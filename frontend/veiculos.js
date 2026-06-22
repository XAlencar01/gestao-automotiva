// veiculos.js — com paginação

//ESTADO PAGINAÇÃO
const LIMIT = 15;
let _offsetVeic  = 0;
let _totalVeic   = 0;
let veiculoEditando = null;

// MODAL CONFIRMAÇÃO DELETE 
(function () {
  const overlay = document.createElement('div');
  overlay.id = 'modal-confirmar-delete';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:9000;background:rgba(2,6,23,.85);backdrop-filter:blur(6px);align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#17120f;border:1px solid #3a2f29;border-radius:1.25rem;padding:2rem;width:100%;max-width:420px;box-shadow:0 25px 60px rgba(0,0,0,.6);">
      <div style="width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;background:rgba(239,68,68,.12);color:#f87171;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
      </div>
      <p style="font-size:1.125rem;font-weight:800;color:#fdf6f0;text-align:center;margin-bottom:.5rem;">Deletar veículo?</p>
      <p style="font-size:.875rem;color:#a8978c;text-align:center;line-height:1.6;margin-bottom:1.75rem;">Esta ação é irreversível.</p>
      <div style="display:flex;gap:.75rem;">
        <button id="btn-cancelar-delete" style="flex:1;padding:.7rem 1rem;border-radius:.75rem;border:1px solid #3a2f29;background:transparent;color:#a8978c;font-weight:700;font-size:.875rem;cursor:pointer;font-family:inherit;">Cancelar</button>
        <button id="btn-confirmar-delete" style="flex:1;padding:.7rem 1rem;border-radius:.75rem;background:rgba(239,68,68,.12);color:#f87171;border:1px solid rgba(239,68,68,.25);font-weight:700;font-size:.875rem;cursor:pointer;font-family:inherit;">Deletar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('btn-cancelar-delete').addEventListener('click', fecharModalDelete);
  overlay.addEventListener('click', e => { if (e.target === overlay) fecharModalDelete(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModalDelete(); });
})();

function abrirModalDelete(id) {
  const overlay = document.getElementById('modal-confirmar-delete');
  overlay.style.display = 'flex';
  const btn = document.getElementById('btn-confirmar-delete');
  const novo = btn.cloneNode(true);
  btn.parentNode.replaceChild(novo, btn);
  novo.addEventListener('click', () => { fecharModalDelete(); executarDeleteVeiculo(id); });
}
function fecharModalDelete() {
  document.getElementById('modal-confirmar-delete').style.display = 'none';
}

//CLIENTES (para o select do form)
async function carregarClientes() {
  try {
    const res  = await fetch(`${API}/clientes?limit=200`, { headers: getHeaders() });
    const body = await res.json();
    const dados = body.dados ?? body;
    const select = document.getElementById('cliente_id');
    if (!select) return;
    select.innerHTML = `<option value="">Selecione um cliente</option>` +
      dados.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  } catch (erro) { toast.erro('Erro ao carregar clientes.'); }
}

//LISTAR COM PAGINAÇÃO
window.carregarVeiculos = async function (offset = 0) {
  _offsetVeic = offset;
  try {
    const params = new URLSearchParams({ limit: LIMIT, offset });
    const res    = await fetch(`${API}/veiculos?${params}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Erro na API');

    const body  = await res.json();
    const dados = Array.isArray(body) ? body : (body.dados ?? []);
    _totalVeic  = body.total ?? dados.length;

    const tabela = document.getElementById('tabela');
    tabela.innerHTML = '';

    if (dados.length === 0) {
      tabela.innerHTML = `<tr><td colspan="4" class="py-20 text-center text-slate-500">
        <div class="flex flex-col items-center gap-3">
          <i data-lucide="car" class="w-10 h-10 opacity-10"></i>
          <p>Nenhum veículo cadastrado.</p>
        </div></td></tr>`;
      lucide.createIcons();
      renderizarPaginacaoVeiculos();
      return;
    }

    dados.forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${v.cliente || '—'}</td>
        <td>${v.marca || ''} ${v.modelo || ''}</td>
        <td>${v.placa || '—'}</td>
        <td class="text-right">
          <div class="flex items-center justify-end gap-2">
            <button onclick="editarVeiculo(${v.id})"
              class="text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors border border-orange-500/20">
              Editar
            </button>
            <button onclick="deletarVeiculo(${v.id})"
              class="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20">
              Excluir
            </button>
          </div>
        </td>`;
      tabela.appendChild(tr);
    });

    lucide.createIcons();
    renderizarPaginacaoVeiculos();

  } catch (erro) {
    console.error(erro);
    document.getElementById('tabela').innerHTML =
      `<tr><td colspan="4" class="py-10 text-center text-red-400">Erro ao carregar veículos.</td></tr>`;
  }
};

