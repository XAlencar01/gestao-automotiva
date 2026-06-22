// services/agendamentoService.js — lógica de negócio de agendamentos
const AgendamentoModel = require('../models/agendamentoModel');
const { STATUS_AGENDAMENTO, PAGE_LIMIT_DEFAULT, PAGE_LIMIT_MAX } = require('../config/constants');
const logger = require('../utils/logger');

const listar = async ({ limit, offset, status }) => {
  const l = Math.min(parseInt(limit) || PAGE_LIMIT_DEFAULT, PAGE_LIMIT_MAX);
  const o = Math.max(parseInt(offset) || 0, 0);
  const s = STATUS_AGENDAMENTO.includes(status) ? status : null;
  await AgendamentoModel.expirarPendentes();
  return AgendamentoModel.listar({ limit: l, offset: o, status: s });
};

/**
 * Criar agendamento com transação para evitar race condition
 * Usa BEGIN EXCLUSIVE para garantir atomicidade
 */
const criar = async ({ cliente_id, veiculo_id, servico_id, data, funcionario_id }, pool) => {
  const client = await pool.connect();
  
  try {
    // Inicia transação com lock exclusivo para evitar race condition
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    
    // Busca duração do serviço
    const servicoRes = await client.query('SELECT duracao_minutos FROM servicos WHERE id = $1', [servico_id]);
    if (!servicoRes.rows.length) throw { status: 404, mensagem: 'Serviço não encontrado.' };

    const duracaoMinutos = servicoRes.rows[0].duracao_minutos;

    // Verifica posse do veículo
    const veiculoCheck = await client.query('SELECT * FROM veiculos WHERE id = $1 AND cliente_id = $2', [veiculo_id, cliente_id]);
    if (!veiculoCheck.rows.length) throw { status: 400, mensagem: 'Veículo não pertence ao cliente.' };

    const inicioNovo = new Date(data);
    const fimNovo    = new Date(inicioNovo.getTime() + duracaoMinutos * 60000);
    const janela     = {
      janelaInicio: new Date(inicioNovo.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      janelaFim:    new Date(fimNovo.getTime()    + 24 * 60 * 60 * 1000).toISOString(),
    };

    if (funcionario_id) {
      const funcRes = await client.query('SELECT id FROM funcionarios WHERE id=$1 AND ativo=TRUE', [funcionario_id]);
      if (!funcRes.rows.length) throw { status: 400, mensagem: 'Funcionário não encontrado ou inativo.' };
      janela.funcionario_id = funcionario_id;
    }

    // Busca conflitos dentro da transação
    const conflitos = await AgendamentoModel.buscarConflitos(janela, client);
    for (const ag of conflitos) {
      const iEx = new Date(ag.data);
      const fEx = new Date(iEx.getTime() + ag.duracao_minutos * 60000);
      if (inicioNovo < fEx && fimNovo > iEx) {
        throw { status: 400, mensagem: funcionario_id ? 'Este funcionário já está ocupado neste horário.' : 'Horário já ocupado.' };
      }
    }

    // Cria agendamento dentro da mesma transação
    const resultado = await AgendamentoModel.criar({ cliente_id, veiculo_id, servico_id, data, duracaoMinutos, funcionario_id }, client);
    
    await client.query('COMMIT');
    logger.info(`[AGENDAMENTO] Novo agendamento criado: ${resultado.id}`);
    return resultado;
    
  } catch (e) {
    await client.query('ROLLBACK');
    logger.error(`[criarAgendamento] ${e.message || e.mensagem || e}`);
    throw e;
  } finally {
    client.release();
  }
};

const atualizarStatus = async (id, { status, funcionario_id }) => {
  if (!STATUS_AGENDAMENTO.includes(status)) throw { status: 400, mensagem: 'Status inválido.' };

  const campos = { status };
  if (funcionario_id !== undefined) campos.funcionario_id = funcionario_id || null;

  const atualizado = await AgendamentoModel.atualizarStatus(id, campos);
  if (!atualizado) throw { status: 404, mensagem: 'Agendamento não encontrado.' };

  // Busca dados para email de notificação
  if (['aprovado', 'recusado', 'concluido'].includes(status)) {
    const dados = await AgendamentoModel.dadosParaEmail(id);
    if (dados) {
      logger.info(`[AGENDAMENTO] Notificar ${dados.email} — status: ${status}`);
    }
  }

  return atualizado;
};

const deletar = async (id) => {
  const deletado = await AgendamentoModel.deletar(id);
  if (!deletado) throw { status: 404, mensagem: 'Agendamento não encontrado.' };
  return deletado;
};

module.exports = { listar, criar, atualizarStatus, deletar };
