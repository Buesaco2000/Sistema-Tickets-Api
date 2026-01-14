const nodemailer = require("nodemailer");

// Configurar el transportador de correo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.office365.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verificar conexion al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error("Error al configurar el correo:", error.message);
  } else {
    console.log("Servidor de correo listo para enviar mensajes");
  }
});

/**
 * Enviar notificacion de nuevo ticket (R-FAST / Otros Soportes)
 */
const enviarNotificacionTicket = async (ticketData) => {
  const destinatario = process.env.EMAIL_DESTINATARIO;

  if (!destinatario) {
    console.error("EMAIL_DESTINATARIO no esta configurado en .env");
    return false;
  }

  const {
    ticket_id,
    descripcion,
    usuario_nombre,
    usuario_email,
    ingeniero_nombre,
    ingeniero_email,
    municipio,
    tipo_soporte,
    imagen_url,
  } = ticketData;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #1976d2; }
        .value { margin-top: 5px; padding: 10px; background-color: white; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .ingeniero { background-color: #e3f2fd; border-left: 4px solid #1976d2; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nuevo Ticket #${ticket_id}</h1>
          <p>Sistema de Tickets SurOriente</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Tipo de Soporte:</div>
            <div class="value">${tipo_soporte || "R-FAST"}</div>
          </div>

          <div class="field">
            <div class="label">Reportado por:</div>
            <div class="value">${usuario_nombre}<br><small>${usuario_email}</small></div>
          </div>

          <div class="field">
            <div class="label">Ingeniero Asignado:</div>
            <div class="value ingeniero">${ingeniero_nombre || "No asignado"}<br><small>${ingeniero_email || ""}</small></div>
          </div>

          <div class="field">
            <div class="label">Municipio:</div>
            <div class="value">${municipio}</div>
          </div>

          <div class="field">
            <div class="label">Descripcion:</div>
            <div class="value">${descripcion || "Sin descripcion"}</div>
          </div>

          ${
            imagen_url && imagen_url !== "no_url"
              ? `
          <div class="field">
            <div class="label">Imagen Adjunta:</div>
            <div class="value">
              <a href="${imagen_url}" target="_blank">Ver imagen adjunta</a>
            </div>
          </div>
          `
              : ""
          }
        </div>
        <div class="footer">
          <p>Este es un correo automatico del Sistema de Tickets SurOriente.</p>
          <p>Por favor, no responda a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Sistema de Tickets" <${process.env.EMAIL_USER}>`,
    replyTo: usuario_email,
    to: destinatario,
    subject: `Nuevo Ticket #${ticket_id} - ${tipo_soporte || "R-FAST"} - ${municipio}`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error al enviar correo:", error.message);
    return false;
  }
};

/**
 * Enviar notificacion de Nota de Credito
 */
const enviarNotificacionNotaCredito = async (ticketData) => {
  const destinatario = process.env.EMAIL_DESTINATARIO;

  if (!destinatario) {
    console.error("EMAIL_DESTINATARIO no esta configurado en .env");
    return false;
  }

  const {
    ticket_id,
    usuario_nombre,
    usuario_email,
    ingeniero_nombre,
    ingeniero_email,
    municipio,
    fecha_facturacion,
    factura_anular,
    factura_copago_anular,
    valor_copago_anulado,
    factura_refacturar,
    centro_atencion,
    motivo,
  } = ticketData;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #ff9800; }
        .value { margin-top: 5px; padding: 10px; background-color: white; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .highlight { background-color: #fff3e0; border-left: 4px solid #ff9800; }
        .ingeniero { background-color: #fff3e0; border-left: 4px solid #ff9800; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nota de Credito #${ticket_id}</h1>
          <p>Sistema de Tickets SurOriente</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Tipo de Soporte:</div>
            <div class="value">Nota de Credito</div>
          </div>

          <div class="field">
            <div class="label">Facturado por:</div>
            <div class="value">${usuario_nombre}<br><small>${usuario_email}</small></div>
          </div>

          <div class="field">
            <div class="label">Ingeniero Asignado:</div>
            <div class="value ingeniero">${ingeniero_nombre || "No asignado"}<br><small>${ingeniero_email || ""}</small></div>
          </div>

          <div class="field">
            <div class="label">Centro de Atencion:</div>
            <div class="value">${centro_atencion || municipio}</div>
          </div>

          <div class="field">
            <div class="label">Fecha de Facturacion:</div>
            <div class="value">${fecha_facturacion || "No especificada"}</div>
          </div>

          <div class="field">
            <div class="label">Factura a Anular:</div>
            <div class="value highlight">${factura_anular || "No especificada"}</div>
          </div>

          <div class="field">
            <div class="label">Factura Copago a Anular:</div>
            <div class="value">${factura_copago_anular || "No especificada"}</div>
          </div>

          <div class="field">
            <div class="label">Valor Copago Anulado:</div>
            <div class="value highlight">$ ${valor_copago_anulado || "0"}</div>
          </div>

          <div class="field">
            <div class="label">Factura a Refacturar:</div>
            <div class="value">${factura_refacturar || "No especificada"}</div>
          </div>

          <div class="field">
            <div class="label">Motivo:</div>
            <div class="value highlight">${motivo || "Sin motivo especificado"}</div>
          </div>
        </div>
        <div class="footer">
          <p>Este es un correo automatico del Sistema de Tickets SurOriente.</p>
          <p>Por favor, no responda a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Sistema de Tickets" <${process.env.EMAIL_USER}>`,
    replyTo: usuario_email,
    to: destinatario,
    subject: `Nota de Credito #${ticket_id} - ${centro_atencion || municipio} - ${factura_anular}`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo Nota de Credito enviado:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error al enviar correo:", error.message);
    return false;
  }
};

module.exports = {
  enviarNotificacionTicket,
  enviarNotificacionNotaCredito,
};
