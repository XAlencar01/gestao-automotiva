// models/ClienteModel.js — apenas queries SQL
const pool = require('../config/db');

const listar = async ({ limit, offset, busca }) => {
  const where  = busca ? `WHERE ativo = true AND (nome ILIKE $3 OR email ILIKE $3)` : `WHERE ativo = true`;
  const params = busca ? [limit, offset, `%${busca}%`] : [limit, offset];
  const dados  = await pool.query(
    `SELECT * FROM clientes ${where} ORDER BY id ASC LIMIT $1 OFFSET $2`, params
  );
  const total = await pool.query(
    `SELECT COUNT(*) FROM clientes ${busca ? `WHERE ativo = true AND (nome ILIKE $1 OR email ILIKE $1)` : `WHERE ativo = true`}`,
    busca ? [`%${busca}%`] : []
  );
  return { dados: dados.rows, total: parseInt(total.rows[0].count) };
};

const buscarPorId = async (id) => {
  const r = await pool.query('SELECT * FROM clientes WHERE id = $1 AND ativo = true', [id]);
  return r.rows[0] || null;
};

const buscarPorEmail = async (email) => {
  const r = await pool.query('SELECT * FROM clientes WHERE email = $1', [email]);
  return r.rows[0] || null;
};

const criar = async ({ nome, telefone, email }) => {
  const r = await pool.query(
    'INSERT INTO clientes (nome, telefone, email, ativo) VALUES ($1, $2, $3, true) RETURNING *',
    [nome, telefone, email]
  );
  return r.rows[0];
};

const atualizar = async (id, { nome, telefone, email }) => {
  const r = await pool.query(
    'UPDATE clientes SET nome=$1, telefone=$2, email=$3 WHERE id=$4 AND ativo=true RETURNING *',
    [nome, telefone, email, id]
  );
  return r.rows[0] || null;
};

const anonimizar = async (id) => {
  await pool.query(
    `UPDATE clientes SET nome='Usuário Removido', email=NULL, telefone=NULL,
     usuario_id=NULL, ativo=false WHERE id=$1`, [id]
  );
};

const buscarUsuarioId = async (id) => {
  const r = await pool.query('SELECT usuario_id FROM clientes WHERE id = $1', [id]);
  return r.rows[0]?.usuario_id || null;
};

const atualizarCRM = async (id, { status_funil, tags, notas }) => {
  const r = await pool.query(
    'UPDATE clientes SET status_funil=$1, tags=$2, notas=$3 WHERE id=$4 AND ativo=true RETURNING *',
    [status_funil, tags, notas, id]
  );
  return r.rows[0] || null;
};

const historicoVeiculos = async (clienteId) => {
  const r = await pool.query('SELECT * FROM veiculos WHERE cliente_id = $1 ORDER BY id DESC', [clienteId]);
  return r.rows;
};

const historicoAgendamentos = async (clienteId) => {
  const r = await pool.query(`
    SELECT a.id, a.data, a.status, s.nome AS servico, s.preco, v.modelo AS veiculo, v.placa
    FROM agendamentos a
    JOIN servicos s ON s.id = a.servico_id
    JOIN veiculos v ON v.id = a.veiculo_id
    WHERE a.cliente_id = $1 ORDER BY a.data DESC
  `, [clienteId]);
  return r.rows;
};

module.exports = {
  listar, buscarPorId, buscarPorEmail, criar, atualizar, anonimizar, buscarUsuarioId,
  atualizarCRM, historicoVeiculos, historicoAgendamentos,
};