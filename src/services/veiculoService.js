// services/veiculoService.js — lógica de negócio de veículos
const VeiculoModel = require('../models/veiculoModel');
const { PAGE_LIMIT_DEFAULT, PAGE_LIMIT_MAX } = require('../config/constants');

const listar = async ({ usuario, limit, offset }) => {
  const l = Math.min(parseInt(limit) || PAGE_LIMIT_DEFAULT, PAGE_LIMIT_MAX);
  const o = Math.max(parseInt(offset) || 0, 0);
  if (usuario.tipo === 'cliente') {
    return VeiculoModel.listar({ tipo: 'cliente', cliente_id: usuario.cliente_id, limit: l, offset: o });
  }
  return VeiculoModel.listar({ limit: l, offset: o });
};

const buscarPorId = async (id) => {
  const v = await VeiculoModel.buscarPorId(id);
  if (!v) throw { status: 404, mensagem: 'Veículo não encontrado.' };
  return v;
};

const criar = async (dados, usuario) => {
  let cliente_id = dados.cliente_id;
  if (usuario.tipo === 'cliente') cliente_id = usuario.cliente_id;
  if (!cliente_id || !dados.modelo || !dados.placa)
    throw { status: 400, mensagem: 'cliente_id, modelo e placa são obrigatórios.' };
  return VeiculoModel.criar({ ...dados, cliente_id });
};

const atualizar = async (id, dados, usuario) => {
  let cliente_id = dados.cliente_id;
  if (usuario.tipo === 'cliente') cliente_id = usuario.cliente_id;
  if (!cliente_id || !dados.modelo || !dados.placa)
    throw { status: 400, mensagem: 'cliente_id, modelo e placa são obrigatórios.' };
  const atualizado = await VeiculoModel.atualizar(id, { ...dados, cliente_id });
  if (!atualizado) throw { status: 404, mensagem: 'Veículo não encontrado.' };
  return atualizado;
};

const deletar = async (id) => {
  const deletado = await VeiculoModel.deletar(id);
  if (!deletado) throw { status: 404, mensagem: 'Veículo não encontrado.' };
  return deletado;
};

module.exports = { listar, buscarPorId, criar, atualizar, deletar };