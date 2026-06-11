-- ============================================================
--  Sistema de Tickets SurOriente — Schema completo
--  Ejecutar: mysql -u root -p soporte < schema.sql
--  (crea la base de datos si no existe)
-- ============================================================

CREATE DATABASE IF NOT EXISTS soporte
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE soporte;

SET FOREIGN_KEY_CHECKS = 0;

-- EMPRESA
CREATE TABLE IF NOT EXISTS empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- UBICACION
CREATE TABLE IF NOT EXISTS municipios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sedes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    municipio_id INT NOT NULL,
    empresa_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre, empresa_id),
    FOREIGN KEY (municipio_id) REFERENCES municipios(id) ON DELETE RESTRICT,
    FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
    INDEX idx_sede_municipio (municipio_id),
    INDEX idx_sede_empresa (empresa_id)
) ENGINE=InnoDB;

-- SEGURIDAD
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(150) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    empresa_id INT NOT NULL,
    rol_id INT,
    cargo_id INT,
    municipio_id INT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    created_by INT,
    updated_by INT,
    UNIQUE(email, empresa_id),
    FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL,
    FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE SET NULL,
    FOREIGN KEY (municipio_id) REFERENCES municipios(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_users_empresa (empresa_id),
    INDEX idx_users_empresa_activo (empresa_id, activo)
) ENGINE=InnoDB;

-- CATALOGOS
CREATE TABLE IF NOT EXISTS tipos_soporte (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    requiere_detalle BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS estados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    scope ENUM('TICKET','MANTENIMIENTO') NOT NULL,
    UNIQUE(nombre, scope)
) ENGINE=InnoDB;

