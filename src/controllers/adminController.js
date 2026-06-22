// adminController.js
// Gerencia a criação, listagem, ativação/desativação e exclusão de admins.

const pool   = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Resend } = require('resend');
const { normalizarEmail } = require('../utils/normalizar');

const FRONT_URL      = process.env.FRONT_URL     || 'http://127.0.0.1:5500';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM     = process.env.EMAIL_USER    || 'noreply@smartsystemauto.com.br';

const resend = new Resend(RESEND_API_KEY);

// EMAIL DE BOAS-VINDAS AO NOVO ADMIN 

async function enviarEmailAdmin(email, nome, senhaTemporaria) {
  if (!RESEND_API_KEY) return;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Acesso ao Smart System</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <tr><td align="center" style="padding-bottom:24px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:#0f172a;border-radius:16px;padding:14px 24px;">
              <span style="color:#fff;font-size:15px;font-weight:700;">🚗 Smart System</span>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#3b82f6;height:4px;font-size:0;">&nbsp;</td></tr>
            <tr><td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Seu acesso foi criado</p>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;">Olá, ${nome}! Você foi cadastrado como administrador do Smart System.</p>

              <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
                Use as credenciais abaixo para fazer login. Recomendamos trocar a senha no primeiro acesso.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:8px;">
                <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;">E-mail</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#0f172a;font-weight:600;">${email}</p>
                </td></tr>
                <tr><td style="padding:16px 20px;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;">Senha temporária</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#0f172a;font-weight:600;letter-spacing:1px;">${senhaTemporaria}</p>
                </td></tr>
              </table>

              <table cellpadding="0" cellspacing="0" style="margin-top:32px;"><tr>
                <td style="background:#3b82f6;border-radius:10px;">
                  <a href="${FRONT_URL}/login.html"
                    style="display:inline-block;padding:13px 28px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
                    Acessar o painel &rarr;
                  </a>
                </td>
              </tr></table>

            </td></tr>
            <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Se você não esperava este acesso, entre em contato com o administrador principal.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Smart System &mdash; Estética Automotiva</p>
          <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;">&copy; ${new Date().getFullYear()} smartsystemauto.com.br</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from:    `Smart System <${EMAIL_FROM}>`,
      to:      email,
      subject: '🔑 Seu acesso ao Smart System foi criado',
      html,
    });
    if (error) console.error('[RESEND ADMIN ERROR]', error);
    else       console.log('[EMAIL ADMIN]', data?.id);
  } catch (err) {
    console.error('[RESEND ADMIN EXCEPTION]', err.message);
  }
}

//LISTAR ADMINS 

const listarAdmins = async (req, res) => {
  try {
    // Nunca exibe o próprio superadmin na listagem — ele não pode ser gerenciado aqui
    const resultado = await pool.query(`
      SELECT id, nome, email, tipo, ativo, criado_em
      FROM usuarios
      WHERE tipo = 'admin'
      ORDER BY criado_em DESC
    `);
    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error('Erro ao listar admins:', error);
    res.status(500).json({ erro: 'Erro ao listar administradores.' });
  }
};

//CRIAR ADMIN

const criarAdmin = async (req, res) => {
  try {
    let { nome, email } = req.body;
    nome  = nome?.trim();
    email = normalizarEmail(email);

    if (!nome || !email)
      return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios.' });

    // Verifica se já existe
    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0)
      return res.status(400).json({ erro: 'Já existe um usuário com este e-mail.' });

    // Gera senha temporária — o admin vai receber por email e pode trocar depois
    const senhaTemporaria = crypto.randomBytes(5).toString('hex').toUpperCase(); // ex: A3F9C2B1E0
    const senhaHash       = await bcrypt.hash(senhaTemporaria, 10);

    const resultado = await pool.query(`
      INSERT INTO usuarios (nome, email, senha, tipo, ativo, email_confirmado)
      VALUES ($1, $2, $3, 'admin', TRUE, TRUE)
      RETURNING id, nome, email, tipo, ativo, criado_em
    `, [nome, email, senhaHash]);

    // Manda as credenciais por email
    await enviarEmailAdmin(email, nome, senhaTemporaria);

    res.status(201).json({
      mensagem: 'Administrador criado com sucesso. As credenciais foram enviadas por e-mail.',
      admin: resultado.rows[0],
    });
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    res.status(500).json({ erro: 'Erro ao criar administrador.' });
  }
};

// ATIVAR / DESATIVAR ADMIN

const toggleAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    // Proteção: não deixa mexer no superadmin
    const alvo = await pool.query('SELECT tipo, ativo FROM usuarios WHERE id = $1', [id]);
    if (alvo.rows.length === 0)
      return res.status(404).json({ erro: 'Usuário não encontrado.' });

    if (alvo.rows[0].tipo === 'superadmin')
      return res.status(403).json({ erro: 'O superadmin não pode ser alterado.' });

    // não deixa mexer nos clientes
    if (alvo.rows[0].tipo !== 'admin')
      return res.status(400).json({ erro: 'Este usuário não é um administrador.' });

    const novoStatus = !alvo.rows[0].ativo;

    const resultado = await pool.query(`
      UPDATE usuarios SET ativo = $1 WHERE id = $2
      RETURNING id, nome, email, tipo, ativo
    `, [novoStatus, id]);

    const acao = novoStatus ? 'ativado' : 'desativado';
    res.status(200).json({
      mensagem: `Administrador ${acao} com sucesso.`,
      admin: resultado.rows[0],
    });
  } catch (error) {
    console.error('Erro ao alterar status do admin:', error);
    res.status(500).json({ erro: 'Erro ao alterar status do administrador.' });
  }
};

// EXCLUIR ADMIN 

const excluirAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    // Dupla proteção — nunca deixa excluir superadmin, mesmo que alguém tente forçar
    const alvo = await pool.query('SELECT tipo FROM usuarios WHERE id = $1', [id]);
    if (alvo.rows.length === 0)
      return res.status(404).json({ erro: 'Usuário não encontrado.' });

    if (alvo.rows[0].tipo === 'superadmin')
      return res.status(403).json({ erro: 'O superadmin não pode ser excluído pelo painel.' });

    if (alvo.rows[0].tipo !== 'admin')
      return res.status(400).json({ erro: 'Este usuário não é um administrador.' });

    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);

    res.status(200).json({ mensagem: 'Administrador removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir admin:', error);
    res.status(500).json({ erro: 'Erro ao excluir administrador.' });
  }
};

module.exports = { listarAdmins, criarAdmin, toggleAdmin, excluirAdmin };