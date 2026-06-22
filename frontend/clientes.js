// clientes.js — com paginação e busca

// ESTADO DE PAGINAÇÃO 
const LIMIT = 15;
let _offsetCli = 0;
let _totalCli  = 0;
let _buscaCli  = '';
let _buscaTimer = null;

// LISTAR 
window.carregarClientes = async function (offset = 0) {
  _offsetCli = offset;
  try {
    const params = new URLSearchParams({ limit: LIMIT, offset });
    if (_buscaCli) params.set('busca', _buscaCli);

    const res  = await fetch(`${API}/clientes?${params}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha na requisição');

    const body   = await res.json();
    const dados  = body.dados ?? body;
    _totalCli    = body.total ?? dados.length;

    // Remove anonimizados LGPD
    const ativos = dados.filter(c => c.nome !== 'Usuário Removido' && c.email !== null);
    const tabela = document.getElementById('tabela');

    if (ativos.length === 0) {
      tabela.innerHTML = `<tr><td colspan="5" class="py-16 text-center text-slate-500">
        <div class="flex flex-col items-center gap-3">
          <i data-lucide="users" class="w-10 h-10 opacity-10"></i>
          <p id="msg-vazio-clientes"></p>
        </div></td></tr>`;
      document.getElementById('msg-vazio-clientes').textContent = _buscaCli
        ? `Nenhum cliente encontrado para "${_buscaCli}".`
        : 'Nenhum cliente cadastrado.';
      lucide.createIcons();
      renderizarPaginacaoClientes();
      return;
    }

    tabela.innerHTML = '';
    ativos.forEach(c => tabela.appendChild(criarLinhaCliente(c)));

    lucide.createIcons();
    renderizarPaginacaoClientes();

  } catch (erro) {
    console.error(erro);
    document.getElementById('tabela').innerHTML =
      `<tr><td colspan="5" class="py-8 text-center text-red-400">Erro ao carregar clientes.</td></tr>`;
  }
};

// FUNIL — rótulos do estágio do cliente
const FUNIL_LABEL = {
  novo:       { cls: 'funil-novo',       label: 'Novo'       },
  ativo:      { cls: 'funil-ativo',      label: 'Ativo'      },
  recorrente: { cls: 'funil-recorrente', label: 'Recorrente' },
  inativo:    { cls: 'funil-inativo',    label: 'Inativo'    },
};

// Cria a linha da tabela via DOM (sem innerHTML com dados do usuário) para evitar XSS.
function criarLinhaCliente(c) {
  const tr = document.createElement('tr');

  const tdNome = document.createElement('td');
  tdNome.className = 'text-slate-200 font-medium';
  tdNome.textContent = c.nome ?? '—';

  const tdEmail = document.createElement('td');
  tdEmail.className = 'text-slate-400';
  tdEmail.textContent = c.email ?? '—';

  const tdTelefone = document.createElement('td');
  tdTelefone.className = 'text-slate-400';
  tdTelefone.textContent = c.telefone ?? '—';

  const tdFunil = document.createElement('td');
  const funil = FUNIL_LABEL[c.status_funil] ?? FUNIL_LABEL.novo;
  const spanFunil = document.createElement('span');
  spanFunil.className = `funil-badge ${funil.cls}`;
  spanFunil.textContent = funil.label;
  tdFunil.appendChild(spanFunil);

  const tdAcoes = document.createElement('td');
  tdAcoes.className = 'text-right';
  const wrap = document.createElement('div');
  wrap.className = 'flex items-center justify-end gap-2';

  const btnVer = document.createElement('button');
  btnVer.className = 'text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20';
  btnVer.textContent = 'Ver perfil';
  btnVer.addEventListener('click', () => { window.location.href = `cliente-detalhe.html?id=${c.id}`; });

  const btnEditar = document.createElement('button');
  btnEditar.className = 'text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors border border-orange-500/20';
  btnEditar.textContent = 'Editar';
  btnEditar.addEventListener('click', () => editarCliente(c.id));

  const btnExcluir = document.createElement('button');
  btnExcluir.className = 'text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20';
  btnExcluir.textContent = 'Excluir';
  btnExcluir.addEventListener('click', () => confirmarExclusaoCliente(c.id, c.nome ?? ''));

  wrap.append(btnVer, btnEditar, btnExcluir);
  tdAcoes.appendChild(wrap);

  tr.append(tdNome, tdEmail, tdTelefone, tdFunil, tdAcoes);
  return tr;
}

//PAGINAÇÃO
function renderizarPaginacaoClientes() {
  const container = document.getElementById('paginacao-clientes');
  if (!container) return;

  const totalPags = Math.ceil(_totalCli / LIMIT);
  const pagAtual  = Math.floor(_offsetCli / LIMIT) + 1;
  const inicio    = _totalCli === 0 ? 0 : _offsetCli + 1;
  const fim       = Math.min(_offsetCli + LIMIT, _totalCli);

  container.innerHTML = `
    <div class="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-slate-800">
      <span class="text-xs text-slate-500">
        Mostrando <strong class="text-slate-300">${inicio}–${fim}</strong> de <strong class="text-slate-300">${_totalCli}</strong> clientes
      </span>
      <div class="flex items-center gap-1">
        <button onclick="carregarClientes(${_offsetCli - LIMIT})"
          ${pagAtual === 1 ? 'disabled' : ''}
          class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          ← Anterior
        </button>
        <span class="px-3 py-1.5 text-xs font-bold text-slate-300">${pagAtual} / ${totalPags || 1}</span>
        <button onclick="carregarClientes(${_offsetCli + LIMIT})"
          ${pagAtual >= totalPags || totalPags === 0 ? 'disabled' : ''}
          class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          Próximo →
        </button>
      </div>
    </div>`;
}

// BUSCA 
window.onBuscaCliente = function (valor) {
  clearTimeout(_buscaTimer);
  _buscaTimer = setTimeout(() => {
    _buscaCli   = valor.trim();
    _offsetCli  = 0;
    carregarClientes(0);
  }, 350);
};

// FORMULÁRIO
window.abrirFormCliente = function () {
  document.getElementById('formCliente').style.display = 'block';
  document.getElementById('clienteId').value = '';
  document.getElementById('nome').value      = '';
  document.getElementById('email').value     = '';
  document.getElementById('telefone').value  = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.fecharFormCliente = function () {
  document.getElementById('formCliente').style.display = 'none';
};

window.editarCliente = async function (id) {
  try {
    const res     = await fetch(`${API}/clientes/${id}`, { headers: getHeaders() });
    const cliente = await res.json();
    document.getElementById('formCliente').style.display = 'block';
    document.getElementById('clienteId').value = cliente.id;
    document.getElementById('nome').value      = cliente.nome;
    document.getElementById('email').value     = cliente.email;
    document.getElementById('telefone').value  = cliente.telefone;
    maskTelefone(document.getElementById('telefone'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (erro) {
    toast.erro('Não foi possível carregar os dados do cliente.');
  }
};

window.salvarCliente = async function () {
  const id       = document.getElementById('clienteId').value;
  const nome     = document.getElementById('nome').value.trim();
  const email    = document.getElementById('email').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  if (!nome || !email || !telefone) { toast.aviso('Preencha todos os campos.'); return; }
  try {
    const res = await fetch(id ? `${API}/clientes/${id}` : `${API}/clientes`, {
      method: id ? 'PUT' : 'POST', headers: getHeaders(),
      body: JSON.stringify({ nome, email, telefone })
    });
    if (res.ok) {
      toast.sucesso(id ? 'Cliente atualizado!' : 'Cliente cadastrado!');
      fecharFormCliente();
      carregarClientes(_offsetCli);
    } else {
      const err = await res.json();
      toast.erro(err.erro ?? 'Erro ao salvar cliente.');
    }
  } catch { toast.erro('Erro de conexão.'); }
};

// EXCLUIR 
window.confirmarExclusaoCliente = function (id, nome) {
  const modal = document.getElementById('modal-excluir-cliente');
  document.getElementById('modal-excluir-nome').textContent = nome;
  modal.dataset.clienteId = id;
  modal.classList.remove('hidden'); modal.classList.add('flex');
};
window.fecharModalExcluirCliente = function () {
  const modal = document.getElementById('modal-excluir-cliente');
  modal.classList.add('hidden'); modal.classList.remove('flex');
};
window.executarExclusaoCliente = async function () {
  const modal = document.getElementById('modal-excluir-cliente');
  const id    = modal.dataset.clienteId;
  fecharModalExcluirCliente();
  try {
    const res = await fetch(`${API}/clientes/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (res.ok) { toast.sucesso('Cliente removido.'); carregarClientes(_offsetCli); }
    else toast.erro('Erro ao remover cliente.');
  } catch { toast.erro('Erro de conexão.'); }
};

// VISTA LISTA / KANBAN
window.trocarVista = function (vista) {
  const lista  = document.getElementById('vista-lista');
  const kanban = document.getElementById('vista-kanban');
  const btnLista  = document.getElementById('btn-vista-lista');
  const btnKanban = document.getElementById('btn-vista-kanban');

  if (vista === 'kanban') {
    lista.style.display  = 'none';
    kanban.style.display = 'block';
    btnLista.classList.remove('active');
    btnKanban.classList.add('active');
    carregarKanban();
  } else {
    lista.style.display  = 'block';
    kanban.style.display = 'none';
    btnKanban.classList.remove('active');
    btnLista.classList.add('active');
  }
};

const COLUNAS_FUNIL = ['novo', 'ativo', 'recorrente', 'inativo'];

async function carregarKanban() {
  COLUNAS_FUNIL.forEach(s => {
    document.getElementById(`kanban-${s}`).innerHTML = `<p class="kanban-empty">Carregando...</p>`;
  });
  try {
    const res = await fetch(`${API}/clientes/funil`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha na requisição');
    const dados = await res.json();

    const grupos = { novo: [], ativo: [], recorrente: [], inativo: [] };
    dados.forEach(c => {
      const status = grupos[c.status_funil] ? c.status_funil : 'novo';
      grupos[status].push(c);
    });

    COLUNAS_FUNIL.forEach(status => renderizarColunaKanban(status, grupos[status]));
    ativarDragAndDrop();
  } catch (erro) {
    console.error(erro);
    toast.erro('Não foi possível carregar o funil de clientes.');
  }
}

function renderizarColunaKanban(status, clientes) {
  const container = document.getElementById(`kanban-${status}`);
  document.getElementById(`count-${status}`).textContent = clientes.length;
  container.textContent = '';

  if (!clientes.length) {
    const vazio = document.createElement('p');
    vazio.className = 'kanban-empty';
    vazio.textContent = 'Nenhum cliente neste estágio.';
    container.appendChild(vazio);
    return;
  }

  clientes.forEach(c => {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.clienteId = c.id;

    const nome = document.createElement('p');
    nome.className = 'kanban-card-nome';
    nome.textContent = c.nome ?? '—';

    const contato = document.createElement('p');
    contato.className = 'kanban-card-contato';
    contato.textContent = [c.email, c.telefone].filter(Boolean).join(' · ') || '—';

    card.append(nome, contato);

    if (Array.isArray(c.tags) && c.tags.length) {
      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'kanban-card-tags';
      c.tags.slice(0, 3).forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'kanban-tag';
        chip.textContent = tag;
        tagsWrap.appendChild(chip);
      });
      card.appendChild(tagsWrap);
    }

    card.addEventListener('click', () => { window.location.href = `cliente-detalhe.html?id=${c.id}`; });
    card.addEventListener('dragstart', e => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', c.id);
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));

    container.appendChild(card);
  });
}

function ativarDragAndDrop() {
  document.querySelectorAll('.kanban-col').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', async e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const clienteId  = e.dataTransfer.getData('text/plain');
      const novoStatus = col.dataset.status;
      if (!clienteId || !novoStatus) return;
      await moverClienteFunil(clienteId, novoStatus);
    });
  });
}

async function moverClienteFunil(clienteId, status_funil) {
  try {
    const res = await fetch(`${API}/clientes/${clienteId}/crm`, {
      method: 'PATCH', headers: getHeaders(),
      body: JSON.stringify({ status_funil }),
    });
    if (!res.ok) { toast.erro('Erro ao mover cliente.'); return; }
    toast.sucesso('Estágio do cliente atualizado!');
    carregarKanban();
  } catch {
    toast.erro('Erro de conexão.');
  }
}

// INIT
carregarClientes();