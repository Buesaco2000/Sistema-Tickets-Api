-- Módulo de ajustes de inventario (corrección formal de stock)
-- Permite a ADMIN y Almacén corregir stock con concepto y trazabilidad completa.
-- cantidad puede ser positivo (ingreso por ajuste) o negativo (reducción por ajuste).

CREATE TABLE IF NOT EXISTS ajustes_inventario (
  id          INT          NOT NULL AUTO_INCREMENT,
  empresa_id  INT          NOT NULL,
  item_id     INT          NOT NULL,
  cantidad    INT          NOT NULL,
  concepto    ENUM(
    'DIFERENCIA_INVENTARIO',
    'DETERIORO',
    'PERDIDA',
    'BAJA',
    'CORRECCION'
  )            NOT NULL,
  motivo      TEXT         NOT NULL,
  creado_por  INT          NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_aj_item    (item_id),
  KEY idx_aj_empresa (empresa_id),
  CONSTRAINT fk_aj_item    FOREIGN KEY (item_id)   REFERENCES items_recepcion_inventario(id),
  CONSTRAINT fk_aj_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
  CONSTRAINT fk_aj_creado  FOREIGN KEY (creado_por) REFERENCES users(id)
);

--mysql -u root -p soporte < Backend/migrations/015_ajustes_inventario.sql
