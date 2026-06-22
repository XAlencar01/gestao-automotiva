// verifica se está logado
function verificarLogin() {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = 'login.html';
}

//LOGIN
async function login() {
  const email  = document.getElementById('email').value.trim().toLowerCase();
  const senha  = document.getElementById('senha').value;
  const erroEl = document.getElementById('erro');

  // Usa mostrarErro se disponível (login.html), senão usa estilo direto
  function exibirErro(msg, tipo = 'erro') {
    if (typeof mostrarErro === 'function') {
      mostrarErro(msg, tipo);
    } else {
      erroEl.innerText      = msg;
      erroEl.style.color    = tipo === 'sucesso' ? '#22c55e' : '#ef4444';
      erroEl.style.display  = 'block';
    }
  }

  if (!email || !senha) {
    exibirErro('Preencha o e-mail e a senha.');
    return;
  }

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, senha })
    });

    const data = await res.json();

    if (!res.ok) {
      // Mensagens de erro amigáveis
      let msg = data.erro || 'Erro ao fazer login.';
      if (msg.includes('não encontrado'))   msg = 'E-mail não cadastrado no sistema.';
      if (msg.includes('Senha inválida'))    msg = 'Senha incorreta. Tente novamente.';
      if (msg.includes('Confirme seu email')) msg = 'E-mail não confirmado. Verifique sua caixa de entrada.';

      exibirErro(msg);
      mostrarBotaoReenvio(data.reenviar === true);
      return;
    }

    mostrarBotaoReenvio(false);
    localStorage.setItem('token', data.token);

    const usuario = parseJwt(data.token);

    if (!usuario) {
      exibirErro('Token inválido recebido do servidor.');
      localStorage.removeItem('token');
      return;
    }

    if (usuario.tipo === 'admin' || usuario.tipo === 'superadmin') {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'tela_cliente.html';
    }

  } catch (erro) {
    console.error(erro);
    if (typeof mostrarErro === 'function') {
      mostrarErro('Erro ao conectar com o servidor. Tente novamente.');
    } else {
      erroEl.innerText     = 'Erro ao conectar com o servidor.';
      erroEl.style.display = 'block';
    }
  }
}

// REENVIAR EMAIL 
async function reenviarEmail() {
  const email  = document.getElementById('email').value.trim().toLowerCase();
  const erroEl = document.getElementById('erro');

  if (!email) {
    if (typeof mostrarErro === 'function') mostrarErro('Digite seu e-mail para reenviar.');
    else { erroEl.innerText = 'Digite seu e-mail.'; erroEl.style.display = 'block'; }
    return;
  }

  try {
    const res  = await fetch(`${API}/auth/reenviar-email`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.erro);

    if (typeof mostrarErro === 'function') {
      mostrarErro(data.mensagem, 'sucesso');
    } else {
      erroEl.style.color   = '#22c55e';
      erroEl.innerText     = data.mensagem;
      erroEl.style.display = 'block';
    }

  } catch (error) {
    if (typeof mostrarErro === 'function') mostrarErro(error.message);
    else { erroEl.style.color = '#ef4444'; erroEl.innerText = error.message; erroEl.style.display = 'block'; }
  }
}

//BOTÃO REENVIO 
function mostrarBotaoReenvio(mostrar) {
  const btn = document.getElementById('btn-reenviar');
  if (!btn) return;
  btn.style.display = mostrar ? 'block' : 'none';
}

//JWT
function parseJwt(token) {
  try {
    const base64 = token.split('.')[1];
    const json   = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch (e) {
    console.error('Token inválido:', e);
    return null;
  }
}

function getUsuario() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return parseJwt(token);
}

function mostrarUsuario() {
  const usuario = getUsuario();
  if (!usuario) return;
  const el = document.getElementById('usuario-logado');
  if (el) el.innerText = usuario.nome || usuario.tipo?.toUpperCase() || 'USUÁRIO';
}

function ocultarParaCliente() {
  const usuario = getUsuario();
  const elementosAdmin = document.querySelectorAll('.admin-only');
  if (!usuario || (usuario.tipo !== 'admin' && usuario.tipo !== 'superadmin')) {
    elementosAdmin.forEach(el => el.style.display = 'none');
    return;
  }
  elementosAdmin.forEach(el => {
    el.style.display = (el.tagName === 'TD' || el.tagName === 'TH') ? 'table-cell' : 'block';
  });
}

function getHeaders() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}