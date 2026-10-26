-- Conecta responsable_recibe con un usuario real del sistema
ALTER TABLE recepciones_inventario
  ADD COLUMN responsable_recibe_id INT NULL,
  ADD CONSTRAINT fk_recepcion_responsable
    FOREIGN KEY (responsable_recibe_id) REFERENCES users(id) ON DELETE SET NULL;
