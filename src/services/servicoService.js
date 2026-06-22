// services/servicoService.js — lógica de negócio de serviços
const ServicoModel = require('../models/servicoModel');

const listar = async () => ServicoModel.listar();

const buscarPorId = async (id) => {
  const servico = await ServicoModel.buscarPorId(id);
  if (!servico) throw { status: 404, mensagem: 'Serviço não encontrado.' };
  return servico;
};

const criar = async ({ nome, preco, descricao, duracao_minutos }) => {
  if (!nome || !duracao_minutos || !preco)
    throw { status: 400, mensagem: 'Nome, duração e preço são obrigatórios.' };
  return ServicoModel.criar({ nome, preco, descricao, duracao_minutos });
};

const atualizar = async (id, dados) => {
  const atualizado = await ServicoModel.atualizar(id, dados);
  if (!atualizado) throw { status: 404, mensagem: 'Serviço não encontrado.' };
  return atualizado;
};

const deletar = async (id) => {
  const deletado = await ServicoModel.deletar(id);
  if (!deletado) throw { status: 404, mensagem: 'Serviço não encontrado.' };
  return deletado;
};

module.exports = { listar, buscarPorId, criar, atualizar, deletar };