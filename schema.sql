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
CREATE TABLE empresa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- UBICACION
CREATE TABLE municipios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE sedes (
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
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE users (
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
    sede_id INT NULL,

    activo BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
    created_by INT,
    updated_by INT,
    
    UNIQUE(email, empresa_id),
    
    CONSTRAINT fk_users_sede FOREIGN KEY (sede_id) REFERENCES sedes(id),
    FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL,
	FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE SET NULL,
    FOREIGN KEY (municipio_id) REFERENCES municipios(id) ON DELETE SET NULL,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_users_empresa (empresa_id),
    INDEX idx_eb_empresa_vivo (empresa_id, deleted_at),
    INDEX idx_users_empresa_activo (empresa_id, activo)
) ENGINE=InnoDB;

-- CATALOGOS
CREATE TABLE tipos_soporte (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    requiere_detalle BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

CREATE TABLE estados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    scope ENUM('TICKET','MANTENIMIENTO') NOT NULL,
    UNIQUE(nombre, scope)
) ENGINE=InnoDB;

-- equipos_biomedicos
CREATE TABLE tipos_equipo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE nivel_riesgo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE clasificacion_riesgo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE clasificacion_biomedica (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE frecuencia_mantenimiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE nivel_complejidad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE fabricantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE,
  telefono  VARCHAR(30)  NULL,
  direccion VARCHAR(200) NULL,
  lugar     VARCHAR(100) NULL,
  correo    VARCHAR(100) NULL
) ENGINE=InnoDB;

CREATE TABLE proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE equipos_biomedicos (
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
  
  UNIQUE KEY uq_serie_empresa (serie, empresa_id),
  
  CONSTRAINT chk_fechas_equipo 
    CHECK (fecha_instalacion IS NULL OR fecha_compra IS NULL OR fecha_instalacion >= fecha_compra),
  CONSTRAINT chk_garantia 
    CHECK (fecha_fin_garantia IS NULL OR inicio_garantia IS NULL OR fecha_fin_garantia > inicio_garantia),
    
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
  INDEX idx_eb_empresa_vivo (empresa_id, deleted_at),
  INDEX idx_equipos_empresa_activo (empresa_id, activo)
) ENGINE=InnoDB;

CREATE TABLE clase_tecnologia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE caracteristicas_tecnicas (
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
  
  vida_util      INT,
  vida_util_unidad ENUM('MESES','AÑOS','HORAS') DEFAULT 'AÑOS',
  fecha_fabricacion DATE,
  requiere_agua BOOLEAN,
  requiere_gas BOOLEAN,
  requiere_combustible BOOLEAN,

  FOREIGN KEY (equipo_id) REFERENCES equipos_biomedicos(id) ON DELETE CASCADE,
  FOREIGN KEY (clase_tecnologia_id) REFERENCES clase_tecnologia(id) ON DELETE SET NULL,
  
  INDEX idx_fk_caracteristicas (equipo_id)
) ENGINE=InnoDB;

CREATE TABLE componentes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  
  nombre VARCHAR(100),
  marca VARCHAR(100),
  modelo VARCHAR(100),
  serie VARCHAR(100),
  FOREIGN KEY (equipo_id) REFERENCES equipos_biomedicos(id) ON DELETE CASCADE,
  
  INDEX idx_fk_componentes (equipo_id)
) ENGINE=InnoDB;

CREATE TABLE tipos_documento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL,
  tipo_documento_id INT NOT NULL,
  url TEXT,
  FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id) ON DELETE RESTRICT,
  FOREIGN KEY (equipo_id) REFERENCES equipos_biomedicos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE soporte_tecnico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo_id INT NOT NULL UNIQUE,
  verificable BOOLEAN,
  calibrable BOOLEAN,
  manual_usuario BOOLEAN,
  periodicidad_calibracion VARCHAR(50),
  manuales JSON NULL,
  planos   JSON NULL,
  recomendaciones TEXT,

  FOREIGN KEY (equipo_id) REFERENCES equipos_biomedicos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- TICKETS 
CREATE TABLE tickets (
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
    INDEX idx_tickets_empresa_tipo   (empresa_id, tipo_soporte_id),
	INDEX idx_eb_empresa_vivo (empresa_id, deleted_at)
) ENGINE=InnoDB;

