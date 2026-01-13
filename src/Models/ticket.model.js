const pool = require("../database");
const ROLES = require("../Utils/roles");

const FLUJO_ESTADOS = {
  abierto: ["en_proceso"], // Abierto -> En proceso
  en_proceso: ["resuelto"], // En proceso -> Resuelto
  resuelto: [],
};

const Ticket = {
  create: async ({
    usuario_salud_id,
    ingeniero_id,
    municipio_id,
    tipo_soporte_id,
  }) => {
    const [result] = await pool.query(
      `INSERT INTO tickets (usuario_salud_id, ingeniero_id, municipio_id, tipo_soporte_id) 
       VALUES (?, ?, ?, ?)`,
      [usuario_salud_id, ingeniero_id, municipio_id, tipo_soporte_id]
    );
    return result.insertId;
  },

  findByRol: async ({ rol_id, userId, municipioId }) => {
    const query = `
      SELECT
        t.id,
        u.nombres,
        u.apellidos,
        u.email,
        u.telefono,
        ts.nombre AS tipo,
        t.estado,
        COALESCE(sp.descripcion, os.descripcion) AS tipo_error,
        COALESCE(sp.imagen_url, os.imagen) AS imagen_url

      FROM tickets t
      JOIN users u ON u.id = t.usuario_salud_id
      JOIN tipos_soporte ts ON ts.id = t.tipo_soporte_id
      LEFT JOIN soporte_plataforma sp ON sp.ticket_id = t.id
      LEFT JOIN otros_soportes os ON os.ticket_id = t.id
      WHERE
        (? = 1)
        OR (? = 2 AND t.municipio_id = ?)
        OR (? = 3 AND t.usuario_salud_id = ?)
      ORDER BY t.created_at DESC
    `;

    const [rows] = await pool.query(query, [
      rol_id,
      rol_id,
      municipioId,
      rol_id,
      userId,
    ]);

    return rows;
  },

  findEstadosByRol: async ({ rol_id, userId, municipioId }) => {
    const query = `
      SELECT
        t.id,
        u.nombres,
        u.apellidos,
        u.email,
        ts.nombre AS tipo,
        t.estado,
        COALESCE(sp.imagen_url, os.imagen) AS image
      FROM tickets t
      JOIN users u ON u.id = t.usuario_salud_id
      JOIN tipos_soporte ts ON ts.id = t.tipo_soporte_id
      LEFT JOIN soporte_plataforma sp ON sp.ticket_id = t.id
      LEFT JOIN otros_soportes os ON os.ticket_id = t.id
      WHERE
        t.estado IN ('abierto', 'en_proceso', 'resuelto')
        AND (
          (? = 1) 
          OR
          ( ? = 2 AND t.municipio_id = ? )
          OR
          ( ? = 3 AND t.usuario_salud_id = ? )
        )
      ORDER BY t.created_at DESC
    `;

    const [rows] = await pool.query(query, [
      rol_id,
      rol_id,
      municipioId,
      rol_id,
      userId,
    ]);

    return rows;
  },

  findTicketsByRol: async ({ rol_id, userId, municipioId }) => {
    const query = `
      SELECT
        ts.nombre AS tipo_soporte,
        COUNT(t.id) AS total_soportes

      FROM tickets t

      JOIN tipos_soporte ts ON ts.id = t.tipo_soporte_id

      WHERE
        (? = 1) 
        OR 
        ( ? = 2 AND t.municipio_id = ? )
          OR
        ( ? = 3 AND t.usuario_salud_id = ? )

      GROUP BY ts.nombre WITH ROLLUP
      ORDER BY tipo_soporte IS NULL, total_soportes  DESC
    `;

    const [rows] = await pool.query(query, [
      rol_id,
      rol_id,
      municipioId,
      rol_id,
      userId,
    ]);

    return rows;
  },

  findByEstado: async ({ rol_id, userId, municipioId }) => {
    const [rows] = await pool.query(
      `SELECT t.estado, COUNT(*) AS total
      FROM tickets t
      WHERE t.estado IN ('abierto', 'en_proceso', 'resuelto')
        AND (
          (? = 1) 
          OR ? = 2 AND t.municipio_id = ?
          OR ? = 3 AND t.usuario_salud_id = ?
        )
      GROUP BY t.estado
    `,
      [rol_id, rol_id, municipioId, rol_id, userId]
    );

    const [totalGeneral] = await pool.query(
      `
      SELECT COUNT(*) AS total_general
      FROM tickets t
      WHERE t.estado IN ('abierto', 'resuelto')
        AND (
          (? = 1) 
          OR
          ? = 2 AND t.municipio_id = ?
          OR ? = 3 AND t.usuario_salud_id = ?
        )
    `,
      [rol_id, rol_id, municipioId, rol_id, userId]
    );

    return { estados: rows, total_general: totalGeneral[0].total_general };
  },

  findByCambiarEstado: async (ticketId, nuevoEstado, user) => {
    const [rows] = await pool.query(
      `SELECT estado, ingeniero_id 
     FROM tickets 
     WHERE id = ?`,
      [ticketId]
    );

    if (rows.length === 0) {
      throw new Error("Ticket no encontrado");
    }

    const ticket = rows[0];

    // Cliente nunca puede cambiar estado
    if (user.rol_id === ROLES.SALUD) {
      throw new Error("No autorizado");
    }

    // Ingeniero solo sus tickets
    if (user.rol_id === ROLES.INGENIERO && ticket.ingeniero_id !== user.id) {
      throw new Error("No autorizado");
    }

    // Validar transición
    if (!FLUJO_ESTADOS[ticket.estado].includes(nuevoEstado)) {
      throw new Error("Transición de estado inválida");
    }

    await pool.query(`UPDATE tickets SET estado = ? WHERE id = ?`, [
      nuevoEstado,
      ticketId,
    ]);
  },
};

module.exports = Ticket;
