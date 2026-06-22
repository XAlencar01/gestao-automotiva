const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart System — Estética Automotiva',
      version: '1.0.0',
      description: 'API REST para gestão de agendamentos, clientes, veículos, serviços e funcionários de uma estética automotiva. Projeto de Trabalho de Conclusão de Curso — Engenharia de Software.',
      contact: { name: 'Smart System' },
    },
    servers: [
      { url: 'https://gestao-agendamentos-estetica-automo.vercel.app', description: 'Produção' },
      { url: 'http://localhost:3000', description: 'Local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Erro: {
          type: 'object',
          properties: { erro: { type: 'string', example: 'Mensagem de erro' } },
        },
        Mensagem: {
          type: 'object',
          properties: { mensagem: { type: 'string', example: 'Operação realizada com sucesso.' } },
        },
        Usuario: {
          type: 'object',
          properties: {
            id:       { type: 'integer', example: 1 },
            nome:     { type: 'string',  example: 'João Silva' },
            email:    { type: 'string',  example: 'joao@email.com' },
            telefone: { type: 'string',  example: '11999990000' },
            tipo:     { type: 'string',  enum: ['cliente', 'admin', 'superadmin'] },
          },
        },
        Cliente: {
          type: 'object',
          properties: {
            id:       { type: 'integer', example: 1 },
            nome:     { type: 'string',  example: 'João Silva' },
            email:    { type: 'string',  example: 'joao@email.com' },
            telefone: { type: 'string',  example: '11999990000' },
            ativo:    { type: 'boolean', example: true },
          },
        },
        Veiculo: {
          type: 'object',
          properties: {
            id:         { type: 'integer', example: 1 },
            cliente_id: { type: 'integer', example: 1 },
            marca:      { type: 'string',  example: 'Toyota' },
            modelo:     { type: 'string',  example: 'Corolla' },
            placa:      { type: 'string',  example: 'ABC1D23' },
            cor:        { type: 'string',  example: 'Branco' },
            ano:        { type: 'integer', example: 2022 },
          },
        },
        Servico: {
          type: 'object',
          properties: {
            id:               { type: 'integer', example: 1 },
            nome:             { type: 'string',  example: 'Lavagem Completa' },
            preco:            { type: 'number',  example: 80.00 },
            descricao:        { type: 'string',  example: 'Lavagem externa e interna detalhada.' },
            duracao_minutos:  { type: 'integer', example: 60 },
          },
        },
        Agendamento: {
          type: 'object',
          properties: {
            id:          { type: 'integer', example: 1 },
            cliente:     { type: 'string',  example: 'João Silva' },
            veiculo:     { type: 'string',  example: 'Corolla' },
            servico:     { type: 'string',  example: 'Lavagem Completa' },
            funcionario: { type: 'string',  example: 'Carlos Lima' },
            data:        { type: 'string',  format: 'date-time', example: '2025-06-10T10:00:00.000Z' },
            status:      { type: 'string',  enum: ['pendente', 'aprovado', 'recusado', 'concluido'] },
          },
        },
        Funcionario: {
          type: 'object',
          properties: {
            id:                 { type: 'integer', example: 1 },
            nome:               { type: 'string',  example: 'Carlos Lima' },
            ativo:              { type: 'boolean', example: true },
            agendamentos_hoje:  { type: 'integer', example: 3 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth',          description: 'Autenticação e gerenciamento de sessão' },
      { name: 'Clientes',      description: 'Cadastro e gerenciamento de clientes' },
      { name: 'Veículos',      description: 'Cadastro e gerenciamento de veículos' },
      { name: 'Serviços',      description: 'Cadastro e gerenciamento de serviços' },
      { name: 'Agendamentos',  description: 'Criação e controle de agendamentos' },
      { name: 'Funcionários',  description: 'Cadastro e disponibilidade de funcionários' },
      { name: 'Agenda',        description: 'Horários de funcionamento e dias fechados' },
      { name: 'Relatórios',    description: 'Dados analíticos e métricas do negócio' },
      { name: 'Área do Cliente', description: 'Endpoints exclusivos para clientes logados' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);