CREATE TABLE roles_ticket (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;
    
CREATE TABLE ticket_usuarios (
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

CREATE TABLE ticket_historial_estado (
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
CREATE TABLE soportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    empresa_id INT NOT NULL,
    ticket_id INT NOT NULL,
    tipo_soporte_id INT,

    descripcion TEXT,
    imagen_url TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    created_by INT NULL,
    
    FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_soporte_id) REFERENCES tipos_soporte(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_soporte_ticket (ticket_id)
) ENGINE=InnoDB;

CREATE TABLE soporte_detalle ( 
	id INT AUTO_INCREMENT PRIMARY KEY, 
    
    empresa_id INT NOT NULL,
    soporte_id INT NOT NULL UNIQUE,
    sede_id INT,  /*centro_atencion*/
    
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
    FOREIGN KEY (sede_id) REFERENCES sedes(id)ON DELETE SET NULL,
    
    INDEX idx_detalle_soporte (soporte_id)
) ENGINE=InnoDB;
  
-- Protocolos preventivos
CREATE TABLE mantenimientos_preventivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  empresa_id INT NOT NULL,
  equipo_id INT NOT NULL,
  
  numero_inventario INT NOT NULL COMMENT 'Número de inventario del protocolo, diferente a activo_fijo',
  tiempo_horas   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  tiempo_minutos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  fecha_mantenimiento DATE NOT NULL,
  numero_mantenimiento INT NOT NULL,
  bioseguridad_verificada BOOLEAN DEFAULT FALSE,
  equipo_limpio BOOLEAN DEFAULT FALSE,
  observaciones TEXT,
  imagen_antes   VARCHAR(500) NULL,
  imagen_despues VARCHAR(500) NULL,
  servicio VARCHAR(100) NULL,
  realizado_por INT NULL,
  aprobado_por INT NULL,
  firma_realizado VARCHAR(500) NULL,
  firma_aprobado  VARCHAR(500) NULL,
  
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
  INDEX idx_prev_empresa_fecha (empresa_id, fecha_mantenimiento),
  INDEX idx_eb_empresa_vivo (empresa_id, deleted_at),
  INDEX idx_prev_fecha_empresa (empresa_id, fecha_mantenimiento DESC, deleted_at)
) ENGINE=InnoDB;
  
CREATE TABLE catalogo_repuestos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE repuestos_preventivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  preventivo_id INT NOT NULL,
  repuesto_id INT,
  FOREIGN KEY (preventivo_id) REFERENCES mantenimientos_preventivos(id) ON DELETE CASCADE,
  FOREIGN KEY (repuesto_id) REFERENCES catalogo_repuestos(id) ON DELETE RESTRICT,
  
  INDEX idx_fk_repuestos_prev (preventivo_id)
) ENGINE=InnoDB;

CREATE TABLE catalogo_herramientas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE
) ENGINE=InnoDB;
    
CREATE TABLE herramientas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  preventivo_id INT NOT NULL,
  herramienta_id INT,
  FOREIGN KEY (preventivo_id) REFERENCES mantenimientos_preventivos(id) ON DELETE CASCADE,
  FOREIGN KEY (herramienta_id) REFERENCES catalogo_herramientas(id) ON DELETE RESTRICT,
  
  INDEX idx_fk_herramientas (preventivo_id)
) ENGINE=InnoDB;

CREATE TABLE catalogo_insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  preventivo_id INT NOT NULL,
  insumo_id INT,
  FOREIGN KEY (preventivo_id) REFERENCES mantenimientos_preventivos(id) ON DELETE CASCADE,
  FOREIGN KEY (insumo_id) REFERENCES catalogo_insumos(id) ON DELETE RESTRICT,
  
  INDEX idx_fk_insumos (preventivo_id)
) ENGINE=InnoDB;

