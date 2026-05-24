// =====================================================
// SERVIÇO DE EMAIL
// Usa Nodemailer para enviar emails.
//
// DESENVOLVIMENTO: cria uma conta Ethereal automaticamente.
//   Os emails ficam em um inbox virtual — veja o link no console.
//   Não precisa configurar nada no .env para testar.
//
// PRODUÇÃO: configure as variáveis SMTP_* no .env.
//   Recomendamos Resend (https://resend.com) — 3.000 emails grátis/mês.
// =====================================================

const nodemailer = require('nodemailer');

// O transporter é criado de forma lazy (na primeira chamada)
// para suportar a criação assíncrona da conta Ethereal
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Em desenvolvimento sem SMTP configurado, cria conta Ethereal automática
  const isDev = process.env.NODE_ENV !== 'production';
  const hasSmtp = process.env.SMTP_USER && !process.env.SMTP_USER.includes('seu_');

  if (isDev && !hasSmtp) {
    // Cria uma conta de teste no Ethereal (gratuito, sem cadastro)
    const testAccount = await nodemailer.createTestAccount();
    console.log('📧 Conta Ethereal criada automaticamente para testes:');
    console.log(`   Usuário: ${testAccount.user}`);
    console.log(`   Inbox:   https://ethereal.email/messages`);

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  } else {
    // Usa as configurações reais do .env
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

/**
 * Envia o email de redefinição de senha.
 */
async function sendPasswordResetEmail(to, name, resetLink) {
  const transport = await getTransporter();

  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM || '"Routinia" <noreply@routinia.app>',
    to,
    subject: 'Redefinição de senha — Routinia',
    text: `Olá, ${name}!\n\nClique no link para redefinir sua senha:\n${resetLink}\n\nEste link expira em 15 minutos.`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Routinia</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #1f2937; margin: 0 0 8px;">Redefinição de senha</h2>
      <p style="color: #4b5563;">Olá, <strong>${name}</strong>!</p>
      <p style="color: #4b5563;">Clique no botão abaixo para criar uma nova senha:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Redefinir minha senha
        </a>
      </div>
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">⏱️ Este link expira em <strong>15 minutos</strong>.</p>
      </div>
      <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">
        Ou cole: <a href="${resetLink}" style="color: #6366f1;">${resetLink}</a>
      </p>
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">© ${new Date().getFullYear()} Routinia.</p>
    </div>
  </div>
</body>
</html>`,
  });

  // Mostra o link para ver o email no Ethereal (só em dev)
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`\n📬 Email enviado! Veja aqui: ${previewUrl}\n`);
  }

  return info;
}

module.exports = { sendPasswordResetEmail };
