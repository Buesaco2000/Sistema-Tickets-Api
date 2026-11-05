USE soporte;

DELIMITER //
DROP PROCEDURE IF EXISTS _apply_022 //
CREATE PROCEDURE _apply_022()
BEGIN

  -- 1. Guard: titulo ya existe en tickets en el schema actual
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'tickets'
      AND COLUMN_NAME  = 'titulo'
  ) THEN
    ALTER TABLE tickets
      ADD COLUMN titulo VARCHAR(255) NOT NULL DEFAULT '' AFTER estado_id;
  END IF;

  -- 2. Guard: servicio/imagen_antes/imagen_despues/firma_* ya existen en mantenimientos_preventivos
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'mantenimientos_preventivos'
      AND COLUMN_NAME  = 'servicio'
  ) THEN
    ALTER TABLE mantenimientos_preventivos
      ADD COLUMN servicio        VARCHAR(150) NULL AFTER observaciones,
      ADD COLUMN imagen_antes    TEXT         NULL,
      ADD COLUMN imagen_despues  TEXT         NULL,
      ADD COLUMN firma_realizado TEXT         NULL,
      ADD COLUMN firma_aprobado  TEXT         NULL;
  END IF;

  -- 3. Guard: cant_recepcionada/lote/tipo_etiquetas ya existen en items_recepcion_inventario
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'items_recepcion_inventario'
      AND COLUMN_NAME  = 'cant_recepcionada'
  ) THEN
    ALTER TABLE items_recepcion_inventario
      ADD COLUMN cant_recepcionada INT        NULL AFTER cant_solicitada,
      ADD COLUMN lote              VARCHAR(50) NULL AFTER cant_faltante,
      ADD COLUMN tipo_etiquetas    VARCHAR(20) NULL AFTER etiquetas;
  END IF;

  -- 4. UNICA OPERACION REAL: renombrar indice en equipos_biomedicos.
  IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'equipos_biomedicos'
      AND INDEX_NAME   = 'serie'
  ) THEN
    ALTER TABLE equipos_biomedicos DROP INDEX serie;
  END IF;

  IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'equipos_biomedicos'
      AND INDEX_NAME   = 'uq_serie_empresa'
  ) THEN
    ALTER TABLE equipos_biomedicos DROP INDEX uq_serie_empresa;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'equipos_biomedicos'
      AND INDEX_NAME   = 'uq_equipo_serie_empresa'
  ) THEN
    ALTER TABLE equipos_biomedicos
      ADD UNIQUE INDEX uq_equipo_serie_empresa (serie, empresa_id);
  END IF;

END //
DELIMITER ;

CALL _apply_022();
DROP PROCEDURE IF EXISTS _apply_022;
