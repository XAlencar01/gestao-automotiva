// superadminMiddleware.js
// Usado em rotas que só o dono do sistema pode acessar,
// como criar/desativar admins e ver logs sensíveis.

const verificarSuperAdmin = (req, res, next) => {
  if (req.usuario.tipo !== 'superadmin') {
    return res.status(403).json({ erro: 'Acesso restrito ao administrador principal.' });
  }
  next();
};

module.exports = verificarSuperAdmin;