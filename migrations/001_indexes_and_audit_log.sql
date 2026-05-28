-- ─────────────────────────────────────────────────────────────────────────────
-- Migración 001 — Índices de performance + tabla audit_log
-- Ejecutar una sola vez contra la BD de producción.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── PERF-03: Índices faltantes ────────────────────────────────────────────────

-- dispensaciones: filtros de listar() y aceptar/rechazar
ALTER TABLE dispensaciones
  ADD INDEX IF NOT EXISTS idx_disp_director    (director_id),
  ADD INDEX IF NOT EXISTS idx_disp_destinatario (destinatario_id),
  ADD INDEX IF NOT EXISTS idx_disp_empresa_estado (empresa_id, estado);

-- salidas_medicamentos: stock calculation (usado en CADA query de inventario)
ALTER TABLE salidas_medicamentos
  ADD INDEX IF NOT EXISTS idx_salidas_item_estado (item_id, estado);

-- dispensacion_items: subquery dispensacion_activa + crear dispensacion
ALTER TABLE dispensacion_items
  ADD INDEX IF NOT EXISTS idx_dispitems_item (item_id);

-- password_reset_tokens: lookup por token hash
ALTER TABLE password_reset_tokens
  ADD INDEX IF NOT EXISTS idx_prt_token (token);

-- ticket_historial_estado: consultas de historial
ALTER TABLE ticket_historial_estado
  ADD INDEX IF NOT EXISTS idx_thist_ticket (ticket_id);

-- traslados_pendientes: filtros por municipio destino
ALTER TABLE traslados_pendientes
  ADD INDEX IF NOT EXISTS idx_traslados_muni_dest (municipio_destino_id, estado);

