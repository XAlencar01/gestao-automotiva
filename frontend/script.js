

// carregar serviços
async function carregarServicos() {
  const res = await fetch(`${API}/servicos`);
  const dados = await res.json();

  const select = document.getElementById("servico_id");

  dados.forEach(servico => {
    const option = document.createElement("option");
    option.value = servico.id;
    option.textContent = `${servico.nome} (${servico.duracao_minutos} min)`;
    select.appendChild(option);
  });
}

// listar agendamentos
async function carregarAgendamentos() {
  const res = await fetch(`${API}/agendamentos`);
  const dados = await res.json();

  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  dados.forEach(a => {
    const li = document.createElement("li");
    li.textContent = `${a.cliente} - ${a.servico} - ${new Date(a.data).toLocaleString()}`;
    lista.appendChild(li);
  });
}

// criar agendamento
document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const body = {
    cliente_id: document.getElementById("cliente_id").value,
    veiculo_id: document.getElementById("veiculo_id").value,
    servico_id: document.getElementById("servico_id").value,
    data: document.getElementById("data").value,
    status: "pendente"
  };

  const res = await fetch(`${API}/agendamentos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const resultado = await res.json();

  if (res.status !== 201) {
    alert(resultado.erro);
  } else {
    alert("Agendado com sucesso!");
    carregarAgendamentos();
  }
});

// iniciar
carregarServicos();
carregarAgendamentos();