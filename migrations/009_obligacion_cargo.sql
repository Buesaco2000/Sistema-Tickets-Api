-- Agrega cargo_id a obligacion para filtrar informes por área/cargo
ALTER TABLE obligacion
    ADD COLUMN cargo_id INT NULL AFTER empresa_id,
    ADD CONSTRAINT fk_obligacion_cargo
        FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE SET NULL;

CREATE INDEX idx_obligacion_cargo ON obligacion(cargo_id);

INSERT IGNORE INTO cargos (nombre) VALUES 
('Planeación'), ('Subgerencia Administrativa Y Financiera'), ('Asesor(a) Externo(a)'), ('Facturación'), ('Presupuesto'), ('Producción'), 
('Calidad' ), ('Contratación'), ('Coordinadora APS'), ('Contabilidad'), ('Jefe Control Interno'), ('Gestión Ambiental - Calidad'),
('Coordinador PIC Departamental y Municipal'), ('Auditorias Cuentas Médicas');