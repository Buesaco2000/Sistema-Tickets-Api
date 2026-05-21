/**
 * Pruebas de Carga — k6
 * https://k6.io/docs/
 *
 * Instalar k6 en Windows:
 *   winget install k6 --source winget
 *
 * Ejecutar:
 *   k6 run tests/load/load.k6.js
 *
 * Ejecutar con entorno de staging (100 VUs, 5 min):
 *   k6 run --vus 100 --duration 5m tests/load/load.k6.js
 *
 * Escenarios hospitalarios cubiertos:
 *   1. Login masivo — turno de mañana, 40 usuarios ingresan al sistema
 *   2. Consulta de inventario — revisión rápida de medicamentos
 *   3. Creación de tickets — reportes de fallas de equipos
 *   4. Consulta de mantenimientos preventivos
 */

import http  from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ── Métricas personalizadas ───────────────────────────────────
const loginErrors      = new Rate('login_errors');
const ticketErrors     = new Rate('ticket_creation_errors');
const inventoryLatency = new Trend('inventory_latency', true);
const ticketsCreated   = new Counter('tickets_created');

// ── Configuración de escenarios ───────────────────────────────
export const options = {
  scenarios: {
    // Escenario 1: Turno de mañana — login masivo (ramp-up)
    turno_manana: {
      executor:  'ramping-vus',
      startVUs:  0,
      stages: [
        { duration: '30s', target: 40  }, // 40 usuarios entrando
        { duration: '2m',  target: 40  }, // carga sostenida
        { duration: '30s', target: 0   }, // rampa de bajada
      ],
      gracefulRampDown: '10s',
    },
    // Escenario 2: Pico de emergencia — 10 tickets CRITICA simultáneos
    pico_emergencia: {
      executor:  'constant-vus',
      vus:       10,
      duration:  '1m',
      startTime: '3m30s', // inicia cuando termina el turno de mañana
    },
  },
  thresholds: {
    // 95% de peticiones < 500 ms
    'http_req_duration':           ['p(95)<500'],
    // Login: p99 < 1s
    'http_req_duration{name:login}': ['p(99)<1000'],
    // Tasa de errores login < 1%
    'login_errors':                 ['rate<0.01'],
    // Tasa de errores tickets < 2%
    'ticket_creation_errors':       ['rate<0.02'],
    // Inventario p95 < 300 ms
    'inventory_latency':            ['p(95)<300'],
  },
};

// ── Variables de entorno (configurar antes de ejecutar) ───────
const BASE_URL    = __ENV.BASE_URL    || 'http://localhost:3000/api/v1';
const EMPRESA_ID  = Number(__ENV.EMPRESA_ID  || '1');
const TEST_EMAIL  = __ENV.TEST_EMAIL  || 'ingeniero@hospital.co';
const TEST_PASS   = __ENV.TEST_PASS   || 'Seguro1234!';

// ── Flujo principal ───────────────────────────────────────────
export default function () {
  let accessCookie = '';

  // ── Grupo 1: Autenticación ────────────────────────────────
  group('login', () => {
    const payload = JSON.stringify({
      email:      TEST_EMAIL,
      password:   TEST_PASS,
      empresa_id: EMPRESA_ID,
    });

    const res = http.post(`${BASE_URL}/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags:    { name: 'login' },
    });

    const ok = check(res, {
      'login: status 200':       (r) => r.status === 200,
      'login: tiene cookie':     (r) => r.headers['Set-Cookie'] !== undefined,
      'login: body.success true':(r) => JSON.parse(r.body).success === true,
    });

    loginErrors.add(!ok);

    if (res.status === 200) {
      // Extraer accessToken de la cookie Set-Cookie
      const setCookie = res.headers['Set-Cookie'] || '';
      const match = setCookie.match(/accessToken=([^;]+)/);
      if (match) accessCookie = match[1];
    }
  });

  if (!accessCookie) return; // si no pudo logear, no continúa

  const authHeaders = {
    headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${accessCookie}` },
  };

  sleep(0.5);

  // ── Grupo 2: Consulta de inventario (GET items) ───────────
  group('inventario', () => {
    const start = Date.now();
    const res   = http.get(`${BASE_URL}/recepciones/medicamentos/items`, {
      ...authHeaders,
      tags: { name: 'inventario' },
    });
    inventoryLatency.add(Date.now() - start);

    check(res, {
      'inventario: status 200':  (r) => r.status === 200,
      'inventario: array data':  (r) => {
        try { return Array.isArray(JSON.parse(r.body).data); }
        catch { return false; }
      },
    });
  });

  sleep(0.3);

  // ── Grupo 3: Consulta de tickets ──────────────────────────
  group('tickets_list', () => {
    const res = http.get(`${BASE_URL}/tickets?page=1&limit=20`, {
      ...authHeaders,
      tags: { name: 'tickets_list' },
    });

    check(res, {
      'tickets list: status 200': (r) => r.status === 200,
      'tickets list: paginado':   (r) => {
        try { return JSON.parse(r.body).meta !== undefined; }
        catch { return false; }
      },
    });
  });

  sleep(0.2);

  // ── Grupo 4: Creación de ticket de falla (emergencia) ─────
  group('crear_ticket', () => {
    const ticket = JSON.stringify({
      titulo:                 `Falla equipo VU-${__VU} iter-${__ITER}`,
      municipio_incidente_id: 1,
      tipo_soporte_id:        1,
      equipo_id:              null,
      estado_id:              1,
      prioridad:              'MEDIA',
    });

    const res = http.post(`${BASE_URL}/tickets`, ticket, {
      ...authHeaders,
      tags: { name: 'crear_ticket' },
    });

    const ok = check(res, {
      'ticket: creado 201': (r) => r.status === 201,
      'ticket: tiene id':   (r) => {
        try { return JSON.parse(r.body).data?.id !== undefined; }
        catch { return false; }
      },
    });

    ticketErrors.add(!ok);
    if (ok) ticketsCreated.add(1);
  });

  sleep(1);

  // ── Grupo 5: Health check ─────────────────────────────────
  group('health', () => {
    const res = http.get(`${BASE_URL.replace('/api/v1', '')}/health`);
    check(res, {
      'health: ok': (r) => r.status === 200 && JSON.parse(r.body).status === 'ok',
    });
  });

  sleep(0.5);
}

// ── Resumen al final ──────────────────────────────────────────
export function handleSummary(data) {
  return {
    'tests/load/resultado_k6.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
  };
}

// Helper inline (evita importar k6/x/summary en entornos sin extensión)
function textSummary(data, opts = {}) {
  const indent = opts.indent || '';
  const lines  = [`${indent}─── Resumen k6 ───`];
  for (const [metric, val] of Object.entries(data.metrics)) {
    if (val.type === 'trend') {
      lines.push(`${indent}${metric}: avg=${val.values.avg?.toFixed(1)}ms p95=${val.values['p(95)']?.toFixed(1)}ms`);
    } else if (val.type === 'rate') {
      lines.push(`${indent}${metric}: ${(val.values.rate * 100).toFixed(2)}%`);
    } else if (val.type === 'counter') {
      lines.push(`${indent}${metric}: ${val.values.count}`);
    }
  }
  return lines.join('\n');
}
