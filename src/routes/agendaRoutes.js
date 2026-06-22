// Arquivo: routes/agendaRoutes.js

const express         = require('express');
const router          = express.Router();
const verificarToken  = require('../middlewares/authMiddleware');
const verificarAdmin  = require('../middlewares/adminMiddleware');
const pool            = require('../config/db');

/**
 * GET /agenda/slots?data=2025-06-10&servico_id=3
 * Retorna array de horários disponíveis para uma data e serviço.
 * Leva em conta: horário de funcionamento, dias fechados,
 * agendamentos existentes e quantidade de funcionários ativos.
 */
router.get('/slots', verificarToken, async (req, res) => {
  const { data, servico_id } = req.query;
  if (!data || !servico_id) return res.status(400).json({ erro: 'data e servico_id são obrigatórios' });

  try {
    const dataObj    = new Date(data + 'T00:00:00');
    const diaSemana  = dataObj.getDay(); // 0=Dom … 6=Sáb

    // 1. Verifica se é dia fechado específico
    const diaFechado = await pool.query(
      'SELECT id FROM dias_fechados WHERE data = $1', [data]
    );
    if (diaFechado.rows.length > 0) {
      return res.json({ aberto: false, motivo: diaFechado.rows[0].motivo || 'Dia fechado', slots: [] });
    }

    // 2. Busca horário padrão do dia da semana
    const horario = await pool.query(
      'SELECT * FROM horarios_funcionamento WHERE dia_semana = $1', [diaSemana]
    );
    if (!horario.rows.length || !horario.rows[0].ativo) {
      return res.json({ aberto: false, motivo: 'Loja fechada neste dia', slots: [] });
    }

    const { abertura, fechamento, intervalo_min } = horario.rows[0];

    // 3. Busca duração do serviço
    const servico = await pool.query('SELECT duracao_minutos FROM servicos WHERE id = $1', [servico_id]);
    if (!servico.rows.length) return res.status(404).json({ erro: 'Serviço não encontrado' });
    const duracaoServico = parseInt(servico.rows[0].duracao_minutos);

    // 4. Conta funcionários ativos
    const funcResult = await pool.query("SELECT COUNT(*) FROM funcionarios WHERE ativo = true");
    const totalFuncionarios = parseInt(funcResult.rows[0].count);

    if (totalFuncionarios === 0) {
      return res.json({ aberto: false, motivo: 'Nenhum funcionário disponível', slots: [] });
    }

    // 5. Gera todos os slots do dia
    const [hAb, mAb] = abertura.split(':').map(Number);
    const [hFe, mFe] = fechamento.split(':').map(Number);
    const inicioMin  = hAb * 60 + mAb;
    const fimMin     = hFe * 60 + mFe;

    const agora     = new Date();
    const ehHoje    = data === agora.toISOString().slice(0, 10);
    const agoraMin  = agora.getHours() * 60 + agora.getMinutes();

    const slots = [];

    for (let min = inicioMin; min + duracaoServico <= fimMin; min += intervalo_min) {
      const hh    = String(Math.floor(min / 60)).padStart(2, '0');
      const mm    = String(min % 60).padStart(2, '0');
      const horarioStr = `${hh}:${mm}`;

      // Pula horários já passados se for hoje
      if (ehHoje && min <= agoraMin) continue;

      // 6. Conta agendamentos que colidem com este slot
      // Um agendamento colide se: inicio_agend < slot_fim E fim_agend > slot_inicio
      const slotInicioTime = `${horarioStr}:00`;
      const slotFimMin     = min + duracaoServico;
      const slotFimHH      = String(Math.floor(slotFimMin / 60)).padStart(2, '0');
      const slotFimMM      = String(slotFimMin % 60).padStart(2, '0');
      const slotFimTime    = `${slotFimHH}:${slotFimMM}:00`;

      const ocupados = await pool.query(`
        SELECT COUNT(*) FROM agendamentos a
        JOIN servicos s ON s.id = a.servico_id
        WHERE DATE(a.data) = $1
          AND a.status NOT IN ('recusado', 'cancelado')
          AND (a.data::time, (a.data + (s.duracao_minutos || ' minutes')::interval)::time)
              OVERLAPS ($2::time, $3::time)
      `, [data, slotInicioTime, slotFimTime]);

      const funcionariosOcupados = parseInt(ocupados.rows[0].count);
      const funcionariosLivres   = totalFuncionarios - funcionariosOcupados;

      slots.push({
        horario:    horarioStr,
        disponivel: funcionariosLivres > 0,
        livres:     Math.max(0, funcionariosLivres),
        total:      totalFuncionarios,
      });
    }

    res.json({ aberto: true, slots });
  } catch (error) {
    console.error('Erro ao buscar slots:', error);
    res.status(500).json({ erro: 'Erro ao buscar horários disponíveis' });
  }
});

