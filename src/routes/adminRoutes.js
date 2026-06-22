const express             = require('express');
const router              = express.Router();
const verificarToken      = require('../middlewares/authMiddleware');
const verificarSuperAdmin = require('../middlewares/superadminMiddleware');
const { validar, schemaAdmin } = require('../utils/validacoes');
const { listarAdmins, criarAdmin, toggleAdmin, excluirAdmin } = require('../controllers/adminController');

router.use(verificarToken, verificarSuperAdmin);

/**
 * @openapi
 * /admins:
 *   get:
 *     tags: [Administradores]
 *     summary: Lista todos os administradores (somente superadmin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de administradores
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Usuario' }
 */
router.get('/', listarAdmins);

/**
 * @openapi
 * /admins:
 *   post:
 *     tags: [Administradores]
 *     summary: Cria um novo administrador com senha temporária enviada por e-mail (somente superadmin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email]
 *             properties:
 *               nome:  { type: string, example: Ana Souza }
 *               email: { type: string, example: ana@empresa.com }
 *     responses:
 *       201: { description: Administrador criado e credenciais enviadas por e-mail }
 *       400: { description: E-mail já cadastrado ou dados inválidos }
 */
router.post('/', validar(schemaAdmin), criarAdmin);

/**
 * @openapi
 * /admins/{id}/toggle:
 *   patch:
 *     tags: [Administradores]
 *     summary: Ativa ou desativa um administrador (somente superadmin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Status alternado }
 *       404: { description: Usuário não encontrado }
 */
router.patch('/:id/toggle', toggleAdmin);

/**
 * @openapi
 * /admins/{id}:
 *   delete:
 *     tags: [Administradores]
 *     summary: Remove um administrador permanentemente (somente superadmin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Administrador removido }
 *       403: { description: Não é possível remover o superadmin }
 *       404: { description: Usuário não encontrado }
 */
router.delete('/:id', excluirAdmin);

module.exports = router;