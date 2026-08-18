const pool = require("../../Config/database");
const AppError = require("../../Utils/AppError"); // ajusta la ruta según tu proyecto
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const getResumen = async (empresaId, anio) => {
    const query = `
        SELECT 
            COUNT(CASE WHEN e.nombre = 'VENCIDO' THEN 1 END) AS vencidos,
            COUNT(CASE WHEN e.nombre NOT IN ('PRESENTADO', 'NO_APLICA', 'VENCIDO') AND DATEDIFF(ei.fecha_limite, CURDATE()) <= 15 THEN 1 END) AS criticos,
            COUNT(CASE WHEN e.nombre NOT IN ('PRESENTADO', 'NO_APLICA', 'VENCIDO') AND DATEDIFF(ei.fecha_limite, CURDATE()) BETWEEN 16 AND 30 THEN 1 END) AS proximos,
            COUNT(CASE WHEN e.nombre = 'PRESENTADO' THEN 1 END) AS cumplidos,
            COUNT(CASE WHEN e.nombre != 'NO_APLICA' THEN 1 END) AS total_validos

        FROM ejecucion_informe ei JOIN estados e ON ei.estado_id = e.id
        WHERE ei.empresa_id = ? AND ei.deleted_at IS NULL AND YEAR(ei.fecha_corte) = ?
    `;
    
    const [rows] = await pool.query(query, [empresaId, anio]);
    const { vencidos, criticos, proximos, cumplidos, total_validos } = rows[0];
    const pct_oportunidad = total_validos > 0
    ? Math.round((cumplidos / total_validos) * 100)
    : 0;

    return { vencidos, criticos, proximos, cumplidos, pct_oportunidad };
};

const findAll = async (empresaId, filtros) => {
    let query = `
    SELECT 
        ei.id, ei.etiqueta_corte, ei.fecha_corte, ei.fecha_limite, ei.fecha_presentado, ei.numero_radicado,
        DATEDIFF(ei.fecha_limite, CURDATE()) AS dias_restantes, o.codigo, o.nombre  AS  informe,
        er.nombre AS ente_rector, e.nombre AS estado, 
        CONCAT(u.nombres, ' ', u.apellidos) AS responsable
    FROM ejecucion_informe ei JOIN obligacion o ON o.id = ei.obligacion_id 
    JOIN ente_rector er ON er.id = o.ente_rector_id
    JOIN estados e ON e.id = ei.estado_id
    LEFT JOIN users u ON u.id = o.responsable_id
    WHERE ei.empresa_id = ? AND ei.deleted_at IS NULL AND YEAR(ei.fecha_corte) = ?
    `;
    
    const conds  = [];
    const params = [empresaId, filtros.anio];

    if (filtros.estado) { 
        conds.push("e.nombre = ?"); 
        params.push(filtros.estado);
    }

    if (filtros.texto) {
        const like = `%${filtros.texto}%`;
        conds.push("(o.codigo LIKE ? OR o.nombre LIKE ? OR er.nombre LIKE ?)");
        params.push(like, like, like);
    }
    
    if (filtros.soloMios) {
        conds.push("o.responsable_id = ?");
        params.push(filtros.userId);
    }

    if (conds.length) query += " AND " + conds.join(" AND ");
    query += " ORDER BY ei.fecha_limite ASC";

    const [rows] = await pool.query(query, params);
    return rows;

}

