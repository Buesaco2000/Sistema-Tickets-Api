const pool = require("../database");

const Usuarios = {
  // Este método inserta un nuevo Usuario en la tabla Usuarios.
  create: async (data) => {
    const {
      nombres,
      apellidos,
      email,
      telefono,
      rol_id,
      cargo_id,
      municipio_id,
      password,
    } = data;
    const query = `
            INSERT INTO users (nombres, apellidos, email, telefono, rol_id, cargo_id, municipio_id, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const values = [
      nombres,
      apellidos,
      email,
      telefono,
      rol_id,
      cargo_id,
      municipio_id,
      password,
    ];
    const result = await pool.query(query, values);
    const [user] = await pool.query(`SELECT * FROM users WHERE id = ?`, [
      result.insertId,
    ]);

    return user[0];
  },

  // Este método recupera todos los Usuarios de la tabla Usuarios.
  findAll: async () => {
    const query = `
    SELECT 
      u.id,
      u.nombres,
      u.apellidos,
      u.email,
      u.telefono,
      u.activo,
      r.nombre AS rol,
      c.nombre AS cargo,
      m.nombre AS municipio
    FROM users u
    JOIN roles r ON r.id = u.rol_id
    JOIN cargos c ON c.id = u.cargo_id
    JOIN municipios m ON m.id = u.municipio_id
    ORDER BY u.id DESC
  `;
    const result = await pool.query(query);
    return result[0];
  },

  // Este método recupera un Usuario específico por su ID.
  findById: async (id) => {
    const query = `
      SELECT u.id,
        u.nombres,
        u.apellidos,
        u.email,
        u.telefono,
        u.rol_id,
        u.cargo_id,
        u.municipio_id,
        u.activo,
        u.created_at,
        r.nombre AS rol,
        c.nombre AS cargo,
        m.nombre AS municipio
      FROM users u
      JOIN roles r ON r.id = u.rol_id
      JOIN cargos c ON c.id = u.cargo_id
      JOIN municipios m ON m.id = u.municipio_id
      WHERE u.id = ?
    `;
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  },

  findByEmail: async (email) => {
    const query = `
    SELECT u.*, 
           r.nombre AS rol,
           c.nombre AS cargo,
           m.nombre AS municipio
    FROM users u
    JOIN roles r ON r.id = u.rol_id
    JOIN cargos c ON c.id = u.cargo_id
    JOIN municipios m ON m.id = u.municipio_id
    WHERE u.email = ?
  `;
    const [rows] = await pool.query(query, [email]);
    return rows[0];
  },

  // Actualizar un usuario por ID
  updateById: async (id, data) => {
    const fields = [];
    const values = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return null;

    const query = `
        UPDATE users
      SET ${fields.join(", ")}, updated_at = NOW()
        WHERE id = ?
      `;
    values.push(id);
    await pool.query(query, values);

    return await Usuarios.findById(id);
  },

  // Actualizar un activo o estado por ID
  findByCambiarEstado: async (id, nuevoEstado) => {
    const [rows] = await pool.query(
      `SELECT activo 
     FROM users 
     WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    await pool.query(
      `UPDATE users
      SET activo = ? 
      WHERE id = ?
      `,
      [nuevoEstado, id]
    );
  },

  // Este método elimina un Usuario específico por su ID.
  deleteById: async (id) => {
    const query = `DELETE FROM users WHERE id = ?`;
    const values = [id];
    const [result] = await pool.query(query, values);
    return result.affectedRows > 0;
  },

  findByIngenieroPorMunicipio: async (municipio_id) => {
    const [rows] = await pool.query(
      `SELECT u.id
    FROM users u
    JOIN roles r ON r.id = u.rol_id
    WHERE r.nombre = 'ingeniero'
      AND u.municipio_id = ?
      AND u.activo = TRUE
    ORDER BY RAND()
    LIMIT 1
    `,
      [municipio_id]
    );

    return rows.length ? rows[0].id : null;
  },
};

module.exports = Usuarios;