CREATE TABLE catalogo_actividades_mantenimiento (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE mantenimiento_actividades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  preventivo_id INT NOT NULL,
  actividad_id  INT     NOT NULL,
  
  UNIQUE(preventivo_id, actividad_id),
  
  FOREIGN KEY (preventivo_id) REFERENCES mantenimientos_preventivos(id) ON DELETE CASCADE,
  FOREIGN KEY (actividad_id)  REFERENCES catalogo_actividades_mantenimiento(id) ON DELETE RESTRICT,
  
  INDEX idx_act_prev (preventivo_id)
) ENGINE=InnoDB;

CREATE TABLE catalogo_verificacion_preventivo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE verificacion_preventivo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  preventivo_id INT NOT NULL,
  catalogo_verificacion_id INT NOT NULL,
  aprobado BOOLEAN DEFAULT FALSE,
  
  UNIQUE(preventivo_id, catalogo_verificacion_id),
  
  FOREIGN KEY (preventivo_id) REFERENCES mantenimientos_preventivos(id) ON DELETE CASCADE,
  FOREIGN KEY (catalogo_verificacion_id) REFERENCES catalogo_verificacion_preventivo(id) ON DELETE RESTRICT,
  INDEX idx_fk_verificacion (preventivo_id)
) ENGINE=InnoDB;

-- Protocolos correctivos (historial)
CREATE TABLE tipo_servicios (
id INT AUTO_INCREMENT PRIMARY KEY,
nombre VARCHAR(100) UNIQUE 
)ENGINE=InnoDB;

CREATE TABLE mantenimientos_correctivos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  empresa_id INT NOT NULL,
  equipo_id INT NOT NULL,
  estado_id INT NOT NULL,
  tipo_servicio_id INT NOT NULL,
  
  fecha_inicio DATE NOT NULL,
  falla_reportada TEXT NOT NULL,
  accion_correctiva TEXT NOT NULL,
  se_instalaron_partes BOOLEAN DEFAULT FALSE,  
  observaciones TEXT,
  fecha_entrega DATE NOT NULL,

  servicio VARCHAR(100) NULL,
  realizado_por INT NULL,
  aprobado_por INT NULL,
  firma_realizado VARCHAR(500) NULL,
  firma_aprobado  VARCHAR(500) NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  
  CONSTRAINT chk_fechas_correctivo CHECK (fecha_entrega >= fecha_inicio),
  FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE RESTRICT,
  FOREIGN KEY (equipo_id) REFERENCES equipos_biomedicos(id) ON DELETE CASCADE,
  FOREIGN KEY (estado_id) REFERENCES estados(id) ON DELETE RESTRICT,
  FOREIGN KEY (tipo_servicio_id) REFERENCES tipo_servicios(id) ON DELETE RESTRICT,
  FOREIGN KEY (realizado_por) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (aprobado_por) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_mant_corr_equipo (equipo_id),
  INDEX idx_estado_correctivo (estado_id),
  INDEX idx_corr_empresa_estado (empresa_id, estado_id),
  INDEX idx_eb_empresa_vivo (empresa_id, deleted_at),
  FULLTEXT idx_ft_correctivo (falla_reportada, accion_correctiva, observaciones)
) ENGINE=InnoDB;

CREATE TABLE repuestos_correctivos(
  id INT AUTO_INCREMENT PRIMARY KEY,
  correctivo_id INT NOT NULL,
  repuesto_id INT,
  descripcion TEXT,
  cantidad INT NOT NULL,
  FOREIGN KEY (correctivo_id) REFERENCES mantenimientos_correctivos(id) ON DELETE CASCADE,
  FOREIGN KEY (repuesto_id) REFERENCES catalogo_repuestos(id) ON DELETE RESTRICT,
  
  INDEX idx_fk_repuestos_corr (correctivo_id)
) ENGINE=InnoDB;

-- Catálogo de medicamentos
CREATE TABLE catalogo_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id      INT NOT NULL,
  categoria ENUM('MEDICAMENTOS','LABORATORIO','MEDICO_QUIRURGICO','ASEO_PAPELERIA', 'ODONTOLOGIA') NOT NULL,
  codigo_interno  VARCHAR(100) NOT NULL,
  nombre          VARCHAR(255) NOT NULL,
  forma_farmaceutica VARCHAR(255) DEFAULT NULL,
  concentracion   VARCHAR(255) DEFAULT NULL,
  precio_2026     VARCHAR(100) DEFAULT NULL,
  precio_regulado VARCHAR(100) DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (empresa_id) REFERENCES empresa(id),
  UNIQUE KEY uq_codigo_empresa_categoria (codigo_interno, empresa_id, categoria)
);

