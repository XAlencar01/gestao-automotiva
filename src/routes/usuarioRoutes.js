const express        = require('express');
const router         = express.Router();
const verificarToken  = require('../middlewares/authMiddleware');
const verificarAdmin  = require('../middlewares/adminMiddleware');
const { criarUsuario } = require('../controllers/usuarioController');

//  Somente admin/superadmin pode criar usuários por esta rota
router.post('/', verificarToken, verificarAdmin, criarUsuario);

module.exports = router;