-- Migration 027: Convierte precio_2026 y precio_regulado de VARCHAR a DECIMAL(12,2)
-- Paso 1: agrega columnas DECIMAL temporales
ALTER TABLE catalogo_items
  ADD COLUMN precio_2026_new     DECIMAL(12,2) DEFAULT NULL,
  ADD COLUMN precio_regulado_new DECIMAL(12,2) DEFAULT NULL;

-- Paso 2: copia solo los valores numericos validos; el resto queda en NULL
SET SQL_SAFE_UPDATES = 0;
UPDATE catalogo_items
SET
  precio_2026_new = CASE
    WHEN precio_2026 REGEXP '^[0-9]+(\\.[0-9]+)?$' THEN CAST(precio_2026 AS DECIMAL(12,2))
    ELSE NULL
  END,
  precio_regulado_new = CASE
    WHEN precio_regulado REGEXP '^[0-9]+(\\.[0-9]+)?$' THEN CAST(precio_regulado AS DECIMAL(12,2))
    ELSE NULL
  END
WHERE id >= 0;
SET SQL_SAFE_UPDATES = 1;

-- Paso 3: elimina las columnas VARCHAR originales
ALTER TABLE catalogo_items
  DROP COLUMN precio_2026,
  DROP COLUMN precio_regulado;

-- Paso 4: renombra las nuevas columnas al nombre original
ALTER TABLE catalogo_items
  CHANGE COLUMN precio_2026_new     precio_2026     DECIMAL(12,2) DEFAULT NULL,
  CHANGE COLUMN precio_regulado_new precio_regulado DECIMAL(12,2) DEFAULT NULL;
