-- Paso 1: conservar solo el token mas reciente por usuario (el de mayor id)
SET SQL_SAFE_UPDATES = 0;
DELETE FROM refresh_tokens
WHERE id NOT IN (
  SELECT max_id FROM (
    SELECT MAX(id) AS max_id FROM refresh_tokens GROUP BY user_id
  ) AS latest
);
SET SQL_SAFE_UPDATES = 1;

-- Paso 2: reemplazar indice (idx_rt_user queda redundante con uq_user sobre la misma columna)
ALTER TABLE refresh_tokens
  DROP INDEX uq_user_device,
  DROP INDEX idx_rt_user,
  ADD UNIQUE KEY uq_user (user_id);
