-- Agrega estado BORRADOR/COMPLETADA a recepciones_medicamentos
-- BORRADOR: guardado parcial, NO aparece en inventario ni afecta stock
-- COMPLETADA: recepción finalizada (comportamiento actual)

ALTER TABLE recepciones_medicamentos
  ADD COLUMN estado ENUM('BORRADOR','COMPLETADA') NOT NULL DEFAULT 'COMPLETADA'
  AFTER responsable_recibe;

-- Índice para que la búsqueda del borrador del usuario sea rápida
CREATE INDEX idx_recep_estado_user ON recepciones_medicamentos (created_by, estado);
