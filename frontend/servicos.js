let servicoEditando = null;

// Carrega lista de servicos
window.carregarServicos = async function () {
  try {
    const res = await fetch(`${API}/servicos`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Erro na API');

    const dados = await res.json();
    const tabela = document.getElementById('tabela');

    if (dados.length === 0) {
      tabela.innerHTML = `<tr><td colspan="4">Nenhum serviço cadastrado</td></tr>`;
      return;
    }

    tabela.innerHTML = dados.map(s => `
      <tr>
        <td>${s.nome}</td>
        <td>${s.duracao_minutos || 0} min</td>
        <td>R$ ${Number(s.preco).toFixed(2).replace('.', ',')}</td>
        <td>
          <button onclick="editarServico(${s.id})">✏️</button>
          <button onclick="deletarServico(${s.id})">🗑</button>
        </td>
      </tr>
    `).join('');

  } catch (erro) {
    console.error(erro);
    document.getElementById('tabela').innerHTML =
      `<tr><td colspan="4">Erro ao carregar serviços</td></tr>`;
  }
};

// Abre formulario de servico
window.abrirFormServico = function () {
  document.getElementById('formServico').style.display = 'block';
};

// Fecha e reseta formulario
window.fecharFormServico = function () {
  document.getElementById('formServico').style.display = 'none';
  servicoEditando = null;
  document.getElementById('nome').value     = '';
  document.getElementById('duracao').value  = '';
  document.getElementById('preco').value    = '';
};

// Carrega dados do servico no formulario para edicao
window.editarServico = async function (id) {
  try {
    const res     = await fetch(`${API}/servicos/${id}`, { headers: getHeaders() });
    const servico = await res.json();

    document.getElementById('nome').value    = servico.nome;
    document.getElementById('duracao').value = servico.duracao_minutos;
    document.getElementById('preco').value   = servico.preco;

    servicoEditando = id;
    abrirFormServico();

  } catch (erro) {
    console.error(erro);
    toast.erro('Erro ao carregar serviço.');
  }
};

// Cria ou atualiza servico
window.criarServico = async function () {
  const nome    = document.getElementById('nome').value.trim();
  const duracao = Number(document.getElementById('duracao').value);
  const preco   = Number(document.getElementById('preco').value);

  if (!nome || !duracao || !preco) {
    toast.aviso('Preencha todos os campos corretamente.');
    return;
  }

  try {
    const url    = servicoEditando ? `${API}/servicos/${servicoEditando}` : `${API}/servicos`;
    const method = servicoEditando ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify({ nome, duracao_minutos: duracao, preco })
    });

    const resposta = await res.json();

    if (!res.ok) {
      toast.erro(resposta.erro || 'Erro ao salvar serviço.');
      return;
    }

    toast.sucesso(servicoEditando ? 'Serviço atualizado!' : 'Serviço criado!');
    fecharFormServico();
    carregarServicos();

  } catch (erro) {
    console.error(erro);
    toast.erro('Erro de conexão com o servidor.');
  }
};

// Remove servico
window.deletarServico = async function (id) {
  if (!confirm('Deseja deletar este serviço?')) return;

  await fetch(`${API}/servicos/${id}`, { method: 'DELETE', headers: getHeaders() });
  carregarServicos();
};

carregarServicos();