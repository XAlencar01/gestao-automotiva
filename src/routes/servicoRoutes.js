const express        = require('express');
const router         = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const verificarAdmin = require('../middlewares/adminMiddleware');
const { validar, schemaServico } = require('../utils/validacoes');
const { listarServicos, buscarServicoPorId, criarServico, atualizarServico, deletarServico } = require('../controllers/servicoController');

/**
 * @openapi
 * /servicos:
 *   get:
 *     tags: [Serviços]
 *     summary: Lista todos os serviços disponíveis (público)
 *     security: []
 *     responses:
 *       200:
 *         description: Lista de serviços
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Servico' }
 */
router.get('/', listarServicos);

/**
 * @openapi
 * /servicos/{id}:
 *   get:
 *     tags: [Serviços]
 *     summary: Busca serviço por ID (público)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Serviço encontrado, content: { application/json: { schema: { $ref: '#/components/schemas/Servico' } } } }
 *       404: { description: Serviço não encontrado }
 */
router.get('/:id', buscarServicoPorId);

/**
 * @openapi
 * /servicos:
 *   post:
 *     tags: [Serviços]
 *     summary: Cria um serviço (somente admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Servico' }
 *     responses:
 *       201: { description: Serviço criado }
 *       400: { description: Dados inválidos }
 */
router.post('/', verificarToken, verificarAdmin, validar(schemaServico), criarServico);

/**
 * @openapi
 * /servicos/{id}:
 *   put:
 *     tags: [Serviços]
 *     summary: Atualiza serviço (somente admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Servico' }
 *     responses:
 *       200: { description: Serviço atualizado }
 *       404: { description: Serviço não encontrado }
 */
router.put('/:id', verificarToken, verificarAdmin, validar(schemaServico), atualizarServico);

/**
 * @openapi
 * /servicos/{id}:
 *   delete:
 *     tags: [Serviços]
 *     summary: Remove serviço (somente admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Serviço removido }
 *       404: { description: Serviço não encontrado }
 */
router.delete('/:id', verificarToken, verificarAdmin, deletarServico);

module.exports = router;