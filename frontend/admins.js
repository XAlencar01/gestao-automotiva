// Lógica da tela de gestão de administradores.
// Só carrega corretamente se o usuário logado for superadmin —

//FORMULÁRIO

window.abrirFormAdmin = function () {
  document.getElementById('admin-nome').value  = '';
  document.getElementById('admin-email').value = '';
  document.getElementById('formAdmin').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  lucide.createIcons();
};

window.fecharFormAdmin = function () {
  document.getElementById('formAdmin').style.display = 'none';
};

//CRIAR ADMIN
window.salvarAdmin = async function () {
  const nome  = document.getElementById('admin-nome').value.trim();
  const email = document.getElementById('admin-email').value.trim();
  const btn   = document.getElementById('btn-salvar-admin');

  if (!nome || !email) {
    toast.aviso('Preencha o nome e o e-mail para continuar.');
    return;
  }

  if (!email.includes('@')) {
    toast.aviso('Insira um e-mail válido.');
    return;
  }

  btn.disabled  = true;
  btn.innerHTML = '<span>Criando...</span>';

  try {
    const res  = await fetch(`${API}/admins`, {
      method:  'POST',
      headers: getHeaders(),
      body:    JSON.stringify({ nome, email })
    });
    const data = await res.json();

    if (!res.ok) {
      toast.erro(data.erro || 'Erro ao criar administrador.');
      return;
    }

    toast.sucesso('Admin criado! As credenciais foram enviadas por e-mail.');
    fecharFormAdmin();
    carregarAdmins();

  } catch (err) {
    console.error(err);
    toast.erro('Erro de conexão com o servidor.');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i> Criar e Enviar Acesso';
    lucide.createIcons();
  }
};

//LISTAR ADMINS

window.carregarAdmins = async function () {
  const tabela = document.getElementById('tabela-admins');

  try {
    const res  = await fetch(`${API}/admins`, { headers: getHeaders() });
    const data = await res.json();

    if (!res.ok) {
      tabela.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-red-400">Erro ao carregar administradores.</td></tr>`;
      return;
    }

    if (!data.length) {
      tabela.innerHTML = `
        <tr>
          <td colspan="5" class="py-20 text-center text-slate-500">
            <div class="flex flex-col items-center gap-3">
              <i data-lucide="user-x" class="w-10 h-10 opacity-10"></i>
              <p>Nenhum administrador cadastrado ainda.</p>
            </div>
          </td>
        </tr>`;
      lucide.createIcons();
      return;
    }

    tabela.innerHTML = data.map(a => {
      const criadoEm = a.criado_em
        ? new Date(a.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '—';

      const badgeStatus = a.ativo
        ? `<span class="badge-ativo">● Ativo</span>`
        : `<span class="badge-inativo">● Inativo</span>`;

      const btnToggle = a.ativo
        ? `<button onclick="confirmarToggleAdmin(${a.id}, '${(a.nome ?? '').replace(/'/g,"\\'")}', true)"
             class="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400
                    hover:bg-amber-500/20 transition-colors border border-amber-500/20"
             title="Desativar acesso">
             Desativar
           </button>`
        : `<button onclick="confirmarToggleAdmin(${a.id}, '${(a.nome ?? '').replace(/'/g,"\\'")}', false)"
             class="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400
                    hover:bg-green-500/20 transition-colors border border-green-500/20"
             title="Reativar acesso">
             Ativar
           </button>`;

      return `
        <tr>
          <td class="text-slate-200 font-medium">${a.nome ?? '—'}</td>
          <td class="text-slate-400">${a.email ?? '—'}</td>
          <td>${badgeStatus}</td>
          <td class="text-slate-500 text-xs">${criadoEm}</td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-2">
              ${btnToggle}
              <button onclick="confirmarExclusaoAdmin(${a.id}, '${(a.nome ?? '').replace(/'/g,"\\'")}')"
                class="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400
                       hover:bg-red-500/20 transition-colors border border-red-500/20">
                Excluir
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');

    lucide.createIcons();

  } catch (err) {
    console.error(err);
    tabela.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-red-400">Erro de conexão.</td></tr>`;
  }
};

//MODAL TOGGLE (ATIVAR/DESATIVAR)

window.confirmarToggleAdmin = function (id, nome, estaAtivo) {
  const modal = document.getElementById('modal-toggle-admin');
  document.getElementById('modal-toggle-titulo').textContent =
    estaAtivo ? 'Desativar administrador?' : 'Reativar administrador?';
  document.getElementById('modal-toggle-desc').textContent = estaAtivo
    ? `${nome} não conseguirá mais fazer login enquanto estiver inativo.`
    : `${nome} voltará a ter acesso ao painel.`;

  modal.dataset.adminId = id;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.fecharModalToggleAdmin = function () {
  const modal = document.getElementById('modal-toggle-admin');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
};

window.executarToggleAdmin = async function () {
  const modal = document.getElementById('modal-toggle-admin');
  const id    = modal.dataset.adminId;
  fecharModalToggleAdmin();

  try {
    const res  = await fetch(`${API}/admins/${id}/toggle`, {
      method: 'PATCH', headers: getHeaders()
    });
    const data = await res.json();

    if (!res.ok) {
      toast.erro(data.erro || 'Erro ao alterar status.');
      return;
    }

    const acao = data.admin?.ativo ? 'reativado' : 'desativado';
    toast.sucesso(`Administrador ${acao} com sucesso.`);
    carregarAdmins();

  } catch (err) {
    console.error(err);
    toast.erro('Erro de conexão.');
  }
};

//MODAL EXCLUSÃO

window.confirmarExclusaoAdmin = function (id, nome) {
  const modal = document.getElementById('modal-excluir-admin');
  document.getElementById('modal-excluir-admin-nome').textContent = nome;
  modal.dataset.adminId = id;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

window.fecharModalExcluirAdmin = function () {
  const modal = document.getElementById('modal-excluir-admin');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
};

window.executarExclusaoAdmin = async function () {
  const modal = document.getElementById('modal-excluir-admin');
  const id    = modal.dataset.adminId;
  fecharModalExcluirAdmin();

  try {
    const res  = await fetch(`${API}/admins/${id}`, {
      method: 'DELETE', headers: getHeaders()
    });
    const data = await res.json();

    if (!res.ok) {
      toast.erro(data.erro || 'Erro ao excluir administrador.');
      return;
    }

    toast.sucesso('Administrador removido com sucesso.');
    carregarAdmins();

  } catch (err) {
    console.error(err);
    toast.erro('Erro de conexão ao excluir.');
  }
};

// ─── PROTEÇÃO FRONT — redireciona se não for superadmin ──────────────────────
// O backend já bloqueia, mas isso evita que a tela carregue no lugar errado.

window.verificarSuperAdmin = function () {
  try {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.tipo !== 'superadmin') {
      window.location.href = 'dashboard.html';
    }
  } catch {
    window.location.href = 'login.html';
  }
};

// INIT 

carregarAdmins();