const findById = async (empresaId, id) => {
    const [detalleRows] = await pool.query(`
        SELECT
        ei.id, ei.etiqueta_corte, ei.fecha_corte, ei.fecha_limite, ei.fecha_limite_orig, 
        ei.fecha_presentado, ei.numero_radicado, ei.observaciones, ei.ticket_id,
        DATEDIFF(ei.fecha_limite, CURDATE()) AS dias_restantes, o.codigo, 
        o.nombre AS informe, o.soporte_normativo, o.area_elabora, o.area_presenta, 
        o.dias_plazo, er.nombre AS ente_rector, r.nombre  AS receptor, e.nombre  AS estado,
        CONCAT(u.nombres,  ' ', u.apellidos) AS responsable,
        CONCAT(s.nombres,  ' ', s.apellidos) AS suplente
        FROM ejecucion_informe ei
            JOIN obligacion  o  ON o.id  = ei.obligacion_id
            JOIN ente_rector er ON er.id = o.ente_rector_id
            JOIN receptor    r  ON r.id  = o.receptor_id
            JOIN estados     e  ON e.id  = ei.estado_id
            LEFT JOIN users  u  ON u.id  = o.responsable_id
            LEFT JOIN users  s  ON s.id  = o.suplente_id
        WHERE ei.id = ? AND ei.empresa_id = ? AND ei.deleted_at IS NULL
    `, [id, empresaId]);

    if (!detalleRows.length) throw new AppError("Informe no encontrado", 404);

    const[[evidencias], [historial]] = await Promise.all([
        pool.query(`
            SELECT
            ev.id, ev.nombre_original, ev.nombre_archivo, ev.ruta_relativa, ev.mime, 
            ev.tamano_bytes, ev.created_at, te.nombre AS tipo_evidencia, 
            CONCAT(u.nombres, ' ', u.apellidos) AS subido_por
            FROM evidencia_informe ev
                JOIN tipo_evidencia te ON te.id = ev.tipo_evidencia_id
                LEFT JOIN users u      ON u.id  = ev.subido_por
            WHERE ev.ejecucion_id = ? AND ev.deleted_at IS NULL
            ORDER BY ev.created_at DESC`, [id]), 
        
            pool.query(`
            SELECT
                log.created_at,
                ea.nombre AS estado_anterior, en.nombre AS estado_nuevo,
                CONCAT(u.nombres, ' ', u.apellidos) AS cambiado_por, log.observacion
                FROM ejecucion_informe_log log
                    JOIN estados ea       ON ea.id = log.estado_ant_id
                    JOIN estados en       ON en.id = log.estado_nuevo_id
                    LEFT JOIN users u     ON u.id  = log.cambiado_por
                WHERE log.ejecucion_id = ?
                ORDER BY log.created_at DESC`, [id])
    ]);

    return {
        ...detalleRows[0],
        evidencias,
        historial
    };
}

const cambiarEstado = async (empresaId, id, estadoId, userId, observacion) => {
    const connection = await pool.getConnection();
    try {
        await connection.query("SET @current_user_id = ?", [userId]);

        const [[estado]] = await connection.query("SELECT nombre FROM estados WHERE id = ?", [estadoId]);

        let sql = `UPDATE ejecucion_informe SET estado_id = ?, observaciones = ?, updated_by = ?`;
        const params = [estadoId, observacion, userId];

        if (estado.nombre === "PRESENTADO") {
            sql += `, fecha_presentado = NOW(), presentado_por = ?`;
            params.push(userId);
        }

        sql += ` WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`;
        params.push(id, empresaId);

        const [result] = await connection.query(sql, params);

        if (result.affectedRows === 0) 
            throw new AppError("Informe no encontrado o ya eliminado", 404);
    } finally {
        connection.release();
    }
}

const subirEvidencia = async (empresaId, ejecucionId, tipoEvidenciaId, file, userId) => {
    const [[ejecucionRows]] = await pool.query(
        "SELECT id FROM ejecucion_informe WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL", [ejecucionId, empresaId]);
    
    if (!ejecucionRows) throw new AppError("Informe no encontrado", 404);

    const buffer = fs.readFileSync(file.path);
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    const rutaRelativa = path.relative(
        path.join(process.cwd(), "public"), file.path
    ).replace(/\\/g, "/");

    try {
        await pool.query(
            `INSERT INTO evidencia_informe 
                (empresa_id, ejecucion_id, tipo_evidencia_id, nombre_original,
                nombre_archivo, ruta_relativa, mime, tamano_bytes, hash_sha256, subido_por)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [empresaId, ejecucionId, tipoEvidenciaId, file.originalname,
            file.filename, rutaRelativa, file.mimetype, file.size, hash, userId]
        );
    } catch (err) {
        fs.unlinkSync(file.path);
        throw new AppError("Error al subir evidencia: " + err.message, 500);
    }
    
}

const eliminarEvidencia = async (empresaId, id, userId) => {
    const [[result]] = await pool.query(
        `UPDATE evidencia_informe SET deleted_at = NOW(), deleted_by = ? 
        WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`, [userId, id, empresaId]
    );

    if (result.affectedRows === 0) 
        throw new AppError("Evidencia no encontrada o ya eliminada", 404);
}

module.exports = { getResumen, findAll, findById, cambiarEstado, subirEvidencia, eliminarEvidencia };
