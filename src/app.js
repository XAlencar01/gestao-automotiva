const express        = require('express');
const cors           = require('cors');
const rateLimit      = require('express-rate-limit');
const helmet         = require('helmet');
const swaggerUi      = require('swagger-ui-express');
const swaggerSpec    = require('./config/swagger');
const logger         = require('./utils/logger');
const app            = express();

const clienteRoutes     = require('./routes/clienteRoutes');
const veiculoRoutes     = require('./routes/veiculoRoutes');
const servicoRoutes     = require('./routes/servicoRoutes');
const agendamentoRoutes = require('./routes/agendamentoRoutes');
const authRoutes        = require('./routes/authRoutes');
const usuarioRoutes     = require('./routes/usuarioRoutes');
const relatorioRoutes   = require('./routes/relatorioRoutes');
const clienteAreaRoutes = require('./routes/clienteAreaRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const agendaRoutes      = require('./routes/agendaRoutes');
const adminRoutes       = require('./routes/adminRoutes');

app.use(helmet({ contentSecurityPolicy: false }));
app.set('trust proxy', 1);

const allowedOrigins = (process.env.FRONT_URL || 'http://127.0.0.1:5500')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Origem não permitida pelo CORS'));
  },
  credentials: true,
}));

const isTest = process.env.NODE_ENV === 'test';

const limiterGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente em 15 minutos.' },
  skip: () => isTest,
});
app.use(limiterGlobal);

const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { erro: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.' },
  skip: () => isTest,
});

app.use(express.json({ limit: '10kb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Smart System — API Docs',
  customCss: '.swagger-ui .topbar { background-color: #0f172a; }',
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

app.use('/clientes',     clienteRoutes);
app.use('/veiculos',     veiculoRoutes);
app.use('/servicos',     servicoRoutes);
app.use('/agendamentos', agendamentoRoutes);
app.use('/auth',         limiterAuth, authRoutes);
app.use('/usuarios',     usuarioRoutes);
app.use('/relatorios',   relatorioRoutes);
app.use('/cliente',      clienteAreaRoutes);
app.use('/funcionarios', funcionarioRoutes);
app.use('/agenda',       agendaRoutes);
app.use('/admins',       adminRoutes);

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    logger.error(`[ERRO] ${err.message}`);
  }
  if (err.message === 'Origem não permitida pelo CORS') {
    return res.status(403).json({ erro: 'Origem não permitida.' });
  }
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

module.exports = app;