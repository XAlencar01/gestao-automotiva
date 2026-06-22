function normalizarEmail(email) {
  if (!email) return email;

  return email
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '');
}

module.exports = {
  normalizarEmail
};