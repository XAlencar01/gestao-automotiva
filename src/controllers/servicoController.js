// controllers/servicoController.js
const ServicoService = require('../services/servicoService');
const logger         = require('../utils/logger');

const listarServicos      = async (req, res) => { try { res.status(200).json(await ServicoService.listar()); } catch (e) { res.status(500).json({ erro: 'Erro ao listar serviços.' }); } };
const buscarServicoPorId  = async (req, res) => { try { res.status(200).json(await ServicoService.buscarPorId(req.params.id)); } catch (e) { res.status(e.status||500).json({ erro: e.mensagem||'Erro.' }); } };
const criarServico        = async (req, res) => { try { res.status(201).json(await ServicoService.criar(req.body)); } catch (e) { res.status(e.status||500).json({ erro: e.mensagem||'Erro ao criar serviço.' }); } };
const atualizarServico    = async (req, res) => { try { res.status(200).json(await ServicoService.atualizar(req.params.id, req.body)); } catch (e) { res.status(e.status||500).json({ erro: e.mensagem||'Erro.' }); } };
const deletarServico      = async (req, res) => { try { await ServicoService.deletar(req.params.id); res.status(200).json({ mensagem: 'Serviço deletado com sucesso.' }); } catch (e) { res.status(e.status||500).json({ erro: e.mensagem||'Erro.' }); } };

module.exports = { listarServicos, buscarServicoPorId, criarServico, atualizarServico, deletarServico };