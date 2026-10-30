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

const makeToken = (overrides = {}) =>
  jwt.sign(
    { id: 7, empresa_id: 1, rol_id: 3, email: 'salud@ips.co',
      nombres: 'Luis', apellidos: 'Parra', cargo: 'director tecnico', ...overrides },
    SECRET,
    { expiresIn: '1h' }
  );

const cookie = (t) => ({ Cookie: `accessToken=${t}` });

afterEach(() => jest.resetAllMocks());

//  SUITE 1: POST / 
describe('POST /api/v1/dispensaciones — crear', () => {
  const token = makeToken();

  const payload = {
    tipo:            'URGENCIAS',
    destinatario_id: 12,
    fecha:           '2026-10-01',
    observaciones:   'Entrega urgente',
    items: [{ item_id: 10, cantidad: 2 }],
  };

  it('201 — crea dispensación con stock suficiente', async () => {
    const conn = {
      beginTransaction: jest.fn(),
      query: jest.fn()
        // director profile
        .mockResolvedValueOnce([[{ municipio_id: 2, nombres: 'Luis', apellidos: 'Parra' }]])
        // INSERT cabecera
        .mockResolvedValueOnce([{ insertId: 55 }])
        // item stock query
        .mockResolvedValueOnce([[{
          id: 10, nombre: 'Amoxicilina 500mg', lote: 'L-001',
          fecha_vencimiento: '2027-01-01',
          cant_recepcionada: 20, total_salidas: 0, total_dispensado: 0,
        }]])
        // INSERT dispensacion_items
        .mockResolvedValueOnce([{}]),
      commit:   jest.fn(),
      rollback: jest.fn(),
      release:  jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    const res = await request(app)
      .post('/api/v1/dispensaciones')
      .set(cookie(token))
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(55);
  });

  it('400 — stock insuficiente lanza error descriptivo', async () => {
    const conn = {
      beginTransaction: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce([[{ municipio_id: 2, nombres: 'Luis', apellidos: 'Parra' }]])
        .mockResolvedValueOnce([{ insertId: 56 }])
        .mockResolvedValueOnce([[{
          id: 10, nombre: 'Amoxicilina 500mg', lote: 'L-001',
          fecha_vencimiento: '2027-01-01',
          cant_recepcionada: 1, total_salidas: 1, total_dispensado: 0, // stock = 0
        }]])
        .mockResolvedValueOnce([{}]),
      commit:   jest.fn(),
      rollback: jest.fn(),
      release:  jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    const res = await request(app)
      .post('/api/v1/dispensaciones')
      .set(cookie(token))
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/[Ss]tock/);
  });

  it('400 — ítem no encontrado', async () => {
    const conn = {
      beginTransaction: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce([[{ municipio_id: 2, nombres: 'Luis', apellidos: 'Parra' }]])
        .mockResolvedValueOnce([{ insertId: 57 }])
        .mockResolvedValueOnce([[]])  // ítem no existe → array vacío
        .mockResolvedValueOnce([{}]),
      commit:   jest.fn(),
      rollback: jest.fn(),
      release:  jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    const res = await request(app)
      .post('/api/v1/dispensaciones')
      .set(cookie(token))
      .send(payload);

    expect(res.status).toBe(404);
  });

  it('400 — payload sin items falla validación Zod', async () => {
    const conn = {
      beginTransaction: jest.fn(),
      query: jest.fn(),
      commit: jest.fn(), rollback: jest.fn(), release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    const res = await request(app)
      .post('/api/v1/dispensaciones')
      .set(cookie(makeToken()))
      .send({ tipo: 'URGENCIAS', destinatario_id: 12, fecha: '2026-10-01', items: [] });

    expect(res.status).toBe(400);
  });

  it('403 — INGENIERO no puede crear dispensaciones', async () => {
    const res = await request(app)
      .post('/api/v1/dispensaciones')
      .set(cookie(makeToken({ rol_id: 2 })))
      .send(payload);

    expect(res.status).toBe(403);
  });
});


//  SUITE 2: GET / 
describe('GET /api/v1/dispensaciones — listar', () => {
  it('200 — ADMIN recibe lista sin filtro municipio', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 2 }]])
      .mockResolvedValueOnce([[
        { id: 1, tipo: 'URGENCIAS', estado: 'ACEPTADO', total_items: 3 },
        { id: 2, tipo: 'KIT',       estado: 'PENDIENTE', total_items: 1 },
      ]]);

    const res = await request(app)
      .get('/api/v1/dispensaciones')
      .set(cookie(makeToken({ rol_id: 1 })));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('aislamiento — query lleva empresa_id del JWT', async () => {
    pool.query
      .mockResolvedValueOnce([[{ municipio_id: 3 }]])  // perfil usuario no-ADMIN
      .mockResolvedValueOnce([[{ total: 0 }]])
      .mockResolvedValueOnce([[]]);

    await request(app)
      .get('/api/v1/dispensaciones')
      .set(cookie(makeToken({ rol_id: 3 })));

    const sqlCount = pool.query.mock.calls[1][0];
    const params   = pool.query.mock.calls[1][1];
    expect(sqlCount).toMatch(/empresa_id/);
    expect(params[0]).toBe(1); // empresa_id del token
  });

  it('200 — no-ADMIN: query filtra por municipio del usuario', async () => {
    pool.query
      .mockResolvedValueOnce([[{ municipio_id: 5 }]])  // perfil del usuario
      .mockResolvedValueOnce([[{ total: 1 }]])
      .mockResolvedValueOnce([[{ id: 3, tipo: 'KIT', estado: 'PENDIENTE' }]]);

    await request(app)
      .get('/api/v1/dispensaciones')
      .set(cookie(makeToken({ rol_id: 3 })));

    const sqlCount = pool.query.mock.calls[1][0];
    const params   = pool.query.mock.calls[1][1];
    expect(sqlCount).toMatch(/municipio_id/);
    expect(params).toContain(5);
  });
});


