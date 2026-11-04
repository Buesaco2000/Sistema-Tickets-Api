-- Tabla de secuencias por empresa y año para consecutivos de recepciones
CREATE TABLE IF NOT EXISTS secuencias (
  empresa_id    INT          NOT NULL,
  anio          SMALLINT     NOT NULL,
  ultimo_valor  INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (empresa_id, anio)
) ENGINE=InnoDB;

-- Columna consecutivo en recepciones
ALTER TABLE recepciones_inventario
  ADD COLUMN consecutivo VARCHAR(20) NULL DEFAULT NULL AFTER id;

-- Índice para búsqueda rápida por consecutivo
CREATE INDEX idx_recepciones_consecutivo ON recepciones_inventario (empresa_id, consecutivo);

--mysql -u root -p soporte < Backend/migrations/019_consecutivo_recepciones.sql