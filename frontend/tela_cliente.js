// tela_cliente.js — Área do Cliente (completo)

function getHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function getUsuario() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1]));
  } catch { return null; }
}

//  NAVEGAÇÃO 
function trocarTela(tela) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(tela).classList.add('active');
  document.getElementById('btn-' + tela).classList.add('active');
  lucide.createIcons();
}

//  BADGES 
function getBadge(status) {
  const map = {
    pendente:  { cls: 'badge-pending',  icon: 'clock',        label: 'Pendente'  },
    aprovado:  { cls: 'badge-approved', icon: 'check',        label: 'Aprovado'  },
    concluido: { cls: 'badge-approved', icon: 'check-circle', label: 'Concluído' },
    recusado:  { cls: 'badge-rejected', icon: 'x',            label: 'Recusado'  },
  };
  const s = map[(status || '').toLowerCase()] ?? { cls: 'badge-pending', icon: 'clock', label: status };
  return `<span class="badge ${s.cls}"><i data-lucide="${s.icon}" style="width:11px;height:11px"></i> ${s.label}</span>`;
}

//  GOOGLE CALENDAR 
function abrirGoogleCalendar(agendamento) {
  const inicio = new Date(agendamento.data);
  const fim    = new Date(inicio.getTime() + 60 * 60 * 1000);
  const fmt    = d => d.toISOString().replace(/-|:|\.\d{3}/g, '');

  const endereco = _dadosConta
    ? [_dadosConta.logradouro, _dadosConta.numero, _dadosConta.bairro, _dadosConta.cidade, _dadosConta.estado]
        .filter(Boolean).join(', ')
    : '140 R. José Borges do Canto';

  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     `Serviço: ${agendamento.servico}`,
    dates:    `${fmt(inicio)}/${fmt(fim)}`,
    details:  `Veículo: ${agendamento.veiculo?.modelo ?? ''} · ${agendamento.veiculo?.placa ?? ''}`,
    location: endereco,
  });
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
}

