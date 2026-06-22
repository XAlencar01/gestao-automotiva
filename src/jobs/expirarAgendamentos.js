// src/jobs/expirarAgendamentos.js — cron job para expirar agendamentos pendentes
const cron   = require('node-cron');
const pool   = require('../config/db');
const logger = require('../utils/logger');

// Roda todo dia às 00:05 e às 12:05 — expira agendamentos pendentes há mais de 48h
const iniciarJobExpiracao = () => {
  cron.schedule('5 0,12 * * *', async () => {
    logger.info('[JOB] Iniciando expiração de agendamentos pendentes...');
    try {
      const resultado = await pool.query(`
        UPDATE agendamentos
        SET status = 'recusado'
        WHERE status = 'pendente'
          AND criado_em < NOW() - INTERVAL '48 hours'
        RETURNING id
      `);
      const qtd = resultado.rowCount;
      if (qtd > 0) {
        logger.info(`[JOB] ${qtd} agendamento(s) expirado(s) automaticamente.`);
      } else {
        logger.info('[JOB] Nenhum agendamento para expirar.');
      }
    } catch (err) {
      logger.error(`[JOB] Erro ao expirar agendamentos: ${err.message}`);
    }
  }, {
    timezone: 'America/Sao_Paulo',
  });

  logger.info('[JOB] Cron de expiração de agendamentos iniciado (00:05 e 12:05 BRT).');
};

module.exports = { iniciarJobExpiracao };