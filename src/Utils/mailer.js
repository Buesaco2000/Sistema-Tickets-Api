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

const fmtFecha = (d) =>
  d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const TIPO_LABEL = {
  MEDICAMENTOS: 'Medicamentos', LABORATORIO: 'Laboratorio',
  MEDICO_QUIRURGICO: 'Méd. Quirúrgico', ASEO_PAPELERIA: 'Aseo y Pap.',
  ODONTOLOGIA: 'Odontología',
};

const buildRows = (list, colorFecha) =>
  list.map((i) => `
    <tr>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:13px">${i.nombre}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280">${TIPO_LABEL[i.tipo_recepcion] ?? i.tipo_recepcion}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px">${i.municipio ?? '—'}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px">${i.lote ?? '—'}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;color:${colorFecha}">${fmtFecha(i.fecha_vencimiento)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;text-align:center">${i.stock}</td>
    </tr>`).join('');

const TH = (label) => `<th style="padding:7px 10px;text-align:left;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;background:#f9fafb">${label}</th>`;

const buildTable = (list, colorFecha) => `
  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
    <thead><tr>${['Medicamento/Insumo','Categoría','Municipio','Lote','Vencimiento','Stock'].map(TH).join('')}</tr></thead>
    <tbody>${buildRows(list, colorFecha)}</tbody>
  </table>`;

const sendVencimientoAlert = async (toEmails, items) => {
  const vencidos = items.filter((i) => i.estado === 'VENCIDO');
  const proximos = items.filter((i) => i.estado === 'PROXIMO');
  const fecha    = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;color:#1a2332">
      <div style="background:#1d4ed8;padding:22px 28px;border-radius:8px 8px 0 0">
        <h2 style="color:#fff;margin:0;font-size:20px">⚠️ Alerta de vencimiento de inventario</h2>
        <p style="color:#bfdbfe;margin:6px 0 0;font-size:13px">${fecha}</p>
      </div>
      <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">

        ${vencidos.length > 0 ? `
        <h3 style="color:#dc2626;margin:0 0 12px;font-size:15px">
          🔴 Ítems vencidos con stock activo — ${vencidos.length}
        </h3>
        ${buildTable(vencidos, '#dc2626')}
        <div style="height:28px"></div>` : ''}

        ${proximos.length > 0 ? `
        <h3 style="color:#b45309;margin:0 0 12px;font-size:15px">
          🟡 Próximos a vencer (≤ 30 días) — ${proximos.length}
        </h3>
        ${buildTable(proximos, '#b45309')}` : ''}

        <p style="margin-top:24px;color:#9ca3af;font-size:12px;border-top:1px solid #f3f4f6;padding-top:16px">
          Este correo fue generado automáticamente por el Sistema ESE SurOriente. No responder a este mensaje.
        </p>
      </div>
    </div>`;

  await resend.emails.send({
    from:    FROM,
    to:      toEmails,
    subject: `⚠️ Inventario: ${vencidos.length} vencido${vencidos.length !== 1 ? 's' : ''}, ${proximos.length} por vencer — ${new Date().toLocaleDateString('es-CO')}`,
    html,
  });
};

module.exports = { sendPasswordReset, sendVencimientoAlert };
