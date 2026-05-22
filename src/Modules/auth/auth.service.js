const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const pool     = require('../../config/database');
const AppError = require('../../utils/AppError');
const ROLES    = require('../../utils/roles');

// COOKIE_SECURE=true solo cuando haya HTTPS configurado
const useSecure = process.env.COOKIE_SECURE === 'true';

const COOKIE_OPTS_ACCESS = {
  httpOnly: true,
  secure:   useSecure,
  sameSite: 'lax',
  maxAge:   15 * 60 * 1000,           // 15 min
};

const COOKIE_OPTS_REFRESH = {
  httpOnly: true,
  secure:   useSecure,
  sameSite: 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 días
};

const _generateTokens = (user) => {
  const payload = {
    id:         user.id,
    empresa_id: user.empresa_id,
    rol_id:     user.rol_id,
    email:      user.email,
  };
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(
    { id: user.id, empresa_id: user.empresa_id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

const login = async (email, password, empresaId) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.email, u.password, u.empresa_id, u.rol_id, u.nombres, u.apellidos,
            u.cargo_id, u.municipio_id, u.telefono, u.activo, u.deleted_at,
            r.nombre AS rol,
            c.nombre AS cargo,
            m.nombre AS municipio
     FROM users u
     LEFT JOIN roles      r ON r.id = u.rol_id
     LEFT JOIN cargos     c ON c.id = u.cargo_id
     LEFT JOIN municipios m ON m.id = u.municipio_id
     WHERE u.email = ? AND u.empresa_id = ? LIMIT 1`,
    [email.toLowerCase().trim(), empresaId]
  );

  const user = rows[0];

  // Mensaje vago intencional: evita user enumeration
  if (!user || user.deleted_at || !user.activo) {
    throw new AppError('Credenciales inválidas.', 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Credenciales inválidas.', 401);

  const tokens = _generateTokens(user);

  // Guardar hash del refresh token (rotación con un token por usuario)
  const tokenHash = await bcrypt.hash(tokens.refreshToken, 8);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
     ON DUPLICATE KEY UPDATE token_hash = VALUES(token_hash), expires_at = VALUES(expires_at)`,
    [user.id, tokenHash]
  );

  return {
    tokens,
    cookieOpts: { access: COOKIE_OPTS_ACCESS, refresh: COOKIE_OPTS_REFRESH },
    user: {
      id:           user.id,
      email:        user.email,
      nombres:      user.nombres,
      apellidos:    user.apellidos,
      rol_id:       user.rol_id,
      rol:          user.rol,
      empresa_id:   user.empresa_id,
      cargo_id:     user.cargo_id,
      cargo:        user.cargo,
      municipio_id: user.municipio_id,
      municipio:    user.municipio,
      telefono:     user.telefono,
      activo:       user.activo,
    },
  };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) throw new AppError('Refresh token requerido.', 401);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Refresh token inválido o expirado.', 401);
  }

  const [rows] = await pool.query(
    `SELECT rt.token_hash, u.id, u.empresa_id, u.rol_id, u.email, u.activo, u.deleted_at
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.user_id = ? AND rt.expires_at > NOW()`,
    [decoded.id]
  );

  const record = rows[0];
  if (!record || !record.activo || record.deleted_at) throw new AppError('Sesión inválida.', 401);

  const valid = await bcrypt.compare(refreshToken, record.token_hash);
  if (!valid) throw new AppError('Refresh token inválido.', 401);

  const { accessToken } = _generateTokens(record);
  return { accessToken, cookieOpts: COOKIE_OPTS_ACCESS };
};

const logout = async (userId) => {
  await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
};

const register = async (data, createdBy, creatorEmpresaId) => {
  const { nombres, apellidos, email, password, empresa_id, rol_id, cargo_id, municipio_id, telefono } = data;

  // Un admin solo puede crear usuarios en su propia empresa
  if (empresa_id !== creatorEmpresaId) {
    throw new AppError('No puedes crear usuarios en otra empresa.', 403);
  }

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ? AND empresa_id = ?',
    [email.toLowerCase().trim(), empresa_id]
  );
  if (existing.length) throw new AppError('El email ya está registrado en esta empresa.', 409);

  const hashed = await bcrypt.hash(password, 12);

  const [result] = await pool.query(
    `INSERT INTO users (nombres, apellidos, email, password, empresa_id, rol_id, cargo_id, municipio_id, telefono, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombres, apellidos, email.toLowerCase().trim(), hashed, empresa_id, rol_id || null, cargo_id || null, municipio_id || null, telefono || null, createdBy]
  );

  const [user] = await pool.query(
    'SELECT id, nombres, apellidos, email, empresa_id, rol_id, cargo_id FROM users WHERE id = ?',
    [result.insertId]
  );
  return user[0];
};

// Registro público — cualquier persona puede crear su cuenta con rol SALUD
const registerPublic = async (data) => {
  const { nombres, apellidos, email, password, empresa_id, cargo_id, municipio_id, telefono } = data;

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ? AND empresa_id = ?',
    [email.toLowerCase().trim(), empresa_id]
  );
  if (existing.length) throw new AppError('El email ya está registrado en esta empresa.', 409);

  const hashed = await bcrypt.hash(password, 12);

  const [result] = await pool.query(
    `INSERT INTO users (nombres, apellidos, email, password, empresa_id, rol_id, cargo_id, municipio_id, telefono)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombres, apellidos, email.toLowerCase().trim(), hashed, empresa_id, ROLES.SALUD,
     cargo_id || null, municipio_id || null, telefono || null]
  );

  const [rows] = await pool.query(
    'SELECT id, nombres, apellidos, email, empresa_id, rol_id, cargo_id FROM users WHERE id = ?',
    [result.insertId]
  );
  return rows[0];
};

module.exports = { login, refresh, logout, register, registerPublic };