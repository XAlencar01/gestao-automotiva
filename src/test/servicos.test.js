// src/test/servicos.test.js
'use strict';

jest.mock('../config/db', () => require('./mocks/db'));
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }) }
  }))
}));

const request    = require('supertest');
const jwt        = require('jsonwebtoken');
const app        = require('../app');
const pool       = require('../config/db');
const SECRET     = process.env.JWT_SECRET || 'segredo_super_forte';
const tokenAdmin = jwt.sign({ id: 1, tipo: 'admin', email: 'admin@test.com' }, SECRET, { expiresIn: '1d' });

function mockQuery(rows = [], rowCount = 1) {
  pool.query.mockResolvedValueOnce({ rows, rowCount });
}

beforeEach(() => jest.clearAllMocks());

describe('GET /servicos', () => {

  test('deve listar serviços', async () => {
    mockQuery([{ id: 1, nome: 'Lavagem', preco: 50, duracao_minutos: 30 }]);
    const res = await request(app).get('/servicos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('deve retornar array vazio', async () => {
    mockQuery([]);
    const res = await request(app).get('/servicos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /servicos/:id', () => {

  test('deve retornar 404 se não existir', async () => {
    mockQuery([]);
    const res = await request(app).get('/servicos/999');
    expect(res.status).toBe(404);
  });

  test('deve retornar serviço pelo id', async () => {
    mockQuery([{ id: 1, nome: 'Lavagem', preco: 50, duracao_minutos: 30 }]);
    const res = await request(app).get('/servicos/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nome', 'Lavagem');
  });
});

describe('POST /servicos', () => {

  test('deve retornar 400 se campos faltarem', async () => {
    const res = await request(app).post('/servicos').set('Authorization', `Bearer ${tokenAdmin}`).send({ nome: 'Lavagem' });
    expect(res.status).toBe(400);
  });

  test('deve criar serviço com sucesso', async () => {
    mockQuery([{ id: 3, nome: 'Higienização', preco: 180, duracao_minutos: 90 }]);
    const res = await request(app).post('/servicos').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome: 'Higienização', duracao_minutos: 90, preco: 180 });
    expect(res.status).toBe(201);
    expect(res.body.nome).toBe('Higienização');
  });
});

describe('PUT /servicos/:id', () => {

  test('deve retornar 404 se não existir', async () => {
    mockQuery([]);
    const res = await request(app).put('/servicos/999').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome: 'Teste', duracao_minutos: 30, preco: 50 });
    expect(res.status).toBe(404);
  });

  test('deve atualizar com sucesso', async () => {
    mockQuery([{ id: 1, nome: 'Lavagem Atualizada', preco: 60, duracao_minutos: 45 }]);
    const res = await request(app).put('/servicos/1').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome: 'Lavagem Atualizada', duracao_minutos: 45, preco: 60 });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Lavagem Atualizada');
  });
});

describe('DELETE /servicos/:id', () => {

  test('deve retornar 404 se não existir', async () => {
    mockQuery([]);
    const res = await request(app).delete('/servicos/999').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });

  test('deve deletar com sucesso', async () => {
    mockQuery([{ id: 1 }]);
    const res = await request(app).delete('/servicos/1').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
  });
});