// relatorios.js

let chartReceita  = null;
let chartServicos = null;

// Inicializa os dois gráficos — chamada pelo carregarRelatorios
function inicializarGraficos(labelsReceita, dadosReceita, labelsServicos, dadosServicos) {
  labelsReceita  = labelsReceita  || [];
  dadosReceita   = dadosReceita   || [];
  labelsServicos = labelsServicos || [];
  dadosServicos  = dadosServicos  || [];

  const ctxR = document.getElementById('receitaChart')?.getContext('2d');
  const ctxS = document.getElementById('servicosChart')?.getContext('2d');
  if (!ctxR || !ctxS) return;

  if (chartReceita)  chartReceita.destroy();
  if (chartServicos) chartServicos.destroy();

  chartReceita = new Chart(ctxR, {
    type: 'line',
    data: {
      labels: labelsReceita,
      datasets: [{
        label: 'Faturamento',
        data: dadosReceita,
        borderColor: '#ff6b35',
        backgroundColor: 'rgba(255,107,53,0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#3a2f29' }, ticks: { color: '#a8978c' } },
        x: { grid: { display: false }, ticks: { color: '#a8978c' } }
      }
    }
  });

  chartServicos = new Chart(ctxS, {
    type: 'doughnut',
    data: {
      labels: labelsServicos,
      datasets: [{
        data: dadosServicos,
        backgroundColor: ['#ff6b35','#10b981','#f59e0b','#6366f1','#8b5cf6'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#a8978c', padding: 20 } }
      }
    }
  });
}

// FILTRO DE PERÍODO
let _filtroDataInicio = '';
let _filtroDataFim    = '';

function aplicarFiltroPeriodo() {
  const inicio = document.getElementById('filtro-data-inicio').value;
  const fim    = document.getElementById('filtro-data-fim').value;
  if (inicio && fim && inicio > fim) {
    toast.aviso('A data inicial não pode ser depois da data final.');
    return;
  }
  _filtroDataInicio = inicio;
  _filtroDataFim    = fim;
  document.querySelectorAll('.atalho-periodo').forEach(b => b.classList.remove('atalho-ativo'));
  carregarRelatorios();
}

function limparFiltroPeriodo() {
  document.getElementById('filtro-data-inicio').value = '';
  document.getElementById('filtro-data-fim').value    = '';
  _filtroDataInicio = '';
  _filtroDataFim    = '';
  document.querySelectorAll('.atalho-periodo').forEach(b => b.classList.remove('atalho-ativo'));
  carregarRelatorios();
}

function aplicarAtalhoPeriodo(dias, btnEl) {
  const fim    = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - (dias - 1));

  const toISO = d => d.toISOString().slice(0, 10);
  _filtroDataInicio = toISO(inicio);
  _filtroDataFim    = toISO(fim);

  document.getElementById('filtro-data-inicio').value = _filtroDataInicio;
  document.getElementById('filtro-data-fim').value    = _filtroDataFim;

  document.querySelectorAll('.atalho-periodo').forEach(b => b.classList.remove('atalho-ativo'));
  btnEl?.classList.add('atalho-ativo');

  carregarRelatorios();
}

function atualizarLabelPeriodo(periodo) {
  const label = document.getElementById('periodo-ativo-label');
  if (!label) return;
  if (!periodo?.inicio && !periodo?.fim) {
    label.textContent = 'Mostrando: todo o histórico';
    return;
  }
  const fmt = iso => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') : '';
  if (periodo.inicio && periodo.fim) label.textContent = `Mostrando: ${fmt(periodo.inicio)} até ${fmt(periodo.fim)}`;
  else if (periodo.inicio)           label.textContent = `Mostrando: a partir de ${fmt(periodo.inicio)}`;
  else                                label.textContent = `Mostrando: até ${fmt(periodo.fim)}`;
}

