// agenda.js — Painel Admin: Gestão de Agenda

// ── ESTADO ──────────────────────────────────────────
const DIAS_SEMANA = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const DIAS_CURTO  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// ── STATUS HOJE ──────────────────────────────────────
async function carregarStatusHoje() {
  try {
    const res  = await fetch(`${API}/agenda/status-hoje`, { headers: getHeaders() });
    const data = await res.json();

    const badge   = document.getElementById('status-badge');
    const detalhe = document.getElementById('status-detalhe');
    const card    = document.getElementById('card-status-hoje');

    if (data.aberto) {
      badge.textContent   = '● Aberto Hoje';
      badge.className     = 'status-badge aberto';
      detalhe.innerHTML   = `
        <span>🕐 ${data.abertura?.slice(0,5)} – ${data.fechamento?.slice(0,5)}</span>
        <span>👷 ${data.funcionarios_ativos} funcionário(s) ativo(s)</span>
        <span>📋 ${data.agendamentos_hoje} agendamento(s) hoje</span>
      `;
      card.classList.remove('fechado');
    } else {
      badge.textContent  = '● Fechado Hoje';
      badge.className    = 'status-badge fechado';
      detalhe.innerHTML  = `<span>⚠️ ${data.motivo || 'Loja fechada'}</span>`;
      card.classList.add('fechado');
    }

    const btnToggle = document.getElementById('btn-toggle-hoje');
    if (data.aberto) {
      btnToggle.textContent = '🔒 Fechar hoje';
      btnToggle.onclick     = () => abrirModalFecharHoje();
    } else {
      btnToggle.textContent = '🔓 Reabrir hoje';
      btnToggle.onclick     = () => reabrirHoje();
    }
  } catch(e) {
    console.error('Erro ao carregar status hoje:', e);
  }
}

async function reabrirHoje() {
  const hoje = new Date().toISOString().slice(0, 10);
  try {
    const res  = await fetch(`${API}/agenda/dias-fechados`, { headers: getHeaders() });
    const dias  = await res.json();
    const diaHoje = dias.find(d => d.data?.slice(0,10) === hoje);
    if (!diaHoje) { toast.aviso('Hoje não está marcado como fechado.'); return; }

    const del = await fetch(`${API}/agenda/dias-fechados/${diaHoje.id}`, {
      method: 'DELETE', headers: getHeaders()
    });
    if (!del.ok) { toast.erro('Erro ao reabrir.'); return; }
    toast.sucesso('Loja reaberta para hoje!');
    await carregarStatusHoje();
    await carregarDiasFechados();
  } catch(e) { toast.erro('Erro de conexão.'); }
}

// ── MODAL FECHAR HOJE ────────────────────────────────
function abrirModalFecharHoje() {
  document.getElementById('input-motivo-fechar').value = '';
  const m = document.getElementById('modal-fechar-hoje');
  m.classList.remove('hidden'); m.classList.add('flex');
}
function fecharModalFecharHoje() {
  const m = document.getElementById('modal-fechar-hoje');
  m.classList.add('hidden'); m.classList.remove('flex');
}
async function confirmarFecharHoje() {
  const motivo = document.getElementById('input-motivo-fechar').value.trim();
  const hoje   = new Date().toISOString().slice(0, 10);
  try {
    const res = await fetch(`${API}/agenda/dias-fechados`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ data: hoje, motivo: motivo || 'Fechado manualmente pelo admin' })
    });
    if (!res.ok) {
      const e = await res.json();
      toast.erro(e.erro || 'Erro ao fechar.'); return;
    }
    toast.sucesso('Loja marcada como fechada hoje.');
    fecharModalFecharHoje();
    await carregarStatusHoje();
    await carregarDiasFechados();
  } catch(e) { toast.erro('Erro de conexão.'); }
}

// ── HORÁRIOS DE FUNCIONAMENTO ────────────────────────
let _horarios = [];

async function carregarFuncionamento() {
  try {
    const res  = await fetch(`${API}/agenda/funcionamento`, { headers: getHeaders() });
    _horarios  = await res.json();
    renderizarFuncionamento();
  } catch(e) {
    console.error('Erro ao carregar funcionamento:', e);
  }
}

