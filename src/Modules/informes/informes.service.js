const pool = require("../../Config/database");
const AppError = require("../../Utils/AppError");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const getResumen = async (empresaId, anio, cargoId = null) => {
    let query = `
        SELECT
            COUNT(CASE WHEN e.nombre = 'VENCIDO' THEN 1 END) AS vencidos,
            COUNT(CASE WHEN e.nombre NOT IN ('PRESENTADO', 'NO_APLICA', 'VENCIDO') AND DATEDIFF(ei.fecha_limite, CURDATE()) <= 15 THEN 1 END) AS criticos,
            COUNT(CASE WHEN e.nombre NOT IN ('PRESENTADO', 'NO_APLICA', 'VENCIDO') AND DATEDIFF(ei.fecha_limite, CURDATE()) BETWEEN 16 AND 30 THEN 1 END) AS proximos,
            COUNT(CASE WHEN e.nombre = 'PRESENTADO' THEN 1 END) AS cumplidos,
            COUNT(CASE WHEN e.nombre != 'NO_APLICA' THEN 1 END) AS total_validos

        FROM ejecucion_informe ei
        JOIN estados e    ON ei.estado_id  = e.id
        JOIN obligacion o ON o.id          = ei.obligacion_id
        WHERE ei.empresa_id = ? AND ei.deleted_at IS NULL AND YEAR(ei.fecha_corte) = ?
    `;
    const params = [empresaId, anio];

    if (cargoId) {
        query  += " AND o.cargo_id = ?";
        params.push(cargoId);
    }

    const [rows] = await pool.query(query, params);
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

    if (filtros.cargoId) {
        conds.push("o.cargo_id = ?");
        params.push(filtros.cargoId);
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

const MESES_LABELS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

async function generarSiguientePeriodo(conn, empresaId, obligacionId, fechaCorteActual, estadoPendienteId, userId) {
    const [rows] = await conn.query(
        `SELECT o.dias_plazo, p.meses_corte
         FROM obligacion o JOIN periodicidad p ON p.id = o.periodicidad_id
         WHERE o.id = ? AND o.empresa_id = ? AND o.deleted_at IS NULL`,
        [obligacionId, empresaId]
    );
    if (!rows.length) return;

    const { dias_plazo, meses_corte } = rows[0];
    const meses = Array.isArray(meses_corte) ? meses_corte : JSON.parse(meses_corte);
    if (!meses.length) return; 

    const actual     = new Date(fechaCorteActual);
    const mesActual  = actual.getMonth() + 1; 
    const anioActual = actual.getFullYear();

    const mesSig  = meses.find(m => m > mesActual);
    const anioSig = mesSig ? anioActual : anioActual + 1;
    const mesNum  = mesSig ?? meses[0];

    const etiqueta      = `${MESES_LABELS[mesNum - 1]} ${anioSig}`;
    const fechaCorte    = new Date(anioSig, mesNum, 0); 
    const fechaCorteStr = fechaCorte.toISOString().split('T')[0];
    const fechaLimite   = new Date(fechaCorte);
    fechaLimite.setDate(fechaLimite.getDate() + dias_plazo);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    try {
        await conn.query(
            `INSERT INTO ejecucion_informe
             (empresa_id, obligacion_id, estado_id,
              etiqueta_corte, fecha_corte, fecha_limite, fecha_limite_orig,
              created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [empresaId, obligacionId, estadoPendienteId,
             etiqueta, fechaCorteStr, fechaLimiteStr, fechaLimiteStr,
             userId ?? null]
        );
    } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') throw err;
    }
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

        if (estado.nombre === "PRESENTADO") {
            const [[ejec]] = await connection.query(
                `SELECT obligacion_id, fecha_corte FROM ejecucion_informe WHERE id = ?`, [id]
            );
            const [[estadoPendiente]] = await connection.query(
                `SELECT id FROM estados WHERE nombre = 'PENDIENTE' AND scope = 'INFORME' LIMIT 1`
            );
            if (ejec && estadoPendiente) {
                await generarSiguientePeriodo(
                    connection, empresaId,
                    ejec.obligacion_id, ejec.fecha_corte,
                    estadoPendiente.id, userId
                );
            }
        }
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
    const [result] = await pool.query(
        `UPDATE evidencia_informe SET deleted_at = NOW(), deleted_by = ? 
        WHERE id = ? AND empresa_id = ? AND deleted_at IS NULL`, [userId, id, empresaId]
    );

    if (result.affectedRows === 0) 
        throw new AppError("Evidencia no encontrada o ya eliminada", 404);
}

const getAniosDisponibles = async (empresaId, cargoId = null) => {
    let query = `
        SELECT DISTINCT YEAR(ei.fecha_corte) AS anio
        FROM ejecucion_informe ei
        JOIN obligacion o ON o.id = ei.obligacion_id
        WHERE ei.empresa_id = ? AND ei.deleted_at IS NULL
    `;
    const params = [empresaId];
    if (cargoId) { query += " AND o.cargo_id = ?"; params.push(cargoId); }
    query += " ORDER BY anio DESC";
    const [rows] = await pool.query(query, params);
    return rows.map(r => r.anio);
};

module.exports = { getResumen, getAniosDisponibles, findAll, findById, cambiarEstado, subirEvidencia, eliminarEvidencia };
