const express        = require('express');
const router         = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const verificarAdmin = require('../middlewares/adminMiddleware');
const { validar, schemaFuncionario, schemaFuncionarioUpdate } = require('../utils/validacoes');
const { listarFuncionarios, listarFuncionariosAtivos, criarFuncionario, atualizarFuncionario, deletarFuncionario, funcionariosDisponiveis } = require('../controllers/funcionarioController');

router.use(verificarToken);

/**
 * @openapi
 * /funcionarios/ativos:
 *   get:
 *     tags: [Funcionários]
 *     summary: Lista funcionários ativos (disponível para qualquer usuário autenticado)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de funcionários ativos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Funcionario' }
 */
router.get('/ativos', listarFuncionariosAtivos);

/**
 * @openapi
 * /funcionarios/disponiveis:
 *   get:
 *     tags: [Funcionários]
 *     summary: Retorna funcionários livres para um horário e serviço específicos
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: data
 *         required: true
 *         schema: { type: string, format: date-time }
 *         description: Data e hora do agendamento (ISO)
 *       - in: query
 *         name: servico_id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de funcionários disponíveis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Funcionario' }
 *       400: { description: Parâmetros obrigatórios faltando }
 */
router.get('/disponiveis', funcionariosDisponiveis);

/**
 * @openapi
 * /funcionarios:
 *   get:
 *     tags: [Funcionários]
 *     summary: Lista todos os funcionários com agendamentos de hoje (somente admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista completa de funcionários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Funcionario' }
 */
router.get('/', verificarAdmin, listarFuncionarios);

/**
 * @openapi
 * /funcionarios:
 *   post:
 *     tags: [Funcionários]
 *     summary: Cadastra um funcionário (somente admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome]
 *             properties:
 *               nome: { type: string, example: Carlos Lima }
 *     responses:
 *       201: { description: Funcionário criado }
 *       400: { description: Dados inválidos }
 */
router.post('/', verificarAdmin, validar(schemaFuncionario), criarFuncionario);

/**
 * @openapi
 * /funcionarios/{id}:
 *   put:
 *     tags: [Funcionários]
 *     summary: Atualiza nome e/ou status ativo de um funcionário (somente admin)
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
 *               nome:  { type: string }
 *               ativo: { type: boolean }
 *     responses:
 *       200: { description: Funcionário atualizado }
 *       404: { description: Funcionário não encontrado }
 */
router.put('/:id', verificarAdmin, validar(schemaFuncionarioUpdate), atualizarFuncionario);

/**
 * @openapi
 * /funcionarios/{id}:
 *   delete:
 *     tags: [Funcionários]
 *     summary: Remove funcionário (somente admin) — bloqueado se houver agendamentos futuros
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Funcionário removido }
 *       400: { description: Possui agendamentos futuros }
 *       404: { description: Funcionário não encontrado }
 */
router.delete('/:id', verificarAdmin, deletarFuncionario);

module.exports = router;