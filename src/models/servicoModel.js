// models/servicoModel.js — apenas queries SQL
const pool = require('../config/db');

const listar = async () => {
  const r = await pool.query('SELECT id, nome, preco, descricao, duracao_minutos FROM servicos ORDER BY id ASC');
  return r.rows;
};

const buscarPorId = async (id) => {
  const r = await pool.query('SELECT id, nome, preco, descricao, duracao_minutos FROM servicos WHERE id = $1', [id]);
  return r.rows[0] || null;
};

const criar = async ({ nome, preco, descricao, duracao_minutos }) => {
  const r = await pool.query(
    'INSERT INTO servicos (nome, preco, descricao, duracao_minutos) VALUES ($1,$2,$3,$4) RETURNING *',
    [nome, preco, descricao || null, duracao_minutos]
  );
  return r.rows[0];
};

const atualizar = async (id, { nome, preco, descricao, duracao_minutos }) => {
  const r = await pool.query(
    'UPDATE servicos SET nome=$1, preco=$2, descricao=$3, duracao_minutos=$4 WHERE id=$5 RETURNING *',
    [nome, preco, descricao || null, duracao_minutos, id]
  );
  return r.rows[0] || null;
};

const deletar = async (id) => {
  const r = await pool.query('DELETE FROM servicos WHERE id=$1 RETURNING *', [id]);
  return r.rows[0] || null;
};

module.exports = { listar, buscarPorId, criar, atualizar, deletar };