const pool = require('../config/db');

// Valida e normaliza o período (data_inicio/data_fim) vindo da query string.
// Quando ausentes, os relatórios continuam considerando todo o histórico.
const resolverPeriodo = (query) => {
  const { data_inicio, data_fim } = query;
  const regexData = /^\d{4}-\d{2}-\d{2}$/;

  if (data_inicio && !regexData.test(data_inicio)) {
    throw { status: 400, mensagem: 'data_inicio inválida. Use o formato AAAA-MM-DD.' };
  }
  if (data_fim && !regexData.test(data_fim)) {
    throw { status: 400, mensagem: 'data_fim inválida. Use o formato AAAA-MM-DD.' };
  }
  if (data_inicio && data_fim && data_inicio > data_fim) {
    throw { status: 400, mensagem: 'data_inicio não pode ser depois de data_fim.' };
  }

  return {
    inicio: data_inicio || null,
    // Inclui o dia inteiro de data_fim (até 23:59:59.999) na comparação.
    fim: data_fim ? `${data_fim} 23:59:59.999` : null,
  };
};

const obterRelatorios = async (req, res) => {
  try {
    const { inicio, fim } = resolverPeriodo(req.query);

    // Monta a cláusula de período reaproveitada em todas as queries por status.
    // $1/$2 ficam reservados para o intervalo; cada query usa params adicionais a partir daí.
    const condPeriodo = [];
    const paramsPeriodo = [];
    if (inicio) { paramsPeriodo.push(inicio); condPeriodo.push(`a.data >= $${paramsPeriodo.length}`); }
    if (fim)    { paramsPeriodo.push(fim);    condPeriodo.push(`a.data <= $${paramsPeriodo.length}`); }
    const whereExtra = condPeriodo.length ? `AND ${condPeriodo.join(' AND ')}` : '';

    // Receita total
    const receitaResult = await pool.query(`
      SELECT COALESCE(SUM(s.preco), 0) AS total
      FROM agendamentos a
      JOIN servicos s ON s.id = a.servico_id
      WHERE a.status IN ('concluido') ${whereExtra}
    `, paramsPeriodo);
    const receitaTotal = Number(receitaResult.rows[0].total);

    // Ticket Médio
    const totalAgendamentos = await pool.query(`
      SELECT COUNT(*) AS qtd FROM agendamentos a
      WHERE status IN ('concluido') ${whereExtra}
    `, paramsPeriodo);
    const qtd = Number(totalAgendamentos.rows[0].qtd);
    const ticketMedio = qtd > 0 ? receitaTotal / qtd : 0;

    // Fidelização (RFM simplificado: Recência + Frequência + Valor)
    // Classifica cada cliente em um segmento com base em quando voltou,
    // quantas vezes voltou e quanto gastou. Mais robusto que "voltou ou não".
    const rfmResult = await pool.query(`
      WITH base AS (
        SELECT
          a.cliente_id,
          COUNT(*)                                   AS freq,
          COALESCE(SUM(s.preco), 0)                  AS valor,
          MAX(a.data)                                AS ultima,
          NOW() - MAX(a.data)                        AS recencia
        FROM agendamentos a
        JOIN servicos s ON s.id = a.servico_id
        WHERE a.status = 'concluido'
        GROUP BY a.cliente_id
      ),
      segmentado AS (
        SELECT *,
          CASE
            WHEN freq = 1 AND recencia <= INTERVAL '60 days' THEN 'novo'
            WHEN freq >= 2 AND recencia <= INTERVAL '45 days' THEN 'fiel'
            WHEN freq >= 2 AND recencia <= INTERVAL '90 days' THEN 'ativo'
            WHEN recencia <= INTERVAL '180 days' THEN 'em_risco'
            ELSE 'inativo'
          END AS segmento
        FROM base
      )
      SELECT
        segmento,
        COUNT(*)                AS qtd,
        COALESCE(SUM(valor), 0) AS ltv_total,
        COALESCE(AVG(valor), 0) AS ltv_medio
      FROM segmentado
      GROUP BY segmento
    `);

    const totalClientesBase = rfmResult.rows.reduce((acc, r) => acc + Number(r.qtd), 0);
    const segmentos = { novo: 0, ativo: 0, fiel: 0, em_risco: 0, inativo: 0 };
    let ltvTotalGeral = 0;
    rfmResult.rows.forEach(r => {
      segmentos[r.segmento] = Number(r.qtd);
      ltvTotalGeral += Number(r.ltv_total);
    });

    // Taxa de fidelização = % de clientes recorrentes (ativo + fiel) entre os que já voltaram pelo menos 1x
    const recorrentes = segmentos.ativo + segmentos.fiel;
    const baseRecorrencia = totalClientesBase - segmentos.novo;
    const fidelizacao = baseRecorrencia > 0
      ? Math.round(100 * recorrentes / baseRecorrencia)
      : 0;

    const ltvMedio = totalClientesBase > 0 ? ltvTotalGeral / totalClientesBase : 0;

    // Evolução temporal — usa o período selecionado; sem período, cai nos últimos 30 dias.
    const condEvolucao = condPeriodo.length ? whereExtra : `AND a.data >= NOW() - INTERVAL '30 days'`;
    const evolucaoResult = await pool.query(`
      SELECT
        TO_CHAR(a.data, 'DD/MM') AS dia,
        COALESCE(SUM(s.preco), 0) AS total
      FROM agendamentos a
      JOIN servicos s ON s.id = a.servico_id
      WHERE a.status IN ('concluido') ${condEvolucao}
      GROUP BY TO_CHAR(a.data, 'DD/MM'), DATE_TRUNC('day', a.data)
      ORDER BY DATE_TRUNC('day', a.data) ASC
    `, paramsPeriodo);
    const evolucao = evolucaoResult.rows.map(r => ({
      dia:   r.dia,
      total: Number(r.total)
    }));

    // Mix de serviços
    const servicosResult = await pool.query(`
      SELECT s.nome, COUNT(*) AS total
      FROM agendamentos a
      JOIN servicos s ON s.id = a.servico_id
      WHERE a.status IN ('concluido') ${whereExtra}
      GROUP BY s.nome
      ORDER BY total DESC
    `, paramsPeriodo);
    const servicos = servicosResult.rows.map(r => ({
      nome:  r.nome,
      total: Number(r.total)
    }));

    // Ranking de clientes com serviços, funcionário e veículo
    const clientesResult = await pool.query(`
      SELECT
        COALESCE(c.nome, 'Usuário Removido')                          AS nome,
        COUNT(a.id)                                                    AS qtd,
        COALESCE(SUM(s.preco), 0)                                      AS total,
        STRING_AGG(DISTINCT s.nome,  ', ' ORDER BY s.nome)            AS servicos_realizados,
        STRING_AGG(DISTINCT f.nome,  ', ' ORDER BY f.nome)            AS funcionario,
        STRING_AGG(
          DISTINCT
          CASE
            WHEN v.marca IS NOT NULL OR v.modelo IS NOT NULL
            THEN TRIM(COALESCE(v.marca, '') || ' ' || COALESCE(v.modelo, ''))
            ELSE NULL
          END,
          ', '
        )                                                              AS veiculos
      FROM agendamentos a
      LEFT JOIN clientes     c ON c.id = a.cliente_id
      LEFT JOIN servicos     s ON s.id = a.servico_id
      LEFT JOIN funcionarios f ON f.id = a.funcionario_id
      LEFT JOIN veiculos     v ON v.id = a.veiculo_id
      WHERE a.status IN ('concluido') ${whereExtra}
      GROUP BY c.nome
      ORDER BY total DESC
    `, paramsPeriodo);

    const clientes = clientesResult.rows.map(r => ({
      nome:                r.nome,
      qtd:                 Number(r.qtd),
      total:               Number(r.total),
      servicos_realizados: r.servicos_realizados || '—',
      funcionario:         r.funcionario         || '—',
      veiculos:            r.veiculos            || '—',
    }));

    res.status(200).json({
      periodo: { inicio: req.query.data_inicio || null, fim: req.query.data_fim || null },
      receitaTotal,
      ticketMedio,
      fidelizacao,
      ltvMedio,
      segmentos,
      evolucao,
      servicos,
      clientes
    });

  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ erro: error.mensagem });
    }
    console.error('Erro ao obter relatórios:', error);
    res.status(500).json({ erro: 'Erro interno ao gerar relatórios.' });
  }
};

module.exports = { obterRelatorios };
