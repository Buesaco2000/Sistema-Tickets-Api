/**
 * Auth — Integration tests (Jest + Supertest)
 * Instalar: npm i -D jest supertest
 * Ejecutar:  npx jest tests/integration/auth.test.js
 */
const request  = require('supertest');
const bcrypt   = require('bcrypt');

// Establecer env vars antes de que auth.service.js las use al firmar tokens
process.env.JWT_ACCESS_SECRET  = 'test_secret_key_256_bits_minimum_length';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_256_bits_minimum_length';

// ── Mock del pool de base de datos ───────────────────────────
jest.mock('../../src/config/database', () => {
  const pool = {
    query:         jest.fn(),
    getConnection: jest.fn(),
    end:           jest.fn(),
  };
  return pool;
});

const pool = require('../../src/config/database');
const app  = require('../../app');

// Usuario de prueba base
const TEST_EMPRESA_ID = 1;
const TEST_USER = {
  id:         10,
  email:      'enfermero@hospital.co',
  empresa_id: TEST_EMPRESA_ID,
  rol_id:     3,
  nombres:    'Ana',
  apellidos:  'Torres',
  cargo_id:   null,
  municipio_id: null,
  telefono:   null,
  activo:     1,
  deleted_at: null,
  rol:        'SALUD',
  cargo:      null,
  municipio:  null,
};

let hashedPassword;

beforeAll(async () => {
  hashedPassword = await bcrypt.hash('Seguro1234!', 12);
});

afterEach(() => jest.resetAllMocks());

// ── Helpers ───────────────────────────────────────────────────
const mockLogin = (userOverride = {}) => {
  const user = { ...TEST_USER, password: hashedPassword, ...userOverride };
  pool.query
    .mockResolvedValueOnce([[user]])          // SELECT usuario
    .mockResolvedValueOnce([{ insertId: 1 }]); // INSERT refresh_token
};

// ─────────────────────────────────────────────────────────────
// SUITE 1 — Login
// ─────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  it('200 — credenciales válidas retornan cookie + perfil', async () => {
    mockLogin();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'Seguro1234!', empresa_id: TEST_EMPRESA_ID });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('401 — password incorrecto retorna mensaje vago (anti-enumeración)', async () => {
    mockLogin();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'WrongPass!', empresa_id: TEST_EMPRESA_ID });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas.');
  });

  it('401 — usuario inexistente en empresa retorna mismo mensaje vago', async () => {
    pool.query.mockResolvedValueOnce([[]]); // no rows

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'noexiste@hospital.co', password: 'Algo1234!', empresa_id: TEST_EMPRESA_ID });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas.');
  });

  it('401 — usuario inactivo no puede ingresar', async () => {
    mockLogin({ activo: 0 });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'Seguro1234!', empresa_id: TEST_EMPRESA_ID });

    expect(res.status).toBe(401);
  });

  it('401 — usuario eliminado (soft-delete) no puede ingresar', async () => {
    mockLogin({ deleted_at: '2025-01-01 00:00:00' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'Seguro1234!', empresa_id: TEST_EMPRESA_ID });

    expect(res.status).toBe(401);
  });

  it('400 — empresa_id ausente retorna error de validación', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'Seguro1234!' });

    expect(res.status).toBe(400);
  });

  it('400 — email inválido retorna error de validación', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'no-es-email', password: 'Seguro1234!', empresa_id: TEST_EMPRESA_ID });

    expect(res.status).toBe(400);
  });

  it('aislamiento empresa: mismo email empresa distinta NO puede ingresar', async () => {
    // La query filtra por empresa_id=99 → no encuentra el usuario
    pool.query.mockResolvedValueOnce([[]]); // usuario no existe en empresa 99

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'Seguro1234!', empresa_id: 99 });

    expect(res.status).toBe(401);
    // Verificamos que la query se llamó con empresa_id=99
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('empresa_id'),
      expect.arrayContaining([99])
    );
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 2 — /auth/me (ruta protegida)
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/auth/me', () => {
  it('401 — sin cookie de acceso rechaza', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
