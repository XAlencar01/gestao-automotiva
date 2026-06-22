// agendamentos.js — com paginação e filtro de status

// ── ESTADO DE PAGINAÇÃO ──────────────────────────────────
const LIMIT = 15;
let _offsetAgend   = 0;
let _totalAgend    = 0;
let _statusFiltro  = '';
let _listaFuncionarios = [];

// ── FORMULÁRIO ───────────────────────────────────────────
window.abrirFormulario = function () {
  document.getElementById('formAgendamento').style.display = 'block';
  carregarFuncionariosSelect();
};
window.fecharFormulario = function () {
  document.getElementById('formAgendamento').style.display = 'none';
};

async function carregarClientes() {
  const res   = await fetch(`${API}/clientes?limit=200`, { headers: getHeaders() });
  const body  = await res.json();
  const dados = body.dados ?? body; // compatível com array legado
  const ativos = dados.filter(c => c.nome !== 'Usuário Removido' && c.email !== null);
  const select = document.getElementById('cliente_id');
  select.innerHTML = `<option value="">Selecione o cliente</option>` +
    ativos.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  carregarVeiculosDoCliente();
}

window.carregarVeiculosDoCliente = async function () {
  const cliente_id = document.getElementById('cliente_id').value;
  const res    = await fetch(`${API}/veiculos`, { headers: getHeaders() });
  const dados  = await res.json();
  const lista  = Array.isArray(dados) ? dados : dados.dados ?? [];
  const filtrados = lista.filter(v => v.cliente_id == cliente_id);
  document.getElementById('veiculo_id').innerHTML =
    `<option value="">Selecione o veículo</option>` +
    filtrados.map(v => `<option value="${v.id}">${v.modelo} — ${v.placa}</option>`).join('');
};

let listaServicos = [];
async function carregarServicos() {
  const res     = await fetch(`${API}/servicos`, { headers: getHeaders() });
  listaServicos = await res.json();
  document.getElementById('servico_id').innerHTML =
    `<option value="">Selecione o serviço</option>` +
    listaServicos.map(s => `<option value="${s.id}">${s.nome} (${s.duracao_minutos} min)</option>`).join('');
}

async function carregarFuncionariosSelect() {
  try {
    const res  = await fetch(`${API}/funcionarios/ativos`, { headers: getHeaders() });
    const dados = await res.json();
    const select = document.getElementById('funcionario_id');
    if (!select) return;
    select.innerHTML = `<option value="">Sem funcionário designado</option>` +
      dados.map(f => `<option value="${f.id}">${f.nome}</option>`).join('');
  } catch (err) { console.error(err); }
}

// ── CRIAR ────────────────────────────────────────────────
window.criarAgendamento = async function () {
  const cliente_id    = document.getElementById('cliente_id').value;
  const veiculo_id    = document.getElementById('veiculo_id').value;
  const servico_id    = document.getElementById('servico_id').value;
  const data          = document.getElementById('data').value;
  const funcionario_id = document.getElementById('funcionario_id')?.value || null;

  if (!cliente_id || !veiculo_id || !servico_id || !data) {
    toast.aviso('Preencha todos os campos obrigatórios.'); return;
  }
  if (new Date(data) <= new Date()) {
    toast.aviso('Não é possível agendar em data e horário passados.'); return;
  }
  try {
    const res = await fetch(`${API}/agendamentos`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ cliente_id, veiculo_id, servico_id, data, funcionario_id: funcionario_id || null })
    });
    if (res.ok) {
      toast.sucesso('Agendamento criado com sucesso!');
      fecharFormulario();
      carregarAgendamentos();
    } else {
      const erro = await res.json();
      toast.erro(erro.erro || 'Erro ao criar agendamento.');
    }
  } catch (err) { toast.erro('Erro de conexão com o servidor.'); }
};

