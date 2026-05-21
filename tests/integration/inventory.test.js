/**
 * Inventory (Recepción de medicamentos) — Integration tests
 * Escenario: medicamento vencido + control de cadena frío
 */
const request = require('supertest');
const jwt     = require('jsonwebtoken');

jest.mock('../../src/config/database', () => ({
  query:         jest.fn(),
  getConnection: jest.fn(),
  end:           jest.fn(),
}));

const pool = require('../../src/config/database');
const app  = require('../../app');

const makeToken = (overrides = {}) =>
  jwt.sign(
    { id: 5, empresa_id: 1, rol_id: 2, email: 'ing@ips.co', ...overrides },
    process.env.JWT_ACCESS_SECRET || 'test_secret_key_256_bits_minimum_length',
    { expiresIn: '1h' }
  );

const cookie = (t) => ({ Cookie: `accessToken=${t}` });

afterEach(() => jest.resetAllMocks());

// ─────────────────────────────────────────────────────────────
// SUITE 1 — Escenario: recepción con medicamento próximo a vencer
// ─────────────────────────────────────────────────────────────
describe('Escenario: Recepción de medicamentos — vencimiento y cadena frío', () => {
  const token = makeToken();

  const payloadRecepcion = {
    fecha:               '2026-05-20',
    hora:                '09:00',
    municipio_id:        1,
    sede_id:             1,
    proveedor:           'Distribuidora MedPharma',
    remision_factura:    'FAC-2026-0042',
    responsable_recibe:  'María Gómez',
    medicamentos: [
      {
        nombre:                   'Insulina Glargina 100 UI/mL',
        codigo_interno:           'MED-001',
        presentacion_comercial:   'Solución inyectable',
        concentracion:            '100 UI/mL',
        fecha_vencimiento:        '2026-07-15',     // ~55 días → estado ROJO
        cant_solicitada:          10,
        cant_recepcionada:        10,
        cadena_frio:              true,
        temperatura:              '2-8°C',
        certificado_calidad:      true,
        tipo_certificado_calidad: 'FÍSICO',
        etiquetas:                true,
        tipo_etiquetas:           'MAGNÉTICO',
        lote:                     'L-2024-888',
        snna:                     'SI',
        cod:                      'SI',
        acr:                      'A',
        estado_empaque:           'BUENO',
      },
    ],
  };

  it('201 — crea recepción con medicamento próximo a vencer', async () => {
    const conn = {
      beginTransaction: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce([{ insertId: 5 }])  // INSERT recepcion
        .mockResolvedValueOnce([{}]),               // INSERT item
      commit: jest.fn(), rollback: jest.fn(), release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    // findById: recepcion con medicamentos
    pool.query
      .mockResolvedValueOnce([[{ id: 5, proveedor: 'Distribuidora MedPharma' }]])
      .mockResolvedValueOnce([[{
        id: 1, nombre: 'Insulina Glargina 100 UI/mL',
        fecha_vencimiento: '2026-07-15',
        cadena_frio: true, cant_recepcionada: 10,
      }]]);

    const res = await request(app)
      .post('/api/v1/recepciones/medicamentos')
      .set(cookie(token))
      .send(payloadRecepcion);

    expect(res.status).toBe(201);
    expect(res.body.data.medicamentos[0].cadena_frio).toBe(true);
    expect(res.body.data.medicamentos[0].fecha_vencimiento).toBe('2026-07-15');
  });

  it('201 — campos nuevos lote/cant_recepcionada/tipo_certificado_calidad se persisten', async () => {
    const conn = {
      beginTransaction: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce([{ insertId: 6 }])
        .mockResolvedValueOnce([{}]),
      commit: jest.fn(), rollback: jest.fn(), release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    pool.query
      .mockResolvedValueOnce([[{ id: 6 }]])
      .mockResolvedValueOnce([[{
        id: 2, lote: 'L-2024-888',
        cant_recepcionada: 10,
        tipo_certificado_calidad: 'FÍSICO',
        tipo_etiquetas: 'MAGNÉTICO',
      }]]);

    const res = await request(app)
      .post('/api/v1/recepciones/medicamentos')
      .set(cookie(token))
      .send(payloadRecepcion);

    expect(res.status).toBe(201);
    // Verificar que el INSERT incluyó los campos nuevos
    const insertCall = conn.query.mock.calls[1];
    const insertSql  = insertCall[0];
    expect(insertSql).toContain('cant_recepcionada');
    expect(insertSql).toContain('lote');
    expect(insertSql).toContain('tipo_certificado_calidad');
    expect(insertSql).toContain('tipo_etiquetas');
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 2 — GET /items — inventario con semáforo vencimiento
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/recepciones/medicamentos/items — semáforo vencimiento', () => {
  const token = makeToken();

  it('200 — retorna items con fechas de vencimiento', async () => {
    const hoy     = new Date();
    const en400   = new Date(hoy); en400.setDate(hoy.getDate() + 400);
    const en200   = new Date(hoy); en200.setDate(hoy.getDate() + 200);
    const vencido = new Date(hoy); vencido.setDate(hoy.getDate() - 10);

    pool.query.mockResolvedValueOnce([[
      { id: 1, nombre: 'Amoxicilina 500mg',  fecha_vencimiento: en400.toISOString().split('T')[0],   cant_recepcionada: 50 },
      { id: 2, nombre: 'Ibuprofeno 400mg',   fecha_vencimiento: en200.toISOString().split('T')[0],   cant_recepcionada: 20 },
      { id: 3, nombre: 'Insulina Glargina',  fecha_vencimiento: vencido.toISOString().split('T')[0], cant_recepcionada: 5  },
    ]]);

    const res = await request(app)
      .get('/api/v1/recepciones/medicamentos/items')
      .set(cookie(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    // Verificar que incluye fechas de vencimiento
    expect(res.body.data[2].fecha_vencimiento).toBeDefined();
  });

  it('aislamiento: query filtra por empresa_id del JWT', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    await request(app)
      .get('/api/v1/recepciones/medicamentos/items')
      .set(cookie(token));

    const sql    = pool.query.mock.calls[0][0];
    const params = pool.query.mock.calls[0][1];
    expect(sql).toMatch(/empresa_id/);
    expect(params[0]).toBe(1); // empresa_id del token
  });
});
