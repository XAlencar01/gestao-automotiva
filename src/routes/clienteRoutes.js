const express       = require('express');
const router        = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const verificarAdmin = require('../middlewares/adminMiddleware');

const {
  listarClientes,
  buscarClientePorId,
  criarCliente,
  atualizarCliente,
  deletarCliente,
  exportarDados,
  atualizarCRM,
  buscarHistorico,
  listarFunil,
} = require('../controllers/ClienteController');

router.use(verificarToken, verificarAdmin);

/**
 * @openapi
 * /clientes:
 *   get:
 *     tags: [Clientes]
 *     summary: Lista todos os clientes ativos (somente admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Cliente' }
 */
router.get('/', listarClientes);

/**
 * @openapi
 * /clientes/funil:
 *   get:
 *     tags: [Clientes]
 *     summary: Lista todos os clientes ativos sem paginação, para o Kanban e o card de funil do dashboard
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista completa de clientes (campos reduzidos)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { type: object }
 */
router.get('/funil', listarFunil);

/**
 * @openapi
 * /clientes/{id}:
 *   get:
 *     tags: [Clientes]
 *     summary: Busca cliente por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Cliente encontrado, content: { application/json: { schema: { $ref: '#/components/schemas/Cliente' } } } }
 *       404: { description: Cliente não encontrado }
 */
router.get('/:id', buscarClientePorId);

/**
 * @openapi
 * /clientes:
 *   post:
 *     tags: [Clientes]
 *     summary: Cria um cliente manualmente (somente admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email]
 *             properties:
 *               nome:     { type: string, example: João Silva }
 *               email:    { type: string, example: joao@email.com }
 *               telefone: { type: string, example: '11999990000' }
 *     responses:
 *       201: { description: Cliente criado }
 */
router.post('/', criarCliente);

/**
 * @openapi
 * /clientes/{id}:
 *   put:
 *     tags: [Clientes]
 *     summary: Atualiza dados de um cliente (somente admin)
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
 *             properties:
 *               nome:     { type: string }
 *               email:    { type: string }
 *               telefone: { type: string }
 *     responses:
 *       200: { description: Cliente atualizado }
 *       404: { description: Cliente não encontrado }
 */
router.put('/:id', atualizarCliente);

/**
 * @openapi
 * /clientes/{id}:
 *   delete:
 *     tags: [Clientes]
 *     summary: Anonimiza cliente em conformidade com a LGPD (somente admin)
 *     description: Não deleta o registro — anonimiza nome, e-mail e telefone e remove o login. O histórico de agendamentos é preservado.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Conta removida em conformidade com a LGPD }
 *       404: { description: Cliente não encontrado }
 */
router.delete('/:id', deletarCliente);

/**
 * @openapi
 * /clientes/{id}/exportar:
 *   get:
 *     tags: [Clientes]
 *     summary: Exporta todos os dados de um cliente (portabilidade LGPD art. 18)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: JSON completo com dados pessoais, veículos e agendamentos
 *       404: { description: Cliente não encontrado }
 */
router.get('/:id/exportar', exportarDados);

/**
 * @openapi
 * /clientes/{id}/historico:
 *   get:
 *     tags: [Clientes]
 *     summary: Histórico completo do cliente (veículos e agendamentos) para visão 360 do CRM
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Histórico do cliente }
 *       404: { description: Cliente não encontrado }
 */
router.get('/:id/historico', buscarHistorico);

/**
 * @openapi
 * /clientes/{id}/crm:
 *   patch:
 *     tags: [Clientes]
 *     summary: Atualiza status de funil, tags e notas internas do cliente
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
 *             properties:
 *               status_funil: { type: string, enum: [novo, ativo, recorrente, inativo] }
 *               tags:         { type: array, items: { type: string } }
 *               notas:        { type: string }
 *     responses:
 *       200: { description: Cliente atualizado }
 *       400: { description: Status de funil inválido }
 *       404: { description: Cliente não encontrado }
 */
router.patch('/:id/crm', atualizarCRM);

module.exports = router;