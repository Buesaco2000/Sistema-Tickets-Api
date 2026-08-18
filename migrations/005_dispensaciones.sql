-- TABLA: dispensaciones
CREATE TABLE dispensaciones (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id        INT NOT NULL,
  tipo              ENUM('KIT','URGENCIAS','HOSPITALIZACION','CARRO_PARO') NOT NULL,
  municipio_id      INT NOT NULL,
  director_id       INT NOT NULL,
  destinatario_id   INT NOT NULL,
  estado            ENUM('PENDIENTE','ACEPTADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  observaciones     TEXT NULL,
  aceptado_por      VARCHAR(150) NULL,
  fecha_aceptacion  TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (empresa_id)      REFERENCES empresa(id),
  FOREIGN KEY (municipio_id)    REFERENCES municipios(id),
  FOREIGN KEY (director_id)     REFERENCES users(id),
  FOREIGN KEY (destinatario_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- TABLA: dispensacion_items
CREATE TABLE dispensacion_items (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  dispensacion_id     INT NOT NULL,
  item_id             INT NOT NULL,
  medicamento_nombre  VARCHAR(255) NOT NULL,
  cantidad            INT UNSIGNED NOT NULL,
  lote                VARCHAR(100) NULL,
  fecha_vencimiento   DATE NULL,

  FOREIGN KEY (dispensacion_id) REFERENCES dispensaciones(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id)         REFERENCES items_recepcion_medicamentos(id)
) ENGINE=InnoDB;
