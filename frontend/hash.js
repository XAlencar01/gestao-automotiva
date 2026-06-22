const bcrypt = require('bcrypt');

const senha = '123456'; // 👈 coloca sua senha aqui

const hash = bcrypt.hashSync(senha, 10);

console.log(hash);