CREATE TABLE ente_rector (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(160) NOT NULL UNIQUE,
  sigla      VARCHAR(30),
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE receptor (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(120) NOT NULL UNIQUE,
  url_portal VARCHAR(300),
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ESTADOS 
ALTER TABLE estados
  MODIFY scope ENUM('TICKET','MANTENIMIENTO','INFORME') NOT NULL;

INSERT INTO estados (nombre, scope) VALUES
  ('PENDIENTE',  'INFORME'),
  ('EN_PROCESO', 'INFORME'),
  ('PRESENTADO', 'INFORME'),
  ('VENCIDO',    'INFORME'),
  ('NO_APLICA',  'INFORME');

--  PERIODICIDAD 
CREATE TABLE periodicidad (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  codigo         VARCHAR(20)      NOT NULL UNIQUE,
  nombre         VARCHAR(60)      NOT NULL,
  meses_corte    JSON             NOT NULL,
  cortes_por_ano TINYINT UNSIGNED NOT NULL,
  activo         BOOLEAN          NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_meses_corte CHECK (JSON_VALID(meses_corte))
) ENGINE=InnoDB;

INSERT INTO periodicidad (codigo, nombre, meses_corte, cortes_por_ano) VALUES
  ('MENSUAL',       'Mensual',       '[1,2,3,4,5,6,7,8,9,10,11,12]', 12),
  ('BIMESTRAL',     'Bimestral',     '[2,4,6,8,10,12]',               6),
  ('TRIMESTRAL',    'Trimestral',    '[3,6,9,12]',                    4),
  ('CUATRIMESTRAL', 'Cuatrimestral', '[4,8,12]',                      3),
  ('SEMESTRAL',     'Semestral',     '[6,12]',                        2),
  ('ANUAL',         'Anual',         '[12]',                          1);

--  TIPO EVIDENCIA 
CREATE TABLE tipo_evidencia (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  codigo      VARCHAR(30)      NOT NULL UNIQUE,
  nombre      VARCHAR(80)      NOT NULL,
  descripcion TEXT,
  obligatorio BOOLEAN          NOT NULL DEFAULT FALSE,
  orden       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  icono       VARCHAR(40),
  activo      BOOLEAN          NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT INTO tipo_evidencia (codigo, nombre, obligatorio, orden) VALUES
  ('EVIDENCIA',         'Reporte presentado', TRUE,  1),
  ('ACUSE',             'Acuse de recibido',  TRUE,  2),
  ('SOPORTE_NORMATIVO', 'Sustento normativo', FALSE, 3);

--  OBLIGACION 
CREATE TABLE obligacion (
  id                INT AUTO_INCREMENT PRIMARY KEY,

  empresa_id        INT          NOT NULL,
  codigo            VARCHAR(20)  NOT NULL,
  ente_rector_id    INT          NOT NULL,
  receptor_id       INT          NOT NULL,
  periodicidad_id   INT          NOT NULL,

  nombre            VARCHAR(200) NOT NULL,
  soporte_normativo TEXT         NOT NULL,
  detalle           TEXT,

  dias_plazo        SMALLINT UNSIGNED NOT NULL,
  complejidad       TINYINT UNSIGNED  NOT NULL DEFAULT 1,  -- 1=baja … 5=muy alta
  dias_anticipacion SMALLINT UNSIGNED NOT NULL DEFAULT 30,

  area_elabora      VARCHAR(120),
  area_presenta     VARCHAR(120),
  responsable_id    INT NULL,
  suplente_id       INT NULL,

  activo     BOOLEAN  NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME  NULL,
  created_by INT NULL,
  updated_by INT NULL,

  UNIQUE KEY uq_obligacion_codigo (codigo, empresa_id),

  CONSTRAINT chk_complejidad CHECK (complejidad BETWEEN 1 AND 5),
  CONSTRAINT chk_dias_plazo  CHECK (dias_plazo  BETWEEN 1 AND 730),

  FOREIGN KEY (empresa_id)      REFERENCES empresa(id)       ON DELETE RESTRICT,
  FOREIGN KEY (ente_rector_id)  REFERENCES ente_rector(id)   ON DELETE RESTRICT,
  FOREIGN KEY (receptor_id)     REFERENCES receptor(id)      ON DELETE RESTRICT,
  FOREIGN KEY (periodicidad_id) REFERENCES periodicidad(id)  ON DELETE RESTRICT,
  FOREIGN KEY (responsable_id)  REFERENCES users(id)         ON DELETE SET NULL,
  FOREIGN KEY (suplente_id)     REFERENCES users(id)         ON DELETE SET NULL,
  FOREIGN KEY (created_by)      REFERENCES users(id)         ON DELETE SET NULL,
  FOREIGN KEY (updated_by)      REFERENCES users(id)         ON DELETE SET NULL,

  INDEX idx_oblig_empresa        (empresa_id),
  INDEX idx_oblig_empresa_vivo   (empresa_id, deleted_at),
  INDEX idx_oblig_empresa_activo (empresa_id, activo),
  INDEX idx_oblig_resp           (responsable_id),
  INDEX idx_oblig_ente           (ente_rector_id),
  INDEX idx_oblig_receptor       (receptor_id)
) ENGINE=InnoDB;

--  EJECUCION INFORME 
CREATE TABLE ejecucion_informe (
  id               INT AUTO_INCREMENT PRIMARY KEY,

  empresa_id       INT NOT NULL,
  obligacion_id    INT NOT NULL,
  estado_id        INT NOT NULL,

  etiqueta_corte   VARCHAR(20) NOT NULL,
  fecha_corte      DATE        NOT NULL,
  fecha_limite     DATE        NOT NULL,
  fecha_limite_orig DATE       NULL, 

  fecha_presentado DATETIME    NULL,
  presentado_por   INT         NULL,
  numero_radicado  VARCHAR(80) NULL,
  observaciones    TEXT,

  ticket_id        INT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME  NULL,
  created_by INT NULL,
  updated_by INT NULL,

  UNIQUE KEY uq_obligacion_corte (obligacion_id, etiqueta_corte),

  CONSTRAINT chk_limite_posterior CHECK (fecha_limite >= fecha_corte),

  FOREIGN KEY (empresa_id)     REFERENCES empresa(id)    ON DELETE RESTRICT,
  FOREIGN KEY (obligacion_id)  REFERENCES obligacion(id) ON DELETE CASCADE,
  FOREIGN KEY (estado_id)      REFERENCES estados(id)    ON DELETE RESTRICT,
  FOREIGN KEY (presentado_por) REFERENCES users(id)      ON DELETE SET NULL,
  FOREIGN KEY (ticket_id)      REFERENCES tickets(id)    ON DELETE SET NULL,
  FOREIGN KEY (created_by)     REFERENCES users(id)      ON DELETE SET NULL,
  FOREIGN KEY (updated_by)     REFERENCES users(id)      ON DELETE SET NULL,

  INDEX idx_ejec_empresa      (empresa_id),
  INDEX idx_ejec_empresa_vivo (empresa_id, deleted_at),
  INDEX idx_ejec_limite       (fecha_limite),
  INDEX idx_ejec_oblig        (obligacion_id),
  INDEX idx_ejec_pendientes   (empresa_id, estado_id, fecha_limite)
) ENGINE=InnoDB;

--  LOG DE CAMBIOS DE ESTADO 
CREATE TABLE ejecucion_informe_log (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  ejecucion_id    INT NOT NULL,
  estado_ant_id   INT NULL,
  estado_nuevo_id INT NOT NULL,
  cambiado_por    INT NULL,
  observacion     TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (ejecucion_id)    REFERENCES ejecucion_informe(id) ON DELETE CASCADE,
  FOREIGN KEY (estado_ant_id)   REFERENCES estados(id)           ON DELETE RESTRICT,
  FOREIGN KEY (estado_nuevo_id) REFERENCES estados(id)           ON DELETE RESTRICT,
  FOREIGN KEY (cambiado_por)    REFERENCES users(id)             ON DELETE SET NULL,

  INDEX idx_log_ejec (ejecucion_id),
  INDEX idx_log_user (cambiado_por)
) ENGINE=InnoDB;

-- EVIDENCIA INFORME 
CREATE TABLE evidencia_informe (
  id                INT AUTO_INCREMENT PRIMARY KEY,

  empresa_id        INT NOT NULL,
  ejecucion_id      INT NOT NULL,
  tipo_evidencia_id INT NOT NULL,

  nombre_original   VARCHAR(300)    NOT NULL,
  nombre_archivo    VARCHAR(300)    NOT NULL,
  ruta_relativa     VARCHAR(600)    NOT NULL,
  mime              VARCHAR(120),
  tamano_bytes      BIGINT UNSIGNED,
  hash_sha256       CHAR(64),

  CONSTRAINT chk_tamano CHECK (tamano_bytes IS NULL OR tamano_bytes <= 52428800),

  subido_por  INT      NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  deleted_by  INT      NULL,

  FOREIGN KEY (empresa_id)        REFERENCES empresa(id)            ON DELETE RESTRICT,
  FOREIGN KEY (ejecucion_id)      REFERENCES ejecucion_informe(id)  ON DELETE CASCADE,
  FOREIGN KEY (tipo_evidencia_id) REFERENCES tipo_evidencia(id)     ON DELETE RESTRICT,
  FOREIGN KEY (subido_por)        REFERENCES users(id)              ON DELETE SET NULL,
  FOREIGN KEY (deleted_by)        REFERENCES users(id)              ON DELETE SET NULL,

  INDEX idx_evid_ejec    (ejecucion_id),
  INDEX idx_evid_empresa (empresa_id),
  INDEX idx_evid_hash    (hash_sha256),
  INDEX idx_evid_tipo    (tipo_evidencia_id)
) ENGINE=InnoDB;

-- ALERTA INFORME 
CREATE TABLE alerta_informe (
  id            INT AUTO_INCREMENT PRIMARY KEY,

  empresa_id    INT NOT NULL,
  ejecucion_id  INT NOT NULL,
  hito_dias     SMALLINT NOT NULL,  
  canal         ENUM('EMAIL','WHATSAPP','SMS','INTERNA') NOT NULL DEFAULT 'EMAIL',
  destinatario  VARCHAR(200),       
  user_id       INT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_alerta (ejecucion_id, hito_dias, canal),

  CONSTRAINT chk_hito CHECK (hito_dias BETWEEN -365 AND 0),

  FOREIGN KEY (empresa_id)   REFERENCES empresa(id)           ON DELETE RESTRICT,
  FOREIGN KEY (ejecucion_id) REFERENCES ejecucion_informe(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)      REFERENCES users(id)             ON DELETE SET NULL,

  INDEX idx_alerta_ejec    (ejecucion_id),
  INDEX idx_alerta_empresa (empresa_id, created_at DESC)
) ENGINE=InnoDB;

-- TRIGGER 
DELIMITER $$

CREATE TRIGGER trg_ejec_log_estado
AFTER UPDATE ON ejecucion_informe
FOR EACH ROW
BEGIN
  IF NEW.estado_id != OLD.estado_id THEN
    INSERT INTO ejecucion_informe_log
      (ejecucion_id, estado_ant_id, estado_nuevo_id, cambiado_por)
    VALUES
      (NEW.id, OLD.estado_id, NEW.estado_id, @current_user_id);
  END IF;
END$$

DELIMITER ;
