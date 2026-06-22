// services/clienteService.js — lógica de negócio de clientes
const ClienteModel  = require('../models/ClienteModel');
const pool          = require('../config/db');
const { PAGE_LIMIT_DEFAULT, PAGE_LIMIT_MAX } = require('../config/constants');

const listar = async ({ limit, offset, busca }) => {
  const l = Math.min(parseInt(limit) || PAGE_LIMIT_DEFAULT, PAGE_LIMIT_MAX);
  const o = Math.max(parseInt(offset) || 0, 0);
  return ClienteModel.listar({ limit: l, offset: o, busca: busca || null });
};

const buscarPorId = async (id) => {
  const cliente = await ClienteModel.buscarPorId(id);
  if (!cliente) throw { status: 404, mensagem: 'Cliente não encontrado.' };
  return cliente;
};

const criar = async ({ nome, telefone, email }) => {
  return ClienteModel.criar({ nome, telefone, email: email.toLowerCase().trim() });
};

const atualizar = async (id, { nome, telefone, email }) => {
  const atualizado = await ClienteModel.atualizar(id, { nome, telefone, email: email.toLowerCase().trim() });
  if (!atualizado) throw { status: 404, mensagem: 'Cliente não encontrado.' };
  return atualizado;
};

const STATUS_FUNIL_VALIDOS = ['novo', 'ativo', 'recorrente', 'inativo'];

// Atualização parcial: campos omitidos mantêm o valor atual (ex: drag-and-drop do Kanban
// envia só status_funil e não deve apagar tags/notas já salvas).
const atualizarCRM = async (id, { status_funil, tags, notas }) => {
  if (status_funil && !STATUS_FUNIL_VALIDOS.includes(status_funil)) {
    throw { status: 400, mensagem: 'Status de funil inválido.' };
  }

  const atual = await ClienteModel.buscarPorId(id);
  if (!atual) throw { status: 404, mensagem: 'Cliente não encontrado.' };

  const tagsLimpa = Array.isArray(tags)
    ? tags.map(t => String(t).trim()).filter(Boolean).slice(0, 10)
    : atual.tags ?? [];

  const atualizado = await ClienteModel.atualizarCRM(id, {
    status_funil: status_funil || atual.status_funil || 'novo',
    tags: tagsLimpa,
    notas: notas !== undefined ? (notas ? String(notas).slice(0, 2000) : null) : atual.notas,
  });
  if (!atualizado) throw { status: 404, mensagem: 'Cliente não encontrado.' };
  return atualizado;
};

const listarParaFunil = async () => {
  // Filtra anonimizados por LGPD (mesma regra usada na tela de lista/Kanban).
  const dados = await ClienteModel.listarParaFunil();
  return dados.filter(c => c.nome !== 'Usuário Removido' && c.email !== null);
};

const buscarHistorico = async (id) => {
  const cliente = await ClienteModel.buscarPorId(id);
  if (!cliente) throw { status: 404, mensagem: 'Cliente não encontrado.' };
  const [veiculos, agendamentos] = await Promise.all([
    ClienteModel.historicoVeiculos(id),
    ClienteModel.historicoAgendamentos(id),
  ]);
  return { cliente, veiculos, agendamentos };
};

// LGPD — anonimiza dados e deleta login
const remover = async (id) => {
  const cliente = await ClienteModel.buscarPorId(id);
  if (!cliente) throw { status: 404, mensagem: 'Cliente não encontrado.' };

  const usuario_id = await ClienteModel.buscarUsuarioId(id);
  await ClienteModel.anonimizar(id);
  if (usuario_id) await pool.query('DELETE FROM usuarios WHERE id = $1', [usuario_id]);
};

// Exportação de dados do cliente (portabilidade LGPD art. 18)
const exportarDados = async (clienteId) => {
  const cliente = await ClienteModel.buscarPorId(clienteId);
  if (!cliente) throw { status: 404, mensagem: 'Cliente não encontrado.' };

  const veiculos = await pool.query(
    'SELECT modelo, placa, marca, cor, ano FROM veiculos WHERE cliente_id = $1', [clienteId]
  );
  const agendamentos = await pool.query(`
    SELECT a.data, a.status, s.nome AS servico, s.preco, v.modelo AS veiculo
    FROM agendamentos a
    JOIN servicos s ON s.id = a.servico_id
    JOIN veiculos v ON v.id = a.veiculo_id
    WHERE a.cliente_id = $1 ORDER BY a.data DESC
  `, [clienteId]);

  return {
    exportado_em: new Date().toISOString(),
    cliente: {
      nome:            cliente.nome,
      email:           cliente.email,
      telefone:        cliente.telefone,
      data_nascimento: cliente.data_nascimento,
      endereco: {
        cep:         cliente.cep,
        logradouro:  cliente.logradouro,
        numero:      cliente.numero,
        complemento: cliente.complemento,
        bairro:      cliente.bairro,
        cidade:      cliente.cidade,
        estado:      cliente.estado,
      },
      membro_desde: cliente.criado_em,
    },
    veiculos:      veiculos.rows,
    agendamentos:  agendamentos.rows,
  };
};

module.exports = {
  listar, buscarPorId, criar, atualizar, remover, exportarDados, atualizarCRM, buscarHistorico,
  listarParaFunil,
};