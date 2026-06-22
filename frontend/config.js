// config.js
window.API = "http://localhost:3000";
// produção (Render):
//https://gestao-agendamentos-estetica-automotiva.onrender.com
// backup
//https://gestao-agendamentos-estetica-automotiva-production.up.railway.app

// Máscara de telefone BR: (00) 0000-0000 ou (00) 00000-0000
window.maskTelefone = function (input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10) {
    v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
  } else if (v.length > 6) {
    v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (v.length > 2) {
    v = v.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
  } else if (v.length > 0) {
    v = v.replace(/^(\d{0,2}).*/, '($1');
  }
  input.value = v;
};
