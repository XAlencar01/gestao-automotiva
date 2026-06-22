// src/test/middlewares.test.js
'use strict';

jest.mock('../config/db', () => require('./mocks/db'));
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }) }
  }))
}));

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../app');
const pool    = require('../config/db');
const SECRET  = process.env.JWT_SECRET || 'segredo_super_forte';

function mockQuery(rows = [], rowCount = 1) {
  pool.query.mockResolvedValueOnce({ rows, rowCount });
}

beforeEach(() => jest.clearAllMocks());

describe('authMiddleware', () => {

  test('deve retornar 401 sem Authorization', async () => {
    const res = await request(app).get('/agendamentos');
    expect(res.status).toBe(401);
    expect(res.body.erro).toMatch(/token não fornecido/i);
  });

  test('deve retornar 403 com token inválido', async () => {
    const res = await request(app).get('/agendamentos').set('Authorization', 'Bearer tokeninvalido');
    expect(res.status).toBe(403);
    expect(res.body.erro).toMatch(/token inválido/i);
  });

  test('deve permitir acesso com token válido', async () => {
    const token = jwt.sign({ id: 1, tipo: 'admin', email: 'admin@test.com' }, SECRET, { expiresIn: '1d' });
    mockQuery([]);
    mockQuery([]);
    const res = await request(app).get('/agendamentos').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('adminMiddleware', () => {

  test('deve retornar 403 para cliente', async () => {
    const token = jwt.sign({ id: 2, tipo: 'cliente', email: 'cli@test.com', cliente_id: 5 }, SECRET, { expiresIn: '1d' });
    const res = await request(app).get('/funcionarios').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.erro).toMatch(/acesso negado/i);
  });

  test('deve permitir acesso para admin', async () => {
    const token = jwt.sign({ id: 1, tipo: 'admin', email: 'admin@test.com' }, SECRET, { expiresIn: '1d' });
    mockQuery([]);
    const res = await request(app).get('/funcionarios').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('deve permitir acesso para superadmin', async () => {
    const token = jwt.sign({ id: 1, tipo: 'superadmin', email: 'super@test.com' }, SECRET, { expiresIn: '1d' });
    mockQuery([]);
    const res = await request(app).get('/funcionarios').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /cliente/minha-conta', () => {

  test('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/cliente/minha-conta');
    expect(res.status).toBe(401);
  });

  test('deve retornar 404 se cliente não existir', async () => {
    const token = jwt.sign({ id: 2, tipo: 'cliente', email: 'x@x.com', cliente_id: 5 }, SECRET, { expiresIn: '1d' });
    mockQuery([]);
    const res = await request(app).get('/cliente/minha-conta').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('deve retornar dados da conta', async () => {
    const token = jwt.sign({ id: 2, tipo: 'cliente', email: 'cli@test.com', cliente_id: 5 }, SECRET, { expiresIn: '1d' });
    mockQuery([{
      id: 5, nome: 'Cliente Teste', email: 'cli@test.com',
      telefone: '11999', data_nascimento: null, cep: null,
      logradouro: null, numero: null, complemento: null,
      bairro: null, cidade: null, estado: null,
      perfil_completo: false, criado_em: new Date()
    }]);
    const res = await request(app).get('/cliente/minha-conta').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nome', 'Cliente Teste');
    expect(res.body).toHaveProperty('aniversario_hoje');
  });
});

describe('DELETE /cliente/minha-conta (LGPD)', () => {

  test('deve anonimizar e deletar', async () => {
    const token = jwt.sign({ id: 2, tipo: 'cliente', email: 'cli@test.com', cliente_id: 5 }, SECRET, { expiresIn: '1d' });
    mockQuery([{ id: 5, email: 'cli@test.com' }]);
    mockQuery([]);
    mockQuery([]);
    mockQuery([]);
    const res = await request(app).delete('/cliente/minha-conta').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.mensagem).toMatch(/lgpd/i);
  });
});

describe('GET /cliente/meus-agendamentos', () => {

  test('deve retornar agendamentos do cliente', async () => {
    const token = jwt.sign({ id: 2, tipo: 'cliente', email: 'cli@test.com', cliente_id: 5 }, SECRET, { expiresIn: '1d' });
    mockQuery([{ id: 5, email: 'cli@test.com' }]);
    mockQuery([{
      id: 1, data: new Date(), status: 'pendente',
      desconto_aniversario: false, servico: 'Lavagem',
      duracao_minutos: 30, preco: 50,
      veiculo_modelo: 'Corolla', veiculo_placa: 'ABC1234'
    }]);
    const res = await request(app).get('/cliente/meus-agendamentos').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('servico', 'Lavagem');
  });
});