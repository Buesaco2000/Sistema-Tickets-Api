ALTER TABLE items_recepcion_inventario
    ADD COLUMN autorizacion_uso TINYINT(1) NULL DEFAULT NULL
        AFTER estado_registro;

CREATE INDEX idx_recepcion_autorizacion ON items_recepcion_inventario(autorizacion_uso);
