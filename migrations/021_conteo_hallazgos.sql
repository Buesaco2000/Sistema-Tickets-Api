-- Hallazgos en conteo físico: ítems encontrados que no existen en el sistema
CREATE TABLE IF NOT EXISTS conteo_hallazgos (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  conteo_id        INT          NOT NULL,
  tipo_recepcion   ENUM('MEDICAMENTOS','LABORATORIO','MEDICO_QUIRURGICO','ASEO_PAPELERIA','ODONTOLOGIA') NOT NULL,
  nombre           VARCHAR(255) NOT NULL,
  lote             VARCHAR(100),
  fecha_vencimiento DATE,
  cantidad         INT          NOT NULL DEFAULT 0,
  observacion      VARCHAR(500),
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conteo_id) REFERENCES conteos_fisicos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- mysql -u root -p soporte < Backend/migrations/021_conteo_hallazgos.sql