// ── ATUALIZAR STATUS ─────────────────────────────────────
window.atualizarStatus = async function (id, status) {
  try {
    const res = await fetch(`${API}/agendamentos/${id}`, {
      method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status })
    });
    if (res.ok) {
      const msg = { aprovado: 'Agendamento aprovado!', recusado: 'Agendamento recusado.', concluido: 'Serviço concluído!' };
      const tipo = (status === 'aprovado' || status === 'concluido') ? 'sucesso' : 'aviso';
      toast[tipo](msg[status] ?? `Status: ${status}`);
      carregarAgendamentos();
    } else {
      const erro = await res.json();
      toast.erro(erro.erro || 'Erro ao atualizar status.');
    }
  } catch (err) { toast.erro('Erro de conexão ao atualizar status.'); }
};

window.atribuirFuncionario = async function (agendamentoId, funcionarioId) {
  try {
    const res = await fetch(`${API}/agendamentos/${agendamentoId}`, {
      method: 'PUT', headers: getHeaders(),
      body: JSON.stringify({ status: 'aprovado', funcionario_id: funcionarioId || null })
    });
    if (res.ok) { toast.sucesso('Funcionário atribuído!'); carregarAgendamentos(); }
    else { const e = await res.json(); toast.erro(e.erro || 'Erro ao atribuir.'); }
  } catch (err) { toast.erro('Erro de conexão.'); }
};

// ── LISTAR COM PAGINAÇÃO ─────────────────────────────────
window.carregarAgendamentos = async function (offset = 0) {
  _offsetAgend = offset;

  try {
    const fRes = await fetch(`${API}/funcionarios/ativos`, { headers: getHeaders() });
    _listaFuncionarios = fRes.ok ? await fRes.json() : [];
  } catch { _listaFuncionarios = []; }

  const params = new URLSearchParams({ limit: LIMIT, offset });
  if (_statusFiltro) params.set('status', _statusFiltro);

  const res  = await fetch(`${API}/agendamentos?${params}`, { headers: getHeaders() });
  const body = await res.json();

  // suporte a resposta paginada { dados, total } e array legado
  const dados = body.dados ?? body;
  _totalAgend = body.total ?? dados.length;

  const tabela = document.getElementById('tabela');
  tabela.innerHTML = '';

  if (!dados.length) {
    tabela.innerHTML = `<tr><td colspan="7" class="py-16 text-center text-slate-500">
      <div class="flex flex-col items-center gap-3">
        <i data-lucide="calendar-off" class="w-10 h-10 opacity-20"></i>
        <p>Nenhum agendamento encontrado.</p>
      </div></td></tr>`;
    lucide.createIcons();
    renderizarPaginacao();
    return;
  }

  const badgeMap = {
    pendente:  '<span style="background:rgba(251,191,36,.12);color:#fbbf24;padding:.2rem .65rem;border-radius:9999px;font-size:.72rem;font-weight:700">PENDENTE</span>',
    aprovado:  '<span style="background:rgba(34,197,94,.12);color:#22c55e;padding:.2rem .65rem;border-radius:9999px;font-size:.72rem;font-weight:700">APROVADO</span>',
    recusado:  '<span style="background:rgba(239,68,68,.12);color:#ef4444;padding:.2rem .65rem;border-radius:9999px;font-size:.72rem;font-weight:700">RECUSADO</span>',
    concluido: '<span style="background:rgba(14,165,233,.12);color:#0ea5e9;padding:.2rem .65rem;border-radius:9999px;font-size:.72rem;font-weight:700">CONCLUÍDO</span>',
  };

  const opsFuncionarios = `<option value="">— Nenhum —</option>` +
    _listaFuncionarios.map(f => `<option value="${f.id}">${f.nome}</option>`).join('');

  dados.forEach(a => {
    const tr = document.createElement('tr');
    const dataFormatada = new Date(a.data).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo'
    });
    const selectFunc = `<select onchange="atribuirFuncionario(${a.id}, this.value)"
      style="background:#221b17;border:1px solid #3a2f29;color:#fdf6f0;padding:.3rem .6rem;
             border-radius:.5rem;font-size:.75rem;outline:none;min-width:130px;">
      ${opsFuncionarios.replace(`value="${a.funcionario_id}"`, `value="${a.funcionario_id}" selected`)}
    </select>`;
    const anivBadge = a.desconto_aniversario
      ? `<span title="Desconto de aniversário" style="margin-left:.25rem;font-size:.75rem">🎂</span>` : '';
    const botoesAcao = () => {
      if (a.status === 'pendente') return `
        <button onclick="atualizarStatus(${a.id},'aprovado')" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors border border-green-500/20">Aprovar</button>
        <button onclick="atualizarStatus(${a.id},'recusado')" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20">Recusar</button>`;
      if (a.status === 'aprovado') return `
        <button onclick="atualizarStatus(${a.id},'concluido')" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors border border-sky-500/20">Concluir</button>`;
      return '';
    };
    tr.innerHTML = `
      <td class="text-slate-200">${a.cliente}</td>
      <td class="text-slate-400">${a.veiculo}</td>
      <td class="text-slate-400">${a.servico}${anivBadge}</td>
      <td class="text-slate-400">${dataFormatada}</td>
      <td>${badgeMap[a.status] ?? a.status}</td>
      <td>${selectFunc}</td>
      <td class="text-right"><div class="flex items-center justify-end gap-2">
        ${botoesAcao()}
        <button onclick="deletar(${a.id})" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-slate-600/30">Excluir</button>
      </div></td>`;
    tabela.appendChild(tr);
  });

  lucide.createIcons();
  renderizarPaginacao();
};

