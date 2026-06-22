// src/test/veiculos_extra.test.js
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
const tokenAdmin   = jwt.sign({ id: 1, tipo: 'admin', email: 'admin@test.com' }, SECRET, { expiresIn: '1d' });
const tokenCliente = jwt.sign({ id: 2, tipo: 'cliente', email: 'cli@test.com', cliente_id: 5 }, SECRET, { expiresIn: '1d' });

function mockQuery(rows = [], rowCount = 1) {
  pool.query.mockResolvedValueOnce({ rows, rowCount });
}

beforeEach(() => jest.clearAllMocks());

describe('GET /veiculos/:id', () => {
  test('deve retornar 404 se não existir', async () => {
    mockQuery([]);
    const res = await request(app).get('/veiculos/999').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });

  test('deve retornar veículo pelo id', async () => {
    mockQuery([{ id: 1, modelo: 'Corolla', placa: 'ABC1234', cliente: 'João' }]);
    const res = await request(app).get('/veiculos/1').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('modelo', 'Corolla');
  });
});

describe('GET /veiculos — como cliente', () => {
  test('deve retornar apenas veículos do próprio cliente', async () => {
    mockQuery([{ id: 1, modelo: 'Gol', placa: 'XYZ9999', cliente: 'Cliente' }]);
    const res = await request(app).get('/veiculos').set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /veiculos — validações Joi', () => {
  test('deve retornar 400 com cliente_id ausente', async () => {
    const res = await request(app).post('/veiculos').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ modelo: 'Gol', placa: 'XYZ9876' });
    expect(res.status).toBe(400);
  });

  test('deve retornar 400 com placa ausente', async () => {
    const res = await request(app).post('/veiculos').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ cliente_id: 1, modelo: 'Gol' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /veiculos/:id', () => {
  test('deve retornar 400 campos obrigatórios faltando', async () => {
    const res = await request(app).put('/veiculos/1').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ marca: 'Toyota' });
    expect(res.status).toBe(400);
  });

  test('deve retornar 404 se não existir', async () => {
    mockQuery([]);
    const res = await request(app).put('/veiculos/999').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ cliente_id: 1, modelo: 'Civic', placa: 'AAA1111' });
    expect(res.status).toBe(404);
  });

  test('deve atualizar com sucesso', async () => {
    mockQuery([{ id: 1, modelo: 'Civic Atualizado', placa: 'AAA1111' }]);
    const res = await request(app).put('/veiculos/1').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ cliente_id: 1, modelo: 'Civic Atualizado', placa: 'AAA1111' });
    expect(res.status).toBe(200);
    expect(res.body.modelo).toBe('Civic Atualizado');
  });
});