function renderizarFuncionamento() {
  const container = document.getElementById('tabela-funcionamento');
  container.innerHTML = _horarios.map(h => `
    <div class="horario-row ${h.ativo ? '' : 'inativo'}" id="row-dia-${h.dia_semana}">
      <div class="dia-label">
        <span class="dia-nome">${DIAS_SEMANA[h.dia_semana]}</span>
        <span class="dia-curto">${DIAS_CURTO[h.dia_semana]}</span>
      </div>
      <label class="toggle-switch" title="${h.ativo ? 'Clique para desativar' : 'Clique para ativar'}">
        <input type="checkbox" ${h.ativo ? 'checked' : ''}
          onchange="toggleDiaSemana(${h.dia_semana}, this.checked)">
        <span class="toggle-slider"></span>
      </label>
      <div class="horario-inputs ${h.ativo ? '' : 'disabled'}">
        <div class="input-time-group">
          <label>Abertura</label>
          <input type="time" value="${h.abertura?.slice(0,5)}"
            id="ab-${h.dia_semana}" class="input-time" ${h.ativo ? '' : 'disabled'}>
        </div>
        <span class="separador">–</span>
        <div class="input-time-group">
          <label>Fechamento</label>
          <input type="time" value="${h.fechamento?.slice(0,5)}"
            id="fe-${h.dia_semana}" class="input-time" ${h.ativo ? '' : 'disabled'}>
        </div>
        <div class="input-time-group">
          <label>Intervalo</label>
          <select id="int-${h.dia_semana}" class="input-time" ${h.ativo ? '' : 'disabled'}>
            ${[15,20,30,45,60].map(v =>
              `<option value="${v}" ${h.intervalo_min == v ? 'selected' : ''}>${v} min</option>`
            ).join('')}
          </select>
        </div>
        <button onclick="salvarDia(${h.dia_semana})" class="btn-salvar-dia">Salvar</button>
      </div>
    </div>
  `).join('');
}

async function toggleDiaSemana(dia, ativo) {
  const h = _horarios.find(x => x.dia_semana === dia);
  if (!h) return;
  await salvarDiaComValores(dia, h.abertura?.slice(0,5), h.fechamento?.slice(0,5), h.intervalo_min, ativo);
}

async function salvarDia(dia) {
  const abertura    = document.getElementById(`ab-${dia}`).value;
  const fechamento  = document.getElementById(`fe-${dia}`).value;
  const intervalo   = document.getElementById(`int-${dia}`).value;
  const ativo       = _horarios.find(x => x.dia_semana === dia)?.ativo ?? true;

  if (!abertura || !fechamento) { toast.aviso('Preencha os horários.'); return; }
  if (abertura >= fechamento)   { toast.aviso('Abertura deve ser antes do fechamento.'); return; }

  await salvarDiaComValores(dia, abertura, fechamento, intervalo, ativo);
}

async function salvarDiaComValores(dia, abertura, fechamento, intervalo, ativo) {
  try {
    const res = await fetch(`${API}/agenda/funcionamento/${dia}`, {
      method: 'PUT', headers: getHeaders(),
      body: JSON.stringify({ abertura, fechamento, intervalo_min: intervalo, ativo })
    });
    if (!res.ok) { toast.erro('Erro ao salvar.'); return; }
    const atualizado = await res.json();
    const idx = _horarios.findIndex(x => x.dia_semana === dia);
    if (idx >= 0) _horarios[idx] = atualizado;
    renderizarFuncionamento();
    toast.sucesso(`${DIAS_SEMANA[dia]} atualizado!`);
  } catch(e) { toast.erro('Erro de conexão.'); }
}

// DIAS FECHADOS
async function carregarDiasFechados() {
  try {
    const res  = await fetch(`${API}/agenda/dias-fechados`, { headers: getHeaders() });
    const dias = await res.json();
    renderizarDiasFechados(dias);
  } catch(e) {
    console.error('Erro ao carregar dias fechados:', e);
  }
}

function renderizarDiasFechados(dias) {
  const lista = document.getElementById('lista-dias-fechados');
  if (!dias.length) {
    lista.innerHTML = `<p class="vazio">Nenhum dia fechado cadastrado.</p>`;
    return;
  }
  lista.innerHTML = dias.map(d => {
    const dataFmt = new Date(d.data.slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    });
    return `
      <div class="dia-fechado-item">
        <div>
          <span class="data-tag">📅 ${dataFmt}</span>
          ${d.motivo ? `<span class="motivo-tag">${d.motivo}</span>` : ''}
        </div>
        <button onclick="removerDiaFechado(${d.id})" class="btn-remover-dia" title="Reabrir este dia">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;
  }).join('');
}

async function adicionarDiaFechado() {
  const data   = document.getElementById('input-data-fechar').value;
  const motivo = document.getElementById('input-motivo-especifico').value.trim();
  if (!data) { toast.aviso('Selecione uma data.'); return; }

  try {
    const res = await fetch(`${API}/agenda/dias-fechados`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ data, motivo: motivo || null })
    });
    if (!res.ok) {
      const e = await res.json();
      toast.erro(e.erro || 'Erro ao adicionar.'); return;
    }
    document.getElementById('input-data-fechar').value       = '';
    document.getElementById('input-motivo-especifico').value = '';
    toast.sucesso('Dia fechado adicionado!');
    await carregarDiasFechados();
    await carregarStatusHoje();
  } catch(e) { toast.erro('Erro de conexão.'); }
}

async function removerDiaFechado(id) {
  try {
    const res = await fetch(`${API}/agenda/dias-fechados/${id}`, {
      method: 'DELETE', headers: getHeaders()
    });
    if (!res.ok) { toast.erro('Erro ao remover.'); return; }
    toast.sucesso('Dia reaberto!');
    await carregarDiasFechados();
    await carregarStatusHoje();
  } catch(e) { toast.erro('Erro de conexão.'); }
}