-- Estado para salidas (los traslados empiezan PENDIENTE, resto ACTIVO)
ALTER TABLE salidas_medicamentos
  ADD COLUMN estado ENUM('ACTIVO','PENDIENTE','RECHAZADO') NOT NULL DEFAULT 'ACTIVO'
  AFTER responsable;

-- Tabla de traslados pendientes de confirmación
CREATE TABLE traslados_pendientes (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id           INT NOT NULL,
  salida_id            INT UNSIGNED NOT NULL,
  item_id              INT NOT NULL,
  cantidad             INT UNSIGNED NOT NULL,
  medicamento_nombre   VARCHAR(255) NOT NULL,
  responsable_origen   VARCHAR(150) NOT NULL,
  municipio_origen_id  INT NULL,
  sede_origen_id       INT NULL,
  municipio_destino_id INT NULL,
  sede_destino_id      INT NULL,
  estado               ENUM('PENDIENTE','CONFIRMADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  recepcion_destino_id INT NULL,
  confirmado_por       VARCHAR(150) NULL,
  fecha_confirmacion   TIMESTAMP NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salida_id)   REFERENCES salidas_medicamentos(id),
  FOREIGN KEY (empresa_id)  REFERENCES empresa(id),
  FOREIGN KEY (municipio_destino_id) REFERENCES municipios(id),
  FOREIGN KEY (sede_destino_id)      REFERENCES sedes(id)
) ENGINE=InnoDB;
