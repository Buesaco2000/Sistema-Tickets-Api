/**
 * Tickets — Integration tests (Jest + Supertest)
 * Escenarios hospitalarios:
 *   • Ventilador fuera de servicio (ticket CRITICA)
 *   • Ruptura de cadena frío (ticket ALTA)
 *   • Auditoría INVIMA (asignación multi-usuario)
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

const JWT_SECRET = 'test_secret_key_256_bits_minimum_length';

const makeToken = (overrides = {}) =>
  jwt.sign(
    { id: 5, empresa_id: 1, rol_id: 2, email: 'ing@ips.co', ...overrides },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

const cookie = (t) => ({ Cookie: `accessToken=${t}` });

// resetAllMocks limpia también la cola de mockResolvedValueOnce
afterEach(() => jest.resetAllMocks());

// ─────────────────────────────────────────────────────────────
// SUITE 1 — Ventilador fuera de servicio (ticket CRITICA)
// ─────────────────────────────────────────────────────────────
describe('Escenario: Ventilador fuera de servicio (ticket CRITICA)', () => {
  const token = makeToken({ rol_id: 2 });

  const ticketVentilador = {
    titulo:                 'Ventilador mecánico MAQUET fuera de servicio — UCI',
    municipio_incidente_id: 1,
    tipo_soporte_id:        1,
    equipo_id:              42,
    estado_id:              1,
    prioridad:              'CRITICA',
  };

  it('201 — crea ticket CRITICA correctamente', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 42 }]]); // equipo en empresa

    const conn = {
      beginTransaction: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce([{ insertId: 100 }])  // INSERT ticket
        .mockResolvedValueOnce([{}]),                  // INSERT historial
      commit: jest.fn(), rollback: jest.fn(), release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    // findById post-insert
    pool.query.mockResolvedValueOnce([[{
      id: 100, titulo: ticketVentilador.titulo, prioridad: 'CRITICA', estado: 'Abierto',
    }]]);

    const res = await request(app)
      .post('/api/v1/tickets')
      .set(cookie(token))
      .send(ticketVentilador);

    expect(res.status).toBe(201);
    expect(res.body.data.prioridad).toBe('CRITICA');
    expect(res.body.data.titulo).toContain('Ventilador');
  });

  it('403 — equipo de otra empresa rechazado', async () => {
    pool.query.mockResolvedValueOnce([[]]); // equipo no existe en empresa

    const res = await request(app)
      .post('/api/v1/tickets')
      .set(cookie(token))
      .send(ticketVentilador);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('empresa');
  });

  it('400 — ticket sin título rechazado por Zod', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .set(cookie(token))
      .send({ ...ticketVentilador, titulo: '' });

    expect(res.status).toBe(400);
  });

  it('400 — ticket sin título (campo ausente) rechazado por Zod', async () => {
    const { titulo, ...sinTitulo } = ticketVentilador;
    const res = await request(app)
      .post('/api/v1/tickets')
      .set(cookie(token))
      .send(sinTitulo);

    expect(res.status).toBe(400);
  });

  it('401 — sin autenticación rechazado', async () => {
    const res = await request(app)
      .post('/api/v1/tickets')
      .send(ticketVentilador);

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 2 — Ruptura de cadena frío
// ─────────────────────────────────────────────────────────────
describe('Escenario: Ruptura de cadena frío — nevera de vacunas (ticket ALTA)', () => {
  const token = makeToken({ rol_id: 3, id: 8 }); // SALUD

  const ticketCadenaFrio = {
    titulo:                 'Nevera de vacunas temperatura fuera de rango — +8°C detectado',
    municipio_incidente_id: 2,
    tipo_soporte_id:        1,
    equipo_id:              17,
    estado_id:              1,
    prioridad:              'ALTA',
  };

  it('201 — personal de salud puede crear ticket de equipo', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 17 }]]);

    const conn = {
      beginTransaction: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce([{ insertId: 101 }])
        .mockResolvedValueOnce([{}]),
      commit: jest.fn(), rollback: jest.fn(), release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);

    pool.query.mockResolvedValueOnce([[{
      id: 101, titulo: ticketCadenaFrio.titulo, prioridad: 'ALTA', estado: 'Abierto',
    }]]);

    const res = await request(app)
      .post('/api/v1/tickets')
      .set(cookie(token))
      .send(ticketCadenaFrio);

    expect(res.status).toBe(201);
    expect(res.body.data.prioridad).toBe('ALTA');
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 3 — Auditoría INVIMA — asignación de usuarios
// ─────────────────────────────────────────────────────────────
describe('Escenario: Auditoría INVIMA — asignación de usuarios', () => {
  const tokenAdmin = makeToken({ rol_id: 1, id: 1 });

  it('200 — asigna usuario válido de la misma empresa', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 55, titulo: 'Auditoría INVIMA UCI' }]]) // findById
      .mockResolvedValueOnce([[{ id: 20 }]])                                  // user en empresa
      .mockResolvedValueOnce([{}]);                                            // INSERT ticket_usuarios

    const res = await request(app)
      .post('/api/v1/tickets/55/usuarios')
      .set(cookie(tokenAdmin))
      .send({ user_id: 20, rol_ticket_id: 2 });

    expect(res.status).toBe(200);
  });

  it('403 — no puede asignar usuario de empresa diferente', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 55, titulo: 'Auditoría INVIMA UCI' }]]) // findById
      .mockResolvedValueOnce([[]]); // usuario no existe en empresa

    const res = await request(app)
      .post('/api/v1/tickets/55/usuarios')
      .set(cookie(tokenAdmin))
      .send({ user_id: 999, rol_ticket_id: 2 });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('empresa');
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 4 — Paginación y filtros
// ─────────────────────────────────────────────────────────────
describe('GET /api/v1/tickets — filtros y paginación', () => {
  const token = makeToken();

  it('200 — retorna lista paginada con campo pagination', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 3 }]])
      .mockResolvedValueOnce([[
        { id: 1, titulo: 'Ticket A', prioridad: 'MEDIA' },
        { id: 2, titulo: 'Ticket B', prioridad: 'ALTA'  },
        { id: 3, titulo: 'Ticket C', prioridad: 'BAJA'  },
      ]]);

    const res = await request(app)
      .get('/api/v1/tickets?page=1&limit=10')
      .set(cookie(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination.total).toBe(3); // paginated() usa "pagination" no "meta"
  });

  it('200 — filtra por prioridad=CRITICA', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 1 }]])
      .mockResolvedValueOnce([[{ id: 100, titulo: 'Ventilador', prioridad: 'CRITICA' }]]);

    const res = await request(app)
      .get('/api/v1/tickets?prioridad=CRITICA')
      .set(cookie(token));

    expect(res.status).toBe(200);
    expect(res.body.data[0].prioridad).toBe('CRITICA');
  });

  it('aislamiento: query siempre incluye empresa_id del token', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 0 }]])
      .mockResolvedValueOnce([[]]);

    await request(app)
      .get('/api/v1/tickets')
      .set(cookie(token));

    const sql    = pool.query.mock.calls[0][0];
    const params = pool.query.mock.calls[0][1];
    expect(sql).toMatch(/empresa_id/);
    expect(params[0]).toBe(1); // empresa_id del JWT
  });
});
