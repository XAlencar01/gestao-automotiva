const express        = require('express');
const router         = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const verificarAdmin = require('../middlewares/adminMiddleware');
const { obterRelatorios } = require('../controllers/relatorioController');

/**
 * @openapi
 * /relatorios:
 *   get:
 *     tags: [Relatórios]
 *     summary: Retorna métricas e relatórios do negócio (somente admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: data_inicio
 *         schema: { type: string, format: date, example: '2026-06-01' }
 *         description: Filtra agendamentos a partir desta data (AAAA-MM-DD). Opcional.
 *       - in: query
 *         name: data_fim
 *         schema: { type: string, format: date, example: '2026-06-30' }
 *         description: Filtra agendamentos até esta data (AAAA-MM-DD). Opcional.
 *     responses:
 *       200:
 *         description: Dados analíticos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 periodo:       { type: object, properties: { inicio: { type: string, nullable: true }, fim: { type: string, nullable: true } } }
 *                 receitaTotal:  { type: number, example: 4500.00 }
 *                 ticketMedio:   { type: number, example: 150.00 }
 *                 fidelizacao:   { type: number, example: 68, description: "Percentual de clientes com mais de 1 serviço" }
 *                 evolucao:      { type: array, items: { type: object, properties: { dia: { type: string }, total: { type: number } } } }
 *                 servicos:      { type: array, items: { type: object, properties: { nome: { type: string }, total: { type: integer } } } }
 *                 clientes:      { type: array, items: { type: object } }
 *       400: { description: Período inválido }
 *       401: { description: Token não fornecido }
 *       403: { description: Acesso negado }
 */
router.get('/', verificarToken, verificarAdmin, obterRelatorios);

module.exports = router;