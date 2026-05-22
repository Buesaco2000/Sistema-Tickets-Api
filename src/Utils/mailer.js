const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Sistema Tickets SurOriente <noreply@esesurorientecauca.gov.co>';

const sendPasswordReset = async (toEmail, resetLink) => {
  await resend.emails.send({
    from: FROM,
    to:   toEmail,
    subject: 'Recuperación de contraseña',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1976d2">Recuperar contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente botón. El enlace expira en <strong>1 hora</strong>.</p>
        <a href="${resetLink}"
           style="display:inline-block;padding:12px 24px;background:#1976d2;color:#fff;
                  text-decoration:none;border-radius:6px;font-weight:bold">
          Restablecer contraseña
        </a>
        <p style="margin-top:20px;color:#666;font-size:13px">
          Si no solicitaste esto, ignora este correo.
        </p>
      </div>
    `,
  });
};

module.exports = { sendPasswordReset };
