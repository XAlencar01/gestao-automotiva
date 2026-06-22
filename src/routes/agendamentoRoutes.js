const express        = require('express');
const router         = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const verificarAdmin = require('../middlewares/adminMiddleware');
const { validar, schemaAgendamento, schemaStatusAgendamento } = require('../utils/validacoes');
const { listarAgendamentos, criarAgendamento, atualizarStatus, deletarAgendamento } = require('../controllers/agendamentoController');

/**
 * @openapi
 * /agendamentos:
 *   get:
 *     tags: [Agendamentos]
 *     summary: Lista agendamentos com paginação e filtro de status
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pendente, aprovado, recusado, concluido] }
 *         description: Filtra por status
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Máximo de registros por página
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *         description: Posição inicial para paginação
 *     responses:
 *       200:
 *         description: Lista paginada de agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dados:  { type: array, items: { $ref: '#/components/schemas/Agendamento' } }
 *                 total:  { type: integer }
 *                 limit:  { type: integer }
 *                 offset: { type: integer }
 */
router.get('/', verificarToken, listarAgendamentos);

/**
 * @openapi
 * /agendamentos:
 *   post:
 *     tags: [Agendamentos]
 *     summary: Cria um novo agendamento
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cliente_id, veiculo_id, servico_id, data]
 *             properties:
 *               cliente_id:     { type: integer }
 *               veiculo_id:     { type: integer }
 *               servico_id:     { type: integer }
 *               data:           { type: string, format: date-time }
 *               funcionario_id: { type: integer, nullable: true }
 *     responses:
 *       201: { description: Agendamento criado }
 *       400: { description: Conflito de horário ou dados inválidos }
 */
router.post('/', verificarToken, validar(schemaAgendamento), criarAgendamento);

/**
 * @openapi
 * /agendamentos/{id}:
 *   put:
 *     tags: [Agendamentos]
 *     summary: Atualiza status de agendamento (somente admin)
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
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:         { type: string, enum: [pendente, aprovado, recusado, concluido] }
 *               funcionario_id: { type: integer, nullable: true }
 *     responses:
 *       200: { description: Status atualizado }
 *       400: { description: Status inválido }
 *       404: { description: Agendamento não encontrado }
 */
router.put('/:id', verificarToken, verificarAdmin, validar(schemaStatusAgendamento), atualizarStatus);

/**
 * @openapi
 * /agendamentos/{id}:
 *   delete:
 *     tags: [Agendamentos]
 *     summary: Remove agendamento (somente admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Agendamento removido }
 *       404: { description: Agendamento não encontrado }
 */
router.delete('/:id', verificarToken, verificarAdmin, deletarAgendamento);

module.exports = router;