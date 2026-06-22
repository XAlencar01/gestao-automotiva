const pool = require('../config/db');

//  LISTAR
const listarFuncionarios = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        f.id,
        f.nome,
        f.ativo,
        f.criado_em,
        COUNT(a.id) FILTER (
          WHERE a.status NOT IN ('recusado') 
          AND DATE(a.data) = CURRENT_DATE
        ) AS agendamentos_hoje
      FROM funcionarios f
      LEFT JOIN agendamentos a ON a.funcionario_id = f.id
      GROUP BY f.id
      ORDER BY f.nome ASC
    `);
    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    res.status(500).json({ erro: 'Erro ao listar funcionários' });
  }
};

//  LISTAR APENAS ATIVOS (para selects)
const listarFuncionariosAtivos = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id, nome FROM funcionarios WHERE ativo = TRUE ORDER BY nome ASC`
    );
    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error('Erro ao listar funcionários ativos:', error);
    res.status(500).json({ erro: 'Erro ao listar funcionários' });
  }
};

//  CRIAR
const criarFuncionario = async (req, res) => {
  const { nome } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'O nome do funcionário é obrigatório.' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO funcionarios (nome) VALUES ($1) RETURNING *`,
      [nome.trim()]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    res.status(500).json({ erro: 'Erro ao criar funcionário' });
  }
};

//  ATUALIZAR (nome e/ou ativo)
const atualizarFuncionario = async (req, res) => {
  const { id } = req.params;
  const { nome, ativo } = req.body;

  try {
    const campos  = [];
    const valores = [];
    let idx = 1;

    if (nome !== undefined) { campos.push(`nome = $${idx++}`);  valores.push(nome.trim()); }
    if (ativo !== undefined){ campos.push(`ativo = $${idx++}`); valores.push(ativo); }

    if (campos.length === 0)
      return res.status(400).json({ erro: 'Nenhum campo enviado.' });

    valores.push(id);
    const resultado = await pool.query(
      `UPDATE funcionarios SET ${campos.join(', ')} WHERE id = $${idx} RETURNING *`,
      valores
    );

    if (resultado.rows.length === 0)
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    res.status(500).json({ erro: 'Erro ao atualizar funcionário' });
  }
};

//  DELETAR
const deletarFuncionario = async (req, res) => {
  const { id } = req.params;
  try {
    // Verifica agendamentos futuros antes de deletar
    const agFuturos = await pool.query(
      `SELECT COUNT(*) FROM agendamentos
       WHERE funcionario_id = $1 AND data > NOW() AND status != 'recusado'`,
      [id]
    );

    if (parseInt(agFuturos.rows[0].count) > 0) {
      return res.status(400).json({
        erro: 'Este funcionário possui agendamentos futuros. Desative-o em vez de excluir.'
      });
    }

    const resultado = await pool.query(
      'DELETE FROM funcionarios WHERE id = $1 RETURNING *', [id]
    );

    if (resultado.rows.length === 0)
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });

    res.status(200).json({ mensagem: 'Funcionário removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar funcionário:', error);
    res.status(500).json({ erro: 'Erro ao deletar funcionário' });
  }
};

//  DISPONIBILIDADE — retorna funcionários
//  livres para um determinado horário
const funcionariosDisponiveis = async (req, res) => {
  const { data, servico_id } = req.query;

  if (!data || !servico_id)
    return res.status(400).json({ erro: 'data e servico_id são obrigatórios.' });

  try {
    // Busca duração do serviço
    const servicoRes = await pool.query(
      'SELECT duracao_minutos FROM servicos WHERE id = $1', [servico_id]
    );
    if (servicoRes.rows.length === 0)
      return res.status(404).json({ erro: 'Serviço não encontrado.' });

    const duracao    = servicoRes.rows[0].duracao_minutos;
    const inicioNovo = new Date(data);
    const fimNovo    = new Date(inicioNovo.getTime() + duracao * 60000);

    // Busca todos funcionários ativos
    const todosRes = await pool.query(
      'SELECT id, nome FROM funcionarios WHERE ativo = TRUE ORDER BY nome ASC'
    );

    // Para cada funcionário, verifica conflito de horário
    const disponiveis = [];

    for (const func of todosRes.rows) {
      const conflitosRes = await pool.query(`
        SELECT a.data, s.duracao_minutos
        FROM agendamentos a
        JOIN servicos s ON a.servico_id = s.id
        WHERE a.funcionario_id = $1
          AND a.status != 'recusado'
          AND a.data BETWEEN $2 AND $3
      `, [
        func.id,
        new Date(inicioNovo.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        new Date(fimNovo.getTime()   + 24 * 60 * 60 * 1000).toISOString()
      ]);

      let livre = true;
      for (const ag of conflitosRes.rows) {
        const inicioEx = new Date(ag.data);
        const fimEx    = new Date(inicioEx.getTime() + ag.duracao_minutos * 60000);
        if (inicioNovo < fimEx && fimNovo > inicioEx) { livre = false; break; }
      }

      if (livre) disponiveis.push(func);
    }

    res.status(200).json(disponiveis);
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({ erro: 'Erro ao verificar disponibilidade' });
  }
};

module.exports = {
  listarFuncionarios,
  listarFuncionariosAtivos,
  criarFuncionario,
  atualizarFuncionario,
  deletarFuncionario,
  funcionariosDisponiveis,
};