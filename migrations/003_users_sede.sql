-- Agrega sede_id al perfil del usuario para filtrar inventario por sede
ALTER TABLE users
  ADD COLUMN sede_id INT NULL,
  ADD CONSTRAINT fk_users_sede FOREIGN KEY (sede_id) REFERENCES sedes(id);
