const express        = require('express');
const router         = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const verificarAdmin = require('../middlewares/adminMiddleware');
const { validar, schemaVeiculo } = require('../utils/validacoes');
const { listarVeiculos, buscarVeiculoPorId, criarVeiculo, atualizarVeiculo, deletarVeiculo } = require('../controllers/veiculoController');

/**
 * @openapi
 * /veiculos:
 *   get:
 *     tags: [Veículos]
 *     summary: Lista veículos (admin vê todos, cliente vê apenas os seus)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de veículos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Veiculo' }
 */
router.get('/', verificarToken, listarVeiculos);

/**
 * @openapi
 * /veiculos/{id}:
 *   get:
 *     tags: [Veículos]
 *     summary: Busca veículo por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Veículo encontrado, content: { application/json: { schema: { $ref: '#/components/schemas/Veiculo' } } } }
 *       404: { description: Veículo não encontrado }
 */
router.get('/:id', verificarToken, buscarVeiculoPorId);

/**
 * @openapi
 * /veiculos:
 *   post:
 *     tags: [Veículos]
 *     summary: Cria um veículo
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Veiculo' }
 *     responses:
 *       201: { description: Veículo criado }
 *       400: { description: Dados inválidos }
 */
router.post('/', verificarToken, validar(schemaVeiculo), criarVeiculo);

/**
 * @openapi
 * /veiculos/{id}:
 *   put:
 *     tags: [Veículos]
 *     summary: Atualiza veículo (somente admin)
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
 *           schema: { $ref: '#/components/schemas/Veiculo' }
 *     responses:
 *       200: { description: Veículo atualizado }
 *       404: { description: Veículo não encontrado }
 */
router.put('/:id', verificarToken, verificarAdmin, validar(schemaVeiculo), atualizarVeiculo);

/**
 * @openapi
 * /veiculos/{id}:
 *   delete:
 *     tags: [Veículos]
 *     summary: Remove veículo (somente admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Veículo removido }
 *       404: { description: Veículo não encontrado }
 */
router.delete('/:id', verificarToken, verificarAdmin, deletarVeiculo);

module.exports = router;