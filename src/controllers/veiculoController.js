// controllers/veiculoController.js

const VeiculoService = require('../services/veiculoService');
const logger         = require('../utils/logger');

const listarVeiculos     = async (req, res) => { try { res.status(200).json(await VeiculoService.listar({ usuario: req.usuario, ...req.query })); } catch (e) { res.status(e.status||500).json({ erro: e.mensagem||'Erro ao listar veículos.' }); } };
const buscarVeiculoPorId = async (req, res) => { try { res.status(200).json(await VeiculoService.buscarPorId(req.params.id)); } catch (e) { res.status(e.status||500).json({ erro: e.mensagem||'Erro.' }); } };
const criarVeiculo       = async (req, res) => { try { res.status(201).json(await VeiculoService.criar(req.body, req.usuario)); } catch (e) { res.status(e.status||500).json({ erro: e.mensagem||'Erro ao criar veículo.' }); } };
const atualizarVeiculo   = async (req, res) => { try { res.status(200).json(await VeiculoService.atualizar(req.params.id, req.body, req.usuario)); } catch (e) { res.status(e.status||500).json({ erro: e.mensagem||'Erro.' }); } };
const deletarVeiculo     = async (req, res) => { try { await VeiculoService.deletar(req.params.id); res.status(200).json({ ok: true }); } catch (e) { res.status(e.status||500).json({ erro: e.mensagem||'Erro.' }); } };

module.exports = { listarVeiculos, buscarVeiculoPorId, criarVeiculo, atualizarVeiculo, deletarVeiculo };