-- Inventario valorizado: agrega precio_unitario a items_recepcion_inventario
-- Permite calcular el valor total del stock (stock × precio_unitario).

ALTER TABLE items_recepcion_inventario
  ADD COLUMN precio_unitario DECIMAL(12,2) DEFAULT NULL
    COMMENT 'Precio unitario de compra (COP). NULL si no aplica.'
  AFTER cant_faltante;

-- Índice opcional para reportes de valorización por rango de precio
ALTER TABLE items_recepcion_inventario
  ADD INDEX idx_precio_unitario (precio_unitario);

-- Ejecución:
-- mysql -u root -p soporte < Backend/migrations/016_precio_unitario.sql
