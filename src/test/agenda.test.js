// src/test/agenda.test.js
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
const SECRET     = process.env.JWT_SECRET;
const tokenAdmin = jwt.sign({ id: 1, tipo: 'admin', email: 'admin@test.com' }, SECRET, { expiresIn: '1d' });
const tokenCli   = jwt.sign({ id: 2, tipo: 'cliente', email: 'cli@test.com', cliente_id: 5 }, SECRET, { expiresIn: '1d' });

function mockQuery(rows = [], rowCount = 1) {
  pool.query.mockResolvedValueOnce({ rows, rowCount });
}

beforeEach(() => jest.clearAllMocks());

describe('GET /agenda/status-hoje', () => {
  test('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/agenda/status-hoje');
    expect(res.status).toBe(401);
  });

  test('deve retornar 403 para cliente', async () => {
    const res = await request(app).get('/agenda/status-hoje').set('Authorization', `Bearer ${tokenCli}`);
    expect(res.status).toBe(403);
  });

  test('deve retornar fechado quando há dia fechado', async () => {
    mockQuery([{ motivo: 'Feriado nacional' }]); // dias_fechados
    const res = await request(app).get('/agenda/status-hoje').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.aberto).toBe(false);
    expect(res.body.motivo).toBe('Feriado nacional');
  });

  test('deve retornar fechado quando dia inativo', async () => {
    mockQuery([]);              // sem dia fechado
    mockQuery([{ ativo: false }]); // horario inativo
    const res = await request(app).get('/agenda/status-hoje').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.aberto).toBe(false);
  });

  test('deve retornar aberto com dados do dia', async () => {
    mockQuery([]);  // sem dia fechado
    mockQuery([{ ativo: true, abertura: '08:00', fechamento: '18:00' }]);
    mockQuery([{ count: '3' }]);  // agendamentos hoje
    mockQuery([{ count: '2' }]);  // funcionários ativos
    const res = await request(app).get('/agenda/status-hoje').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.aberto).toBe(true);
    expect(res.body).toHaveProperty('abertura', '08:00');
    expect(res.body.agendamentos_hoje).toBe(3);
    expect(res.body.funcionarios_ativos).toBe(2);
  });
});

describe('GET /agenda/funcionamento', () => {
  test('deve retornar lista de horários', async () => {
    mockQuery([
      { dia_semana: 1, abertura: '08:00', fechamento: '18:00', intervalo_min: 30, ativo: true },
      { dia_semana: 2, abertura: '08:00', fechamento: '18:00', intervalo_min: 30, ativo: true },
    ]);
    const res = await request(app).get('/agenda/funcionamento').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });
});

describe('PUT /agenda/funcionamento/:dia', () => {
  test('deve atualizar horário do dia', async () => {
    mockQuery([{ dia_semana: 1, abertura: '09:00', fechamento: '17:00', intervalo_min: 30, ativo: true }]);
    const res = await request(app).put('/agenda/funcionamento/1').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ abertura: '09:00', fechamento: '17:00', intervalo_min: 30, ativo: true });
    expect(res.status).toBe(200);
    expect(res.body.abertura).toBe('09:00');
  });
});

describe('GET /agenda/dias-fechados', () => {
  test('deve listar dias fechados', async () => {
    mockQuery([{ id: 1, data: '2025-12-25', motivo: 'Natal' }]);
    const res = await request(app).get('/agenda/dias-fechados').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body[0].motivo).toBe('Natal');
  });
});

describe('POST /agenda/dias-fechados', () => {
  test('deve retornar 400 sem data', async () => {
    const res = await request(app).post('/agenda/dias-fechados').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ motivo: 'Feriado' });
    expect(res.status).toBe(400);
  });

  test('deve retornar 409 se data já existe', async () => {
    const err = new Error('duplicate'); err.code = '23505';
    pool.query.mockRejectedValueOnce(err);
    const res = await request(app).post('/agenda/dias-fechados').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ data: '2025-12-25', motivo: 'Natal' });
    expect(res.status).toBe(409);
  });

  test('deve adicionar dia fechado', async () => {
    mockQuery([{ id: 5, data: '2025-12-25', motivo: 'Natal' }]);
    const res = await request(app).post('/agenda/dias-fechados').set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ data: '2025-12-25', motivo: 'Natal' });
    expect(res.status).toBe(201);
    expect(res.body.motivo).toBe('Natal');
  });
});

describe('DELETE /agenda/dias-fechados/:id', () => {
  test('deve remover dia fechado', async () => {
    mockQuery([]);
    const res = await request(app).delete('/agenda/dias-fechados/1').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.mensagem).toMatch(/reaberto/i);
  });
});

describe('GET /agenda/slots', () => {
  test('deve retornar 400 sem parâmetros', async () => {
    const res = await request(app).get('/agenda/slots').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(400);
  });

  test('deve retornar slots indisponíveis em dia fechado', async () => {
    mockQuery([{ id: 1, motivo: 'Feriado' }]); // dia fechado
    const res = await request(app).get('/agenda/slots?data=2025-12-25&servico_id=1').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.aberto).toBe(false);
  });

  test('deve retornar fechado para dia inativo', async () => {
    mockQuery([]);              // sem dia fechado
    mockQuery([{ ativo: false }]); // dia da semana inativo
    const res = await request(app).get('/agenda/slots?data=2025-12-28&servico_id=1').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.aberto).toBe(false);
  });

  test('deve retornar 404 se serviço não existir', async () => {
    mockQuery([]);              // sem dia fechado
    mockQuery([{ ativo: true, abertura: '08:00', fechamento: '18:00', intervalo_min: 30 }]);
    mockQuery([]);              // serviço não encontrado
    const res = await request(app).get('/agenda/slots?data=2025-06-10&servico_id=999').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(404);
  });
});