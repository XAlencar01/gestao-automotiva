// models/agendamentoModel.js — apenas queries SQL
const pool = require('../config/db');

const listar = async ({ limit, offset, status }) => {
  const where  = status ? 'WHERE a.status = $3' : '';
  const params = status ? [limit, offset, status] : [limit, offset];
  const dados  = await pool.query(`
    SELECT DISTINCT a.id, c.nome AS cliente, v.modelo AS veiculo,
      s.nome AS servico, f.nome AS funcionario, a.funcionario_id,
      a.data, a.status, a.desconto_aniversario
    FROM agendamentos a
    JOIN clientes  c ON a.cliente_id  = c.id
    JOIN veiculos  v ON a.veiculo_id  = v.id
    JOIN servicos  s ON a.servico_id  = s.id
    LEFT JOIN funcionarios f ON a.funcionario_id = f.id
    ${where}
    ORDER BY a.data ASC
    LIMIT $1 OFFSET $2
  `, params);
  const total = await pool.query(
    `SELECT COUNT(*) FROM agendamentos a ${status ? 'WHERE a.status = $1' : ''}`,
    status ? [status] : []
  );
  return { dados: dados.rows, total: parseInt(total.rows[0].count) };
};

const buscarPorId = async (id) => {
  const r = await pool.query('SELECT * FROM agendamentos WHERE id = $1', [id]);
  return r.rows[0] || null;
};

const criar = async ({ cliente_id, veiculo_id, servico_id, data, duracao_minutos, funcionario_id, desconto_aniversario }, client = null) => {
  const queryClient = client || pool;
  const r = await queryClient.query(
    `INSERT INTO agendamentos (cliente_id, veiculo_id, servico_id, data, duracao_minutos, status, funcionario_id, desconto_aniversario)
     VALUES ($1,$2,$3,$4,$5,'pendente',$6,$7) RETURNING *`,
    [cliente_id, veiculo_id, servico_id, data, duracao_minutos, funcionario_id || null, desconto_aniversario || false]
  );
  return r.rows[0];
};

const atualizarStatus = async (id, campos) => {
  const sets   = Object.keys(campos).map((k, i) => `${k} = $${i + 1}`);
  const values = [...Object.values(campos), id];
  const r = await pool.query(
    `UPDATE agendamentos SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return r.rows[0] || null;
};

const deletar = async (id) => {
  const r = await pool.query('DELETE FROM agendamentos WHERE id = $1 RETURNING *', [id]);
  return r.rows[0] || null;
};

const expirarPendentes = async () => {
  const r = await pool.query(`
    UPDATE agendamentos SET status = 'recusado'
    WHERE status = 'pendente' AND criado_em < NOW() - INTERVAL '48 hours'
    RETURNING id
  `);
  return r.rowCount;
};

/**
 * Busca conflitos de agendamento com suporte a transações
 * Permite passar um cliente de transação para operações atômicas
 */
const buscarConflitos = async ({ funcionario_id, janelaInicio, janelaFim }, client = null) => {
  const queryClient = client || pool;
  const where  = funcionario_id ? 'AND a.funcionario_id = $3' : '';
  const params = funcionario_id
    ? [janelaInicio, janelaFim, funcionario_id]
    : [janelaInicio, janelaFim];
  const r = await queryClient.query(`
    SELECT a.data, s.duracao_minutos, a.funcionario_id FROM agendamentos a
    JOIN servicos s ON a.servico_id = s.id
    WHERE a.status != 'recusado'
      AND a.data BETWEEN $1 AND $2
    ${where}
  `, params);
  return r.rows;
};

const dadosParaEmail = async (id) => {
  const r = await pool.query(`
    SELECT u.email, c.nome AS nome_cliente, s.nome AS servico,
           v.modelo AS veiculo, f.nome AS funcionario
    FROM agendamentos a
    JOIN clientes c ON a.cliente_id = c.id
    JOIN usuarios u ON c.usuario_id = u.id
    JOIN servicos s ON a.servico_id = s.id
    JOIN veiculos v ON a.veiculo_id = v.id
    LEFT JOIN funcionarios f ON a.funcionario_id = f.id
    WHERE a.id = $1
  `, [id]);
  return r.rows[0] || null;
};

module.exports = { listar, buscarPorId, criar, atualizarStatus, deletar, expirarPendentes, buscarConflitos, dadosParaEmail };
