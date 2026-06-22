// scripts/seed-demo.js — popula o banco com clientes de demonstração completos
// (usuário + cliente + veículo + agendamentos hoje/amanhã). Identificados pelo
// domínio de e-mail @clientedemo.com.br e pela tag 'demo', para poder limpar com:
//   node scripts/seed-demo.js --limpar
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

const SENHA_DEMO = 'Teste@123';
const DOMINIO_DEMO = '@clientedemo.com.br';

const NOMES = [
  'Carlos Mendes', 'Fernanda Lima', 'Roberto Castro', 'Juliana Pereira', 'Marcos Vinícius',
  'Patrícia Souza', 'André Luiz Costa', 'Camila Ferreira', 'Eduardo Santos', 'Beatriz Almeida',
  'Felipe Rodrigues', 'Larissa Martins', 'Thiago Barbosa', 'Renata Carvalho', 'Diego Nascimento',
];

const VEICULOS = [
  { marca: 'Toyota',     modelo: 'Corolla',  cor: 'Preto'   },
  { marca: 'Honda',      modelo: 'Civic',    cor: 'Branco'  },
  { marca: 'Volkswagen', modelo: 'Golf',     cor: 'Cinza'   },
  { marca: 'Hyundai',    modelo: 'HB20',     cor: 'Vermelho'},
  { marca: 'Chevrolet',  modelo: 'Onix',     cor: 'Azul'    },
  { marca: 'Jeep',       modelo: 'Compass',  cor: 'Branco'  },
  { marca: 'Fiat',       modelo: 'Pulse',    cor: 'Preto'   },
  { marca: 'Ford',       modelo: 'Ka',       cor: 'Prata'   },
];

const STATUS_FUNIL = ['novo', 'ativo', 'recorrente', 'inativo'];
const STATUS_AGENDAMENTO = ['pendente', 'aprovado'];

const aleatorio = (lista) => lista[Math.floor(Math.random() * lista.length)];
const placaAleatoria = () => {
  const letras = () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  const num = () => Math.floor(Math.random() * 10);
  return `${letras()}${letras()}${letras()}${num()}${letras()}${num()}${num()}`;
};

async function limpar() {
  console.log('Removendo dados de demonstração anteriores...');
  await pool.query(`
    DELETE FROM agendamentos WHERE cliente_id IN (SELECT id FROM clientes WHERE email LIKE '%${DOMINIO_DEMO}')
  `);
  await pool.query(`
    DELETE FROM veiculos WHERE cliente_id IN (SELECT id FROM clientes WHERE email LIKE '%${DOMINIO_DEMO}')
  `);
  const usuarioIds = await pool.query(`
    SELECT usuario_id FROM clientes WHERE email LIKE '%${DOMINIO_DEMO}' AND usuario_id IS NOT NULL
  `);
  await pool.query(`DELETE FROM clientes WHERE email LIKE '%${DOMINIO_DEMO}'`);
  for (const { usuario_id } of usuarioIds.rows) {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [usuario_id]);
  }
  console.log('Limpeza concluída.');
}

function horarioAleatorio() {
  // Slots de 30 em 30 min entre 08:00 e 17:30 (loja fecha às 18:00).
  const slot = Math.floor(Math.random() * 20); // 0..19 -> 08:00..17:30
  const horas = 8 + Math.floor(slot / 2);
  const minutos = (slot % 2) * 30;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`;
}

async function popular() {
  const servicos = await pool.query('SELECT id, duracao_minutos FROM servicos');
  const funcionarios = await pool.query('SELECT id FROM funcionarios WHERE ativo = true');
  if (!servicos.rows.length || !funcionarios.rows.length) {
    throw new Error('É preciso ter ao menos 1 serviço e 1 funcionário cadastrados antes de popular.');
  }

  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const isoData = (d) => d.toISOString().slice(0, 10);

  const senhaHash = await bcrypt.hash(SENHA_DEMO, 10);

  for (let i = 0; i < NOMES.length; i++) {
    const nome = NOMES[i];
    const email = `teste${String(i + 1).padStart(2, '0')}${DOMINIO_DEMO}`;
    const telefone = `11${String(900000000 + i * 137).slice(0, 9)}`;

    const usuarioResult = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, telefone, tipo, email_confirmado, ativo)
       VALUES ($1, $2, $3, $4, 'cliente', true, true) RETURNING id`,
      [nome, email, senhaHash, telefone]
    );
    const usuarioId = usuarioResult.rows[0].id;

    const statusFunil = STATUS_FUNIL[i % STATUS_FUNIL.length];
    const clienteResult = await pool.query(
      `INSERT INTO clientes (
         nome, email, telefone, usuario_id, perfil_completo,
         cep, logradouro, numero, bairro, cidade, estado,
         status_funil, tags, notas, ativo
       ) VALUES ($1,$2,$3,$4,true, '01310-200','Av. Paulista', $5, 'Bela Vista','São Paulo','SP', $6, $7, $8, true)
       RETURNING id`,
      [
        nome, email, telefone, usuarioId, String(100 + i),
        statusFunil, ['demo'], 'Cliente de demonstração gerado para popular o sistema.',
      ]
    );
    const clienteId = clienteResult.rows[0].id;

    const veiculo = VEICULOS[i % VEICULOS.length];
    const veiculoResult = await pool.query(
      `INSERT INTO veiculos (cliente_id, marca, modelo, placa, cor, ano)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [clienteId, veiculo.marca, veiculo.modelo, placaAleatoria(), veiculo.cor, 2018 + (i % 7)]
    );
    const veiculoId = veiculoResult.rows[0].id;

    // Um agendamento hoje e outro amanhã, em serviços/funcionários e horários distintos.
    for (const dia of [hoje, amanha]) {
      const servico = aleatorio(servicos.rows);
      const funcionario = aleatorio(funcionarios.rows);
      const dataHora = `${isoData(dia)}T${horarioAleatorio()}`;

      await pool.query(
        `INSERT INTO agendamentos (cliente_id, veiculo_id, servico_id, funcionario_id, data, status, duracao_minutos)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          clienteId, veiculoId, servico.id, funcionario.id, dataHora,
          aleatorio(STATUS_AGENDAMENTO), servico.duracao_minutos || 60,
        ]
      );
    }

    console.log(`✓ ${nome} (${email}) — funil: ${statusFunil} — 2 agendamentos criados`);
  }
}

(async () => {
  try {
    if (process.argv.includes('--limpar')) {
      await limpar();
    } else {
      await limpar(); // idempotente: remove uma rodada anterior antes de recriar
      await popular();
      console.log(`\nConcluído! ${NOMES.length} clientes de demonstração criados.`);
      console.log(`Login de teste: teste01${DOMINIO_DEMO} … teste15${DOMINIO_DEMO} — senha: ${SENHA_DEMO}`);
    }
    process.exit(0);
  } catch (e) {
    console.error('Erro ao popular o sistema:', e.message);
    process.exit(1);
  }
})();