CREATE TABLE recepciones_inventario (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id          INT NOT NULL,
  fecha               DATE NOT NULL,
  hora                TIME NOT NULL,
  municipio_id        INT DEFAULT NULL,
  sede_id             INT DEFAULT NULL,
  uas                 VARCHAR(255) DEFAULT NULL,
  proveedor           VARCHAR(255) NOT NULL,
  remision_factura    VARCHAR(255) NOT NULL,
  reactivos           TEXT DEFAULT NULL,
  responsable_recibe  VARCHAR(255) NOT NULL,
  estado ENUM('BORRADOR','COMPLETADA') NOT NULL DEFAULT 'COMPLETADA',
  created_by          INT DEFAULT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at          TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (empresa_id)   REFERENCES empresa(id),
  FOREIGN KEY (municipio_id) REFERENCES municipios(id),
  FOREIGN KEY (sede_id)      REFERENCES sedes(id),
  
  INDEX idx_eb_empresa_vivo (empresa_id, deleted_at),
  INDEX idx_recep_estado_user (created_by, estado)
);

CREATE TABLE items_recepcion_inventario (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  recepcion_id              INT NOT NULL,
  catalogo_id               INT DEFAULT NULL,
  tipo_recepcion ENUM('MEDICAMENTOS','LABORATORIO','MEDICO_QUIRURGICO','ASEO_PAPELERIA', 'ODONTOLOGIA')
  NOT NULL DEFAULT 'MEDICAMENTOS',
  codigo_interno            VARCHAR(100) DEFAULT NULL,
  nombre                    VARCHAR(255) NOT NULL,
  presentacion_comercial    VARCHAR(255) DEFAULT NULL,
  concentracion             VARCHAR(255) DEFAULT NULL,
  fecha_vencimiento         DATE DEFAULT NULL,
  registro_sanitario        VARCHAR(255) DEFAULT NULL,
  estado_registro           ENUM('VIGENTE','VENCIDO','EN TRAMITE') DEFAULT NULL,
  cum                       VARCHAR(100) DEFAULT NULL,
  atc                       VARCHAR(100) DEFAULT NULL,
  laboratorio               VARCHAR(255) DEFAULT NULL,
  cant_solicitada           INT DEFAULT NULL,
  cant_recepcionada        INT         NULL,
  lote                     VARCHAR(50) NULL,
  cant_faltante             INT DEFAULT NULL,
  cadena_frio               TINYINT DEFAULT 0,
  temperatura               VARCHAR(50) DEFAULT NULL,
  snna                      ENUM('S','N','NA') DEFAULT NULL,
  ta                        VARCHAR(100) DEFAULT NULL,
  cod                       VARCHAR(100) DEFAULT NULL,
  acr                       ENUM('A','C','R') DEFAULT NULL,
  ium VARCHAR(50) NULL,
  unidad_medida VARCHAR(50) NULL,
  clasificacion_riesgo VARCHAR(10) NULL,
  vida_util VARCHAR(50) NULL,
  serie VARCHAR(100) NULL,
  estado_empaque            ENUM('BUENO','REGULAR','MALO') DEFAULT NULL,
  humedo                    TINYINT DEFAULT 0,
  colapsado                 TINYINT DEFAULT 0,
  manchado                  TINYINT DEFAULT 0,
  etiquetas                 TINYINT DEFAULT 0,
  tipo_etiquetas           VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
             ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_item_vencimiento (fecha_vencimiento),
  INDEX idx_item_recepcion_med (recepcion_id, fecha_vencimiento),
  INDEX idx_lote (lote),
  INDEX idx_codigo (codigo_interno),
  INDEX idx_catalogo (catalogo_id),

  FULLTEXT INDEX ft_item_busqueda (
    nombre,
    codigo_interno,
    laboratorio
  ),
  
  FOREIGN KEY (recepcion_id) REFERENCES recepciones_medicamentos(id) ON DELETE CASCADE,
  FOREIGN KEY (catalogo_id)  REFERENCES catalogo_items(id) ON DELETE SET NULL
);

