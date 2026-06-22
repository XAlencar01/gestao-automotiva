// src/test/funcionarios.test.js
'use strict';

jest.mock('../config/db', () => require('./mocks/db'));
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }) }
  }))
}));

const request      = require('supertest');
const jwt          = require('jsonwebtoken');
const app          = require('../app');
const pool         = require('../config/db');
const SECRET       = process.env.JWT_SECRET || 'segredo_super_forte';
const tokenAdmin   = jwt.sign({ id: 1, tipo: 'admin',   email: 'admin@test.com' }, SECRET, { expiresIn: '1d' });
const tokenCliente = jwt.sign({ id: 2, tipo: 'cliente', email: 'cli@test.com', cliente_id: 5 }, SECRET, { expiresIn: '1d' });

function mockQuery(rows = [], rowCount = 1) {
  pool.query.mockResolvedValueOnce({ rows, rowCount });
}

beforeEach(() => jest.clearAllMocks());

describe('GET /funcionarios/ativos', () => {

  test('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/funcionarios/ativos');
    expect(res.status).toBe(401);
  });

  test('deve listar funcionários ativos', async () => {
    mockQuery([{ id: 1, nome: 'João' }, { id: 2, nome: 'Maria' }]);
    const res = await request(app).get('/funcionarios/ativos').set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});

describe('GET /funcionarios', () => {

  test('deve retornar 403 para cliente', async () => {
    const res = await request(app).get('/funcionarios').set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(403);
  });

  test('deve listar todos para admin', async () => {
    mockQuery([{ id: 1, nome: 'João', ativo: true, criado_em: new Date(), agendamentos_hoje: 2 }]);
    const res = await request(app).get('/funcionarios').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
  });
});

describe('POST /funcionarios', () => {

  test('deve retornar 403 para cliente', async () => {
    const res = await request(app).post('/funcionarios').set('Authorization', `Bearer ${tokenCliente}`).send({ nome: 'Carlos' });
    expect(res.status).toBe(403);
  });

  test('deve retornar 400 se nome vazio', async () => {
    const res = await request(app).post('/funcionarios').set('Authorization', `Bearer ${tokenAdmin}`).send({ nome: '' });
    expect(res.status).toBe(400);
  });

  test('deve cadastrar com sucesso', async () => {
    mockQuery([{ id: 3, nome: 'Carlos Lima', ativo: true, criado_em: new Date() }]);
    const res = await request(app).post('/funcionarios').set('Authorization', `Bearer ${tokenAdmin}`).send({ nome: 'Carlos Lima' });
    expect(res.status).toBe(201);
    expect(res.body.nome).toBe('Carlos Lima');
  });
});

describe('PUT /funcionarios/:id', () => {

  test('deve retornar 400 sem campos', async () => {
    const res = await request(app).put('/funcionarios/1').set('Authorization', `Bearer ${tokenAdmin}`).send({});
    expect(res.status).toBe(400);
  });

  test('deve retornar 404 se não existir', async () => {
    mockQuery([]);
    const res = await request(app).put('/funcionarios/999').set('Authorization', `Bearer ${tokenAdmin}`).send({ nome: 'Novo', ativo: false });
    expect(res.status).toBe(404);
  });

  test('deve atualizar com sucesso', async () => {
    mockQuery([{ id: 1, nome: 'João Atualizado', ativo: false }]);
    const res = await request(app).put('/funcionarios/1').set('Authorization', `Bearer ${tokenAdmin}`).send({ nome: 'João Atualizado', ativo: false });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('João Atualizado');
  });
});

describe('DELETE /funcionarios/:id', () => {

  test('deve retornar 403 para cliente', async () => {
    const res = await request(app).delete('/funcionarios/1').set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(403);
  });

  test('deve retornar 400 com agendamentos futuros', async () => {
    mockQuery([{ count: '2' }]);
    const res = await request(app).delete('/funcionarios/1').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(400);
  });

  test('deve deletar com sucesso', async () => {
    mockQuery([{ count: '0' }]);
    mockQuery([{ id: 1, nome: 'João' }]);
    const res = await request(app).delete('/funcionarios/1').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
  });
});