//  SUITE 3: GET /:id 
describe('GET /api/v1/dispensaciones/:id — detalle', () => {
  it('200 — retorna cabecera + items', async () => {
    pool.query
      .mockResolvedValueOnce([[{
        id: 10, tipo: 'URGENCIAS', estado: 'ACEPTADO',
        director_nombre: 'Luis', director_apellidos: 'Parra',
        dest_nombre: 'Ana', dest_apellidos: 'Torres',
      }]])
      .mockResolvedValueOnce([[
        { id: 1, item_id: 10, medicamento_nombre: 'Amoxicilina', cantidad: 2 },
      ]]);

    const res = await request(app)
      .get('/api/v1/dispensaciones/10')
      .set(cookie(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });

  it('404 — dispensación no encontrada', async () => {
    pool.query
      .mockResolvedValueOnce([[]])  // sin resultado
      .mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/v1/dispensaciones/999')
      .set(cookie(makeToken()));

    expect(res.status).toBe(404);
  });
});


//  SUITE 4: POST /:id/aceptar 
describe('POST /api/v1/dispensaciones/:id/aceptar', () => {
  it('200 — destinatario acepta dispensación PENDIENTE', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 20, destinatario_id: 7, estado: 'PENDIENTE' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{}]); // audit log

    const res = await request(app)
      .post('/api/v1/dispensaciones/20/aceptar')
      .set(cookie(makeToken({ id: 7 })));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('403 — usuario que no es destinatario recibe 403', async () => {
    pool.query.mockResolvedValueOnce([[{
      id: 20, destinatario_id: 99, estado: 'PENDIENTE', // destinatario = 99, token.id = 7
    }]]);

    const res = await request(app)
      .post('/api/v1/dispensaciones/20/aceptar')
      .set(cookie(makeToken({ id: 7 })));

    expect(res.status).toBe(403);
  });

  it('400 — dispensación ya aceptada no puede aceptarse de nuevo', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 20, destinatario_id: 7, estado: 'ACEPTADO' }]]);

    const res = await request(app)
      .post('/api/v1/dispensaciones/20/aceptar')
      .set(cookie(makeToken({ id: 7 })));

    expect(res.status).toBe(400);
  });
});


//  SUITE 5: POST /:id/rechazar 
describe('POST /api/v1/dispensaciones/:id/rechazar', () => {
  it('200 — destinatario rechaza dispensación PENDIENTE', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 21, destinatario_id: 7, estado: 'PENDIENTE' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{}]);

    const res = await request(app)
      .post('/api/v1/dispensaciones/21/rechazar')
      .set(cookie(makeToken({ id: 7 })));

    expect(res.status).toBe(200);
  });

  it('403 — no destinatario recibe 403', async () => {
    pool.query.mockResolvedValueOnce([[{
      id: 21, destinatario_id: 99, estado: 'PENDIENTE',
    }]]);

    const res = await request(app)
      .post('/api/v1/dispensaciones/21/rechazar')
      .set(cookie(makeToken({ id: 7 })));

    expect(res.status).toBe(403);
  });
});


//  SUITE 6: GET /pendientes/mias 
describe('GET /api/v1/dispensaciones/pendientes/mias', () => {
  it('200 — retorna dispensaciones pendientes del usuario autenticado', async () => {
    pool.query.mockResolvedValueOnce([[
      { id: 5, tipo: 'KIT', total_items: 2, director_nombre: 'Luis Parra' },
    ]]);

    const res = await request(app)
      .get('/api/v1/dispensaciones/pendientes/mias')
      .set(cookie(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].tipo).toBe('KIT');
  });

  it('200 — sin pendientes devuelve array vacío', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/v1/dispensaciones/pendientes/mias')
      .set(cookie(makeToken()));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});
