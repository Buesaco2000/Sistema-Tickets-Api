/**
 * Inventario — Tests de integración de flujos críticos
 * Cubre los 7 escenarios de mayor riesgo del módulo de inventario.
 *
 * Ejecutar: npm run test -- --testPathPattern=inventario-critico
 */

process.env.JWT_ACCESS_SECRET  = 'test_secret_key_256_bits_minimum_length';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_256_bits_minimum_length';
process.env.RESEND_API_KEY     = 're_test_dummy_key';

jest.mock('../../src/Utils/mailer', () => ({
  sendPasswordReset: jest.fn().mockResolvedValue({}),
}));

const request = require('supertest');
const jwt     = require('jsonwebtoken');

jest.mock('../../src/Config/database', () => ({
  query:         jest.fn(),
  getConnection: jest.fn(),
  end:           jest.fn(),
}));

const pool = require('../../src/Config/database');
const app  = require('../../app');

// ── Helpers ────────────────────────────────────────────────────────────────

const token = (overrides = {}) =>
  jwt.sign(
    {
      id: 1, empresa_id: 1, rol_id: 1,
      email: 'admin@suroriente.com',
      cargo: 'Almacén', municipio_id: null,
      ...overrides,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' },
  );

const hdr = (t) => ({ Cookie: `accessToken=${t}` });

/** Devuelve la primera llamada a pool.query como { sql, params } */
const primerQuery = () => ({
  sql:    pool.query.mock.calls[0]?.[0] ?? '',
  params: pool.query.mock.calls[0]?.[1] ?? [],
});

afterEach(() => jest.resetAllMocks());

// ──────────────────────────────────────────────────────────────────────────
// SUITE 1 — Salidas directas: control de stock
// ──────────────────────────────────────────────────────────────────────────
describe('POST /salidas — control de stock', () => {
  const url = '/api/v1/recepciones/medicamentos/salidas';

  const payload = {
    item_id:   10,
    cantidad:  5,
    fecha:     '2026-10-01',
    motivo:    'Consumo',
    responsable: 'Enfermera Pérez',
  };

  it('400 — cantidad supera el stock disponible', async () => {
    // Stock = cant_recepcionada(10) - salidas(6) - dispensadas(4) + ajustes(0) = 0
    pool.query.mockResolvedValueOnce([[{
      id: 10,
      cant_recepcionada: 10,
      total_salidas:     6,
      total_dispensado:  4,
      total_ajustes:     0,
      municipio_origen_id: 1,
      sede_origen_id:      null,
    }]]);

    const res = await request(app)
      .post(url)
      .set(hdr(token()))
      .send({ ...payload, cantidad: 5 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/[Ss]tock insuficiente/);
  });

  it('201 — crea salida cuando hay stock suficiente', async () => {
    // Stock = 20 - 5 - 3 + 0 = 12, cantidad=5 → ok
    pool.query.mockResolvedValueOnce([[{
      id: 10,
      cant_recepcionada: 20,
      total_salidas:     5,
      total_dispensado:  3,
      total_ajustes:     0,
      municipio_origen_id: 1,
      sede_origen_id:      null,
    }]]);

    const conn = {
      beginTransaction: jest.fn(),
      query:   jest.fn().mockResolvedValue([{ insertId: 99 }]),
      commit:  jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    const res = await request(app)
      .post(url)
      .set(hdr(token()))
      .send({ ...payload, cantidad: 5 });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(99);
  });

  it('stock incluye ajustes: ajuste +3 permite salida que antes era insuficiente', async () => {
    // Sin ajuste: 10 - 10 - 0 = 0. Con ajuste +3: = 3, cantidad=2 → ok
    pool.query.mockResolvedValueOnce([[{
      id: 10,
      cant_recepcionada: 10,
      total_salidas:     10,
      total_dispensado:  0,
      total_ajustes:     3,   // ajuste de corrección
      municipio_origen_id: 1,
      sede_origen_id:      null,
    }]]);

    const conn = {
      beginTransaction: jest.fn(),
      query:   jest.fn().mockResolvedValue([{ insertId: 100 }]),
      commit:  jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    const res = await request(app)
      .post(url)
      .set(hdr(token()))
      .send({ ...payload, cantidad: 2 });

    expect(res.status).toBe(201);
  });

  it('aislamiento: SQL filtra por empresa_id del JWT', async () => {
    pool.query.mockResolvedValueOnce([[null]]);

    await request(app)
      .post(url)
      .set(hdr(token({ empresa_id: 7 })))
      .send(payload);

    const { sql, params } = primerQuery();
    expect(sql).toMatch(/empresa_id/);
    expect(params).toContain(7);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// SUITE 2 — Ajustes de inventario
// ──────────────────────────────────────────────────────────────────────────
describe('POST /ajustes-inventario — validaciones', () => {
  const url = '/api/v1/ajustes-inventario';

  const tokenAlmacen = token({ cargo: 'Almacén', rol_id: 3 });

  const base = {
    item_id:  10,
    cantidad: -3,
    concepto: 'DETERIORO',
    motivo:   'Frascos rotos en bodega',
  };

  it('400 — ajuste negativo deja stock en negativo', async () => {
    // stock actual = 2, intento restar 3 → -1
    pool.query.mockResolvedValueOnce([[{ id: 10, stock_actual: 2 }]]);

    const res = await request(app)
      .post(url)
      .set(hdr(tokenAlmacen))
      .send({ ...base, cantidad: -3 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/[Ss]tock insuficiente/);
  });

  it('201 — ajuste negativo válido (stock suficiente)', async () => {
    // stock = 10, ajuste -3 → nuevo stock = 7
    pool.query
      .mockResolvedValueOnce([[{ id: 10, stock_actual: 10 }]])    // SELECT item
      .mockResolvedValueOnce([{ insertId: 55 }]);                  // INSERT ajuste

    const res = await request(app)
      .post(url)
      .set(hdr(tokenAlmacen))
      .send({ ...base, cantidad: -3 });

    expect(res.status).toBe(201);
    expect(res.body.data.stock_nuevo).toBe(7);
  });

  it('201 — ajuste positivo (corrección por más unidades)', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 10, stock_actual: 5 }]])
      .mockResolvedValueOnce([{ insertId: 56 }]);

    const res = await request(app)
      .post(url)
      .set(hdr(tokenAlmacen))
      .send({ item_id: 10, cantidad: 4, concepto: 'CORRECCION', motivo: 'Conteo manual confirmó más unidades' });

    expect(res.status).toBe(201);
    expect(res.body.data.stock_nuevo).toBe(9);
  });

  it('400 — concepto inválido', async () => {
    const res = await request(app)
      .post(url)
      .set(hdr(tokenAlmacen))
      .send({ ...base, concepto: 'INVENTADO' });

    expect(res.status).toBe(400);
  });

  it('400 — motivo demasiado corto', async () => {
    const res = await request(app)
      .post(url)
      .set(hdr(tokenAlmacen))
      .send({ ...base, motivo: 'ok' });

    expect(res.status).toBe(400);
  });

  it('403 — usuario sin cargo Almacén ni ADMIN no puede ajustar', async () => {
    const tokenSinPriv = token({ cargo: 'Auxiliar Administrativa', rol_id: 3 });

    const res = await request(app)
      .post(url)
      .set(hdr(tokenSinPriv))
      .send(base);

    expect(res.status).toBe(403);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// SUITE 3 — Filtro de categorías por cargo Auxiliar
// ──────────────────────────────────────────────────────────────────────────
describe('GET /items — filtro de categorías por cargo', () => {
  const url = '/api/v1/recepciones/medicamentos/items';

  it('Auxiliar: SQL excluye MEDICAMENTOS y MEDICO_QUIRURGICO', async () => {
    const tokenAux = token({ cargo: 'Auxiliar Administrativa', rol_id: 3 });

    // Branch 1: mock de dispensaciones + responsable
    pool.query
      .mockResolvedValueOnce([[]])  // rowsDest (dispensaciones)
      .mockResolvedValueOnce([[]]); // rowsResp (responsable_recibe)

    await request(app)
      .get(url)
      .set(hdr(tokenAux));

    const sqls = pool.query.mock.calls.map((c) => c[0]);
    const alguno = sqls.some((s) =>
      s.includes("MEDICAMENTOS") && s.includes("MEDICO_QUIRURGICO"),
    );
    expect(alguno).toBe(true); // la cláusula NOT IN está en el SQL
  });

  it('Almacén: SQL NO incluye filtro de categorías restringidas', async () => {
    const tokenAlm = token({ cargo: 'Almacén', rol_id: 3, municipio_id: 1 });

    // Branch 2: mock de la query principal + dispensaciones por items
    pool.query
      .mockResolvedValueOnce([[{ id: 1, nombre: 'Amoxicilina', tipo_recepcion: 'MEDICAMENTOS', stock: 10, cant_recepcionada: 10 }]])
      .mockResolvedValueOnce([[]]); // dispensaciones del ítem

    const res = await request(app)
      .get(url)
      .set(hdr(tokenAlm));

    const sqls = pool.query.mock.calls.map((c) => c[0]);
    const tieneRestriccion = sqls.some((s) =>
      /NOT IN.*MEDICAMENTOS/.test(s),
    );
    expect(tieneRestriccion).toBe(false); // Almacén ve todo
  });
});

// ──────────────────────────────────────────────────────────────────────────
// SUITE 4 — Alertas badge: estructura de respuesta
// ──────────────────────────────────────────────────────────────────────────
describe('GET /alertas-badge — estructura', () => {
  const url = '/api/v1/recepciones/medicamentos/alertas-badge';

  it('200 — devuelve vencidos y proximos_vencer como números', async () => {
    pool.query.mockResolvedValueOnce([[{ vencidos: '3', proximos_vencer: '5' }]]);

    const res = await request(app)
      .get(url)
      .set(hdr(token()));

    expect(res.status).toBe(200);
    expect(typeof res.body.data.vencidos).toBe('number');
    expect(typeof res.body.data.proximos_vencer).toBe('number');
    expect(res.body.data.vencidos).toBe(3);
    expect(res.body.data.proximos_vencer).toBe(5);
  });

  it('200 — devuelve ceros cuando no hay alertas', async () => {
    pool.query.mockResolvedValueOnce([[{ vencidos: '0', proximos_vencer: '0' }]]);

    const res = await request(app)
      .get(url)
      .set(hdr(token()));

    expect(res.status).toBe(200);
    expect(res.body.data.vencidos).toBe(0);
    expect(res.body.data.proximos_vencer).toBe(0);
  });

  it('ADMIN ve toda la empresa (sin filtro de municipio)', async () => {
    pool.query.mockResolvedValueOnce([[{ vencidos: '0', proximos_vencer: '0' }]]);

    await request(app)
      .get(url)
      .set(hdr(token({ rol_id: 1, municipio_id: 5 })));

    const { sql, params } = primerQuery();
    expect(sql).not.toMatch(/municipio_id = \?/);
    expect(params).not.toContain(5);
  });

  it('usuario con municipio_id filtra por su municipio', async () => {
    pool.query.mockResolvedValueOnce([[{ vencidos: '1', proximos_vencer: '2' }]]);

    await request(app)
      .get(url)
      .set(hdr(token({ rol_id: 3, cargo: 'Enfermera', municipio_id: 4 })));

    const { sql, params } = primerQuery();
    expect(sql).toMatch(/municipio_id/);
    expect(params).toContain(4);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// SUITE 5 — Multi-tenancy: empresa_id siempre presente
// ──────────────────────────────────────────────────────────────────────────
describe('Multi-tenancy — empresa_id en todos los módulos', () => {
  it('GET /items incluye empresa_id en el SQL', async () => {
    pool.query.mockResolvedValue([[]]);

    await request(app)
      .get('/api/v1/recepciones/medicamentos/items')
      .set(hdr(token({ empresa_id: 9 })));

    const { sql, params } = primerQuery();
    expect(sql).toMatch(/empresa_id/);
    expect(params[0]).toBe(9);
  });

  it('POST /ajustes-inventario incluye empresa_id en el SELECT de verificación', async () => {
    pool.query.mockResolvedValueOnce([[null]]);

    await request(app)
      .post('/api/v1/ajustes-inventario')
      .set(hdr(token({ empresa_id: 9 })))
      .send({ item_id: 1, cantidad: -1, concepto: 'BAJA', motivo: 'Producto vencido detectado en bodega' });

    const { sql, params } = primerQuery();
    expect(sql).toMatch(/empresa_id/);
    expect(params).toContain(9);
  });
});