//PAGINAÇÃO 
function renderizarPaginacaoVeiculos() {
  const container = document.getElementById('paginacao-veiculos');
  if (!container) return;

  const totalPags = Math.ceil(_totalVeic / LIMIT);
  const pagAtual  = Math.floor(_offsetVeic / LIMIT) + 1;
  const inicio    = _totalVeic === 0 ? 0 : _offsetVeic + 1;
  const fim       = Math.min(_offsetVeic + LIMIT, _totalVeic);

  container.innerHTML = `
    <div class="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-slate-800">
      <span class="text-xs text-slate-500">
        Mostrando <strong class="text-slate-300">${inicio}–${fim}</strong> de <strong class="text-slate-300">${_totalVeic}</strong> veículos
      </span>
      <div class="flex items-center gap-1">
        <button onclick="carregarVeiculos(${_offsetVeic - LIMIT})"
          ${pagAtual === 1 ? 'disabled' : ''}
          class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          ← Anterior
        </button>
        <span class="px-3 py-1.5 text-xs font-bold text-slate-300">${pagAtual} / ${totalPags || 1}</span>
        <button onclick="carregarVeiculos(${_offsetVeic + LIMIT})"
          ${pagAtual >= totalPags || totalPags === 0 ? 'disabled' : ''}
          class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          Próximo →
        </button>
      </div>
    </div>`;
}

// FORM 
window.abrirFormVeiculo = function () {
  document.getElementById('formVeiculo').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.fecharFormVeiculo = function () {
  document.getElementById('formVeiculo').style.display = 'none';
  veiculoEditando = null;
  ['cliente_id','marca','modelo','placa','cor','ano'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
};

window.editarVeiculo = async function (id) {
  try {
    abrirFormVeiculo();
    const res = await fetch(`${API}/veiculos/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Erro ao buscar veículo');
    const v = await res.json();
    document.getElementById('cliente_id').value = v.cliente_id;
    document.getElementById('marca').value      = v.marca;
    document.getElementById('modelo').value     = v.modelo;
    document.getElementById('placa').value      = v.placa;
    document.getElementById('cor').value        = v.cor;
    document.getElementById('ano').value        = v.ano;
    veiculoEditando = id;
  } catch { toast.erro('Não foi possível carregar os dados do veículo.'); }
};

window.salvarVeiculo = async function () {
  const cliente_id = document.getElementById('cliente_id').value;
  const marca      = document.getElementById('marca').value.trim();
  const modelo     = document.getElementById('modelo').value.trim();
  const placa      = document.getElementById('placa').value.trim();
  const cor        = document.getElementById('cor').value.trim();
  const ano        = document.getElementById('ano').value.trim();
  if (!cliente_id || !marca || !modelo || !placa) {
    toast.aviso('Preencha: Cliente, Marca, Modelo e Placa.'); return;
  }
  try {
    const res = await fetch(veiculoEditando ? `${API}/veiculos/${veiculoEditando}` : `${API}/veiculos`, {
      method: veiculoEditando ? 'PUT' : 'POST', headers: getHeaders(),
      body: JSON.stringify({ cliente_id, marca, modelo, placa, cor, ano })
    });
    if (res.ok) {
      toast.sucesso(veiculoEditando ? 'Veículo atualizado!' : 'Veículo cadastrado!');
      fecharFormVeiculo(); carregarVeiculos(_offsetVeic);
    } else {
      const erro = await res.json().catch(() => ({}));
      toast.erro(erro.erro || 'Erro ao salvar veículo.');
    }
  } catch { toast.erro('Erro de conexão.'); }
};

window.deletarVeiculo = function (id) { abrirModalDelete(id); };

async function executarDeleteVeiculo(id) {
  try {
    const res = await fetch(`${API}/veiculos/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (res.ok) toast.sucesso('Veículo removido!');
    else toast.erro('Erro ao deletar o veículo.');
    carregarVeiculos(_offsetVeic);
  } catch { toast.erro('Erro de conexão.'); }
}
