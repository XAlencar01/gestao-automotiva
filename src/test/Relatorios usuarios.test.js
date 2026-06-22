// src/test/relatorios_usuarios.test.js
'use strict';

jest.mock('../config/db', () => require('./mocks/db'));
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }) }
  }))
}));

const request       = require('supertest');
const jwt           = require('jsonwebtoken');
const app           = require('../app');
const pool          = require('../config/db');
const SECRET        = process.env.JWT_SECRET;
const tokenAdmin    = jwt.sign({ id: 1, tipo: 'admin',      email: 'admin@test.com' }, SECRET, { expiresIn: '1d' });
const tokenSuper    = jwt.sign({ id: 0, tipo: 'superadmin', email: 'super@test.com' }, SECRET, { expiresIn: '1d' });
const tokenCliente  = jwt.sign({ id: 2, tipo: 'cliente',    email: 'cli@test.com', cliente_id: 5 }, SECRET, { expiresIn: '1d' });

function mockQuery(rows = [], rowCount = 1) {
  pool.query.mockResolvedValueOnce({ rows, rowCount });
}

beforeEach(() => jest.clearAllMocks());

describe('GET /relatorios', () => {
  test('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/relatorios');
    expect(res.status).toBe(401);
  });

  test('deve retornar 403 para cliente', async () => {
    const res = await request(app).get('/relatorios').set('Authorization', `Bearer ${tokenCliente}`);
    expect(res.status).toBe(403);
  });

  test('deve retornar relatórios para admin', async () => {
    mockQuery([{ total: '1500.00' }]);                    // receita
    mockQuery([{ qtd: '5' }]);                            // total agendamentos
    mockQuery([                                           // segmentação RFM
      { segmento: 'novo', qtd: '1', ltv_total: '100', ltv_medio: '100' },
      { segmento: 'fiel', qtd: '3', ltv_total: '900', ltv_medio: '300' },
      { segmento: 'inativo', qtd: '1', ltv_total: '500', ltv_medio: '500' },
    ]);
    mockQuery([{ dia: '01/06', total: '300.00' }]);        // evolução
    mockQuery([{ nome: 'Lavagem', total: '3' }]);          // mix serviços
    mockQuery([{ nome: 'João', qtd: '2', total: '600', servicos_realizados: 'Lavagem', funcionario: 'Pedro', veiculos: 'Corolla' }]);
    const res = await request(app).get('/relatorios').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('receitaTotal', 1500);
    expect(res.body).toHaveProperty('ticketMedio', 300);
    expect(res.body).toHaveProperty('fidelizacao', 75); // 3 fiel / (5-1 novo) = 75%
    expect(res.body).toHaveProperty('ltvMedio');
    expect(res.body.segmentos).toMatchObject({ novo: 1, fiel: 3, inativo: 1 });
    expect(Array.isArray(res.body.evolucao)).toBe(true);
    expect(Array.isArray(res.body.servicos)).toBe(true);
    expect(Array.isArray(res.body.clientes)).toBe(true);
  });

  test('deve retornar ticketMedio 0 se não houver agendamentos', async () => {
    mockQuery([{ total: '0' }]);
    mockQuery([{ qtd: '0' }]);
    mockQuery([]);
    mockQuery([]);
    mockQuery([]);
    mockQuery([]);
    const res = await request(app).get('/relatorios').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.ticketMedio).toBe(0);
    expect(res.body.fidelizacao).toBe(0);
  });
});

describe('POST /usuarios', () => {
  test('deve retornar 400 sem email ou senha', async () => {
    const res = await request(app).post('/usuarios').set('Authorization', `Bearer ${tokenSuper}`).send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
  });

  test('deve retornar 400 com tipo inválido', async () => {
    const res = await request(app).post('/usuarios').set('Authorization', `Bearer ${tokenSuper}`)
      .send({ email: 'x@x.com', senha: 'Senha@123', tipo: 'deus' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/inválido/i);
  });

  test('deve retornar 403 se não-superadmin tenta criar admin', async () => {
    const res = await request(app).post('/usuarios').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ email: 'novo@admin.com', senha: 'Senha@123', tipo: 'admin' });
    expect(res.status).toBe(403);
  });

  test('deve retornar 400 com senha curta', async () => {
    const res = await request(app).post('/usuarios').set('Authorization', `Bearer ${tokenSuper}`)
      .send({ email: 'x@x.com', senha: '123', tipo: 'cliente' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/mínimo/i);
  });

  test('deve criar usuário com sucesso', async () => {
    mockQuery([]);
    const res = await request(app).post('/usuarios').set('Authorization', `Bearer ${tokenSuper}`)
      .send({ email: 'novo@admin.com', senha: 'Senha@123', tipo: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.mensagem).toMatch(/sucesso/i);
  });
});

describe('superadminMiddleware', () => {
  test('deve retornar 403 para admin tentando rota superadmin', async () => {
    const res = await request(app).get('/admins').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(403);
  });

  test('deve permitir acesso para superadmin', async () => {
    mockQuery([]);
    const res = await request(app).get('/admins').set('Authorization', `Bearer ${tokenSuper}`);
    expect(res.status).toBe(200);
  });
});