async function carregarRelatorios() {
  try {
    const params = new URLSearchParams();
    if (_filtroDataInicio) params.set('data_inicio', _filtroDataInicio);
    if (_filtroDataFim)    params.set('data_fim', _filtroDataFim);

    const res  = await fetch(`${API}/relatorios?${params}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) { toast.erro(data.erro ?? 'Erro ao carregar relatórios.'); return; }

    atualizarLabelPeriodo(data.periodo);

    // Cards
    document.getElementById('val-ticket').innerText =
      'R$ ' + Number(data.ticketMedio || 0).toFixed(2).replace('.', ',');
    document.getElementById('val-receita').innerText =
      'R$ ' + Number(data.receitaTotal || 0).toFixed(2).replace('.', ',');
    document.getElementById('val-fidelizacao').innerText =
      (data.fidelizacao || 0) + '%';
    document.getElementById('val-ltv').innerText =
      'R$ ' + Number(data.ltvMedio || 0).toFixed(2).replace('.', ',');
    const segs = data.segmentos || {};
    ['novo','ativo','fiel','em_risco','inativo'].forEach(k => {
      const el = document.getElementById('seg-' + k);
      if (el) el.textContent = segs[k] || 0;
    });

    // Evolução temporal
    const labelsReceita = (data.evolucao || []).map(e => e.dia);
    const dadosReceita  = (data.evolucao || []).map(e => e.total);

    // Mix de serviços
    const labelsServicos = (data.servicos || []).map(s => s.nome);
    const dadosServicos  = (data.servicos || []).map(s => s.total);

    inicializarGraficos(labelsReceita, dadosReceita, labelsServicos, dadosServicos);

    // Tabela de clientes
    const tbody = document.getElementById('rankingClientesBody');
    tbody.innerHTML = '';

    if (!data.clientes || !data.clientes.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-500">Nenhum dado disponível.</td></tr>`;
      return;
    }

    data.clientes.forEach(cliente => {
      const tr = document.createElement('tr');

      const servicosBadges = (cliente.servicos_realizados || '—')
        .split(', ')
        .map(s => s === '—'
          ? '<span style="color:#64748b">—</span>'
          : `<span style="background:rgba(45,212,191,.12);color:#2dd4bf;padding:2px 8px;border-radius:9999px;font-size:.72rem;font-weight:600;white-space:nowrap;">${s}</span>`
        ).join('');

      const funcionarioNome  = cliente.funcionario || '—';
      const funcionarioBadge = funcionarioNome !== '—'
        ? `<span style="background:rgba(16,185,129,.12);color:#34d399;padding:2px 10px;border-radius:9999px;font-size:.72rem;font-weight:600;white-space:nowrap;">👤 ${funcionarioNome}</span>`
        : `<span style="color:#64748b">—</span>`;

      const veiculosNome  = cliente.veiculos || '—';
      const veiculosBadge = veiculosNome !== '—'
        ? veiculosNome.split(', ').map(v =>
            `<span style="background:rgba(245,158,11,.1);color:#fbbf24;padding:2px 10px;border-radius:9999px;font-size:.72rem;font-weight:600;white-space:nowrap;">🚗 ${v}</span>`
          ).join('')
        : `<span style="color:#64748b">—</span>`;

      tr.innerHTML = `
        <td class="font-medium text-white">${cliente.nome}</td>
        <td><div style="display:flex;flex-wrap:wrap;gap:4px;">${veiculosBadge}</div></td>
        <td>${cliente.qtd}</td>
        <td><div style="display:flex;flex-wrap:wrap;gap:4px;">${servicosBadges}</div></td>
        <td><div style="display:flex;flex-wrap:wrap;gap:4px;">${funcionarioBadge}</div></td>
        <td class="text-right font-bold text-white">R$ ${Number(cliente.total).toFixed(2).replace('.', ',')}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Erro ao carregar relatórios:', err);
    const tbody = document.getElementById('rankingClientesBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-red-400">Erro ao carregar dados. Verifique a conexão.</td></tr>`;
    }
  }
}

// Exportar CSV
function exportarExcel() {
  const rows = document.getElementById('tabela-ranking')?.querySelectorAll('tr') || [];
  const csv  = [];
  for (const row of rows) {
    const cols    = row.querySelectorAll('td, th');
    const rowData = [];
    for (const col of cols) {
      const txt = col.innerText.replace(/,/g, '.').replace(/"/g, "'");
      rowData.push('"' + txt + '"');
    }
    csv.push(rowData.join(';'));
  }
  const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Relatorio_SmartSystem_${new Date().toLocaleDateString()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Exportar PDF via print
function exportarPDF() {
  window.print();
}