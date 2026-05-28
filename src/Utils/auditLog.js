const pool = require('../config/database');

/**
 * Registra una acción de negocio en audit_log.
 * Fire-and-forget: no lanza si falla para no interrumpir la operación principal.
 *
 * @param {object} opts
 * @param {number}  opts.empresaId
 * @param {number}  opts.usuarioId
 * @param {string}  opts.tabla              - tabla afectada (ej: 'dispensaciones')
 * @param {number}  opts.registroId         - PK del registro afectado
 * @param {'INSERT'|'UPDATE'|'DELETE'|'LOGIN'|'LOGOUT'|'EXPORT'|'APPROVE'|'REJECT'} opts.accion
 * @param {string}  [opts.modulo]           - módulo de negocio (ej: 'DISPENSACIONES')
 * @param {string}  [opts.descripcion]      - texto libre explicativo
 * @param {object}  [opts.datosAnteriores]  - snapshot antes del cambio
 * @param {object}  [opts.datosNuevos]      - snapshot después del cambio
 * @param {string}  [opts.ip]
 * @param {string}  [opts.userAgent]
 * @param {string}  [opts.requestId]
 */
const logAudit = (opts) => {
  const {
    empresaId,
    usuarioId,
    tabla,
    registroId,
    accion,
    modulo       = null,
    descripcion  = null,
    datosAnteriores = null,
    datosNuevos     = null,
    ip           = null,
    userAgent    = null,
    requestId    = null,
  } = opts;

  pool.query(
    `INSERT INTO audit_log
       (empresa_id, usuario_id, tabla, registro_id, accion, modulo, descripcion,
        datos_anteriores, datos_nuevos, ip, user_agent, request_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      empresaId,
      usuarioId,
      tabla,
      registroId,
      accion,
      modulo,
      descripcion,
      datosAnteriores ? JSON.stringify(datosAnteriores) : null,
      datosNuevos     ? JSON.stringify(datosNuevos)     : null,
      ip,
      userAgent,
      requestId,
    ]
  ).catch(() => {});
};

module.exports = { logAudit };
