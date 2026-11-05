process.env.JWT_ACCESS_SECRET  = 'test_secret_key_256_bits_minimum_length';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_256_bits_minimum_length';
process.env.RESEND_API_KEY     = 're_test_dummy_key';

jest.mock('../../src/Utils/mailer.js', () => ({
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

const token = (overrides = {}) =>
  jwt.sign(
    {
      id: 1, empresa_id: 1, rol_id: 1,
      email: 'admin@suroriente.com',
      cargo: 'Almacen', municipio_id: null,
      ...overrides,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' },
  );

const hdr = (t) => ({ Cookie: `accessToken=${t}` });

afterEach(() => jest.resetAllMocks());

// -------------------------------------------------------------------------
// SUITE 1 - Bug: stock_actual llega como string desde MySQL GREATEST()
// Verifica que Number() previene la concatenacion de strings en ajustes
// -------------------------------------------------------------------------
describe('POST /ajustes-inventario — stock_actual como string (bug regresion)', () => {
  const url = '/api/v1/ajustes-inventario';
  const tk  = token({ cargo: 'Almacen', rol_id: 3 });

  it('stock_nuevo es numero, no string concatenado (ej: "103" vs 13)', async () => {
    // MySQL GREATEST() puede devolver "10" como string.
    // Sin Number(): "10" + 3 = "103". Con Number(): 10 + 3 = 13.
    pool.query
      .mockResolvedValueOnce([[{ id: 5, stock_actual: '10' }]])  // string deliberado
      .mockResolvedValueOnce([{ insertId: 42 }]);

    const res = await request(app)
      .post(url)
      .set(hdr(tk))
      .send({ item_id: 5, cantidad: 3, concepto: 'CORRECCION', motivo: 'Test de tipo numerico' });

    expect(res.status).toBe(201);
    expect(res.body.data.stock_nuevo).toBe(13);     // numero, no "103"
    expect(typeof res.body.data.stock_nuevo).toBe('number');
  });

  it('ajuste negativo con stock_actual string calcula correcto (ej: "10" - 4 = 6)', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 5, stock_actual: '10' }]])
      .mockResolvedValueOnce([{ insertId: 43 }]);

    const res = await request(app)
      .post(url)
      .set(hdr(tk))
      .send({ item_id: 5, cantidad: -4, concepto: 'PERDIDA', motivo: 'Medicamento perdido en bodega' });

    expect(res.status).toBe(201);
    expect(res.body.data.stock_nuevo).toBe(6);
    expect(typeof res.body.data.stock_nuevo).toBe('number');
  });

  it('ajuste negativo con stock_actual "3" rechaza cantidad -5 (quedaria en -2)', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 5, stock_actual: '3' }]]);

    const res = await request(app)
      .post(url)
      .set(hdr(tk))
      .send({ item_id: 5, cantidad: -5, concepto: 'BAJA', motivo: 'Dados de baja por vencimiento' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/[Ss]tock insuficiente/);
  });
});

// -------------------------------------------------------------------------
// SUITE 2 - Consecutivos: formato y aislamiento por empresa
// -------------------------------------------------------------------------
describe('POST /recepciones/medicamentos — consecutivo REC-YYYY-NNNN', () => {
  const url = '/api/v1/recepciones/medicamentos';
  const anio = new Date().getFullYear();

  const payloadBase = {
    fecha:              `${anio}-06-15`,
    hora:               '09:00',
    proveedor:          'Proveedor Test',
    remision_factura:   'FAC-001',
    responsable_recibe: 'Jefe Almacen',
    municipio_id:       1,
    medicamentos:       [],
  };

  const mockConn = (ultimoValor = 1, recepcionId = 10) => ({
    beginTransaction: jest.fn(),
    query: jest.fn()
      .mockResolvedValueOnce([{}])                      // INSERT secuencias ON DUPLICATE KEY
      .mockResolvedValueOnce([[{ val: ultimoValor }]])  // SELECT FOR UPDATE
      .mockResolvedValueOnce([{ insertId: recepcionId }]) // INSERT recepciones_inventario
      .mockResolvedValueOnce([[]])                      // SELECT id FROM items (_syncItems con medicamentos=[])
      ,
    commit:   jest.fn(),
    rollback: jest.fn(),
    release:  jest.fn(),
  });

  it('primer consecutivo de la empresa es REC-YYYY-0001', async () => {
    const conn = mockConn(1);
    pool.getConnection.mockResolvedValue(conn);
    // findById tras crear
    pool.query.mockResolvedValueOnce([[{
      id: 10, consecutivo: `REC-${anio}-0001`, estado: 'COMPLETADA',
      empresa_id: 1, municipio: 'Popayan',
    }]]).mockResolvedValueOnce([[]]); // items

    const res = await request(app)
      .post(url)
      .set(hdr(token()))
      .send(payloadBase);

    expect(res.status).toBe(201);

    // El INSERT de la recepcion debe incluir el consecutivo correcto
    const insertCall = conn.query.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('INSERT INTO recepciones_inventario'),
    );
    expect(insertCall).toBeDefined();
    const consecutivoInsertado = insertCall[1][1]; // segundo parametro del INSERT
    expect(consecutivoInsertado).toBe(`REC-${anio}-0001`);
  });

  it('decimo consecutivo se rellena a 4 digitos: REC-YYYY-0010', async () => {
    const conn = mockConn(10);
    pool.getConnection.mockResolvedValue(conn);
    pool.query.mockResolvedValueOnce([[{
      id: 11, consecutivo: `REC-${anio}-0010`, estado: 'COMPLETADA',
      empresa_id: 1, municipio: 'Popayan',
    }]]).mockResolvedValueOnce([[]]);

    const res = await request(app)
      .post(url)
      .set(hdr(token()))
      .send(payloadBase);

    expect(res.status).toBe(201);

    const insertCall = conn.query.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('INSERT INTO recepciones_inventario'),
    );
    expect(insertCall[1][1]).toBe(`REC-${anio}-0010`);
  });

  it('aislamiento: secuencias se consultan con empresa_id del JWT', async () => {
    const conn = mockConn(1);
    pool.getConnection.mockResolvedValue(conn);
    pool.query.mockResolvedValueOnce([[{
      id: 12, consecutivo: `REC-${anio}-0001`, estado: 'COMPLETADA',
      empresa_id: 5, municipio: 'Popayan',
    }]]).mockResolvedValueOnce([[]]);

    await request(app)
      .post(url)
      .set(hdr(token({ empresa_id: 5 })))
      .send(payloadBase);

    // El INSERT en secuencias debe usar empresa_id=5, no 1
    const insertSecuencia = conn.query.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('INSERT INTO secuencias'),
    );
    expect(insertSecuencia).toBeDefined();
    expect(insertSecuencia[1]).toContain(5); // empresa_id del token
    expect(insertSecuencia[1]).not.toContain(1);
  });

  it('usa FOR UPDATE en la lectura del valor para evitar duplicados concurrentes', async () => {
    const conn = mockConn(3);
    pool.getConnection.mockResolvedValue(conn);
    pool.query.mockResolvedValueOnce([[{
      id: 13, consecutivo: `REC-${anio}-0003`, estado: 'COMPLETADA',
      empresa_id: 1, municipio: 'Popayan',
    }]]).mockResolvedValueOnce([[]]);

    await request(app)
      .post(url)
      .set(hdr(token()))
      .send(payloadBase);

    const selectForUpdate = conn.query.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('FOR UPDATE'),
    );
    expect(selectForUpdate).toBeDefined();
  });
});
