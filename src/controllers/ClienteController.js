// controllers/ClienteController.js — recebe req/res e delega ao service
const ClienteService = require('../services/clienteService');
const logger         = require('../utils/logger');

const listarClientes = async (req, res) => {
  try {
    res.status(200).json(await ClienteService.listar(req.query));
  } catch (e) {
    logger.error(`[listarClientes] ${e.message || e}`);
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao listar clientes.' });
  }
};

const buscarClientePorId = async (req, res) => {
  try {
    res.status(200).json(await ClienteService.buscarPorId(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao buscar cliente.' });
  }
};

const criarCliente = async (req, res) => {
  try {
    res.status(201).json(await ClienteService.criar(req.body));
  } catch (e) {
    logger.error(`[criarCliente] ${e.message || e}`);
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao criar cliente.' });
  }
};

const atualizarCliente = async (req, res) => {
  try {
    res.status(200).json(await ClienteService.atualizar(req.params.id, req.body));
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao atualizar cliente.' });
  }
};

const deletarCliente = async (req, res) => {
  try {
    await ClienteService.remover(req.params.id);
    res.status(200).json({ mensagem: 'Conta removida em conformidade com a LGPD' });
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao deletar cliente.' });
  }
};

const listarFunil = async (req, res) => {
  try {
    res.status(200).json(await ClienteService.listarParaFunil());
  } catch (e) {
    logger.error(`[listarFunil] ${e.message || e}`);
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao listar funil de clientes.' });
  }
};

const atualizarCRM = async (req, res) => {
  try {
    res.status(200).json(await ClienteService.atualizarCRM(req.params.id, req.body));
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao atualizar dados de CRM.' });
  }
};

const buscarHistorico = async (req, res) => {
  try {
    res.status(200).json(await ClienteService.buscarHistorico(req.params.id));
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao buscar histórico do cliente.' });
  }
};

// LGPD art. 18 — portabilidade de dados
const exportarDados = async (req, res) => {
  try {
    const dados = await ClienteService.exportarDados(req.params.id);
    res.status(200).json(dados);
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao exportar dados.' });
  }
};

module.exports = {
  listarClientes, buscarClientePorId, criarCliente, atualizarCliente, deletarCliente, exportarDados,
  atualizarCRM, buscarHistorico, listarFunil,
};