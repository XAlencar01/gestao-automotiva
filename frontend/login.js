
async function login() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, senha })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.erro || "Erro no login");
      return;
    }

    //Salva token
    localStorage.setItem("token", data.token);

    //Redireciona
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o servidor");
  }
}