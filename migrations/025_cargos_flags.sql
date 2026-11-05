DELIMITER //
DROP PROCEDURE IF EXISTS _apply_025 //
CREATE PROCEDURE _apply_025()
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'cargos'
      AND COLUMN_NAME  = 'es_almacen'
  ) THEN
    ALTER TABLE cargos
      ADD COLUMN es_almacen          TINYINT NOT NULL DEFAULT 0,
      ADD COLUMN es_director_tecnico TINYINT NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'cargos'
      AND COLUMN_NAME  = 'es_auxiliar'
  ) THEN
    ALTER TABLE cargos
      ADD COLUMN es_auxiliar TINYINT NOT NULL DEFAULT 0;
  END IF;

END //
DELIMITER ;

CALL _apply_025();
DROP PROCEDURE IF EXISTS _apply_025;


SET SQL_SAFE_UPDATES = 0;

UPDATE cargos
SET es_almacen = 1
WHERE LOWER(CONVERT(nombre USING utf8mb4)) LIKE '%almacen%'
   OR LOWER(CONVERT(nombre USING utf8mb4)) LIKE '%almacén%';

UPDATE cargos
SET es_director_tecnico = 1
WHERE LOWER(CONVERT(nombre USING utf8mb4)) LIKE '%director%tecnico%'
   OR LOWER(CONVERT(nombre USING utf8mb4)) LIKE '%director%técnico%';

UPDATE cargos
SET es_auxiliar = 1
WHERE LOWER(CONVERT(nombre USING utf8mb4)) LIKE '%auxiliar%';

SET SQL_SAFE_UPDATES = 1;
