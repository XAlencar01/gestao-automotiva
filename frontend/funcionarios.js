
// Formulário
function abrirForm() {
  document.getElementById('funcId').value    = '';
  document.getElementById('funcNome').value  = '';
  document.getElementById('funcAtivoWrap').style.display = 'none';
  document.getElementById('formFuncionario').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fecharForm() {
  document.getElementById('formFuncionario').style.display = 'none';
}

function editarFuncionario(id, nome, ativo) {
  document.getElementById('funcId').value    = id;
  document.getElementById('funcNome').value  = nome;
  document.getElementById('funcAtivo').value = String(ativo);
  document.getElementById('funcAtivoWrap').style.display = 'block';
  document.getElementById('formFuncionario').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Salvar (criar ou atualizar) ───────────────────────
async function salvarFuncionario() {
  const id   = document.getElementById('funcId').value;
  const nome = document.getElementById('funcNome').value.trim();

  if (!nome) { toast.aviso('O nome do funcionário é obrigatório.'); return; }

  const body = { nome };

  if (id) {
    body.ativo = document.getElementById('funcAtivo').value === 'true';
  }

  try {
    const res = await fetch(
      id ? `${API}/funcionarios/${id}` : `${API}/funcionarios`,
      { method: id ? 'PUT' : 'POST', headers: getHeaders(), body: JSON.stringify(body) }
    );

    const data = await res.json();

    if (!res.ok) { toast.erro(data.erro ?? 'Erro ao salvar funcionário.'); return; }

    toast.sucesso(id ? 'Funcionário atualizado!' : 'Funcionário cadastrado!');
    fecharForm();
    carregarFuncionarios();
  } catch (err) {
    console.error(err);
    toast.erro('Erro de conexão.');
  }
}

// Listar
async function carregarFuncionarios() {
  try {
    const res   = await fetch(`${API}/funcionarios`, { headers: getHeaders() });
    const dados = await res.json();
    const tabela = document.getElementById('tabela');

    if (!dados.length) {
      tabela.innerHTML = `
        <tr><td colspan="5" class="py-16 text-center text-slate-500">
          <div class="flex flex-col items-center gap-3">
            <i data-lucide="users" class="w-10 h-10 opacity-10"></i>
            <p>Nenhum funcionário cadastrado.</p>
          </div>
        </td></tr>`;
      lucide.createIcons(); return;
    }

    tabela.innerHTML = dados.map(f => {
      const criadoEm = f.criado_em
        ? new Date(f.criado_em).toLocaleDateString('pt-BR')
        : '—';

      return `
        <tr>
          <td class="text-slate-200 font-medium">${f.nome}</td>
          <td>
            <span class="${f.ativo ? 'badge-ativo' : 'badge-inativo'}">
              ${f.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </td>
          <td class="text-slate-400">${f.agendamentos_hoje ?? 0}</td>
          <td class="text-slate-400">${criadoEm}</td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-2">
              <button onclick="editarFuncionario(${f.id}, '${f.nome.replace(/'/g,"\\'")}', ${f.ativo})"
                class="text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors border border-orange-500/20">
                Editar
              </button>
              <button onclick="confirmarExclusao(${f.id}, '${f.nome.replace(/'/g,"\\'")}' )"
                class="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20">
                Excluir
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');

    lucide.createIcons();
  } catch (err) {
    console.error(err);
    document.getElementById('tabela').innerHTML =
      `<tr><td colspan="5" class="py-8 text-center text-red-400">Erro ao carregar funcionários.</td></tr>`;
  }
}

// Modal de exclusão 
let _funcParaExcluir = null;

function confirmarExclusao(id, nome) {
  _funcParaExcluir = id;
  document.getElementById('modal-excluir-nome').textContent = nome;
  const m = document.getElementById('modal-excluir');
  m.classList.remove('hidden'); m.classList.add('flex');
}

function fecharModalExcluir() {
  const m = document.getElementById('modal-excluir');
  m.classList.add('hidden'); m.classList.remove('flex');
  _funcParaExcluir = null;
}

async function executarExclusao() {
  const id = _funcParaExcluir;
  fecharModalExcluir();

  try {
    const res  = await fetch(`${API}/funcionarios/${id}`, {
      method: 'DELETE', headers: getHeaders()
    });
    const data = await res.json();

    if (!res.ok) { toast.erro(data.erro ?? 'Erro ao excluir funcionário.'); return; }

    toast.sucesso('Funcionário removido com sucesso.');
    carregarFuncionarios();
  } catch (err) {
    console.error(err);
    toast.erro('Erro de conexão ao excluir funcionário.');
  }
}

// INIT
carregarFuncionarios();