// src/server.js
require('dotenv').config();

const app    = require('./app');
const logger = require('./utils/logger');
const { iniciarJobExpiracao } = require('./jobs/expirarAgendamentos');

const PORT = process.env.PORT || 3000;

// Validação de variáveis obrigatórias antes de subir
const VARS_OBRIGATORIAS = ['JWT_SECRET', 'DATABASE_URL'];
const faltando = VARS_OBRIGATORIAS.filter(v => !process.env[v]);
if (faltando.length > 0) {
  logger.error(`[STARTUP] Variáveis de ambiente obrigatórias não definidas: ${faltando.join(', ')}`);
  process.exit(1);
}

app.listen(PORT, () => {
  logger.info(`[SERVER] Smart System rodando na porta ${PORT} — ambiente: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`[SERVER] Documentação da API: http://localhost:${PORT}/api-docs`);

  // Inicia cron jobs apenas fora do ambiente de teste
  if (process.env.NODE_ENV !== 'test') {
    iniciarJobExpiracao();
  }
});