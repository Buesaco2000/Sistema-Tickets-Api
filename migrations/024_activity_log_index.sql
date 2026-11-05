DELIMITER //
DROP PROCEDURE IF EXISTS _apply_024 //
CREATE PROCEDURE _apply_024()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'activity_log'
      AND INDEX_NAME   = 'idx_activity_empresa_fecha'
  ) THEN
    ALTER TABLE activity_log
      ADD INDEX idx_activity_empresa_fecha (empresa_id, created_at);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'activity_log'
      AND INDEX_NAME   = 'idx_activity_user'
  ) THEN
    ALTER TABLE activity_log
      ADD INDEX idx_activity_user (user_id);
  END IF;
END //
DELIMITER ;

CALL _apply_024();
DROP PROCEDURE IF EXISTS _apply_024;
