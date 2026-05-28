-- ============================================================
-- TABLA: dispensaciones
-- ============================================================
-- Una dispensación es una asignación de medicamentos que el
-- Director Técnico hace a una persona específica (destinatario).
-- NO descuenta stock; solo lleva trazabilidad de ubicación.
-- El stock real se descuenta cuando el destinatario hace una salida.
--
-- Columnas:
--   tipo            → KIT | URGENCIAS | HOSPITALIZACION | CARRO_PARO
--   municipio_id    → municipio donde ocurre la dispensación
--   director_id     → usuario que crea la dispensación (Director Técnico)
--   destinatario_id → usuario que recibe la dispensación
--   estado          → PENDIENTE (sin aceptar) | ACEPTADO | RECHAZADO
--   observaciones   → nota opcional del Director al crear
--   aceptado_por    → nombre del destinatario al confirmar
--   fecha_aceptacion→ timestamp de cuando fue aceptada
-- ============================================================
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

-- ============================================================
-- TABLA: dispensacion_items
-- ============================================================
-- Cada fila es un medicamento dentro de una dispensación.
-- item_id apunta al ítem del inventario recepcionado.
-- Guardamos nombre, lote y fecha_vencimiento directamente
-- para que queden en el historial aunque el ítem cambie.
-- ============================================================
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
