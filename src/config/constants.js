// Centraliza todas as constantes e magic numbers do sistema

module.exports = {
  // Autenticação
  JWT_EXPIRY:            '1d',
  BCRYPT_ROUNDS:         10,
  TOKEN_BYTES:           32,

  // Tokens de e-mail
  TOKEN_CONFIRMACAO_EXPIRY_MS:  24 * 60 * 60 * 1000, // 24 horas
  TOKEN_RECUPERACAO_EXPIRY_MS:       60 * 60 * 1000, // 1 hora

  // Validação de senha
  SENHA_MIN_LENGTH: 8,
  SENHA_REGEX:      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,

  // Rate limiting
  RATE_LIMIT_WINDOW_MS:      15 * 60 * 1000, // 15 minutos
  RATE_LIMIT_GLOBAL_MAX:     200,
  RATE_LIMIT_AUTH_MAX:       10,

  // Status de agendamento
  STATUS_AGENDAMENTO: ['pendente', 'aprovado', 'recusado', 'concluido'],

  // Tipos de usuário
  TIPOS_USUARIO: ['cliente', 'admin', 'superadmin', 'funcionario'],

  // Paginação padrão
  PAGE_LIMIT_DEFAULT: 20,
  PAGE_LIMIT_MAX:     100,

  // Expiração automática de agendamentos pendentes
  AGENDAMENTO_EXPIRY_HOURS: 48,
};