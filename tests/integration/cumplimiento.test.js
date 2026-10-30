const request = require('supertest');
const jwt     = require('jsonwebtoken');

jest.mock('../../src/Config/database', () => ({
  query:         jest.fn(),
  getConnection: jest.fn(),
  end:           jest.fn(),
}));

const pool = require('../../src/Config/database');
const app  = require('../../app');

const SECRET = process.env.JWT_ACCESS_SECRET || 'test_secret_key_256_bits_minimum_length';

// ARCHIVOS = rol_id 4; ADMIN = rol_id 1
const makeToken = (overrides = {}) =>
  jwt.sign(
    { id: 8, empresa_id: 1, rol_id: 4, email: 'archivos@ips.co',
      nombres: 'Marta', apellidos: 'Ríos', cargo: 'coordinador archivos', ...overrides },
    SECRET,
    { expiresIn: '1h' }
  );

const cookie = (t) => ({ Cookie: `accessToken=${t}` });

afterEach(() => jest.resetAllMocks());


//  SUITE 1: GET /resumen 
describe('GET /api/v1/informes/resumen — KPI cumplimiento', () => {
  it('200 — retorna KPIs con pct_oportunidad calculado', async () => {
    pool.query.mockResolvedValueOnce([[{
      vencidos: 2, criticos: 3, proximos: 5, cumplidos: 10, total_validos: 20,
    }]]);

    const res = await request(app)
      .get('/api/v1/informes/resumen?anio=2026')
      .set(cookie(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data.pct_oportunidad).toBe(50); // 10/20 * 100
    expect(res.body.data.vencidos).toBe(2);
    expect(res.body.data.criticos).toBe(3);
  });

  it('200 — sin datos: pct_oportunidad es 0', async () => {
    pool.query.mockResolvedValueOnce([[{
      vencidos: 0, criticos: 0, proximos: 0, cumplidos: 0, total_validos: 0,
    }]]);

    const res = await request(app)
      .get('/api/v1/informes/resumen?anio=2026')
      .set(cookie(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data.pct_oportunidad).toBe(0);
  });

  it('aislamiento — query incluye empresa_id del JWT', async () => {
    pool.query.mockResolvedValueOnce([[{
      vencidos: 0, criticos: 0, proximos: 0, cumplidos: 0, total_validos: 0,
    }]]);

    await request(app)
      .get('/api/v1/informes/resumen?anio=2026')
      .set(cookie(makeToken({ empresa_id: 7 })));

    const sql    = pool.query.mock.calls[0][0];
    const params = pool.query.mock.calls[0][1];
    expect(sql).toMatch(/empresa_id/);
    expect(params[0]).toBe(7);
  });

  it('403 — INGENIERO (rol 2) no puede acceder', async () => {
    const res = await request(app)
      .get('/api/v1/informes/resumen?anio=2026')
      .set(cookie(makeToken({ rol_id: 2 })));

    expect(res.status).toBe(403);
  });
});


//  SUITE 2: GET / — listado con filtros 
describe('GET /api/v1/informes — listado', () => {
  const informesMock = [
    { id: 1, codigo: 'OBL-001', informe: 'Informe REPS', estado: 'PENDIENTE',
      ente_rector: 'MSPS', etiqueta_corte: 'OCT 2026', dias_restantes: 10 },
    { id: 2, codigo: 'OBL-002', informe: 'Informe PQRS', estado: 'PRESENTADO',
      ente_rector: 'SDS', etiqueta_corte: 'SEP 2026', dias_restantes: -5 },
  ];

  it('200 — retorna lista de informes del año', async () => {
    pool.query.mockResolvedValueOnce([informesMock]);

    const res = await request(app)
      .get('/api/v1/informes?anio=2026')
      .set(cookie(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].codigo).toBe('OBL-001');
  });

  it('200 — filtro estado=PENDIENTE solo trae pendientes', async () => {
    pool.query.mockResolvedValueOnce([[informesMock[0]]]);

    const res = await request(app)
      .get('/api/v1/informes?anio=2026&estado=PENDIENTE')
      .set(cookie(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].estado).toBe('PENDIENTE');

    // Verifica que el SQL incluye el filtro de estado
    const sql = pool.query.mock.calls[0][0];
    expect(sql).toMatch(/e\.nombre = \?/);
  });

  it('200 — soloMios incluye responsable_id del usuario en query', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    await request(app)
      .get('/api/v1/informes?anio=2026&soloMios=true')
      .set(cookie(makeToken({ id: 8 })));

    const sql    = pool.query.mock.calls[0][0];
    const params = pool.query.mock.calls[0][1];
    expect(sql).toMatch(/responsable_id = \?/);
    expect(params).toContain(8);
  });

  it('200 — lista vacía cuando no hay informes', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/v1/informes?anio=2025')
      .set(cookie(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});


//  SUITE 3: GET /:id — detalle 
describe('GET /api/v1/informes/:id — detalle', () => {
  it('200 — retorna detalle con evidencias e historial', async () => {
    // findById hace 3 queries: detalle + evidencias + historial
    pool.query
      .mockResolvedValueOnce([[{
        id: 5, codigo: 'OBL-001', informe: 'Informe REPS',
        estado: 'PENDIENTE', ente_rector: 'MSPS',
        responsable: 'Marta Ríos', suplente: null,
        evidencias: undefined, historial: undefined,
      }]])
      .mockResolvedValueOnce([[
        { id: 1, nombre_original: 'doc.pdf', tipo_evidencia: 'SOPORTE', subido_por: 'Marta Ríos' },
      ]])
      .mockResolvedValueOnce([[
        { created_at: '2026-10-01', estado_anterior: 'PENDIENTE', estado_nuevo: 'EN_PROCESO', cambiado_por: 'Admin' },
      ]]);

    const res = await request(app)
      .get('/api/v1/informes/5')
      .set(cookie(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data.evidencias).toHaveLength(1);
    expect(res.body.data.historial).toHaveLength(1);
    expect(res.body.data.evidencias[0].nombre_original).toBe('doc.pdf');
  });

  it('404 — informe no encontrado', async () => {
    pool.query.mockResolvedValueOnce([[]]); // detalleRows vacío

    const res = await request(app)
      .get('/api/v1/informes/9999')
      .set(cookie(makeToken()));

    expect(res.status).toBe(404);
  });

  it('aislamiento — query filtra por empresa_id del JWT', async () => {
    pool.query.mockResolvedValueOnce([[]]); // no encontrado, pero verificamos params

    await request(app)
      .get('/api/v1/informes/5')
      .set(cookie(makeToken({ empresa_id: 3 })));

    const params = pool.query.mock.calls[0][1];
    expect(params).toContain(3); // empresa_id = 3
  });
});


//  SUITE 4: PATCH /:id/estado 
describe('PATCH /api/v1/informes/:id/estado — cambiar estado', () => {
  it('200 — cambio a estado EN_PROCESO actualiza el registro', async () => {
    const conn = {
      query: jest.fn()
        .mockResolvedValueOnce([{}])                          // SET @current_user_id
        .mockResolvedValueOnce([[{ nombre: 'EN_PROCESO' }]]) // SELECT estado
        .mockResolvedValueOnce([{ affectedRows: 1 }]),        // UPDATE
      release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    const res = await request(app)
      .patch('/api/v1/informes/5/estado')
      .set(cookie(makeToken()))
      .send({ estado_id: 2, observacion: 'En progreso' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('200 — cambio a PRESENTADO genera siguiente período', async () => {
    const conn = {
      query: jest.fn()
        .mockResolvedValueOnce([{}])                           // SET @current_user_id
        .mockResolvedValueOnce([[{ nombre: 'PRESENTADO' }]])  // SELECT estado
        .mockResolvedValueOnce([{ affectedRows: 1 }])         // UPDATE con fecha_presentado
        .mockResolvedValueOnce([[{ obligacion_id: 3, fecha_corte: '2026-09-30' }]])  // SELECT ejecucion
        .mockResolvedValueOnce([[{ id: 1 }]])                 // SELECT estado PENDIENTE
        // generarSiguientePeriodo: dias_plazo + meses_corte
        .mockResolvedValueOnce([[{ dias_plazo: 30, meses_corte: '[1,4,7,10]' }]])
        .mockResolvedValueOnce([{}]),                         // INSERT siguiente período
      release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    const res = await request(app)
      .patch('/api/v1/informes/5/estado')
      .set(cookie(makeToken()))
      .send({ estado_id: 3, observacion: 'Presentado a tiempo' });

    expect(res.status).toBe(200);
    // Verifica que se intentó crear el siguiente período
    const insertCall = conn.query.mock.calls.find(c =>
      typeof c[0] === 'string' && c[0].includes('INSERT INTO ejecucion_informe')
    );
    expect(insertCall).toBeDefined();
  });

  it('404 — informe inexistente', async () => {
    const conn = {
      query: jest.fn()
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[{ nombre: 'EN_PROCESO' }]])
        .mockResolvedValueOnce([{ affectedRows: 0 }]), // no rows updated
      release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    const res = await request(app)
      .patch('/api/v1/informes/9999/estado')
      .set(cookie(makeToken()))
      .send({ estado_id: 2, observacion: '' });

    expect(res.status).toBe(404);
  });

  it('403 — SALUD (rol 3) no puede cambiar estado de informes', async () => {
    const res = await request(app)
      .patch('/api/v1/informes/5/estado')
      .set(cookie(makeToken({ rol_id: 3 })))
      .send({ estado_id: 2, observacion: '' });

    expect(res.status).toBe(403);
  });
});


//  SUITE 5: GET /anios 
describe('GET /api/v1/informes/anios — años disponibles', () => {
  it('200 — retorna años con datos ordenados desc', async () => {
    pool.query.mockResolvedValueOnce([[
      { anio: 2026 }, { anio: 2025 }, { anio: 2024 },
    ]]);

    const res = await request(app)
      .get('/api/v1/informes/anios')
      .set(cookie(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([2026, 2025, 2024]);
  });

  it('200 — sin datos devuelve array vacío', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/v1/informes/anios')
      .set(cookie(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
