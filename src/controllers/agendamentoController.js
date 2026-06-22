// controllers/agendamentoController.js — recebe req/res e delega ao service
const AgendamentoService = require('../services/agendamentoService');
const pool               = require('../config/db');
const logger             = require('../utils/logger');

const listarAgendamentos = async (req, res) => {
  try {
    const resultado = await AgendamentoService.listar(req.query);
    res.status(200).json(resultado);
  } catch (e) {
    logger.error(`[listarAgendamentos] ${e.message || e}`);
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao listar agendamentos.' });
  }
};

const criarAgendamento = async (req, res) => {
  try {
    const agendamento = await AgendamentoService.criar(req.body, pool);
    res.status(201).json(agendamento);
  } catch (e) {
    logger.error(`[criarAgendamento] ${e.message || e.mensagem || e}`);
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao criar agendamento.' });
  }
};

const atualizarStatus = async (req, res) => {
  try {
    const atualizado = await AgendamentoService.atualizarStatus(req.params.id, req.body);
    res.status(200).json(atualizado);
  } catch (e) {
    logger.error(`[atualizarStatus] ${e.message || e.mensagem || e}`);
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao atualizar status.' });
  }
};

const deletarAgendamento = async (req, res) => {
  try {
    await AgendamentoService.deletar(req.params.id);
    res.status(200).json({ mensagem: 'Agendamento deletado com sucesso.' });
  } catch (e) {
    logger.error(`[deletarAgendamento] ${e.message || e.mensagem || e}`);
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao deletar agendamento.' });
  }
};

module.exports = { listarAgendamentos, criarAgendamento, atualizarStatus, deletarAgendamento };