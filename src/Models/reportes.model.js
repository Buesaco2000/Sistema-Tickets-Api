const pool = require("../database");

const ReportesModel = {
  // Obtener tickets filtrados por periodo y tipo de soporte
  getTicketsByPeriodo: async ({
    rol_id,
    userId,
    municipioId,
    periodo,
    fecha_inicio,
    fecha_fin,
    tipo_soporte_id,
  }) => {
    let dateFilter = "";
    let tipoFilter = "";
    const params = [rol_id, rol_id, municipioId, rol_id, userId];

    // Definir filtro de fecha segun periodo
    switch (periodo) {
      case "semana":
        dateFilter = "AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        break;
      case "mes":
        dateFilter =
          "AND MONTH(t.created_at) = MONTH(CURDATE()) AND YEAR(t.created_at) = YEAR(CURDATE())";
        break;
      case "anio":
        dateFilter = "AND YEAR(t.created_at) = YEAR(CURDATE())";
        break;
      case "rango":
        if (fecha_inicio && fecha_fin) {
          dateFilter = "AND t.created_at BETWEEN ? AND ?";
          params.push(fecha_inicio, fecha_fin);
        }
        break;
      default:
        // Sin filtro de fecha - todos los tickets
        break;
    }

    // Definir filtro por tipo de soporte
    // tipo_soporte_id: 1 = Otros Soportes, 2 = R-FAST, 3 = Nota de Credito
    if (tipo_soporte_id && tipo_soporte_id !== "todos") {
      tipoFilter = "AND t.tipo_soporte_id = ?";
      params.push(tipo_soporte_id);
    }

    const query = `
      SELECT
        t.id,
        t.created_at AS fecha_creacion,
        t.estado,
        ts.nombre AS tipo_soporte,

        u_salud.nombres AS usuario_nombres,
        u_salud.apellidos AS usuario_apellidos,
        u_salud.email AS usuario_email,
        u_salud.telefono AS usuario_telefono,

        u_ing.nombres AS ingeniero_nombres,
        u_ing.apellidos AS ingeniero_apellidos,
        u_ing.email AS ingeniero_email,

        m.nombre AS municipio,

        COALESCE(sp.descripcion, os.descripcion, nc.motivo) AS descripcion,
        COALESCE(sp.imagen_url, os.imagen, 'N/A') AS imagen,

        nc.fecha_facturacion,
        nc.factura_anular,
        nc.factura_copago_anular,
        nc.valor_copago_anulado,
        nc.factura_refacturar

      FROM tickets t
      JOIN users u_salud ON u_salud.id = t.usuario_salud_id
      LEFT JOIN users u_ing ON u_ing.id = t.ingeniero_id
      JOIN tipos_soporte ts ON ts.id = t.tipo_soporte_id
      JOIN municipios m ON m.id = t.municipio_id
      LEFT JOIN soporte_plataforma sp ON sp.ticket_id = t.id
      LEFT JOIN otros_soportes os ON os.ticket_id = t.id
      LEFT JOIN soporte_notas_credito nc ON nc.ticket_id = t.id

      WHERE
        ((? = 1)
        OR (? = 2 AND t.municipio_id = ?)
        OR (? = 3 AND t.usuario_salud_id = ?))
        ${dateFilter}
        ${tipoFilter}
      ORDER BY t.created_at DESC
    `;

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Obtener resumen mensual del anio actual
  getResumenMensual: async ({ rol_id, userId, municipioId, anio }) => {
    const query = `
      SELECT
        MONTH(t.created_at) AS mes,
        MONTHNAME(t.created_at) AS nombre_mes,
        COUNT(t.id) AS total_tickets,
        SUM(CASE WHEN t.estado = 'abierto' THEN 1 ELSE 0 END) AS abiertos,
        SUM(CASE WHEN t.estado = 'en_proceso' THEN 1 ELSE 0 END) AS en_proceso,
        SUM(CASE WHEN t.estado = 'resuelto' THEN 1 ELSE 0 END) AS resueltos

      FROM tickets t
      WHERE
        YEAR(t.created_at) = ?
        AND (
          (? = 1)
          OR (? = 2 AND t.municipio_id = ?)
          OR (? = 3 AND t.usuario_salud_id = ?)
        )
      GROUP BY MONTH(t.created_at), MONTHNAME(t.created_at)
      ORDER BY mes ASC
    `;

    const [rows] = await pool.query(query, [
      anio,
      rol_id,
      rol_id,
      municipioId,
      rol_id,
      userId,
    ]);
    return rows;
  },

  // Obtener historico de reportes agrupados por mes/anio
  getHistoricoReportes: async ({ rol_id, userId, municipioId }) => {
    const query = `
      SELECT
        YEAR(t.created_at) AS anio,
        MONTH(t.created_at) AS mes,
        MONTHNAME(t.created_at) AS nombre_mes,
        COUNT(t.id) AS total_tickets,
        SUM(CASE WHEN t.estado = 'abierto' THEN 1 ELSE 0 END) AS abiertos,
        SUM(CASE WHEN t.estado = 'en_proceso' THEN 1 ELSE 0 END) AS en_proceso,
        SUM(CASE WHEN t.estado = 'resuelto' THEN 1 ELSE 0 END) AS resueltos,
        SUM(CASE WHEN ts.nombre = 'PLATAFORMA' THEN 1 ELSE 0 END) AS rfast,
        SUM(CASE WHEN ts.nombre = 'NOTA_CREDITO' THEN 1 ELSE 0 END) AS notas_credito,
        SUM(CASE WHEN ts.nombre = 'OTRO' THEN 1 ELSE 0 END) AS otros_soportes

      FROM tickets t
      JOIN tipos_soporte ts ON ts.id = t.tipo_soporte_id
      WHERE
        (? = 1)
        OR (? = 2 AND t.municipio_id = ?)
        OR (? = 3 AND t.usuario_salud_id = ?)
      GROUP BY YEAR(t.created_at), MONTH(t.created_at), MONTHNAME(t.created_at)
      ORDER BY anio DESC, mes DESC
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
};

module.exports = ReportesModel;