-- Equipos biomédicos
CREATE TABLE IF NOT EXISTS tipos_equipo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS nivel_riesgo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clasificacion_riesgo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clasificacion_biomedica (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS frecuencia_mantenimiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS nivel_complejidad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fabricantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE,
  telefono VARCHAR(30) NULL,
  direccion VARCHAR(200) NULL,
  lugar VARCHAR(100) NULL,
  correo VARCHAR(100) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS equipos_biomedicos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  sede_id INT,
  municipio_id INT,
  tipo_equipo_id INT,
  fabricante_id INT NOT NULL,
  proveedor_id INT,
  nivel_riesgo_id INT,
  clasificacion_riesgo_id INT,
  clasificacion_biomedica_id INT,
  frecuencia_mantenimiento_id INT,
  nivel_complejidad_id INT,
  nombre VARCHAR(255) NOT NULL,
  activo_fijo VARCHAR(50),
  marca VARCHAR(100),
  modelo VARCHAR(100),
  serie VARCHAR(100) NOT NULL,
  codigo_ecri VARCHAR(50),
  registro_invima VARCHAR(100),
  ubicacion VARCHAR(255),
  costo_adquisicion DECIMAL(12,2),
  forma_adquisicion VARCHAR(100),
  fecha_compra DATE,
  fecha_instalacion DATE,
  inicio_garantia DATE,
  fecha_fin_garantia DATE,
  fecha_servicio DATE,
  imagen_url TEXT,
  descripcion TEXT,
  activo TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by INT,
  updated_by INT,
  UNIQUE(serie),
  FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
  FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL,
  FOREIGN KEY (municipio_id) REFERENCES municipios(id) ON DELETE SET NULL,
  FOREIGN KEY (tipo_equipo_id) REFERENCES tipos_equipo(id) ON DELETE SET NULL,
  FOREIGN KEY (fabricante_id) REFERENCES fabricantes(id) ON DELETE RESTRICT,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
  FOREIGN KEY (nivel_riesgo_id) REFERENCES nivel_riesgo(id) ON DELETE SET NULL,
  FOREIGN KEY (clasificacion_riesgo_id) REFERENCES clasificacion_riesgo(id) ON DELETE SET NULL,
  FOREIGN KEY (clasificacion_biomedica_id) REFERENCES clasificacion_biomedica(id) ON DELETE SET NULL,
  FOREIGN KEY (frecuencia_mantenimiento_id) REFERENCES frecuencia_mantenimiento(id) ON DELETE SET NULL,
  FOREIGN KEY (nivel_complejidad_id) REFERENCES nivel_complejidad(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_equipo_empresa (empresa_id),
  INDEX idx_equipo_sede (sede_id),
  INDEX idx_equipo_tipo (tipo_equipo_id),
  INDEX idx_equipo_municipio (municipio_id),
  INDEX idx_equipo_riesgo (nivel_riesgo_id),
  INDEX idx_equipo_activo (activo),
  INDEX idx_equipos_empresa_activo (empresa_id, activo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clase_tecnologia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS caracteristicas_tecnicas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL UNIQUE,
  clase_tecnologia_id INT,
  fuente_energia VARCHAR(100),
  voltaje DECIMAL(10,2),
  voltaje_max_operacion VARCHAR(50),
  corriente_maxima DECIMAL(10,2),
  corriente_minima DECIMAL(10,2),
  potencia DECIMAL(10,2),
  frecuencia DECIMAL(10,2),
  humedad VARCHAR(50),
  longitud_onda VARCHAR(50),
  temperatura VARCHAR(50),
  temperatura_max VARCHAR(50),
  peso VARCHAR(50),
  capacidad VARCHAR(50),
  vida_util INT,
  vida_util_unidad ENUM('MESES','AÑOS','HORAS') DEFAULT 'AÑOS',
  fecha_fabricacion DATE,
  requiere_agua BOOLEAN,
  requiere_gas BOOLEAN,
  requiere_combustible BOOLEAN,
  FOREIGN KEY (equipo_id) REFERENCES equipos_biomedicos(id) ON DELETE CASCADE,
  FOREIGN KEY (clase_tecnologia_id) REFERENCES clase_tecnologia(id) ON DELETE SET NULL,
  INDEX idx_fk_caracteristicas (equipo_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS componentes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  nombre VARCHAR(100),
  marca VARCHAR(100),
  modelo VARCHAR(100),
  serie VARCHAR(100),
  FOREIGN KEY (equipo_id) REFERENCES equipos_biomedicos(id) ON DELETE CASCADE,
  INDEX idx_fk_componentes (equipo_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tipos_documento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  tipo_documento_id INT NOT NULL,
  url TEXT,
  FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id) ON DELETE RESTRICT,
  FOREIGN KEY (equipo_id) REFERENCES equipos_biomedicos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS soporte_tecnico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL UNIQUE,
  verificable BOOLEAN,
  calibrable BOOLEAN,
  manual_usuario BOOLEAN,
  periodicidad_calibracion VARCHAR(50),
  recomendaciones TEXT,
  manuales JSON NULL,
  planos JSON NULL,
  FOREIGN KEY (equipo_id) REFERENCES equipos_biomedicos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- TICKETS
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    municipio_incidente_id INT NOT NULL,
    tipo_soporte_id INT NOT NULL,
    equipo_id INT,
    estado_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL DEFAULT '',
    prioridad ENUM('BAJA','MEDIA','ALTA','CRITICA') DEFAULT 'MEDIA',
    fecha_cierre DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    updated_by INT,
    created_by INT,
    FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
    FOREIGN KEY (municipio_incidente_id) REFERENCES municipios(id) ON DELETE RESTRICT,
    FOREIGN KEY (tipo_soporte_id) REFERENCES tipos_soporte(id) ON DELETE RESTRICT,
    FOREIGN KEY (estado_id) REFERENCES estados(id) ON DELETE RESTRICT,
    FOREIGN KEY (equipo_id) REFERENCES equipos_biomedicos(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tickets_empresa (empresa_id),
    INDEX idx_tickets_estado (estado_id),
    INDEX idx_tickets_equipo (equipo_id),
    INDEX idx_ticket_fecha (created_at),
    INDEX idx_ticket_municipio (municipio_incidente_id),
    INDEX idx_ticket_tipo (tipo_soporte_id),
    INDEX idx_tickets_empresa_estado (empresa_id, estado_id),
    INDEX idx_tickets_empresa_fecha  (empresa_id, created_at DESC),
    INDEX idx_tickets_empresa_tipo   (empresa_id, tipo_soporte_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS roles_ticket (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ticket_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    rol_ticket_id INT,
    empresa_id INT NOT NULL,
    UNIQUE(ticket_id, user_id),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
    FOREIGN KEY (rol_ticket_id) REFERENCES roles_ticket(id) ON DELETE SET NULL,
    INDEX idx_tku_rol (rol_ticket_id),
    INDEX idx_ticket_user_empresa (empresa_id),
    INDEX idx_ticket_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ticket_historial_estado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    estado_id INT NOT NULL,
    changed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (estado_id) REFERENCES estados(id) ON DELETE RESTRICT,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_hist_ticket (ticket_id),
    INDEX idx_hist_ticket_fecha (ticket_id, created_at DESC)
) ENGINE=InnoDB;

-- SOPORTE
CREATE TABLE IF NOT EXISTS soportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    ticket_id INT NOT NULL,
    tipo_soporte_id INT,
    descripcion TEXT,
    imagen_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_soporte_id) REFERENCES tipos_soporte(id) ON DELETE SET NULL,
    INDEX idx_soporte_ticket (ticket_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS soporte_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    soporte_id INT NOT NULL UNIQUE,
    sede_id INT,
    fecha_facturacion DATE,
    factura_anular VARCHAR(10),
    factura_copago_anular VARCHAR(10),
    valor_copago_anulado DECIMAL(12,2),
    factura_refacturar VARCHAR(10),
    nombre_facturador VARCHAR(100),
    motivo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
    FOREIGN KEY (soporte_id) REFERENCES soportes(id) ON DELETE CASCADE,
    FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL,
    INDEX idx_detalle_soporte (soporte_id)
) ENGINE=InnoDB;

-- Mantenimientos preventivos
CREATE TABLE IF NOT EXISTS mantenimientos_preventivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  equipo_id INT NOT NULL,
  descripcion TEXT,
  numero_inventario INT NOT NULL,
  tiempo_horas TINYINT UNSIGNED NOT NULL DEFAULT 0,
  tiempo_minutos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  fecha_mantenimiento DATE NOT NULL,
  numero_mantenimiento INT NOT NULL,
  bioseguridad_verificada BOOLEAN DEFAULT FALSE,
  equipo_limpio BOOLEAN DEFAULT FALSE,
  observaciones TEXT,
  servicio VARCHAR(150) NULL,
  imagen_antes TEXT NULL,
  imagen_despues TEXT NULL,
  firma_realizado TEXT NULL,
  firma_aprobado TEXT NULL,
  realizado_por INT NULL,
  aprobado_por INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT chk_tiempo_minutos CHECK (tiempo_minutos < 60),
  UNIQUE(empresa_id, equipo_id, numero_mantenimiento),
  FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
  FOREIGN KEY (equipo_id) REFERENCES equipos_biomedicos(id) ON DELETE CASCADE,
  FOREIGN KEY (realizado_por) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (aprobado_por) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_mant_prev_equipo (equipo_id),
  INDEX idx_fecha_preventivo (fecha_mantenimiento),
  INDEX idx_prev_empresa_fecha (empresa_id, fecha_mantenimiento)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catalogo_repuestos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS repuestos_preventivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  preventivo_id INT NOT NULL,
  repuesto_id INT,
  cantidad INT,
  verificacion_estado VARCHAR(100),
  FOREIGN KEY (preventivo_id) REFERENCES mantenimientos_preventivos(id) ON DELETE CASCADE,
  FOREIGN KEY (repuesto_id) REFERENCES catalogo_repuestos(id) ON DELETE RESTRICT,
  INDEX idx_fk_repuestos_prev (preventivo_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catalogo_herramientas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS herramientas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  preventivo_id INT NOT NULL,
  herramienta_id INT,
  FOREIGN KEY (preventivo_id) REFERENCES mantenimientos_preventivos(id) ON DELETE CASCADE,
  FOREIGN KEY (herramienta_id) REFERENCES catalogo_herramientas(id) ON DELETE RESTRICT,
  INDEX idx_fk_herramientas (preventivo_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catalogo_insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  preventivo_id INT NOT NULL,
  insumo_id INT,
  cantidad INT,
  FOREIGN KEY (preventivo_id) REFERENCES mantenimientos_preventivos(id) ON DELETE CASCADE,
  FOREIGN KEY (insumo_id) REFERENCES catalogo_insumos(id) ON DELETE RESTRICT,
  INDEX idx_fk_insumos (preventivo_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catalogo_actividades_mantenimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mantenimiento_actividades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  preventivo_id INT NOT NULL,
  actividad_id INT NOT NULL,
  UNIQUE(preventivo_id, actividad_id),
  FOREIGN KEY (preventivo_id) REFERENCES mantenimientos_preventivos(id) ON DELETE CASCADE,
  FOREIGN KEY (actividad_id) REFERENCES catalogo_actividades_mantenimiento(id) ON DELETE RESTRICT,
  INDEX idx_act_prev (preventivo_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS catalogo_verificacion_preventivo (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS verificacion_preventivo (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  preventivo_id           INT NOT NULL,
  catalogo_verificacion_id INT NOT NULL,
  UNIQUE (preventivo_id, catalogo_verificacion_id),
  FOREIGN KEY (preventivo_id)            REFERENCES mantenimientos_preventivos(id) ON DELETE CASCADE,
  FOREIGN KEY (catalogo_verificacion_id) REFERENCES catalogo_verificacion_preventivo(id) ON DELETE RESTRICT,
  INDEX idx_verif_prev (preventivo_id)
) ENGINE=InnoDB;

-- Mantenimientos correctivos
CREATE TABLE IF NOT EXISTS mantenimientos_correctivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  equipo_id INT NOT NULL,
  estado_id INT NOT NULL,
  tipo_servicio ENUM('CORRECTIVO','PREVENTIVO','INSTALACION','LLAMADO_EMERGENCIA','REVISION','ACTUALIZACION'),
  fecha_inicio DATE NOT NULL,
  falla_reportada TEXT NOT NULL,
  accion_correctiva TEXT NOT NULL,
  se_instalaron_partes BOOLEAN DEFAULT FALSE,
  observaciones TEXT,
  fecha_entrega DATE NOT NULL,
  duracion_horas TINYINT UNSIGNED,
  duracion_minutos TINYINT UNSIGNED,
  costo_servicio DECIMAL(12,2),
  realizado_por INT NULL,
  aprobado_por INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT chk_duracion_minutos CHECK (duracion_minutos IS NULL OR duracion_minutos < 60),
  FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
  FOREIGN KEY (equipo_id) REFERENCES equipos_biomedicos(id) ON DELETE CASCADE,
  FOREIGN KEY (estado_id) REFERENCES estados(id) ON DELETE RESTRICT,
  FOREIGN KEY (realizado_por) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (aprobado_por) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_mant_corr_equipo (equipo_id),
  INDEX idx_estado_correctivo (estado_id),
  INDEX idx_corr_empresa_estado (empresa_id, estado_id),
  FULLTEXT idx_ft_correctivo (falla_reportada, accion_correctiva, observaciones)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS repuestos_correctivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  correctivo_id INT NOT NULL,
  repuesto_id INT,
  descripcion TEXT,
  cantidad INT NOT NULL,
  FOREIGN KEY (correctivo_id) REFERENCES mantenimientos_correctivos(id) ON DELETE CASCADE,
  FOREIGN KEY (repuesto_id) REFERENCES catalogo_repuestos(id) ON DELETE RESTRICT,
  INDEX idx_fk_repuestos_corr (correctivo_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    tabla VARCHAR(64) NOT NULL,
    registro_id BIGINT NOT NULL,
    accion ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    usuario_id INT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_empresa (empresa_id, created_at DESC),
    INDEX idx_audit_tabla (tabla, registro_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_rt_user (user_id)
) ENGINE=InnoDB;

-- Triggers
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS trg_ticket_usuario_empresa_ins
BEFORE INSERT ON ticket_usuarios FOR EACH ROW
BEGIN
    DECLARE v_emp_ticket INT;
    DECLARE v_emp_user   INT;
    SELECT empresa_id INTO v_emp_ticket FROM tickets WHERE id = NEW.ticket_id;
    SELECT empresa_id INTO v_emp_user   FROM users   WHERE id = NEW.user_id;
    IF v_emp_ticket IS NULL OR v_emp_user IS NULL OR v_emp_ticket != v_emp_user THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El usuario y el ticket deben pertenecer a la misma empresa';
    END IF;
END$$

CREATE TRIGGER IF NOT EXISTS trg_ticket_estado_scope_ins
BEFORE INSERT ON tickets FOR EACH ROW
BEGIN
    DECLARE v_scope VARCHAR(20);
    SELECT scope INTO v_scope FROM estados WHERE id = NEW.estado_id;
    IF v_scope != 'TICKET' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El estado no corresponde al scope TICKET';
    END IF;
END$$

CREATE TRIGGER IF NOT EXISTS trg_ticket_estado_scope_upd
BEFORE UPDATE ON tickets FOR EACH ROW
BEGIN
    DECLARE v_scope VARCHAR(20);
    IF NEW.estado_id != OLD.estado_id THEN
        SELECT scope INTO v_scope FROM estados WHERE id = NEW.estado_id;
        IF v_scope != 'TICKET' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El estado no corresponde al scope TICKET';
        END IF;
    END IF;
END$$

CREATE TRIGGER IF NOT EXISTS trg_correctivo_estado_scope_ins
BEFORE INSERT ON mantenimientos_correctivos FOR EACH ROW
BEGIN
    DECLARE v_scope VARCHAR(20);
    SELECT scope INTO v_scope FROM estados WHERE id = NEW.estado_id;
    IF v_scope != 'MANTENIMIENTO' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El estado no corresponde al scope MANTENIMIENTO';
    END IF;
END$$

CREATE TRIGGER IF NOT EXISTS trg_correctivo_estado_scope_upd
BEFORE UPDATE ON mantenimientos_correctivos FOR EACH ROW
BEGIN
    DECLARE v_scope VARCHAR(20);
    IF NEW.estado_id != OLD.estado_id THEN
        SELECT scope INTO v_scope FROM estados WHERE id = NEW.estado_id;
        IF v_scope != 'MANTENIMIENTO' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El estado no corresponde al scope MANTENIMIENTO';
        END IF;
    END IF;
END$$

CREATE TRIGGER IF NOT EXISTS trg_historial_estado_scope_ins
BEFORE INSERT ON ticket_historial_estado FOR EACH ROW
BEGIN
    DECLARE v_scope VARCHAR(20);
    SELECT scope INTO v_scope FROM estados WHERE id = NEW.estado_id;
    IF v_scope != 'TICKET' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El estado registrado en historial debe tener scope TICKET';
    END IF;
END$$

DELIMITER ;

-- ============================================================
--  Datos base (catálogos mínimos)
-- ============================================================

INSERT IGNORE INTO roles (id, nombre) VALUES
  (1, 'ADMIN'), (2, 'INGENIERO'), (3, 'SALUD');

INSERT IGNORE INTO estados (nombre, scope) VALUES
  ('Abierto',    'TICKET'),
  ('En proceso', 'TICKET'),
  ('Resuelto',   'TICKET'),
  ('Pendiente',  'MANTENIMIENTO'),
  ('En proceso', 'MANTENIMIENTO'),
  ('Finalizado', 'MANTENIMIENTO');

-- IDs fijos usados en el frontend: Otros=1, R-FAST=2, Notas Crédito=3
INSERT IGNORE INTO tipos_soporte (id, nombre, requiere_detalle) VALUES
  (1, 'Otros',         0),
  (2, 'R-FAST',        0),
  (3, 'Notas Crédito', 1);

INSERT IGNORE INTO municipios (nombre) VALUES
  ('LA VEGA'), ('ALMAGUER'), ('SAN SEBASTIAN'),
        ('SANTA ROSA');

INSERT IGNORE INTO roles_ticket (nombre) VALUES
  ('Solicitante'), ('Técnico Asignado'), ('Supervisor'), ('Observador');

INSERT IGNORE INTO catalogo_actividades_mantenimiento (nombre) VALUES
  ('Limpieza Externa'), ('Limpieza Interna'),
  ('Ajustes'), ('Cambio Partes'), ('Imposicion');

-- ============================================================
--  Catálogo de items (medicamentos, laboratorio, médico-quirúrgico, aseo y papelería)
-- ============================================================
CREATE TABLE IF NOT EXISTS catalogo_items (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id        INT NOT NULL,
  categoria         ENUM('MEDICAMENTOS','LABORATORIO','MEDICO_QUIRURGICO','ASEO_PAPELERIA') NOT NULL,
  codigo_interno    VARCHAR(50)  NOT NULL,
  nombre            VARCHAR(255) NOT NULL,
  presentacion      VARCHAR(150) NULL,
  concentracion     VARCHAR(100) NULL,
  precio_2026       DECIMAL(12,2) NULL,
  precio_regulado   DECIMAL(12,2) NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        DATETIME  NULL,
  UNIQUE (codigo_interno, empresa_id, categoria),
  FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
  INDEX idx_catalogo_items_empresa (empresa_id, categoria)
) ENGINE=InnoDB;

-- ============================================================
--  Recepción de medicamentos
-- ============================================================
CREATE TABLE IF NOT EXISTS recepciones_inventario (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id            INT NOT NULL,
  fecha                 DATE         NOT NULL,
  hora                  TIME         NOT NULL,
  municipio_id          INT          NULL,
  sede_id               INT          NULL,
  uas                   VARCHAR(100) NULL,
  proveedor             VARCHAR(255) NOT NULL,
  remision_factura      VARCHAR(100) NOT NULL,
  reactivos             VARCHAR(255) NULL,
  responsable_entrega   VARCHAR(150) NOT NULL,
  responsable_recibe    VARCHAR(150) NOT NULL,
  created_by            INT          NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at            DATETIME  NULL,
  FOREIGN KEY (empresa_id)   REFERENCES empresa(id)    ON DELETE RESTRICT,
  FOREIGN KEY (municipio_id) REFERENCES municipios(id) ON DELETE SET NULL,
  FOREIGN KEY (sede_id)      REFERENCES sedes(id)      ON DELETE SET NULL,
  FOREIGN KEY (created_by)   REFERENCES users(id)      ON DELETE SET NULL,
  INDEX idx_recep_med_empresa (empresa_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS items_recepcion_inventario (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  recepcion_id              INT          NOT NULL,
  catalogo_id               INT          NULL,
  codigo_interno            VARCHAR(50)  NULL,
  nombre                    VARCHAR(255) NOT NULL,
  presentacion_comercial    VARCHAR(150) NULL,
  concentracion             VARCHAR(100) NULL,
  fecha_vencimiento         DATE         NULL,
  registro_sanitario        VARCHAR(100) NULL,
  estado_registro           VARCHAR(50)  NULL,
  cum                       VARCHAR(50)  NULL,
  atc                       VARCHAR(50)  NULL,
  laboratorio               VARCHAR(150) NULL,
  cant_solicitada              INT          NULL,
  cant_recepcionada            INT          NULL,
  cant_faltante                INT          NULL,
  lote                         VARCHAR(50)  NULL,
  cadena_frio                  BOOLEAN DEFAULT FALSE,
  temperatura                  VARCHAR(20)  NULL,
  snna                         VARCHAR(10)  NULL,
  ta                           VARCHAR(50)  NULL,
  cod                          VARCHAR(50)  NULL,
  acr                          VARCHAR(10)  NULL,
  -- calidad
  certificado_calidad          BOOLEAN DEFAULT FALSE,
  tipo_certificado_calidad     VARCHAR(20)  NULL,
  certificado_esterilizacion   BOOLEAN DEFAULT FALSE,
  estado_empaque               VARCHAR(20)  NULL,
  humedo                       BOOLEAN DEFAULT FALSE,
  colapsado                    BOOLEAN DEFAULT FALSE,
  manchado                     BOOLEAN DEFAULT FALSE,
  etiquetas                    BOOLEAN DEFAULT FALSE,
  tipo_etiquetas               VARCHAR(20)  NULL,
  FOREIGN KEY (recepcion_id) REFERENCES recepciones_inventario(id) ON DELETE CASCADE,
  FOREIGN KEY (catalogo_id)  REFERENCES catalogo_items(id)           ON DELETE SET NULL,
  INDEX idx_items_recep (recepcion_id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
