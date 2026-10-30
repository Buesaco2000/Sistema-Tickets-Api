-- Conteo físico de inventario
CREATE TABLE IF NOT EXISTS conteos_fisicos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id    INT     NOT NULL,
  municipio_id  INT,
  sede_id       INT,
  fecha         DATE    NOT NULL,
  estado        ENUM('EN_PROGRESO','CERRADO') NOT NULL DEFAULT 'EN_PROGRESO',
  observaciones TEXT,
  created_by    INT     NOT NULL,
  closed_by     INT,
  closed_at     DATETIME,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (empresa_id)   REFERENCES empresa(id),
  FOREIGN KEY (municipio_id) REFERENCES municipios(id),
  FOREIGN KEY (sede_id)      REFERENCES sedes(id),
  FOREIGN KEY (created_by)   REFERENCES users(id),
  FOREIGN KEY (closed_by)    REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ítems del conteo con snapshot de stock
CREATE TABLE IF NOT EXISTS conteo_items (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  conteo_id        INT NOT NULL,
  item_id          INT NOT NULL,
  stock_sistema    INT NOT NULL,           -- snapshot al momento de crear
  cantidad_contada INT,                    -- lo que el usuario registra
  estado           ENUM('PENDIENTE','CUADRADO','SOBRANTE','FALTANTE') NOT NULL DEFAULT 'PENDIENTE',
  observacion      VARCHAR(255),
  FOREIGN KEY (conteo_id) REFERENCES conteos_fisicos(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id)   REFERENCES items_recepcion_inventario(id),
  UNIQUE KEY uq_conteo_item (conteo_id, item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
