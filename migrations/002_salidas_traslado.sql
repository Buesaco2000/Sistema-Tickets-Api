-- Agrega destino de traslado a salidas de medicamentos
ALTER TABLE salidas_medicamentos
  ADD COLUMN municipio_destino_id INT NULL,
  ADD COLUMN sede_destino_id      INT NULL,
  ADD CONSTRAINT fk_salidas_municipio_dest FOREIGN KEY (municipio_destino_id) REFERENCES municipios(id),
  ADD CONSTRAINT fk_salidas_sede_dest      FOREIGN KEY (sede_destino_id)      REFERENCES sedes(id);
