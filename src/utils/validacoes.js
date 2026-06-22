// src/utils/validacoes.js — schemas Joi centralizados
const Joi = require('joi');

const schemaRegister = Joi.object({
  nome:     Joi.string().min(2).max(100).required().messages({
    'string.min':  'Nome deve ter ao menos 2 caracteres.',
    'any.required': 'Nome é obrigatório.',
  }),
  email:    Joi.string().email().required().messages({
    'string.email': 'E-mail inválido.',
    'any.required': 'E-mail é obrigatório.',
  }),
  senha:    Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min':      'Senha deve ter ao menos 8 caracteres.',
    'string.pattern.base': 'Senha deve conter letras maiúsculas, minúsculas e ao menos um número.',
    'any.required':    'Senha é obrigatória.',
  }),
  telefone: Joi.string().max(20).allow('', null).optional(),
});

const schemaLogin = Joi.object({
  email: Joi.string().email().required().messages({ 'any.required': 'E-mail é obrigatório.' }),
  senha: Joi.string().required().messages({ 'any.required': 'Senha é obrigatória.' }),
});

const schemaEsqueciSenha = Joi.object({
  email: Joi.string().email().required().messages({ 'any.required': 'E-mail é obrigatório.' }),
});

const schemaRedefinirSenha = Joi.object({
  token:    Joi.string().required(),
  novaSenha: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    'string.min':      'Senha deve ter ao menos 8 caracteres.',
    'string.pattern.base': 'Senha deve conter letras maiúsculas, minúsculas e ao menos um número.',
    'any.required':    'Nova senha é obrigatória.',
  }),
});

const schemaAgendamento = Joi.object({
  cliente_id:    Joi.number().integer().positive().required().messages({ 'any.required': 'cliente_id é obrigatório.' }),
  veiculo_id:    Joi.number().integer().positive().required().messages({ 'any.required': 'veiculo_id é obrigatório.' }),
  servico_id:    Joi.number().integer().positive().required().messages({ 'any.required': 'servico_id é obrigatório.' }),
  data:          Joi.string().isoDate().required().messages({
    'string.isoDate': 'Data deve estar no formato ISO (ex: 2025-06-10T10:00:00).',
    'any.required':   'Data é obrigatória.',
  }),
  funcionario_id: Joi.number().integer().positive().allow(null).optional(),
});

const schemaAgendamentoCliente = Joi.object({
  veiculo_id: Joi.number().integer().positive().required(),
  servico_id: Joi.number().integer().positive().required(),
  data:       Joi.string().isoDate().required().messages({ 'string.isoDate': 'Data inválida.' }),
});

const schemaStatusAgendamento = Joi.object({
  status:        Joi.string().valid('pendente', 'aprovado', 'recusado', 'concluido').required().messages({
    'any.only':    'Status deve ser: pendente, aprovado, recusado ou concluido.',
    'any.required': 'Status é obrigatório.',
  }),
  funcionario_id: Joi.number().integer().positive().allow(null).optional(),
});

const schemaServico = Joi.object({
  nome:            Joi.string().min(2).max(100).required(),
  preco:           Joi.number().positive().required(),
  duracao_minutos: Joi.number().integer().min(5).max(480).required(),
  descricao:       Joi.string().max(500).allow('', null).optional(),
});

const schemaFuncionario = Joi.object({
  nome:  Joi.string().min(2).max(100).required().messages({ 'any.required': 'Nome é obrigatório.' }),
});

const schemaFuncionarioUpdate = Joi.object({
  nome:  Joi.string().min(2).max(100).optional(),
  ativo: Joi.boolean().optional(),
}).min(1).messages({ 'object.min': 'Informe ao menos um campo para atualizar.' });

const schemaCliente = Joi.object({
  nome:     Joi.string().min(2).max(100).required(),
  email:    Joi.string().email().required(),
  telefone: Joi.string().max(20).allow('', null).optional(),
});

const schemaVeiculo = Joi.object({
  cliente_id: Joi.number().integer().positive().required(),
  modelo:     Joi.string().min(1).max(100).required(),
  placa:      Joi.string().min(7).max(8).required(),
  marca:      Joi.string().max(50).allow('', null).optional(),
  cor:        Joi.string().max(30).allow('', null).optional(),
  ano:        Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).allow(null).optional(),
});

const schemaAdmin = Joi.object({
  nome:  Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
});

function validar(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const mensagens = error.details.map(d => d.message).join(' | ');
      return res.status(400).json({ erro: mensagens });
    }
    next();
  };
}

module.exports = {
  validar,
  schemaRegister,
  schemaLogin,
  schemaEsqueciSenha,
  schemaRedefinirSenha,
  schemaAgendamento,
  schemaAgendamentoCliente,
  schemaStatusAgendamento,
  schemaServico,
  schemaFuncionario,
  schemaFuncionarioUpdate,
  schemaCliente,
  schemaVeiculo,
  schemaAdmin,
};