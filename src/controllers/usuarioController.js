const pool   = require('../config/db');
const bcrypt = require('bcrypt');

// Apenas admins podem criar usuários via esta rota (ex: criar outro admin/funcionário)
const criarUsuario = async (req, res) => {
  const { email, senha, tipo } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
  }

  // Apenas tipos válidos; quem pode criar admin é somente superadmin
  const tiposPermitidos = ['cliente', 'admin', 'funcionario'];
  const tipoSolicitado  = tipo || 'cliente';

  if (!tiposPermitidos.includes(tipoSolicitado)) {
    return res.status(400).json({ erro: 'Tipo de usuário inválido.' });
  }

  // Apenas superadmin pode criar outro admin
  if (tipoSolicitado === 'admin' && req.usuario.tipo !== 'superadmin') {
    return res.status(403).json({ erro: 'Apenas superadmin pode criar usuários admin.' });
  }

  if (senha.length < 8) {
    return res.status(400).json({ erro: 'A senha deve ter no mínimo 8 caracteres.' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);

    await pool.query(
      'INSERT INTO usuarios (email, senha, tipo) VALUES ($1, $2, $3)',
      [email, senhaHash, tipoSolicitado]
    );

    res.status(201).json({ mensagem: 'Usuário criado com sucesso.' });

  } catch (error) {
    console.error('[criarUsuario]', error);
    res.status(500).json({ erro: 'Erro ao criar usuário.' });
  }
};

module.exports = { criarUsuario };