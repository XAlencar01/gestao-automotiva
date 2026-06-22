const pool   = require('../config/db');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const { normalizarEmail } = require('../utils/normalizar');

const SECRET         = process.env.JWT_SECRET;
if (!SECRET) throw new Error('[SEGURANÇA] JWT_SECRET não definido nas variáveis de ambiente.');
const FRONT_URL      = process.env.FRONT_URL     || 'http://127.0.0.1:5500';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM     = process.env.EMAIL_USER    || 'noreply@smartsystemauto.com.br';

const resend = new Resend(RESEND_API_KEY);

//  TEMPLATE BASE — moderno e minimalista
function emailBase({ titulo, subtitulo, corpo, btnTexto, btnHref, rodape }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- LOGO / HEADER -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0f172a;border-radius:16px;padding:14px 24px;">
                    <span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:0.5px;">
                      🚗 Smart System
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CARD PRINCIPAL -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

              <!-- BARRA TOPO COLORIDA -->
              <tr>
                <td style="background:linear-gradient(135deg,#3b82f6,#2563eb);height:4px;display:block;line-height:4px;font-size:0;">&nbsp;</td>
              </tr>

              <!-- CONTEÚDO -->
              <tr>
                <td style="padding:40px 40px 32px;">

                  <!-- TÍTULO -->
                  <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${titulo}</p>
                  ${subtitulo ? `<p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">${subtitulo}</p>` : '<div style="margin-bottom:28px;"></div>'}

                  <!-- CORPO -->
                  ${corpo}

                  <!-- BOTÃO -->
                  ${btnTexto && btnHref ? `
                  <table cellpadding="0" cellspacing="0" style="margin-top:32px;">
                    <tr>
                      <td style="background:#3b82f6;border-radius:10px;">
                        <a href="${btnHref}"
                           style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                          ${btnTexto} &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                  ` : ''}

                </td>
              </tr>

              <!-- RODAPÉ DO CARD -->
              <tr>
                <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">${rodape || 'Se você não solicitou esta ação, pode ignorar este e-mail com segurança.'}</p>
                </td>
              </tr>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Smart System &mdash; Estética Automotiva
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">
                &copy; ${new Date().getFullYear()} smartsystemauto.com.br
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

//  TEMPLATES ESPECÍFICOS
function emailConfirmacao(nome, link) {
  return emailBase({
    titulo:    `Confirme seu e-mail`,
    subtitulo: `Olá, ${nome}! Seu cadastro foi realizado com sucesso.`,
    corpo: `
      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
        Para ativar sua conta e começar a usar o Smart System, clique no botão abaixo para confirmar seu endereço de e-mail.
      </p>
      <p style="margin:0;font-size:13px;color:#94a3b8;">
        ⏱ Este link expira em <strong style="color:#475569;">24 horas</strong>.
      </p>
    `,
    btnTexto: 'Confirmar e-mail',
    btnHref:  link,
    rodape:   'Se você não criou uma conta no Smart System, ignore este e-mail.'
  });
}

function emailReenvioConfirmacao(nome, link) {
  return emailBase({
    titulo:    `Novo link de confirmação`,
    subtitulo: `Olá, ${nome}! Você solicitou um novo link.`,
    corpo: `
      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
        Clique no botão abaixo para confirmar seu endereço de e-mail e ativar sua conta.
      </p>
      <p style="margin:0;font-size:13px;color:#94a3b8;">
        ⏱ Este link expira em <strong style="color:#475569;">24 horas</strong>.
      </p>
    `,
    btnTexto: 'Confirmar e-mail',
    btnHref:  link,
    rodape:   'Se você não solicitou este link, ignore este e-mail.'
  });
}

function emailRecuperacaoSenha(nome, link) {
  return emailBase({
    titulo:    `Redefinir sua senha`,
    subtitulo: `Olá, ${nome}! Recebemos uma solicitação de redefinição de senha.`,
    corpo: `
      <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
        Clique no botão abaixo para criar uma nova senha para sua conta.
      </p>
      <p style="margin:0;font-size:13px;color:#94a3b8;">
        ⏱ Este link expira em <strong style="color:#475569;">1 hora</strong>.
      </p>
    `,
    btnTexto: 'Redefinir senha',
    btnHref:  link,
    rodape:   'Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.'
  });
}

//  ENVIAR EMAIL
async function enviarEmail(para, assunto, html) {
  if (!RESEND_API_KEY) {
    console.warn('[EMAIL] Sem RESEND_API_KEY — email não enviado');
    return;
  }
  try {
    const { data, error } = await resend.emails.send({
      from:    `Smart System <${EMAIL_FROM}>`,
      to:      para,
      subject: assunto,
      html,
    });
    if (error) console.error('[RESEND ERROR]', error);
    else       console.log('[EMAIL ENVIADO]', data?.id);
  } catch (err) {
    console.error('[RESEND EXCEPTION]', err.message);
  }
}

//  REGISTER
const register = async (req, res) => {
  try {
    let { nome, email, senha, telefone, tipo } = req.body;
    nome     = nome?.trim();
    email    = normalizarEmail(email);
    telefone = telefone?.trim() || null;

    if (!nome || !email || !senha)
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });

    if (senha.length < 8)
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 8 caracteres.' });

    const senhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(senha);
    if (!senhaForte)
      return res.status(400).json({ erro: 'A senha deve conter letras maiúsculas, minúsculas e pelo menos um número.' });

    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0)
      return res.status(400).json({ erro: 'Email já cadastrado.' });

    const senhaHash   = await bcrypt.hash(senha, 10);
    const token       = crypto.randomBytes(32).toString('hex');
    const expiracao   = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const tipoUsuario = 'cliente'; // tipo ignorado do body — auto-cadastro é sempre cliente

    const novoUsuario = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, telefone, tipo, email_confirmado, token_confirmacao, token_expira_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [nome, email, senhaHash, telefone, tipoUsuario, false, token, expiracao]
    );

    if (tipoUsuario === 'cliente') {
      await pool.query(
        `INSERT INTO clientes (nome, email, telefone, usuario_id) VALUES ($1,$2,$3,$4)`,
        [nome, email, telefone, novoUsuario.rows[0].id]
      );
    }

    const link = `${FRONT_URL}/confirmar-email.html?token=${token}`;
    enviarEmail(email, 'Confirme seu e-mail — Smart System', emailConfirmacao(nome, link));

    return res.status(201).json({ mensagem: 'Cadastro realizado! Verifique seu e-mail para ativar a conta.' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

//  LOGIN
const login = async (req, res) => {
  try {
    let { email, senha } = req.body;
    email = normalizarEmail(email);

    if (!email || !senha)
      return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });

    const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (resultado.rows.length === 0)
      return res.status(401).json({ erro: 'Usuário não encontrado.' });

    const usuario = resultado.rows[0];

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida)
      return res.status(401).json({ erro: 'Senha inválida.' });

    if (!usuario.email_confirmado)
      return res.status(401).json({ erro: 'Confirme seu email antes de fazer login.', reenviar: true });

    const clienteResult = await pool.query('SELECT id FROM clientes WHERE usuario_id = $1', [usuario.id]);
    const cliente_id    = clienteResult.rows[0]?.id || null;

    const token = jwt.sign(
      { id: usuario.id, tipo: usuario.tipo, email: usuario.email, cliente_id },
      SECRET, { expiresIn: '1d' }
    );

    return res.status(200).json({ mensagem: 'Login realizado com sucesso.', token });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

//  CONFIRMAR EMAIL
const confirmarEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ erro: 'Token não informado.' });

    const resultado = await pool.query(
      `SELECT id, token_expira_em, email_confirmado FROM usuarios WHERE token_confirmacao = $1`, [token]
    );
    if (resultado.rows.length === 0) return res.status(400).json({ erro: 'Token inválido.' });

    const usuario = resultado.rows[0];
    if (usuario.email_confirmado) return res.status(200).json({ mensagem: 'Email já confirmado. Faça login!' });
    if (!usuario.token_expira_em || new Date(usuario.token_expira_em) < new Date())
      return res.status(400).json({ erro: 'Token expirado. Solicite um novo link.' });

    await pool.query(
      `UPDATE usuarios SET email_confirmado = true, token_confirmacao = NULL, token_expira_em = NULL WHERE id = $1`,
      [usuario.id]
    );

    return res.status(200).json({ mensagem: 'E-mail confirmado com sucesso! Você já pode fazer login.' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

//  REENVIAR EMAIL
const reenviarEmail = async (req, res) => {
  try {
    let { email } = req.body;
    email = normalizarEmail(email);
    if (!email) return res.status(400).json({ erro: 'Email é obrigatório.' });

    const resultado = await pool.query('SELECT id, nome, email_confirmado FROM usuarios WHERE email = $1', [email]);
    if (resultado.rows.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    const usuario = resultado.rows[0];
    if (usuario.email_confirmado) return res.status(400).json({ erro: 'Email já confirmado.' });

    const novoToken     = crypto.randomBytes(32).toString('hex');
    const novaExpiracao = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await pool.query(
      `UPDATE usuarios SET token_confirmacao = $1, token_expira_em = $2 WHERE id = $3`,
      [novoToken, novaExpiracao, usuario.id]
    );

    const link = `${FRONT_URL}/confirmar-email.html?token=${novoToken}`;
    enviarEmail(email, 'Novo link de confirmação — Smart System', emailReenvioConfirmacao(usuario.nome, link));

    return res.status(200).json({ mensagem: 'E-mail reenviado com sucesso! Verifique sua caixa de entrada.' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

//  ESQUECI MINHA SENHA
const esquecerSenha = async (req, res) => {
  try {
    let { email } = req.body;
    email = normalizarEmail(email);
    if (!email) return res.status(400).json({ erro: 'Email é obrigatório.' });

    const resultado = await pool.query('SELECT id, nome FROM usuarios WHERE email = $1', [email]);
    if (resultado.rows.length === 0)
      return res.status(200).json({ mensagem: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.' });

    const usuario   = resultado.rows[0];
    const token     = crypto.randomBytes(32).toString('hex');
    const expiracao = new Date(Date.now() + 1000 * 60 * 60);

    await pool.query(
      `UPDATE usuarios SET token_recuperacao = $1, token_recuperacao_expira = $2 WHERE id = $3`,
      [token, expiracao, usuario.id]
    );

    const link = `${FRONT_URL}/redefinir-senha.html?token=${token}`;
    enviarEmail(email, 'Redefinição de senha — Smart System', emailRecuperacaoSenha(usuario.nome, link));

    return res.status(200).json({ mensagem: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

//  REDEFINIR SENHA
const redefinirSenha = async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) return res.status(400).json({ erro: 'Token e nova senha são obrigatórios.' });
    if (novaSenha.length < 8) return res.status(400).json({ erro: 'A senha deve ter no mínimo 8 caracteres.' });

    const senhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(novaSenha);
    if (!senhaForte)
      return res.status(400).json({ erro: 'A senha deve conter letras maiúsculas, minúsculas e pelo menos um número.' });

    const resultado = await pool.query(
      `SELECT id, token_recuperacao_expira FROM usuarios WHERE token_recuperacao = $1`, [token]
    );
    if (resultado.rows.length === 0) return res.status(400).json({ erro: 'Token inválido ou já utilizado.' });

    const usuario = resultado.rows[0];
    if (!usuario.token_recuperacao_expira || new Date(usuario.token_recuperacao_expira) < new Date())
      return res.status(400).json({ erro: 'Token expirado. Solicite um novo link.' });

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await pool.query(
      `UPDATE usuarios SET senha = $1, token_recuperacao = NULL, token_recuperacao_expira = NULL WHERE id = $2`,
      [senhaHash, usuario.id]
    );

    return res.status(200).json({ mensagem: 'Senha redefinida com sucesso! Faça login com a nova senha.' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
};

//  VALIDAR TOKEN DE RECUPERAÇÃO
const validarTokenRecuperacao = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ valido: false, erro: 'Token não informado.' });

    const resultado = await pool.query(
      `SELECT id, token_recuperacao_expira FROM usuarios WHERE token_recuperacao = $1`, [token]
    );
    if (resultado.rows.length === 0) return res.status(400).json({ valido: false, erro: 'Token inválido.' });

    const usuario = resultado.rows[0];
    if (!usuario.token_recuperacao_expira || new Date(usuario.token_recuperacao_expira) < new Date())
      return res.status(400).json({ valido: false, erro: 'Token expirado.' });

    return res.status(200).json({ valido: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ valido: false, erro: 'Erro interno no servidor.' });
  }
};

module.exports = { register, login, confirmarEmail, reenviarEmail, esquecerSenha, redefinirSenha, validarTokenRecuperacao };