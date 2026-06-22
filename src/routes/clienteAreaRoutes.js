const express = require('express');
const router  = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const {
  meusAgendamentos,
  meusVeiculos,
  criarVeiculoCliente,
  excluirVeiculoCliente,
  criarAgendamentoCliente,
  buscarConta,
  atualizarConta,
  excluirConta,
} = require('../controllers/clienteAreaController');

router.use(verificarToken);

// Agendamentos
router.get('/meus-agendamentos', meusAgendamentos);

// Veículos
router.get   ('/meus-veiculos',        meusVeiculos);
router.post  ('/meus-veiculos',        criarVeiculoCliente);
router.delete('/meus-veiculos/:id',    excluirVeiculoCliente);

// Agendamento pelo cliente
router.post('/agendar', criarAgendamentoCliente);

// Conta do cliente
router.get   ('/minha-conta', buscarConta);
router.put   ('/minha-conta', atualizarConta);
router.delete('/minha-conta', excluirConta);

module.exports = router;