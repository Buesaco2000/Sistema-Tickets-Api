CREATE TABLE IF NOT EXISTS stock_minimo_punto (
  id              INT           NOT NULL AUTO_INCREMENT,
  empresa_id      INT           NOT NULL,
  catalogo_id     INT           NOT NULL,
  municipio_id    INT               NULL,   -- NULL = aplica a todos los municipios
  sede_id         INT               NULL,   -- NULL = aplica al municipio sin sede específica
  stock_minimo    INT           NOT NULL DEFAULT 1,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Un solo mínimo por combinación empresa + producto + ubicación
  UNIQUE KEY uk_minimo_punto (empresa_id, catalogo_id, municipio_id, sede_id),
  CONSTRAINT fk_smp_empresa   FOREIGN KEY (empresa_id)   REFERENCES empresas(id),
  CONSTRAINT fk_smp_catalogo  FOREIGN KEY (catalogo_id)  REFERENCES catalogo_items(id),
  CONSTRAINT fk_smp_municipio FOREIGN KEY (municipio_id) REFERENCES municipios(id),
  CONSTRAINT fk_smp_sede      FOREIGN KEY (sede_id)      REFERENCES sedes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_smp_empresa_catalogo ON stock_minimo_punto (empresa_id, catalogo_id);
