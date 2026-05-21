-- ============================================================
--  Migración 001 — Correcciones QA
--  Aplicar sobre la base de datos ya existente:
--    mysql -u root -p soporte < migrations/001_qa_fixes.sql
-- ============================================================

USE soporte;

-- ── 1. CRÍTICO-06: campo titulo en tickets ────────────────────
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS titulo VARCHAR(255) NOT NULL DEFAULT ''
  AFTER estado_id;

-- ── 2. ALTO-02: tablas de verificaciones preventivas ─────────
CREATE TABLE IF NOT EXISTS catalogo_verificacion_preventivo (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS verificacion_preventivo (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  preventivo_id            INT NOT NULL,
  catalogo_verificacion_id INT NOT NULL,
  UNIQUE (preventivo_id, catalogo_verificacion_id),
  FOREIGN KEY (preventivo_id)            REFERENCES mantenimientos_preventivos(id) ON DELETE CASCADE,
  FOREIGN KEY (catalogo_verificacion_id) REFERENCES catalogo_verificacion_preventivo(id) ON DELETE RESTRICT,
  INDEX idx_verif_prev (preventivo_id)
) ENGINE=InnoDB;

-- ── 3. Campos extra en mantenimientos_preventivos ─────────────
--    (si ya existen en tu BD real, MySQL los ignora con IF NOT EXISTS en ALTER)
ALTER TABLE mantenimientos_preventivos
  ADD COLUMN IF NOT EXISTS servicio        VARCHAR(150) NULL AFTER observaciones,
  ADD COLUMN IF NOT EXISTS imagen_antes    TEXT NULL,
  ADD COLUMN IF NOT EXISTS imagen_despues  TEXT NULL,
  ADD COLUMN IF NOT EXISTS firma_realizado TEXT NULL,
  ADD COLUMN IF NOT EXISTS firma_aprobado  TEXT NULL;

-- ── 4. Campos nuevos en items_recepcion_medicamentos ──────────
ALTER TABLE items_recepcion_medicamentos
  ADD COLUMN IF NOT EXISTS cant_recepcionada          INT         NULL AFTER cant_solicitada,
  ADD COLUMN IF NOT EXISTS lote                       VARCHAR(50) NULL AFTER cant_faltante,
  ADD COLUMN IF NOT EXISTS tipo_certificado_calidad   VARCHAR(20) NULL AFTER certificado_calidad,
  ADD COLUMN IF NOT EXISTS tipo_etiquetas             VARCHAR(20) NULL AFTER etiquetas;

-- ── 5. Seguridad: serie único por empresa (no global) ─────────
--    PRECAUCIÓN: si hay series duplicadas entre empresas, este ALTER fallará.
--    Verifica primero con:
--      SELECT serie, COUNT(*) FROM equipos_biomedicos
--        WHERE deleted_at IS NULL GROUP BY serie HAVING COUNT(*) > 1;
ALTER TABLE equipos_biomedicos
  DROP INDEX IF EXISTS serie,
  ADD UNIQUE INDEX uq_equipo_serie_empresa (serie, empresa_id);
