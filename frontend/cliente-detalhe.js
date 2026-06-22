// cliente-detalhe.js — perfil 360 do cliente (CRM)

function getClienteIdDaURL() {
  return new URLSearchParams(window.location.search).get('id');
}

let _clienteAtual = null;
let _tagsAtuais = [];

const BADGE_AGENDAMENTO = {
  pendente:  { cls: 'badge-pending',  label: 'Pendente'  },
  aprovado:  { cls: 'badge-approved', label: 'Aprovado'  },
  concluido: { cls: 'badge-approved', label: 'Concluído' },
  recusado:  { cls: 'badge-rejected', label: 'Recusado'  },
};

async function carregarClienteDetalhe() {
  const id = getClienteIdDaURL();
  if (!id) { toast.erro('Cliente não informado.'); window.location.href = 'clientes.html'; return; }

  try {
    const res = await fetch(`${API}/clientes/${id}/historico`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar');
    const { cliente, veiculos, agendamentos } = await res.json();

    _clienteAtual = cliente;
    _tagsAtuais   = Array.isArray(cliente.tags) ? [...cliente.tags] : [];

    document.getElementById('cliente-nome').textContent = cliente.nome ?? 'Cliente';
    document.getElementById('cliente-contato').textContent =
      [cliente.email, cliente.telefone].filter(Boolean).join(' · ') || '—';

    document.getElementById('select-funil').value = cliente.status_funil ?? 'novo';
    document.getElementById('textarea-notas').value = cliente.notas ?? '';

    renderizarTags();
    renderizarVeiculos(veiculos);
    renderizarAgendamentos(agendamentos);
  } catch (e) {
    console.error(e);
    toast.erro('Não foi possível carregar o perfil do cliente.');
  }
}

function renderizarTags() {
  const container = document.getElementById('lista-tags');
  container.textContent = '';
  if (!_tagsAtuais.length) {
    const vazio = document.createElement('span');
    vazio.className = 'text-xs text-slate-500 italic';
    vazio.textContent = 'Nenhuma tag adicionada.';
    container.appendChild(vazio);
    return;
  }
  _tagsAtuais.forEach((tag, idx) => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    const texto = document.createElement('span');
    texto.textContent = tag;
    const btnRemover = document.createElement('button');
    btnRemover.textContent = '×';
    btnRemover.title = 'Remover tag';
    btnRemover.addEventListener('click', () => { _tagsAtuais.splice(idx, 1); renderizarTags(); });
    chip.append(texto, btnRemover);
    container.appendChild(chip);
  });
}

function adicionarTag() {
  const input = document.getElementById('input-tag');
  const valor = input.value.trim();
  if (!valor) return;
  if (_tagsAtuais.length >= 10) { toast.aviso('Máximo de 10 tags por cliente.'); return; }
  if (!_tagsAtuais.includes(valor)) _tagsAtuais.push(valor);
  input.value = '';
  renderizarTags();
}

function renderizarVeiculos(veiculos) {
  const container = document.getElementById('lista-veiculos');
  container.textContent = '';
  if (!veiculos.length) {
    const vazio = document.createElement('p');
    vazio.className = 'text-sm text-slate-500 italic';
    vazio.textContent = 'Nenhum veículo cadastrado.';
    container.appendChild(vazio);
    return;
  }
  veiculos.forEach(v => {
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between border-b border-slate-800 py-2 last:border-0';
    const info = document.createElement('div');
    const linha1 = document.createElement('p');
    linha1.className = 'font-bold text-sm';
    linha1.textContent = v.modelo ?? '—';
    const linha2 = document.createElement('p');
    linha2.className = 'text-xs text-slate-500';
    linha2.textContent = [v.placa, v.cor, v.ano].filter(Boolean).join(' · ') || '—';
    info.append(linha1, linha2);
    item.appendChild(info);
    container.appendChild(item);
  });
}

function renderizarAgendamentos(agendamentos) {
  const container = document.getElementById('lista-agendamentos');
  container.textContent = '';
  if (!agendamentos.length) {
    const vazio = document.createElement('p');
    vazio.className = 'text-sm text-slate-500 italic';
    vazio.textContent = 'Nenhum atendimento registrado ainda.';
    container.appendChild(vazio);
    return;
  }
  agendamentos.forEach(a => {
    const item = document.createElement('div');
    item.className = 'timeline-item';

    const topo = document.createElement('div');
    topo.className = 'flex items-center justify-between';
    const dataEl = document.createElement('span');
    dataEl.className = 'text-xs font-bold text-slate-400';
    dataEl.textContent = a.data ? new Date(a.data).toLocaleDateString('pt-BR') : '—';
    const badgeInfo = BADGE_AGENDAMENTO[(a.status ?? '').toLowerCase()] ?? { cls: 'badge-pending', label: a.status ?? '—' };
    const badgeEl = document.createElement('span');
    badgeEl.className = `badge ${badgeInfo.cls}`;
    badgeEl.textContent = badgeInfo.label;
    topo.append(dataEl, badgeEl);

    const servicoEl = document.createElement('p');
    servicoEl.className = 'text-sm font-medium';
    servicoEl.textContent = a.servico ?? '—';

    const veiculoEl = document.createElement('p');
    veiculoEl.className = 'text-xs text-slate-500';
    veiculoEl.textContent = [a.veiculo, a.placa].filter(Boolean).join(' · ');

    item.append(topo, servicoEl, veiculoEl);
    container.appendChild(item);
  });
}

async function salvarCRM() {
  if (!_clienteAtual) return;
  const status_funil = document.getElementById('select-funil').value;
  const notas         = document.getElementById('textarea-notas').value.trim();

  try {
    const res = await fetch(`${API}/clientes/${_clienteAtual.id}/crm`, {
      method: 'PATCH', headers: getHeaders(),
      body: JSON.stringify({ status_funil, tags: _tagsAtuais, notas }),
    });
    const data = await res.json();
    if (!res.ok) { toast.erro(data.erro ?? 'Erro ao salvar.'); return; }
    toast.sucesso('Perfil do cliente atualizado!');
    _clienteAtual = data;
  } catch {
    toast.erro('Erro de conexão.');
  }
}
