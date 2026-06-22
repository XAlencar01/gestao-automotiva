// register.js

async function cadastrar() {
  const nome     = document.getElementById('nome').value.trim();
  const email    = document.getElementById('email').value.trim().toLowerCase();
  const senha    = document.getElementById('senha').value;
  const telefone = document.getElementById('telefone')?.value || '';

  const erroDiv = document.getElementById('alerta-erro');
  erroDiv.style.display = 'none';
  erroDiv.innerText     = '';

  if (!nome || !email || !senha) {
    erroDiv.innerText     = 'Preencha todos os campos.';
    erroDiv.style.display = 'flex';
    throw new Error('Validação falhou');
  }

  const res = await fetch(`${API}/auth/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ nome, email, senha, telefone })
  });

  const data = await res.json();

  if (!res.ok) {
    erroDiv.innerHTML =
      `<strong>Atenção:</strong>` +
      `<ul style='margin-left:1rem;list-style-type:disc;margin-top:.5rem'>` +
      `<li>${data.erro || 'Erro ao cadastrar usuário.'}</li></ul>`;
    erroDiv.style.display = 'flex';
    throw new Error(data.erro || 'Erro ao cadastrar usuário.');
  }

  return data;
}