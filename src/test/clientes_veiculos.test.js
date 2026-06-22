// src/test/clientes_veiculos.test.js
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
const SECRET       = process.env.JWT_SECRET;
const tokenAdmin   = jwt.sign({ id: 1, tipo: 'admin',   email: 'admin@test.com' }, SECRET, { expiresIn: '1d' });
const tokenCliente = jwt.sign({ id: 2, tipo: 'cliente', email: 'cli@test.com', cliente_id: 5 }, SECRET, { expiresIn: '1d' });

function mockQuery(rows = [], rowCount = 1) {
  pool.query.mockResolvedValueOnce({ rows, rowCount });
}

beforeEach(() => jest.clearAllMocks());

describe('GET /clientes', () => {
  test('deve listar clientes com paginação', async () => {
    mockQuery([{ id: 1, nome: 'João', email: 'joao@test.com', telefone: '11999' }]); // SELECT
    mockQuery([{ count: '1' }]); // COUNT
    const res = await request(app).get('/clientes').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dados');
    expect(Array.isArray(res.body.dados)).toBe(true);
    expect(res.body).toHaveProperty('total', 1);
  });
});

describe('GET /clientes/:id', () => {
  test('deve retornar 404 se não existir', async () => {
    mockQuery([]);
    const res = await request(app).get('/clientes/999').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });

  test('deve retornar cliente pelo id', async () => {
    mockQuery([{ id: 1, nome: 'João', email: 'joao@test.com', telefone: '11999' }]);
    const res = await request(app).get('/clientes/1').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nome', 'João');
  });
});

describe('POST /clientes', () => {
  test('deve criar cliente com sucesso', async () => {
    mockQuery([{ id: 5, nome: 'Novo', email: 'novo@test.com', telefone: '11777' }]);
    const res = await request(app).post('/clientes').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome: 'Novo', email: 'novo@test.com', telefone: '11777' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});

describe('PUT /clientes/:id', () => {
  test('deve retornar 404 se não existir', async () => {
    mockQuery([]);
    const res = await request(app).put('/clientes/999').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome: 'Teste', email: 'teste@test.com', telefone: '11000' });
    expect(res.status).toBe(404);
  });

  test('deve atualizar com sucesso', async () => {
    mockQuery([{ id: 1, nome: 'Atualizado', email: 'novo@test.com', telefone: '11000' }]);
    const res = await request(app).put('/clientes/1').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome: 'Atualizado', email: 'novo@test.com', telefone: '11000' });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Atualizado');
  });
});

describe('DELETE /clientes/:id (LGPD)', () => {
  test('deve retornar 404 se não existir', async () => {
    mockQuery([]);
    const res = await request(app).delete('/clientes/999').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });

  test('deve anonimizar (LGPD)', async () => {
    mockQuery([{ id: 1, usuario_id: 2 }]);
    mockQuery([]);
    mockQuery([]);
    const res = await request(app).delete('/clientes/1').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.mensagem).toMatch(/lgpd/i);
  });
});

describe('GET /veiculos', () => {
  test('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/veiculos');
    expect(res.status).toBe(401);
  });

  test('deve listar veículos', async () => {
    mockQuery([{ id: 1, modelo: 'Corolla', placa: 'ABC1234', cliente: 'João' }]);
    const res = await request(app).get('/veiculos').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
  });
});

describe('POST /veiculos', () => {
  test('deve retornar 400 se campos faltarem (Joi)', async () => {
    const res = await request(app).post('/veiculos').set('Authorization', `Bearer ${tokenAdmin}`).send({ marca: 'Toyota' });
    expect(res.status).toBe(400);
  });

  test('deve criar veículo com sucesso', async () => {
    mockQuery([{ id: 10, cliente_id: 1, modelo: 'Corolla', placa: 'ABC1234', marca: 'Toyota' }]);
    const res = await request(app).post('/veiculos').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ cliente_id: 1, modelo: 'Corolla', placa: 'ABC1234', marca: 'Toyota', cor: 'Branco', ano: 2020 });
    expect(res.status).toBe(201);
    expect(res.body.placa).toBe('ABC1234');
  });
});

describe('DELETE /veiculos/:id', () => {
  test('deve retornar 403 para cliente', async () => {
    const res = await request(app).delete('/veiculos/1').set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(403);
  });

  test('deve deletar como admin', async () => {
    mockQuery([{ id: 1 }]);
    const res = await request(app).delete('/veiculos/1').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
  });
});