//  APPLE CALENDAR (ICS) 
function baixarICS(agendamento) {
  const inicio  = new Date(agendamento.data);
  const fim     = new Date(inicio.getTime() + 60 * 60 * 1000);
  const fmt     = d => d.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const veiculo = `${agendamento.veiculo?.modelo ?? ''} · ${agendamento.veiculo?.placa ?? ''}`;

  const enderecoRaw = _dadosConta
    ? [_dadosConta.logradouro, _dadosConta.numero, _dadosConta.bairro, _dadosConta.cidade, _dadosConta.estado, _dadosConta.cep]
        .filter(Boolean).join(', ')
    : '140 R. José Borges do Canto';
  const enderecoICS = enderecoRaw.replace(/,/g, '\\,');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smart System//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:agendamento-${agendamento.id}@smartsystem`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(inicio)}`,
    `DTEND:${fmt(fim)}`,
    `SUMMARY:Serviço: ${agendamento.servico}`,
    `DESCRIPTION:Veículo: ${veiculo}`,
    `LOCATION:${enderecoICS}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  a.download = `agendamento-${agendamento.id}.ics`;
  a.click();
}

function criarBotoesCalendario(agendamento) {
  if ((agendamento.status ?? '').toLowerCase() !== 'aprovado') return document.createDocumentFragment();

  const wrap = document.createElement('div');
  wrap.className = 'flex items-center gap-2 mt-1';

  const btnGoogle = document.createElement('button');
  btnGoogle.className = 'flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors border border-orange-500/20 hover:border-orange-400/40 rounded-lg px-2 py-1';
  btnGoogle.innerHTML = '<i data-lucide="calendar-plus" style="width:12px;height:12px"></i> Google';
  btnGoogle.addEventListener('click', () => abrirGoogleCalendar(agendamento));

  const btnApple = document.createElement('button');
  btnApple.className = 'flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors border border-slate-600/30 hover:border-slate-400/40 rounded-lg px-2 py-1';
  btnApple.innerHTML = '<i data-lucide="apple" style="width:12px;height:12px"></i> Apple';
  btnApple.addEventListener('click', () => baixarICS(agendamento));

  wrap.append(btnGoogle, btnApple);
  return wrap;
}

//  AGENDAMENTOS 
async function carregarAgendamentos() {
  try {
    const res  = await fetch(`${API}/cliente/meus-agendamentos`, { headers: getHeaders() });
    const data = await res.json();

    document.getElementById('stat-total').textContent      = data.length;
    document.getElementById('stat-pendentes').textContent  = data.filter(a => a.status?.toLowerCase() === 'pendente').length;
    document.getElementById('stat-concluidos').textContent = data.filter(a => ['aprovado','concluido'].includes(a.status?.toLowerCase())).length;

    const tabela = document.getElementById('listaAgendamentos');
    tabela.textContent = '';
    if (!data.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.className = 'py-10 text-center text-slate-500 italic';
      td.textContent = 'Nenhum agendamento encontrado.';
      tr.appendChild(td);
      tabela.appendChild(tr);
      return;
    }
    data.forEach(a => {
      const data_fmt = a.data ? new Date(a.data).toLocaleDateString('pt-BR') : '—';
      const hora     = a.hora ?? '—';

      const tr = document.createElement('tr');
      const tdData = document.createElement('td'); tdData.textContent = data_fmt;
      const tdHora = document.createElement('td'); tdHora.textContent = hora;
      const tdServico = document.createElement('td'); tdServico.textContent = a.servico ?? '—';
      const tdVeiculo = document.createElement('td');
      tdVeiculo.textContent = a.veiculo ? `${a.veiculo.modelo} · ${a.veiculo.placa}` : '—';
      const tdStatus = document.createElement('td');
      tdStatus.innerHTML = getBadge(a.status);
      tdStatus.appendChild(criarBotoesCalendario(a));

      tr.append(tdData, tdHora, tdServico, tdVeiculo, tdStatus);
      tabela.appendChild(tr);
    });
    lucide.createIcons();
  } catch (err) {
    console.error(err);
    toast.erro('Não foi possível carregar seus agendamentos.');
  }
}

//  ASSISTENTE DE AGENDAMENTO (chat) 
let _horarioSelecionado = null;
let _chatEscolha = { veiculo: null, servico: null, data: null };
let listaServicosCliente = [];
let listaVeiculosCliente = [];

function chatBody() { return document.getElementById('chat-body'); }
function chatQR()   { return document.getElementById('chat-quickreplies'); }

function chatScroll() {
  const b = chatBody();
  b.scrollTop = b.scrollHeight;
}

function chatBot(html) {
  const b = chatBody();
  b.insertAdjacentHTML('beforeend', `<div class="msg msg-bot">${html}</div>`);
  chatScroll();
}

// Mensagens do usuário são sempre texto puro vindo de seleções do próprio chat — sem HTML.
function chatUser(texto) {
  const b = chatBody();
  const div = document.createElement('div');
  div.className = 'msg msg-user';
  div.textContent = texto;
  b.appendChild(div);
  chatScroll();
}

function chatTyping(ms, depois) {
  const b = chatBody();
  b.insertAdjacentHTML('beforeend', `<div class="typing" id="chat-typing"><span></span><span></span><span></span></div>`);
  chatScroll();
  setTimeout(() => {
    document.getElementById('chat-typing')?.remove();
    depois();
  }, ms);
}

function chatQuickReplies(html) {
  chatQR().innerHTML = html;
  lucide.createIcons();
}

// Monta quick-replies a partir de elementos DOM (sem HTML interpolado) — evita XSS.
function chatQuickRepliesEls(elementos) {
  const qr = chatQR();
  qr.textContent = '';
  elementos.forEach(el => qr.appendChild(el));
  lucide.createIcons();
}

function criarBotaoQR(label, onClick, opts = {}) {
  const btn = document.createElement('button');
  btn.className = `qr-btn${opts.primary ? ' qr-primary' : ''}`;
  btn.textContent = label;
  if (opts.title) btn.title = opts.title;
  btn.addEventListener('click', onClick);
  return btn;
}

//  PASSO 1 — VEÍCULO 
async function carregarVeiculosParaAgendamento() {
  try {
    const res   = await fetch(`${API}/cliente/meus-veiculos`, { headers: getHeaders() });
    listaVeiculosCliente = await res.json();
  } catch (err) { console.error(err); listaVeiculosCliente = []; }
}

function chatPassoVeiculo() {
  if (!listaVeiculosCliente.length) {
    chatBot('Você ainda não tem nenhum veículo cadastrado. Vá até <strong>"Meus Veículos"</strong> e adicione um para começar.');
    chatQuickReplies('');
    return;
  }
  chatBot('Olá! 👋 Vamos marcar seu serviço. Pra qual veículo é o agendamento?');
  chatQuickRepliesEls(
    listaVeiculosCliente.map(v => {
      const label = `${v.modelo} · ${v.placa}`;
      return criarBotaoQR(label, () => chatEscolheVeiculo(v.id, label));
    })
  );
}

function chatEscolheVeiculo(id, label) {
  _chatEscolha.veiculo = id;
  chatUser(label);
  chatQuickReplies('');
  chatTyping(450, chatPassoServico);
}

//  PASSO 2 — SERVIÇO 
async function carregarServicosParaAgendamento() {
  try {
    const res = await fetch(`${API}/servicos`, { headers: getHeaders() });
    listaServicosCliente = await res.json();
  } catch (err) { console.error(err); listaServicosCliente = []; }
}

function chatPassoServico() {
  chatBot('Boa escolha! Qual serviço você quer fazer?');
  chatQuickRepliesEls(
    listaServicosCliente.map(s => {
      const label = `${s.nome} · R$ ${Number(s.preco).toFixed(2).replace('.',',')}`;
      return criarBotaoQR(label, () => chatEscolheServico(s.id, s.nome));
    })
  );
}

function chatEscolheServico(id, label) {
  _chatEscolha.servico = id;
  chatUser(label);
  chatQuickReplies('');
  chatTyping(450, chatPassoData);
}

//  PASSO 3 — DATA 
function chatPassoData() {
  const hoje = new Date().toISOString().slice(0, 10);
  chatBot('Perfeito. Pra qual dia você quer agendar?');
  chatQuickReplies(`
    <div class="qr-input-wrap">
      <input type="date" id="chat-data-input" class="input-field" min="${hoje}" value="${hoje}">
      <button class="qr-btn qr-primary" onclick="chatEscolheData()">Ver horários</button>
    </div>`);
}

function chatEscolheData() {
  const data = document.getElementById('chat-data-input').value;
  if (!data) { toast.aviso('Escolha uma data.'); return; }
  _chatEscolha.data = data;
  const [y,m,d] = data.split('-');
  chatUser(`${d}/${m}/${y}`);
  chatQuickReplies('');
  chatTyping(350, chatPassoHorario);
}

//  PASSO 4 — HORÁRIO 
async function chatPassoHorario() {
  chatBot('Verificando os horários disponíveis... ⏳');
  try {
    const res = await fetch(`${API}/agenda/slots?data=${_chatEscolha.data}&servico_id=${_chatEscolha.servico}`, { headers: getHeaders() });
    const data_resp = await res.json();

    if (!data_resp.aberto) {
      chatBot(`🚫 ${data_resp.motivo || 'Loja fechada nesse dia. Escolha outra data.'}`);
      chatTyping(300, chatPassoData);
      return;
    }

    const slots = data_resp.slots ?? [];
    const disponiveis = slots.filter(s => s.disponivel);

    if (!disponiveis.length) {
      chatBot('⚠️ Todos os horários estão ocupados nesse dia. Vamos tentar outra data?');
      chatTyping(300, chatPassoData);
      return;
    }

    chatBot('Aqui estão os horários disponíveis hoje:');
    const botoesHorario = disponiveis.map(s =>
      criarBotaoQR(s.horario, () => chatEscolheHorario(s.horario), { title: `${s.livres} de ${s.total} livre(s)` })
    );
    botoesHorario.push(criarBotaoQR('📅 Trocar data', () => chatTyping(0, chatPassoData)));
    chatQuickRepliesEls(botoesHorario);
  } catch (e) {
    console.error(e);
    chatBot('❌ Não consegui buscar os horários agora. Tente novamente.');
  }
}

function chatEscolheHorario(horario) {
  _horarioSelecionado = horario;
  chatUser(horario);
  chatQuickReplies('');
  chatTyping(400, chatPassoResumo);
}

//  PASSO 5 — RESUMO E CONFIRMAÇÃO 
function chatPassoResumo() {
  const veiculo = listaVeiculosCliente.find(v => String(v.id) === String(_chatEscolha.veiculo));
  const servico = listaServicosCliente.find(s => String(s.id) === String(_chatEscolha.servico));
  const [y,m,d] = _chatEscolha.data.split('-');

  chatBot('Tudo certo, só confirmar:');
  const resumo = document.createElement('div');
  resumo.className = 'msg-summary';
  const linha = (label, valor) => {
    const div = document.createElement('div');
    const spanLabel = document.createElement('span'); spanLabel.textContent = label;
    const spanValor = document.createElement('span'); spanValor.textContent = valor;
    div.append(spanLabel, spanValor);
    return div;
  };
  resumo.append(
    linha('Veículo', veiculo ? `${veiculo.modelo} · ${veiculo.placa}` : '—'),
    linha('Serviço', servico ? servico.nome : '—'),
    linha('Preço', `R$ ${servico ? Number(servico.preco).toFixed(2).replace('.',',') : '—'}`),
    linha('Data', `${d}/${m}/${y}`),
    linha('Horário', _horarioSelecionado),
  );
  chatBody().appendChild(resumo);
  chatScroll();

  const btnConfirmar = criarBotaoQR('Confirmar agendamento', enviarAgendamento, { primary: true });
  btnConfirmar.id = 'btn-confirmar-agend-real';
  btnConfirmar.innerHTML = '<i data-lucide="check" style="width:14px;height:14px"></i> Confirmar agendamento';
  const btnRecomecar = criarBotaoQR('Recomeçar', reiniciarChatAgendamento);
  chatQuickRepliesEls([btnConfirmar, btnRecomecar]);
}

function reiniciarChatAgendamento() {
  _chatEscolha = { veiculo: null, servico: null, data: null };
  _horarioSelecionado = null;
  chatBody().innerHTML = '';
  chatQuickReplies('');
  chatTyping(200, chatPassoVeiculo);
}

//  ABRIR / FECHAR 
async function abrirFormAgendamento() {
  document.getElementById('formAgendamentoCliente').style.display = 'flex';
  chatBody().innerHTML = '';
  chatQuickReplies('');
  _chatEscolha = { veiculo: null, servico: null, data: null };
  _horarioSelecionado = null;

  await Promise.all([carregarVeiculosParaAgendamento(), carregarServicosParaAgendamento()]);
  chatTyping(400, chatPassoVeiculo);

  window.scrollTo({ top: 0, behavior: 'smooth' });
  lucide.createIcons();
}

function fecharFormAgendamento() {
  document.getElementById('formAgendamentoCliente').style.display = 'none';
  _horarioSelecionado = null;
  _chatEscolha = { veiculo: null, servico: null, data: null };
}

async function enviarAgendamento() {
  const veiculo_id = _chatEscolha.veiculo;
  const servico_id = _chatEscolha.servico;
  const data       = _chatEscolha.data;

  if (!veiculo_id || !servico_id || !data || !_horarioSelecionado) {
    toast.aviso('Algo deu errado, vamos recomeçar.');
    reiniciarChatAgendamento();
    return;
  }

  const dataHora = `${data}T${_horarioSelecionado}:00`;
  const btn = document.getElementById('btn-confirmar-agend-real');
  if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }

  try {
    const res = await fetch(`${API}/cliente/agendar`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ veiculo_id, servico_id, data: dataHora })
    });
    const resposta = await res.json();
    if (!res.ok) {
      chatBot(`❌ ${resposta.erro ?? 'Erro ao criar agendamento.'}`);
      chatQuickReplies(`<button class="qr-btn" onclick="reiniciarChatAgendamento()">Recomeçar</button>`);
      return;
    }
    chatQuickReplies('');
    chatBot('✅ Agendamento enviado! Você vai receber a confirmação assim que for aprovado.');
    toast.sucesso('Agendamento criado! Aguarde a aprovação.');
    carregarAgendamentos();
    setTimeout(fecharFormAgendamento, 1800);
  } catch {
    chatBot('❌ Erro de conexão com o servidor. Tente novamente.');
    chatQuickReplies(`<button class="qr-btn" onclick="enviarAgendamento()">Tentar de novo</button>`);
  }
}

//  VEÍCULOS 
let _veiculoEditandoId = null;

async function carregarVeiculos() {
  try {
    const res   = await fetch(`${API}/cliente/meus-veiculos`, { headers: getHeaders() });
    const data  = await res.json();
    const lista = document.getElementById('listaVeiculos');

    if (!data.length) {
      lista.innerHTML = `<p class="text-center text-slate-500 italic py-6">Nenhum veículo cadastrado.</p>`;
      return;
    }

    lista.textContent = '';
    data.forEach(v => {
      const card = document.createElement('div');
      card.className = 'vehicle-card';

      const esq = document.createElement('div');
      esq.className = 'flex items-center gap-3';
      const icone = document.createElement('div');
      icone.className = 'w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex-shrink-0';
      icone.style.display = 'flex'; icone.style.alignItems = 'center'; icone.style.justifyContent = 'center';
      icone.innerHTML = '<i data-lucide="car-front" class="w-5 h-5"></i>';
      const info = document.createElement('div');
      const pModelo = document.createElement('p'); pModelo.className = 'font-bold text-sm text-white'; pModelo.textContent = v.modelo ?? '—';
      const pPlaca  = document.createElement('p'); pPlaca.className = 'text-xs text-slate-500';
      pPlaca.textContent = (v.placa ?? '—') + (v.ano ? ' · ' + v.ano : '');
      info.append(pModelo, pPlaca);
      esq.append(icone, info);

      const dir = document.createElement('div');
      dir.className = 'flex items-center gap-2';
      const btnEditar = document.createElement('button');
      btnEditar.className = 'text-slate-500 hover:text-orange-400 transition-colors flex-shrink-0';
      btnEditar.title = 'Editar';
      btnEditar.innerHTML = '<i data-lucide="pencil" class="w-4 h-4"></i>';
      btnEditar.addEventListener('click', () => abrirEdicaoVeiculo(v.id, v.marca, v.modelo, v.placa, v.cor, v.ano));
      const btnExcluir = document.createElement('button');
      btnExcluir.className = 'text-slate-500 hover:text-red-400 transition-colors flex-shrink-0';
      btnExcluir.title = 'Remover';
      btnExcluir.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
      btnExcluir.addEventListener('click', () => confirmarExcluirVeiculo(v.id));
      dir.append(btnEditar, btnExcluir);

      card.append(esq, dir);
      lista.appendChild(card);
    });
    lucide.createIcons();
  } catch (err) {
    console.error(err);
    toast.erro('Não foi possível carregar seus veículos.');
  }
}

function abrirEdicaoVeiculo(id, marca, modelo, placa, cor, ano) {
  _veiculoEditandoId = id;

  document.getElementById('marca').value  = marca;
  document.getElementById('modelo').value = modelo;
  document.getElementById('placa').value  = placa;
  document.getElementById('cor').value    = cor;
  document.getElementById('ano').value    = ano;

  const placaLimpa = placa.replace(/[^A-Z0-9]/g, '');
  const contador   = document.getElementById('placa-contador');
  if (contador) { contador.textContent = `${placaLimpa.length}/7`; contador.classList.toggle('limite', placaLimpa.length >= 7); }

  const titulo = document.getElementById('form-veiculo-titulo');
  if (titulo) titulo.innerHTML = '<i data-lucide="pencil" class="text-orange-500 w-4 h-4"></i> Editar Veículo';

  const btnSalvar = document.getElementById('btn-salvar-veiculo');
  if (btnSalvar) btnSalvar.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Salvar Alterações';

  const btnCancelar = document.getElementById('btn-cancelar-edicao-veiculo');
  if (btnCancelar) btnCancelar.style.display = 'inline-flex';

  lucide.createIcons();
  document.querySelector('#veiculos .card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelarEdicaoVeiculo() {
  _veiculoEditandoId = null;
  ['marca','modelo','placa','cor','ano'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

  const contador = document.getElementById('placa-contador');
  if (contador) { contador.textContent = '0/7'; contador.classList.remove('limite'); }

  const titulo = document.getElementById('form-veiculo-titulo');
  if (titulo) titulo.innerHTML = '<i data-lucide="plus-circle" class="text-orange-500 w-4 h-4"></i> Adicionar Novo Veículo';

  const btnSalvar = document.getElementById('btn-salvar-veiculo');
  if (btnSalvar) btnSalvar.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i> Adicionar';

  const btnCancelar = document.getElementById('btn-cancelar-edicao-veiculo');
  if (btnCancelar) btnCancelar.style.display = 'none';

  lucide.createIcons();
}

let _veiculoParaExcluir = null;

function confirmarExcluirVeiculo(id) {
  _veiculoParaExcluir = id;
  const m = document.getElementById('modal-excluir-veiculo');
  if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
  else excluirVeiculoConfirmado(id);
}

async function excluirVeiculoConfirmado(id) {
  const idReal = id ?? _veiculoParaExcluir;
  _veiculoParaExcluir = null;
  const m = document.getElementById('modal-excluir-veiculo');
  if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }

  try {
    const res = await fetch(`${API}/cliente/meus-veiculos/${idReal}`, { method: 'DELETE', headers: getHeaders() });
    if (!res.ok) { const e = await res.json(); toast.erro(e.erro ?? 'Erro ao remover.'); return; }
    toast.sucesso('Veículo removido com sucesso.');
    carregarVeiculos();
  } catch { toast.erro('Erro de conexão.'); }
}

async function criarVeiculo() {
  const marca  = document.getElementById('marca').value.trim();
  const modelo = document.getElementById('modelo').value.trim();
  const placa  = document.getElementById('placa').value.trim().toUpperCase();
  const cor    = document.getElementById('cor').value.trim();
  const ano    = document.getElementById('ano').value.trim();

  if (!modelo || !placa) { toast.aviso('Preencha ao menos o modelo e a placa.'); return; }

  const placaLimpa = placa.replace(/[^A-Z0-9]/g, '');
  if (placaLimpa.length < 6 || placaLimpa.length > 7) {
    toast.erro('Placa inválida. Use ABC-1234 ou Mercosul (7 caracteres).');
    return;
  }

  //  EDIÇÃO 
  if (_veiculoEditandoId) {
    try {
      const res = await fetch(`${API}/cliente/meus-veiculos/${_veiculoEditandoId}`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify({ modelo, placa, ano, marca, cor })
      });
      if (!res.ok) { const e = await res.json(); toast.erro(e.erro ?? 'Erro ao atualizar.'); return; }
      toast.sucesso('Veículo atualizado com sucesso!');
      cancelarEdicaoVeiculo();
      carregarVeiculos();
    } catch { toast.erro('Erro de conexão.'); }
    return;
  }

  //  CRIAÇÃO 
  try {
    const res = await fetch(`${API}/cliente/meus-veiculos`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ modelo, placa, ano, marca, cor })
    });
    if (!res.ok) { const e = await res.json(); toast.erro(e.erro ?? 'Erro ao adicionar.'); return; }
    ['marca','modelo','placa','cor','ano'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('placa-contador').textContent = '0/7';
    document.getElementById('placa-contador').classList.remove('limite');
    toast.sucesso('Veículo adicionado com sucesso!');
    carregarVeiculos();
  } catch { toast.erro('Erro de conexão.'); }
}

//  CONTA 
let _dadosConta = null;

async function carregarDadosConta() {
  try {
    const usuario    = getUsuario();
    const emailToken = usuario?.email ?? '';

    const res = await fetch(`${API}/cliente/minha-conta`, { headers: getHeaders() });
    if (!res.ok) return;

    const conta = await res.json();
    _dadosConta = conta;

    const nome    = conta.nome || emailToken.split('@')[0] || 'Cliente';
    const inicial = nome.charAt(0).toUpperCase();

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setEl('usuario-logado', nome);
    setEl('user-initial',   inicial);
    setEl('conta-avatar',   inicial);
    setEl('conta-nome',     nome);
    setEl('conta-email',    conta.email || emailToken);
    setEl('conta-nome-row', nome);
    setEl('conta-email-row',conta.email || emailToken);
    setEl('conta-telefone', formatarTelefone(conta.telefone));
    setEl('conta-nascimento', conta.data_nascimento
      ? new Date(conta.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
      : '—');

    const partes = [conta.logradouro, conta.numero, conta.complemento, conta.bairro, conta.cidade, conta.estado].filter(Boolean);
    setEl('conta-endereco', partes.length ? partes.join(', ') : '—');
    setEl('conta-cep', conta.cep || '—');

    if (usuario?.iat) {
      const d = new Date(usuario.iat * 1000).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
      setEl('conta-membro-desde', d.charAt(0).toUpperCase() + d.slice(1));
    }

    const badge = document.getElementById('badge-perfil');
    if (badge) {
      if (conta.perfil_completo) {
        badge.innerHTML = `<i data-lucide="shield-check" style="width:11px;height:11px"></i> Conta Verificada`;
        badge.className = 'badge badge-approved mt-1';
      } else {
        badge.innerHTML = `<i data-lucide="alert-circle" style="width:11px;height:11px"></i> Perfil Incompleto`;
        badge.className = 'badge badge-pending mt-1';
      }
      lucide.createIcons();
    }
  } catch (e) {
    console.warn('Erro ao carregar conta:', e);
  }
}

function preencherInfoConta() { carregarDadosConta(); }

//  EDITAR PERFIL 
function abrirEdicaoPerfil() {
  if (!_dadosConta) return;
  const c   = _dadosConta;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('edit-telefone',    c.telefone);
  maskTelefone(document.getElementById('edit-telefone'));
  set('edit-nascimento',  c.data_nascimento ? c.data_nascimento.split('T')[0] : '');
  set('edit-cep',         c.cep);
  set('edit-logradouro',  c.logradouro);
  set('edit-numero',      c.numero);
  set('edit-complemento', c.complemento);
  set('edit-bairro',      c.bairro);
  set('edit-cidade',      c.cidade);
  set('edit-estado',      c.estado);
  document.getElementById('form-editar-perfil').style.display = 'block';
  document.getElementById('info-perfil-static').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicaoPerfil() {
  document.getElementById('form-editar-perfil').style.display = 'none';
  document.getElementById('info-perfil-static').style.display = 'block';
}

async function buscarCEPEdicao() {
  const cep    = document.getElementById('edit-cep').value.replace(/\D/g, '');
  const status = document.getElementById('edit-cep-status');
  const btn    = document.getElementById('btn-buscar-cep');
  if (cep.length !== 8) { status.textContent = 'CEP inválido.'; status.style.color = '#ef4444'; return; }
  btn.disabled = true; btn.textContent = '...';
  status.textContent = 'Buscando...'; status.style.color = '#a8978c';
  try {
    const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (data.erro) { status.textContent = 'CEP não encontrado.'; status.style.color = '#ef4444'; return; }
    document.getElementById('edit-logradouro').value  = data.logradouro  || '';
    document.getElementById('edit-bairro').value      = data.bairro      || '';
    document.getElementById('edit-cidade').value      = data.localidade  || '';
    document.getElementById('edit-estado').value      = data.uf          || '';
    document.getElementById('edit-complemento').value = data.complemento || '';
    status.textContent = `✓ ${data.localidade} — ${data.uf}`; status.style.color = '#22c55e';
    document.getElementById('edit-numero').focus();
  } catch {
    status.textContent = 'Erro ao buscar CEP.'; status.style.color = '#ef4444';
  } finally {
    btn.disabled = false; btn.textContent = 'Buscar';
  }
}

async function salvarPerfil() {
  const btn             = document.getElementById('btn-salvar-perfil');
  const telefone        = document.getElementById('edit-telefone').value.trim();
  const data_nascimento = document.getElementById('edit-nascimento').value;
  const cep             = document.getElementById('edit-cep').value.trim();
  const logradouro      = document.getElementById('edit-logradouro').value.trim();
  const numero          = document.getElementById('edit-numero').value.trim();
  const complemento     = document.getElementById('edit-complemento').value.trim();
  const bairro          = document.getElementById('edit-bairro').value.trim();
  const cidade          = document.getElementById('edit-cidade').value.trim();
  const estado          = document.getElementById('edit-estado').value.trim();
  if (!telefone) { toast.aviso('Telefone é obrigatório.'); return; }
  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    const res  = await fetch(`${API}/cliente/minha-conta`, {
      method: 'PUT', headers: getHeaders(),
      body: JSON.stringify({ telefone, data_nascimento, cep, logradouro, numero, complemento, bairro, cidade, estado })
    });
    const data = await res.json();
    if (!res.ok) { toast.erro(data.erro ?? 'Erro ao salvar.'); return; }
    toast.sucesso('Perfil atualizado com sucesso!');
    cancelarEdicaoPerfil();
    carregarDadosConta();
    document.getElementById('cp-banner-incompleto')?.remove();
  } catch { toast.erro('Erro de conexão.'); }
  finally { btn.disabled = false; btn.textContent = 'Salvar alterações'; }
}

// EXCLUIR CONTA 
async function excluirConta() {
  try {
    const res  = await fetch(`${API}/cliente/minha-conta`, { method: 'DELETE', headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) { toast.erro(data.erro ?? 'Erro ao excluir conta.'); return; }
    toast.sucesso('Conta excluída. Redirecionando...');
    setTimeout(() => {
      if (typeof logout === 'function') logout();
      else { localStorage.clear(); window.location.href = 'login.html'; }
    }, 2500);
  } catch { toast.erro('Erro de conexão.'); }
}

// INIT 
window.onload = () => {
  verificarLogin();
  carregarDadosConta();
  carregarAgendamentos();
  carregarVeiculos();
};