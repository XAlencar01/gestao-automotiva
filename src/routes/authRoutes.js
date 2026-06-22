const express = require('express');
const router  = express.Router();
const { validar, schemaRegister, schemaLogin, schemaEsqueciSenha, schemaRedefinirSenha } = require('../utils/validacoes');
const { register, login, confirmarEmail, reenviarEmail, esquecerSenha, redefinirSenha, validarTokenRecuperacao } = require('../controllers/authController');

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Cadastro de novo cliente
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email, senha]
 *             properties:
 *               nome:     { type: string, example: João Silva }
 *               email:    { type: string, example: joao@email.com }
 *               senha:    { type: string, example: 'Senha@123' }
 *               telefone: { type: string, example: '11999990000' }
 *     responses:
 *       201: { description: Cadastro realizado }
 *       400: { description: Dados inválidos ou email já cadastrado }
 */
router.post('/register', validar(schemaRegister), register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login de usuário
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email: { type: string, example: joao@email.com }
 *               senha: { type: string, example: 'Senha@123' }
 *     responses:
 *       200:
 *         description: Token JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem: { type: string }
 *                 token:    { type: string }
 *       401: { description: Credenciais inválidas }
 */
router.post('/login', validar(schemaLogin), login);

/**
 * @openapi
 * /auth/confirmar-email:
 *   get:
 *     tags: [Auth]
 *     summary: Confirma e-mail via token
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: E-mail confirmado }
 *       400: { description: Token inválido ou expirado }
 */
router.get('/confirmar-email', confirmarEmail);

/**
 * @openapi
 * /auth/reenviar-email:
 *   post:
 *     tags: [Auth]
 *     summary: Reenvia e-mail de confirmação
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: E-mail reenviado }
 */
router.post('/reenviar-email', reenviarEmail);

/**
 * @openapi
 * /auth/esqueci-senha:
 *   post:
 *     tags: [Auth]
 *     summary: Solicita link de redefinição de senha
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Instrução enviada (resposta genérica por segurança) }
 */
router.post('/esqueci-senha', validar(schemaEsqueciSenha), esquecerSenha);

/**
 * @openapi
 * /auth/redefinir-senha:
 *   post:
 *     tags: [Auth]
 *     summary: Redefine senha com token recebido por e-mail
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, novaSenha]
 *             properties:
 *               token:     { type: string }
 *               novaSenha: { type: string, example: 'NovaSenha@123' }
 *     responses:
 *       200: { description: Senha redefinida }
 *       400: { description: Token inválido ou expirado }
 */
router.post('/redefinir-senha', validar(schemaRedefinirSenha), redefinirSenha);

/**
 * @openapi
 * /auth/validar-recuperacao:
 *   get:
 *     tags: [Auth]
 *     summary: Valida token de recuperação
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Token válido }
 *       400: { description: Token inválido }
 */
router.get('/validar-recuperacao', validarTokenRecuperacao);

module.exports = router;