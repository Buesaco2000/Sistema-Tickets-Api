-- Recepción complementaria: referencia a la recepción padre
ALTER TABLE recepciones_inventario
  ADD COLUMN recepcion_padre_id INT NULL DEFAULT NULL AFTER consecutivo,
  ADD CONSTRAINT fk_recepcion_padre
    FOREIGN KEY (recepcion_padre_id) REFERENCES recepciones_inventario(id)
    ON DELETE SET NULL;

CREATE INDEX idx_recepciones_padre ON recepciones_inventario (recepcion_padre_id);

-- mysql -u root -p soporte < Backend/migrations/020_recepcion_complementaria.sql