// ── PAGINAÇÃO ────────────────────────────────────────────
function renderizarPaginacao() {
  const container = document.getElementById('paginacao-agend');
  if (!container) return;

  const totalPags  = Math.ceil(_totalAgend / LIMIT);
  const pagAtual   = Math.floor(_offsetAgend / LIMIT) + 1;
  const inicio     = _totalAgend === 0 ? 0 : _offsetAgend + 1;
  const fim        = Math.min(_offsetAgend + LIMIT, _totalAgend);

  container.innerHTML = `
    <div class="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-slate-800">
      <span class="text-xs text-slate-500">
        Mostrando <strong class="text-slate-300">${inicio}–${fim}</strong> de <strong class="text-slate-300">${_totalAgend}</strong> agendamentos
      </span>
      <div class="flex items-center gap-1">
        <button onclick="carregarAgendamentos(${_offsetAgend - LIMIT})"
          ${pagAtual === 1 ? 'disabled' : ''}
          class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          ← Anterior
        </button>
        <span class="px-3 py-1.5 text-xs font-bold text-slate-300">${pagAtual} / ${totalPags || 1}</span>
        <button onclick="carregarAgendamentos(${_offsetAgend + LIMIT})"
          ${pagAtual >= totalPags || totalPags === 0 ? 'disabled' : ''}
          class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          Próximo →
        </button>
      </div>
    </div>`;
}

// ── FILTRO DE STATUS ─────────────────────────────────────
window.filtrarStatus = function (status) {
  _statusFiltro = status;
  _offsetAgend  = 0;

  // Atualiza estilo dos botões de filtro
  document.querySelectorAll('.btn-filtro-status').forEach(btn => {
    const ativo = btn.dataset.status === status;
    btn.style.background  = ativo ? 'var(--primary)' : 'transparent';
    btn.style.color       = ativo ? '#fff' : '#a8978c';
    btn.style.borderColor = ativo ? 'var(--primary)' : '#3a2f29';
  });

  carregarAgendamentos(0);
};

// ── EXCLUIR ──────────────────────────────────────────────
window.deletar = function (id) {
  const modal = document.getElementById('modal-excluir-agendamento');
  modal.dataset.agendamentoId = id;
  modal.classList.remove('hidden'); modal.classList.add('flex');
};
window.fecharModalExcluirAgendamento = function () {
  const modal = document.getElementById('modal-excluir-agendamento');
  modal.classList.add('hidden'); modal.classList.remove('flex');
};
window.executarExclusaoAgendamento = async function () {
  const modal = document.getElementById('modal-excluir-agendamento');
  const id    = modal.dataset.agendamentoId;
  fecharModalExcluirAgendamento();
  try {
    const res = await fetch(`${API}/agendamentos/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (res.ok) { toast.sucesso('Agendamento excluído.'); carregarAgendamentos(_offsetAgend); }
    else toast.erro('Erro ao excluir agendamento.');
  } catch (err) { toast.erro('Erro de conexão ao excluir.'); }
};

// INIT
carregarClientes();
carregarServicos();
carregarAgendamentos();