CREATE TABLE salidas_medicamentos (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id   INT NOT NULL,
  item_id      INT NOT NULL,
  municipio_destino_id INT NULL,
  dispensacion_item_id INT NULL,
  sede_destino_id INT NULL,
  cantidad     INT UNSIGNED NOT NULL,
  fecha        DATE NOT NULL,
  motivo       VARCHAR(255) NOT NULL,
  responsable  VARCHAR(150) NOT NULL,
  estado ENUM('ACTIVO','PENDIENTE','RECHAZADO') NOT NULL DEFAULT 'ACTIVO',
  created_by   INT UNSIGNED,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items_recepcion_medicamentos(id) ON DELETE CASCADE,
  FOREIGN KEY (empresa_id) REFERENCES empresa(id) ON DELETE CASCADE,
  FOREIGN KEY (dispensacion_item_id) REFERENCES dispensacion_items(id),
  CONSTRAINT fk_salidas_municipio_dest FOREIGN KEY (municipio_destino_id) REFERENCES municipios(id),
  CONSTRAINT fk_salidas_sede_dest FOREIGN KEY (sede_destino_id) REFERENCES sedes(id),
  
  INDEX idx_item_estado (item_id, estado)
) ENGINE=InnoDB;

CREATE TABLE traslados_pendientes (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id           INT NOT NULL,
  salida_id            INT UNSIGNED NOT NULL,
  item_id              INT NOT NULL,
  cantidad             INT UNSIGNED NOT NULL,
  medicamento_nombre   VARCHAR(255) NOT NULL,
  responsable_origen   VARCHAR(150) NOT NULL,
  municipio_origen_id  INT NULL,
  sede_origen_id       INT NULL,
  municipio_destino_id INT NULL,
  sede_destino_id      INT NULL,
  estado               ENUM('PENDIENTE','CONFIRMADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  recepcion_destino_id INT NULL,
  confirmado_por       VARCHAR(150) NULL,
  fecha_confirmacion   TIMESTAMP NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (salida_id)   REFERENCES salidas_medicamentos(id),
  FOREIGN KEY (empresa_id)  REFERENCES empresa(id),
  FOREIGN KEY (municipio_destino_id) REFERENCES municipios(id),
  FOREIGN KEY (sede_destino_id)      REFERENCES sedes(id),
  
  INDEX idx_traslados_muni_dest (municipio_destino_id, estado)
) ENGINE=InnoDB;

CREATE TABLE dispensaciones (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id        INT NOT NULL,
  tipo              ENUM('KIT','URGENCIAS','HOSPITALIZACION','CARRO_PARO','AMBULANCIAS') NOT NULL,
  municipio_id      INT NOT NULL,
  director_id       INT NOT NULL,
  destinatario_id   INT NOT NULL,
  estado            ENUM('PENDIENTE','ACEPTADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  observaciones     TEXT NULL,
  aceptado_por      VARCHAR(150) NULL,
  fecha_aceptacion  TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (empresa_id)      REFERENCES empresa(id),
  FOREIGN KEY (municipio_id)    REFERENCES municipios(id),
  FOREIGN KEY (director_id)     REFERENCES users(id),
  FOREIGN KEY (destinatario_id) REFERENCES users(id),
  
  INDEX idx_director (director_id),
  INDEX idx_destinatario (destinatario_id),
  INDEX idx_empresa_estado (empresa_id, estado)
) ENGINE=InnoDB;

CREATE TABLE dispensacion_items (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  dispensacion_id     INT NOT NULL,
  item_id             INT NOT NULL,
  medicamento_nombre  VARCHAR(255) NOT NULL,
  cantidad            INT UNSIGNED NOT NULL,
  lote                VARCHAR(100) NULL,
  fecha_vencimiento   DATE NULL,

  FOREIGN KEY (dispensacion_id) REFERENCES dispensaciones(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id)         REFERENCES items_recepcion_medicamentos(id),
  
  INDEX idx_item (item_id)
) ENGINE=InnoDB;

CREATE TABLE user_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_at TIMESTAMP NULL,

    ip VARCHAR(45),
    user_agent TEXT,
    estado ENUM('ACTIVA','CERRADA','EXPIRADA') DEFAULT 'ACTIVA',
    last_activity TIMESTAMP NULL,

    refresh_token_id INT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE activity_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT,
  user_id INT,

  modulo VARCHAR(50),
  accion VARCHAR(100),

  descripcion TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    usuario_id INT NOT NULL,
    
    tabla VARCHAR(64) NOT NULL,
    registro_id BIGINT NOT NULL,
    request_id VARCHAR(100) NULL,
    modulo VARCHAR(50) NULL,

    accion ENUM('INSERT','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT','APPROVE','REJECT') NOT NULL,
    
    descripcion TEXT NULL,
    
    datos_anteriores JSON,
    datos_nuevos JSON,
    
    ip VARCHAR(45),
    user_agent TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_empresa (empresa_id, created_at DESC),
    INDEX idx_audit_usuario (usuario_id, created_at DESC),
    INDEX idx_audit_tabla (tabla, registro_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    device_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uq_user_device (user_id, device_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_rt_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE password_reset_tokens (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,

  CONSTRAINT fk_password_reset_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_token (token)
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER trg_ticket_usuario_empresa_ins
BEFORE INSERT ON ticket_usuarios
FOR EACH ROW
BEGIN
    DECLARE v_emp_ticket INT;
    DECLARE v_emp_user   INT;

    SELECT empresa_id INTO v_emp_ticket FROM tickets WHERE id = NEW.ticket_id;
    SELECT empresa_id INTO v_emp_user   FROM users   WHERE id = NEW.user_id;

    IF v_emp_ticket IS NULL OR v_emp_user IS NULL
       OR v_emp_ticket != v_emp_user THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El usuario y el ticket deben pertenecer a la misma empresa';
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_ticket_usuario_empresa_upd
BEFORE UPDATE ON ticket_usuarios
FOR EACH ROW
BEGIN
    DECLARE v_emp_ticket INT;
    DECLARE v_emp_user   INT;

    IF NEW.ticket_id != OLD.ticket_id OR NEW.user_id != OLD.user_id THEN
        SELECT empresa_id INTO v_emp_ticket FROM tickets WHERE id = NEW.ticket_id;
        SELECT empresa_id INTO v_emp_user   FROM users   WHERE id = NEW.user_id;

        IF v_emp_ticket IS NULL OR v_emp_user IS NULL
           OR v_emp_ticket != v_emp_user THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El usuario y el ticket deben pertenecer a la misma empresa';
        END IF;
    END IF;
END$$
DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_ticket_estado_scope_ins
BEFORE INSERT ON tickets
FOR EACH ROW
BEGIN
    DECLARE v_scope VARCHAR(20);
    SELECT scope INTO v_scope FROM estados WHERE id = NEW.estado_id;
    IF v_scope != 'TICKET' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El estado no corresponde al scope TICKET';
    END IF;
END$$

CREATE TRIGGER trg_ticket_estado_scope_upd
BEFORE UPDATE ON tickets
FOR EACH ROW
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

CREATE TRIGGER trg_correctivo_estado_scope_ins
BEFORE INSERT ON mantenimientos_correctivos
FOR EACH ROW
BEGIN
    DECLARE v_scope VARCHAR(20);
    SELECT scope INTO v_scope FROM estados WHERE id = NEW.estado_id;
    IF v_scope != 'MANTENIMIENTO' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El estado no corresponde al scope MANTENIMIENTO';
    END IF;
END$$

CREATE TRIGGER trg_correctivo_estado_scope_upd
BEFORE UPDATE ON mantenimientos_correctivos
FOR EACH ROW
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

DELIMITER ;

DELIMITER $$
CREATE TRIGGER trg_historial_estado_scope_ins
BEFORE INSERT ON ticket_historial_estado
FOR EACH ROW
BEGIN
    DECLARE v_scope VARCHAR(20);
    SELECT scope INTO v_scope FROM estados WHERE id = NEW.estado_id;
    IF v_scope != 'TICKET' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El estado registrado en historial debe tener scope TICKET';
    END IF;
END$$
DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;
