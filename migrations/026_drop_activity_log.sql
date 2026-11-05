-- Migration 026: Elimina la tabla activity_log (vestigio sin uso)
-- La tabla fue sustituida completamente por audit_log, que tiene:
--   datos_anteriores/datos_nuevos JSON, enum de acciones, request_id, ip, user_agent
--   e indices en (empresa_id, created_at), (usuario_id), (tabla, registro_id)
-- Ningun archivo en Backend/src escribe ni lee activity_log.
-- Indices agregados en migration 024 tambien se eliminan con la tabla.

DROP TABLE IF EXISTS activity_log;
