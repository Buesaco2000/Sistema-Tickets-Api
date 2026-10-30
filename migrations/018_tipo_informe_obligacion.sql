-- Agrega tipo_informe a obligacion para diferenciar informes normativos de obligatorios
ALTER TABLE obligacion
  ADD COLUMN tipo_informe ENUM('NORMATIVO','OBLIGATORIO','CONTRACTUAL') NOT NULL DEFAULT 'NORMATIVO'
  AFTER soporte_normativo;

INSERT IGNORE INTO cargos (nombre) VALUES
  ('Jefe de Archivo');