// GET /agenda/funcionamento — lista horários por dia da semana
router.get('/funcionamento', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM horarios_funcionamento ORDER BY dia_semana');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar horários' });
  }
});

// PUT /agenda/funcionamento/:dia — atualiza horário de um dia
router.put('/funcionamento/:dia', verificarToken, verificarAdmin, async (req, res) => {
  const { dia } = req.params;
  const { abertura, fechamento, intervalo_min, ativo } = req.body;
  try {
    const result = await pool.query(`
      UPDATE horarios_funcionamento
      SET abertura = $1, fechamento = $2, intervalo_min = $3, ativo = $4
      WHERE dia_semana = $5 RETURNING *`,
      [abertura, fechamento, intervalo_min, ativo, dia]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao atualizar horário' });
  }
});

// GET /agenda/dias-fechados — lista todos os dias fechados
router.get('/dias-fechados', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dias_fechados ORDER BY data ASC');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar dias fechados' });
  }
});

// POST /agenda/dias-fechados — adiciona dia fechado
router.post('/dias-fechados', verificarToken, verificarAdmin, async (req, res) => {
  const { data, motivo } = req.body;
  if (!data) return res.status(400).json({ erro: 'Data é obrigatória' });
  try {
    const result = await pool.query(
      'INSERT INTO dias_fechados (data, motivo) VALUES ($1, $2) RETURNING *',
      [data, motivo || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ erro: 'Esta data já está fechada' });
    res.status(500).json({ erro: 'Erro ao adicionar dia fechado' });
  }
});

// DELETE /agenda/dias-fechados/:id — remove dia fechado
router.delete('/dias-fechados/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM dias_fechados WHERE id = $1', [req.params.id]);
    res.json({ mensagem: 'Dia reaberto com sucesso' });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao remover dia fechado' });
  }
});

// GET /agenda/status-hoje — retorna se a loja está aberta hoje e capacidade atual
router.get('/status-hoje', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const hoje       = new Date().toISOString().slice(0, 10);
    const diaSemana  = new Date().getDay();

    const diaFechado = await pool.query('SELECT motivo FROM dias_fechados WHERE data = $1', [hoje]);
    if (diaFechado.rows.length) {
      return res.json({ aberto: false, motivo: diaFechado.rows[0].motivo || 'Dia fechado manualmente' });
    }

    const horario = await pool.query('SELECT * FROM horarios_funcionamento WHERE dia_semana = $1', [diaSemana]);
    if (!horario.rows.length || !horario.rows[0].ativo) {
      return res.json({ aberto: false, motivo: 'Dia da semana inativo' });
    }

    const agendHoje = await pool.query(
      "SELECT COUNT(*) FROM agendamentos WHERE DATE(data) = $1 AND status NOT IN ('recusado','cancelado')", [hoje]
    );
    const funcAtivos = await pool.query("SELECT COUNT(*) FROM funcionarios WHERE ativo = true");

    res.json({
      aberto:           true,
      abertura:         horario.rows[0].abertura,
      fechamento:       horario.rows[0].fechamento,
      agendamentos_hoje: parseInt(agendHoje.rows[0].count),
      funcionarios_ativos: parseInt(funcAtivos.rows[0].count),
    });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar status' });
  }
});

module.exports = router;