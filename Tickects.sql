DROP DATABASE soporte;

CREATE DATABASE soporte;
  
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
  presentacion    VARCHAR(255) DEFAULT NULL,
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

INSERT IGNORE INTO tipos_equipo (nombre) VALUES
  ('FIJO'), ('MOVIL');

INSERT IGNORE INTO nivel_riesgo (nombre) VALUES
  ('1'), ('2'), ('3');

INSERT IGNORE INTO clasificacion_riesgo (nombre) VALUES
  ('CLASE I'), ('CLASE II'), ('CLASE IIA'), ('CLASE IIB');

INSERT IGNORE INTO clasificacion_biomedica (nombre) VALUES
  ('Diagnostico'), ('Tratamiento y mantenimiento de la vida'), ('Rehabilitacion'),
  ('Prevencion'), ('Análisis de laboratorio'), ('Mantenimiento');

INSERT IGNORE INTO frecuencia_mantenimiento (nombre) VALUES
  ('Semestral'), ('Cuatrimestral'), ('Anual');

INSERT IGNORE INTO nivel_complejidad (nombre) VALUES
  ('BAJO'), ('MEDIO'), ('ALTO');

INSERT IGNORE INTO clase_tecnologia (nombre) VALUES
  ('ELECTRICO'), ('ELECTRONICO'), ('MECANICO'), ('ELECTROMECANICO'),
  ('HIDRAULICO'), ('NEUMATICO'), ('VAPOR'), ('SOLAR');

INSERT IGNORE INTO roles (nombre) VALUES
  ('ADMIN'), ('INGENIERO'), ('SALUD');
  
INSERT IGNORE INTO tipos_soporte (nombre, requiere_detalle) VALUES
  ('OTROS', 0), ('R-FAST', 0), ('NOTAS CREDITO', 1);
  
INSERT IGNORE INTO estados (nombre, scope) VALUES
  ('Abierto',    'TICKET'),
  ('En proceso', 'TICKET'),
  ('Resuelto',   'TICKET'),
  ('Pendiente',  'MANTENIMIENTO'),
  ('En proceso', 'MANTENIMIENTO'),
  ('Finalizado', 'MANTENIMIENTO');
  
INSERT IGNORE INTO municipios (nombre) VALUES
  ('LA VEGA'), ('ALMAGUER'), ('SAN SEBASTIAN'), ('SANTA ROSA');

INSERT IGNORE INTO empresa (nombre) VALUES
  ('ESE SurOriente Cauca');
  
INSERT IGNORE INTO cargos (nombre) VALUES
  ('ALMACEN'), ('DIRECTOR TECNICO'), ('BIOMEDIC@S'), ('AUXILIARES'), ('JEFES');
  
INSERT IGNORE INTO sedes (nombre, municipio_id, empresa_id) VALUES
('LA VEGA', 1, 1),
('SAN MIGUEL', 1, 1),
('GUACHICONO', 1, 1),
('SANTA RITA', 1, 1),

('ALMAGUER', 2, 1),
('CAQUIONA', 2, 1),
('HERRADURA', 2, 1),
('LLACUANAS', 2, 1),

('SAN SEBASTIAN', 3, 1),
('PARAMILLOS', 3, 1),
('ROSAL', 3, 1),
('SANTIAGO', 3, 1),
('VALENCIA', 3, 1),

('SANTA ROSA', 4, 1),
('DESCANSE', 4, 1),
('SAN JUAN DE VILLALOBOS', 4, 1);

INSERT IGNORE INTO catalogo_actividades_mantenimiento (nombre) VALUES
    ('LIMPIEZA EXTERNA'),('LIMPIEZA INTERNA'),
    ('AJUSTES'),('CAMBIO DE PARTES O ACCESORIOS'),('IMPOSICION DE STICKERS');

INSERT IGNORE INTO catalogo_insumos (nombre) VALUES
    ('GUANTES DESECHABLES'),('MASCARIILA Y GAFAS DE PROTECCIÓN'),
    ('DESINFECTANTE '),('PAÑOS DE MICROFIBRA '),('TOALLAS DE PAPEL INDUSTRIAL');
    
INSERT IGNORE INTO catalogo_herramientas (nombre) VALUES
    ('DESTORNILLADOR'),('JUEGO DE LLAVES COMBINADAS'),
    ('PINZAS (PUNTA FINA, CORTE, PRESION )'),('ALICATES'),('CINTAS AISLANTES'), 
    ('LUBRICANTES ESPECIALES'), ('CABLE UTP'), ('MULTIMETRO');
    
INSERT IGNORE INTO catalogo_repuestos (nombre) VALUES ('TECLADO'); 

INSERT IGNORE INTO tipos_documento (nombre) VALUES
    ('REGISTRO INVIMA'),('PERMISO DE COMERCIALIZACION'),
    ('GUIA RAPIDA'),('COPIA FACTURA');
    
INSERT IGNORE INTO roles_ticket (nombre) VALUES
    ('Solicitante'), ('Técnico Asignado'), ('Supervisor'), ('Observador');

INSERT IGNORE INTO tipo_servicios (nombre) VALUES
    ('CORRECTIVO'), ('PREVENTIVO'), ('INSTALACION'), ('LLAMADO EMERGENCIA'), 
    ('REVISION'), ('ACTUALIZACION');
    
INSERT INTO catalogo_items (
  empresa_id, categoria, codigo_interno, nombre,
  presentacion, concentracion, precio_2026, precio_regulado
) VALUES
(1,'MEDICAMENTOS','MED001','ACETAMINOFEN','FRASCO *60ML','150MG','2684','no regulado'),
(1,'MEDICAMENTOS','MED002','ACETAMINOFEN','TABLETA','500MG','70','no regulado'),
(1,'MEDICAMENTOS','MED003','ACETAMINOFEN','FRASCO*30ML','100MG/ML','3390','no regulado'),
(1,'MEDICAMENTOS','MED004','PARACETAMOL','VIAL 100 ML','10MG/ML','11300','no regulado'),
(1,'MEDICAMENTOS','MED005','ACETATO ALUMINIO','SOBRE','3645MG','796','no regulado'),
(1,'MEDICAMENTOS','MED007','ACETILCISTEINA','SOBRE','200MG','396','no regulado'),
(1,'MEDICAMENTOS','MED008','ACETAZOLAMIDA','TABLETA','250 MG','687','no regulado'),
(1,'MEDICAMENTOS','MED009','ACICLOVIR ','TABLETA','200MG','238','no regulado'),
(1,'MEDICAMENTOS','MED010','ACICLOVIR','TABLETA','800MG','885','no regulado'),
(1,'MEDICAMENTOS','MED011','ACICLOVIR','CREMA *15GR','5%','3636','no regulado'),
(1,'MEDICAMENTOS','MED012','ACICLOVIR','FRASCO','200 MG','10456','no regulado'),
(1,'MEDICAMENTOS','MED013','ACICLOVIR','AMPOLLA','250 MG','33106','78295'),
(1,'MEDICAMENTOS','MED015','ACIDO ACETIL','TABLETA','100 MG','53','no regulado'),
(1,'MEDICAMENTOS','MED016','ACIDO FOLICO','TABLETA','1 MG','41','no regulado'),
(1,'MEDICAMENTOS','MED017','ACIDO FUSIDICO','CREMA','2%','6562','no regulado'),
(1,'MEDICAMENTOS','MED019','ACIDO TRANEXAMICO','TABLETA',' 500MG','1242','no regulado'),
(1,'MEDICAMENTOS','MED020','ACIDO TRANEXAMICO','AMPOLLA','500MG/5ML','3766','no regulado'),
(1,'MEDICAMENTOS','MED021','ACIDO VALPROICO','CAPSULA','250 MG','265','1220'),
(1,'MEDICAMENTOS','MED022','ACIDO VALPROICO','FRASCO * 120ML','250 MG/5ML','7817','no regulado'),
(1,'MEDICAMENTOS','MED023','EPINEFRINA','AMPOLLA','1 MG','1317','no regulado'),
(1,'MEDICAMENTOS','MED024','AGUA DESTILADA','BOLSA*500ML','','6267','no regulado'),
(1,'MEDICAMENTOS','MED025','AGUA ESTERIL','AMPOLLA*5ML','','1258','no regulado'),
(1,'MEDICAMENTOS','MED026','ALBENDAZOL','TABLETA','200 MG','506','no regulado'),
(1,'MEDICAMENTOS','MED027','ALBENDAZOL','FRASCO*20ML','4G/100ML','2405','no regulado'),
(1,'MEDICAMENTOS','MED028','ALBENDAZOL','FRASCO*20ML','2G/100ML','2439','no regulado'),
(1,'MEDICAMENTOS','MED029','ALFAMETILDOPA','TABLETA','250 MG','2287','no regulado'),
(1,'MEDICAMENTOS','MED030','ALOPURINOL','TABLETA','100MG','179','no regulado'),
(1,'MEDICAMENTOS','MED031','ALPRAZOLAM','TABLETA','0.25MG','1555','no regulado'),
(1,'MEDICAMENTOS','MED032','AMANTADINA','CAPSULA','100MG','1598','no regulado'),
(1,'MEDICAMENTOS','MED033','AMIKACINA','AMPOLLA','100MG/2ML','3441','no regulado'),
(1,'MEDICAMENTOS','MED034','AMINOFILINA','AMPOLLA','500MG/2ML','169000','no regulado'),
(1,'MEDICAMENTOS','MED035','AMIODARONA','AMPOLLA','150 MG','5171','no regulado'),
(1,'MEDICAMENTOS','MED036','AMITRIPTILINA','TABLETA',' 25 MG','67','no regulado'),
(1,'MEDICAMENTOS','MED037','AMLODIPINO','TABLETA','10MG','80','no regulado'),
(1,'MEDICAMENTOS','MED038','AMLODIPINO','TABLETA','5 MG','34','no regulado'),
(1,'MEDICAMENTOS','MED039','AMOXICILINA','FRASCO*100ML',' 250 MG/5ML','7096','no regulado'),
(1,'MEDICAMENTOS','MED040','AMOXICILINA','FRASCO*60ML',' 250 MG','5450','no regulado'),
(1,'MEDICAMENTOS','MED041','AMOXICILINA','FRASCO*45ML',' 250 MG','6054','no regulado'),
(1,'MEDICAMENTOS','MED042','AMOXICILINA','CAPSULA',' 500 MG','370','no regulado'),
(1,'MEDICAMENTOS','MED043','AMOXICILINA+ ACIDO CLAVULANICO','TABLETA','125MG+500MG','2332','no regulado'),
(1,'MEDICAMENTOS','MED044','AMPICILINA','AMPOLLA','1 GR','2498','no regulado'),
(1,'MEDICAMENTOS','MED045','AMPICILINA','FRASCO*60ML','250MG/5ML','4605','no regulado'),
(1,'MEDICAMENTOS','MED046','AMPICILINA','CAPSULA','500 MG','341','no regulado'),
(1,'MEDICAMENTOS','MED047','AMPICILINA+SULBACTAM','AMPOLLA','1G+0.5G','3179','no regulado'),
(1,'MEDICAMENTOS','MED048','ATORVASTATINA','TABLETA','20 MG','68','no regulado'),
(1,'MEDICAMENTOS','MED049','ATORVASTATINA','TABLETA','40 MG','127','no regulado'),
(1,'MEDICAMENTOS','MED050','ATROPINA','AMPOLLA','1 MG','1440','no regulado'),
(1,'MEDICAMENTOS','MED051','AZATIOPRINA','TABLETA','50 MG','471','no regulado'),
(1,'MEDICAMENTOS','MED052','AZITROMICINA','FRASCO*15ML','200 MG/5ML','12482','no regulado'),
(1,'MEDICAMENTOS','MED053','AZITROMICINA','TABLETA','500MG','1102','no regulado'),
(1,'MEDICAMENTOS','MED054','BECLOMETASONA','FRASCO*10ML','250MCG','12558','no regulado'),
(1,'MEDICAMENTOS','MED055','BECLOMETASONA INHA NASAL','FRASCO*10ML','50 MCG','12270','no regulado'),
(1,'MEDICAMENTOS','MED056','BECLOMETASONA INHA BUCAL','FRASCO*10ML','50 MCG','12034','no regulado'),
(1,'MEDICAMENTOS','MED057','BENZOATO DE BENCILO','FRASCO*120ML',' 30G/100ML','8392','no regulado'),
(1,'MEDICAMENTOS','MED058','BETAMETASONA','AMPOLLA','4 MG','1077','no regulado'),
(1,'MEDICAMENTOS','MED059','BETAMETASONA','AMPOLLA',' 8MG','5460','no regulado'),
(1,'MEDICAMENTOS','MED060','BETAMETASONA','CREMA','20G','4591','no regulado'),
(1,'MEDICAMENTOS','MED061','BETAMETILDIGOXINA','GOTAS','06MG/ML','4743','no regulado'),
(1,'MEDICAMENTOS','MED062','BICARBONATO DE SODIO','AMPOLLA','840MG/10ML','4919','no regulado'),
(1,'MEDICAMENTOS','MED063','BIPERIDENO','TABLETA',' 2 MG','350','no regulado'),
(1,'MEDICAMENTOS','MED064','BISACODILO ','TABLETA',' 5MG','70','no regulado'),
(1,'MEDICAMENTOS','MED065','BROMURO IPATROPIO','FRASCO','20MCG/10ML','12593','19560'),
(1,'MEDICAMENTOS','MED066','BROMURO IPRATROPIO','FRASCO*15ML','025MG','24450','24450'),
(1,'MEDICAMENTOS','MED067','BRIMONIDINA','FRASCO*5ML','2MG','19554','23280'),
(1,'MEDICAMENTOS','MED068','BROMURO DE VECURONIO','AMPOLLA','10MG','32504','no regulado'),
(1,'MEDICAMENTOS','MED069','CALCITRIOL','CAPSULA','025 mcg','196','no regulado'),
(1,'MEDICAMENTOS','MED070','CALCITRIOL','CAPSULA','050 mcg','219','no regulado'),
(1,'MEDICAMENTOS','MED071','CAPTOPRIL','TABLETA','25 MG','98','no regulado'),
(1,'MEDICAMENTOS','MED072','CAPTOPRIL','TABLETA',' 50MG','115','no regulado'),
(1,'MEDICAMENTOS','MED073','CARBAMAZEPINA','TABLETA','200 mg','146','146'),
(1,'MEDICAMENTOS','MED074','CARBAMAZEPINA','FRASCO*120ML','100MG/5ML','8952','8952'),
(1,'MEDICAMENTOS','MED075','CARBON ACTIVADO','BOLSA*KG','','26428','no regulado'),
(1,'MEDICAMENTOS','MED076','CARBONATO CALCIO + V D','TABLETA','1250MG+330UI ','191','no regulado'),
(1,'MEDICAMENTOS','MED077','CARBONATO CALCIO','TABLETA','600 MG','118','no regulado'),
(1,'MEDICAMENTOS','MED078','CARBIDOPA+LEVODOPA','TABLETA','25MG/250MG','499','no regulado'),
(1,'MEDICAMENTOS','MED079','CARBONATO DE LITIO','TABLETA','300MG','757','no regulado'),
(1,'MEDICAMENTOS','MED080','CARVEDILOL','TABLETA','625 MG','90','297'),
(1,'MEDICAMENTOS','MED081','CEFALEXINA','FRASCO*60ML',' 250 MG/5ML','6545','no regulado'),
(1,'MEDICAMENTOS','MED082','CEFALEXINA','TABLETA','500 MG','530','no regulado'),
(1,'MEDICAMENTOS','MED083','CEFALOTINA','AMPOLLA',' 1 GR','2943','no regulado'),
(1,'MEDICAMENTOS','MED084','CEFAZOLINA','AMPOLLA',' 1 GR','2943','no regulado'),
(1,'MEDICAMENTOS','MED085','CEFRADINA','AMPOLLA',' 1GR','6724','no regulado'),
(1,'MEDICAMENTOS','MED086','CEFRADINA','TABLETA','500MG','609','no regulado'),
(1,'MEDICAMENTOS','MED087','CEFTRIAXONA','AMPOLLA','1 GR','2018','no regulado'),
(1,'MEDICAMENTOS','MED088','CEFUROXIMA','FRASCO*70ML','250MG/5ML','86765','86765'),
(1,'MEDICAMENTOS','MED089','CETIRIZINA','TABLETA','10MG','68','no regulado'),
(1,'MEDICAMENTOS','MED090','CIPROFLOXACINO','AMPOLLA','100 MG/10ML','2311','no regulado'),
(1,'MEDICAMENTOS','MED091','CIPROFLOXACINO','TABLETA','500MG','349','no regulado'),
(1,'MEDICAMENTOS','MED092','CLARITROMICINA','FRASCO','250MG/5ML','17657','no regulado'),
(1,'MEDICAMENTOS','MED093','CLARITROMICINA','TABLETA',' 500 MG','1962','no regulado'),
(1,'MEDICAMENTOS','MED094','CLARITROMICINA','AMPOLLA','500 MG','22449','no regulado'),
(1,'MEDICAMENTOS','MED095','CLINDAMICINA','AMPOLLA','600 MG','10470','no regulado'),
(1,'MEDICAMENTOS','MED096','CLONIDINA','TABLETA','0150 MG','55','no regulado'),
(1,'MEDICAMENTOS','MED097','CLOPIDROGEL','TABLETA','75 MG','171','1540'),
(1,'MEDICAMENTOS','MED098','CLORFENIRAMINA','TABLETA',' 4MG','48','no regulado'),
(1,'MEDICAMENTOS','MED099','CLORFENIRAMINA','FRASCO*120ML','2MG/5ML','3214','no regulado'),
(1,'MEDICAMENTOS','MED100','CLOROQUINA','TABLETA','250MG','252','no regulado'),
(1,'MEDICAMENTOS','MED101','CLORURO DE POTASIO','AMPOLLA','20MEQ/10ML','1496','no regulado'),
(1,'MEDICAMENTOS','MED102','CLORURO DE SODIO','AMPOLLA','20MEQ/10ML','1417','no regulado'),
(1,'MEDICAMENTOS','MED103','CLOTRIMAZOL','TABLETA','100MG','288','no regulado'),
(1,'MEDICAMENTOS','MED104','CLOTRIMAZOL','CREMA TOPICA','40G','3767','no regulado'),
(1,'MEDICAMENTOS','MED105','CLOTRIMAZOL ','CREMA VAGINAL','40G','6837','no regulado'),
(1,'MEDICAMENTOS','MED106','CLOTRIMAZOL','FRASCO*30ML','1%','3542','no regulado'),
(1,'MEDICAMENTOS','MED107','CLOZAPINA','TABLETA','25MG','157','no regulado'),
(1,'MEDICAMENTOS','MED108','COLCHICINA','TABLETA','0.5MG','132','no regulado'),
(1,'MEDICAMENTOS','MED109','COMPLEJO B','AMPOLLA','','6753','no regulado'),
(1,'MEDICAMENTOS','MED110','COMPLEJO B','TABLETA','','100','no regulado'),
(1,'MEDICAMENTOS','MED111','CROMOGLICATO SODIO','SOL OFT FRASCO*10ML','4','11124','no regulado'),
(1,'MEDICAMENTOS','MED112','CROMOGLICATO SODIO','SOL NAS FRASCO*10ML','4','4836','no regulado'),
(1,'MEDICAMENTOS','MED113','CROMOGLICATO SODIO','SOL NAS FRASCO* 10ML','2','7492','no regulado'),
(1,'MEDICAMENTOS','MED114','CROMOGLICATO SODIO','SOL OFT FRASCO*5ML','2','7176','no regulado'),
(1,'MEDICAMENTOS','MED115','CROTAMITON LOCION','FRASCO*60ML','1%','9005','no regulado'),
(1,'MEDICAMENTOS','MED116','DAPAGLIFLOZINA','TABLETA','10MG','5040','50405'),
(1,'MEDICAMENTOS','MED117','DESLORATADINA','FRASCO*60ML','25MG/5ML','3673','no regulado'),
(1,'MEDICAMENTOS','MED118','DEXAMETASONA','AMPOLLA','4 mg','589','no regulado'),
(1,'MEDICAMENTOS','MED119','DEXAMETASONA','AMPOLLA','8 MG','1079','no regulado'),
(1,'MEDICAMENTOS','MED120','DEXTROSA','BOLSA*500ML','10%','5325','no regulado'),
(1,'MEDICAMENTOS','MED121','DEXTROSA','BOLSA*500ML','5%','4747','no regulado'),
(1,'MEDICAMENTOS','MED122','DEXTROSA CON SOLUCION SALINA','BOLSA*500ML','5%','5456','no regulado'),
(1,'MEDICAMENTOS','MED123','DIAZEPAM','AMPOLLA','10 MG/2ML','6096','no regulado'),
(1,'MEDICAMENTOS','MED124','DICLOFENACO','TABLETA','50 MG','59','no regulado'),
(1,'MEDICAMENTOS','MED125','DICLOFENACO','AMPOLLA','75 MG/3ML','870','no regulado'),
(1,'MEDICAMENTOS','MED126','DICLOXACILINA','FRASCO*80ML','250MG/5ML','4961','no regulado'),
(1,'MEDICAMENTOS','MED127','DICLOXACILINA','CAPSULA','500 MG','442','no regulado'),
(1,'MEDICAMENTOS','MED128','DIFENHIDRAMINA','CAPSULA','50 MG','263','no regulado'),
(1,'MEDICAMENTOS','MED129','DIFENHIDRAMINA','FRASCO*120ML','125MG/5ML','4639','no regulado'),
(1,'MEDICAMENTOS','MED130','DIHIDROCODEINA ','FRASCO*120ML','242MG/ML','8829','no regulado'),
(1,'MEDICAMENTOS','MED131','DINITRATO','TABLETA','5MG','1886','no regulado'),
(1,'MEDICAMENTOS','MED132','DIPIRONA','AMPOLLA','1 GR/2ML','1422','no regulado'),
(1,'MEDICAMENTOS','MED133','DIPIRONA','AMPOLLA','25GR/5ML','1597','no regulado'),
(1,'MEDICAMENTOS','MED134','DIPIRONA','AMPOLLA','2 GR/5ML','6123','no regulado'),
(1,'MEDICAMENTOS','MED135','N-BUTIL BROMURO HIOSINA  + DIPIRONA','AMPOLLA','20MG + 25G/5ML','2854','no regulado'),
(1,'MEDICAMENTOS','MED136','DOBUTAMINA','AMPOLLA','250MG/5ML','12549','no regulado'),
(1,'MEDICAMENTOS','MED137','DOPAMINA','AMPOLLA','200MG/5ML','3135','no regulado'),
(1,'MEDICAMENTOS','MED138','DOXICICLINA','TABLETA','100 MG','261','no regulado'),
(1,'MEDICAMENTOS','MED139','ENALAPRIL','TABLETA','20 MG','172','no regulado'),
(1,'MEDICAMENTOS','MED140','ENALAPRIL','TABLETA','5 MG','219','no regulado'),
(1,'MEDICAMENTOS','MED141','ENOXAPARINA','AMPOLLA',' 40MG/04ML','13064','13064'),
(1,'MEDICAMENTOS','MED142','ENEMA TRAVAD','BOLSA','25%/1000ML','40055','no regulado'),
(1,'MEDICAMENTOS','MED143','ERGOTAMINA+CAFEINA','TABLETA','100MG/1MG','336','no regulado'),
(1,'MEDICAMENTOS','MED144','ERITROMICINA','FRASCO*60ML',' 250 MG/5ML','9868','no regulado'),
(1,'MEDICAMENTOS','MED145','ERITROMICINA','TABLETA','500 MG','869','no regulado'),
(1,'MEDICAMENTOS','MED146','ESOMEPRAZOL','TABLETA','20 MG','143','no regulado'),
(1,'MEDICAMENTOS','MED147','ESOMEPRAZOL','TABLETA','40 MG','156','no regulado'),
(1,'MEDICAMENTOS','MED148','ESPIRONOLACTONA','TABLETA','25MG','157','no regulado'),
(1,'MEDICAMENTOS','MED149','ESTROGENOS CONJUGADOS','CREMA','625 mg','33684','33684'),
(1,'MEDICAMENTOS','MED150','ESTROGENOS CONJUGADOS','TABLETA','0.625MG','889','1029'),
(1,'MEDICAMENTOS','MED151','FENITOINA','TABLETA','100MG','2878','no regulado'),
(1,'MEDICAMENTOS','MED152','FENITOINA','AMPOLLA','250MG/5ML','3058','no regulado'),
(1,'MEDICAMENTOS','MED153','NEOMICINA+HIDROCORTISONA+COLISTINA','FRASCO*15ML','5MG+05MG+1538MG/ML','29434','no regulado'),
(1,'MEDICAMENTOS','MED154','FLUCONAZOL','TABLETA','200 MG','692','no regulado'),
(1,'MEDICAMENTOS','MED155','FLUIMUCIL','FRASCO*25ML','10MG/ML','36800','no regulado'),
(1,'MEDICAMENTOS','MED156','FLUOXETINA','TABLETA','20MG','73','no regulado'),
(1,'MEDICAMENTOS','MED157','FLUOXETINA','FRASCO*70ML','20MG/5ML','5611','no regulado'),
(1,'MEDICAMENTOS','MED158','FLUINARIZINA','TABLETA','10MG','97','no regulado'),
(1,'MEDICAMENTOS','MED159','FLUINARIZINA','TABLETA','5MG','429','no regulado'),
(1,'MEDICAMENTOS','MED160','FUROSEMIDA','AMPOLLA','20 MG/2ML','1345','no regulado'),
(1,'MEDICAMENTOS','MED161','FUROSEMIDA','TABLETA','40MG','58','no regulado'),
(1,'MEDICAMENTOS','MED162','GEMFIBROZILO','TABLETA','600MG','344','no regulado'),
(1,'MEDICAMENTOS','MED163','GENTAMICINA','AMPOLLA','160 MG/2ML','1667','no regulado'),
(1,'MEDICAMENTOS','MED164','GENTAMICINA','AMPOLLA','40MG/2ML','2260','no regulado'),
(1,'MEDICAMENTOS','MED165','HIDROXIDO DE ALUMINIO','FRASCO 360ML','6G/100ML','11048','no regulado'),
(1,'MEDICAMENTOS','MED166','GENTAMICINA','AMPOLLA','80 MG/2ML','8111','no regulado'),
(1,'MEDICAMENTOS','MED167','GENTAMICINA','CREMA','1MG','10381','no regulado'),
(1,'MEDICAMENTOS','MED168','GENTAMICINA','FRASCO*6ML','300%','3503','no regulado'),
(1,'MEDICAMENTOS','MED169','GENTAMICINA','UNG ENTO','5G','17199','no regulado'),
(1,'MEDICAMENTOS','MED170','GLIBENCLAMIDA','TABLETA','5 MG','101','no regulado'),
(1,'MEDICAMENTOS','MED171','GLUCONATO DE CALCIO','AMPOLLA','1','2649','no regulado'),
(1,'MEDICAMENTOS','MED172','HALOPERIDOL','TABLETA','10MG','246','no regulado'),
(1,'MEDICAMENTOS','MED173','HALOPERIDOL','TABLETA','5MG','182','no regulado'),
(1,'MEDICAMENTOS','MED174','HALOPERIDOL','AMPOLLA',' 5MG/ML','2187','no regulado'),
(1,'MEDICAMENTOS','MED175','HALOPERIDOL','FRASCO*15ML','2MG/ML','6727','no regulado'),
(1,'MEDICAMENTOS','MED176','HEPARINA','AMPOLLA','5000 UI','28588','no regulado'),
(1,'MEDICAMENTOS','MED177','VACUNA CONTRA LA HEPATITIS B','AMPOLLA','','63901','no regulado'),
(1,'MEDICAMENTOS','MED178','HIDROCLOROTIAZIDA','TABLETA','25 MG','39','no regulado'),
(1,'MEDICAMENTOS','MED179','HIDROCORTIZONA','AMPOLLA','100 MG','4624','no regulado'),
(1,'MEDICAMENTOS','MED180','HIDROCORTIZONA','CREMA','1%','4459','no regulado'),
(1,'MEDICAMENTOS','MED181','HIDROCORTIZONA','FRASCO','30G','7278','no regulado'),
(1,'MEDICAMENTOS','MED182','HIDROXICINA','AMPOLLA','100MG/2ML','13663','no regulado'),
(1,'MEDICAMENTOS','MED183','HIDROXICINA','TABLETA','25MG','134','no regulado'),
(1,'MEDICAMENTOS','MED184','HIDROXIDO DE ALUMINIO+MAGNESIO+SIMETICONA','FRASCO*360ML','40G+40G+400MG','8493','no regulado'),
(1,'MEDICAMENTOS','MED185','IBUPROFENO','FRASCO','100 MG','6276','no regulado'),
(1,'MEDICAMENTOS','MED186','IBUPROFENO ','TABLETA','400MG','151','no regulado'),
(1,'MEDICAMENTOS','MED187','INSULINA APIDRA','AMPOLLA','10ML','80240','80240'),
(1,'MEDICAMENTOS','MED188','INSULINA APIDRA','AMPOLLA','3ML','24072','24072'),
(1,'MEDICAMENTOS','MED189','INSULINA ASPARTA','LAPICERO','100UI','24204','24204'),
(1,'MEDICAMENTOS','MED190','INSULINA DEGLUDEC','AMPOLLA','3 ML','50022','50022'),
(1,'MEDICAMENTOS','MED191','INSULINA GLARGINA','VIAL X 10ML','100UI/ML','94893','127800'),
(1,'MEDICAMENTOS','MED192','INSULINA GLARGINA','AMPOLLA','3ML','38340','38340'),
(1,'MEDICAMENTOS','MED193','HIDROXIDO DE ALUMINIO+MAGNESIO+SIMETICONA','FRASCO*150ML','40G+40G+400MG','9288','no regulado'),
(1,'MEDICAMENTOS','MED194','INSULINA R','AMPOLLA','1000 UI','19453','no regulado'),
(1,'MEDICAMENTOS','MED195','INSULINA NPH','AMPOLLA','100 UI','18511','no regulado'),
(1,'MEDICAMENTOS','MED196','IMIPRAMINA','TABLETA','25 mg','126','no regulado'),
(1,'MEDICAMENTOS','MED197','IVERMECTINA','FRASCO*5ML','6MG/ML','4944','no regulado'),
(1,'MEDICAMENTOS','MED198','KALETRA (LOPINAVIR + RITONAVIR)','TABLETA','200MG/50MG','1213','no regulado'),
(1,'MEDICAMENTOS','MED199','KALETRA (LOPINAVIR + RITONAVIR)','FRASCO*160ML','80MG/20ML','1346','no regulado'),
(1,'MEDICAMENTOS','MED200','KETAMINA','AMPOLLA','500MG','22425','no regulado'),
(1,'MEDICAMENTOS','MED201','KETOCONAZOL','TABLETA','200MG','375','no regulado'),
(1,'MEDICAMENTOS','MED202','KETOCONAZOL','CREMA','2%','7259','no regulado'),
(1,'MEDICAMENTOS','MED203','KETOTIFENO','TABLETA','1 MG','92','no regulado'),
(1,'MEDICAMENTOS','MED204','KETOTIFENO','FRASCO*100ML','276MG','4114','no regulado'),
(1,'MEDICAMENTOS','MED205','LABETALOL','AMPOLLA','100MG/120ML','19863','19863'),
(1,'MEDICAMENTOS','MED206','LACTATO RINGER','BOLSA*500ML','','4378','no regulado'),
(1,'MEDICAMENTOS','MED207','LAMIVUDINA','FRASCO*240ML','10MG/ML','42040','no regulado'),
(1,'MEDICAMENTOS','MED208','LAMIVUDINA+ ZIDOVUDINA','TABLETA','150MG+300MG','726','no regulado'),
(1,'MEDICAMENTOS','MED209','LANSOPRAZOL','TABLETA','30MG','269','829'),
(1,'MEDICAMENTOS','MED210','LEFLUNOMIDA','TABLETA','20MG','947','6453'),
(1,'MEDICAMENTOS','MED211','LEVONOGESTREL','TABLETA',' 0.75 MG','4159','8707'),
(1,'MEDICAMENTOS','MED212','LEVONOGESTREL+ ETINILESTRADIOL','CAJA X 21 TABLETAS','150MCG+30MCG','87','290'),
(1,'MEDICAMENTOS','MED213','LEVOTIROXINA','TABLETA','100MCG','58','no regulado'),
(1,'MEDICAMENTOS','MED214','LEVOTIROXINA','TABLETA','50MCG','111','no regulado'),
(1,'MEDICAMENTOS','MED215','LEVOTIROXINA','TABLETA','75MCG','429','no regulado'),
(1,'MEDICAMENTOS','MED216','LEVOTIROXINA','TABLETA','25MCG','137','no regulado'),
(1,'MEDICAMENTOS','MED217','LEVOMPROMAZINA','TABLETA','25MG','342','no regulado'),
(1,'MEDICAMENTOS','MED218','LEVOMEPROMAZINA','FRASCO*20ML','40MG/ML','13417','no regulado'),
(1,'MEDICAMENTOS','MED219','LEVOFLOXACINA','TABLETA','500MG','1842','no regulado'),
(1,'MEDICAMENTOS','MED220','LIDOPROCTO','UNG ENTO','10G','25224','no regulado'),
(1,'MEDICAMENTOS','MED221','LOPERAMIDA','TABLETA','2MG','76','no regulado'),
(1,'MEDICAMENTOS','MED222','LORATADINA','FRASCO*100ML','1MG/ML','4087','no regulado'),
(1,'MEDICAMENTOS','MED223','LORATADINA','TABLETA','10 MG','81','no regulado'),
(1,'MEDICAMENTOS','MED224','LOSARTAN','TABLETA','100MG','157','no regulado'),
(1,'MEDICAMENTOS','MED225','LOSARTAN','TABLETA','50 MG','61','no regulado'),
(1,'MEDICAMENTOS','MED226','LOVASTATINA','TABLETA','20MG','94','no regulado'),
(1,'MEDICAMENTOS','MED227','MANITOL','BOLSA*250ML','20%','37480','no regulado'),
(1,'MEDICAMENTOS','MED228','MEBENDAZOL','FRASCO*20ML','100MG/5ML','2225','no regulado'),
(1,'MEDICAMENTOS','MED229','MEBENDAZOL','TABLETA','100MG','2225','no regulado'),
(1,'MEDICAMENTOS','MED230','MEDROXIPROGESTRONA+ESTRADIOL','AMPOLLA','25MG+5MG','7673','14037'),
(1,'MEDICAMENTOS','MED231','MEDROXIPROGESTRONA+ ACETATO','AMPOLLA','150MG /3ML','11325','11325'),
(1,'MEDICAMENTOS','MED232','MEDROXIPROGESTERONA','TABLETA',' 5MG','369','369'),
(1,'MEDICAMENTOS','MED233','METFORMINA','TABLETA','1000MG','501','no regulado'),
(1,'MEDICAMENTOS','MED234','METFORMINA','TABLETA','850MG','127','no regulado'),
(1,'MEDICAMENTOS','MED235','METHERGYN METILERGOMETRINA','AMPOLLA','0.2MG','1547','1547'),
(1,'MEDICAMENTOS','MED236','METILPREDNISOLONA','AMPOLLA','500 MG','21535','67935'),
(1,'MEDICAMENTOS','MED237','METOCARBAMOL','TABLETA','750 MG','283','no regulado'),
(1,'MEDICAMENTOS','MED238','METOCLOPRAMIDA','AMPOLLA','10 MG','1064','no regulado'),
(1,'MEDICAMENTOS','MED239','METOCLOPRAMIDA','TABLETA','10 MG','97','no regulado'),
(1,'MEDICAMENTOS','MED240','METOCLOPRAMIDA ','GOTAS','4MG/ML','3165','no regulado'),
(1,'MEDICAMENTOS','MED241','METOPROLOL','TABLETA','100MG','208','977'),
(1,'MEDICAMENTOS','MED242','METOPROLOL','TABLETA','50 MG','73','488'),
(1,'MEDICAMENTOS','MED243','METOPROLOL','AMPOLLA','5MG/5ML','25689','no regulado'),
(1,'MEDICAMENTOS','MED244','METRONIDAZOL','SUSPENSI N*120ML','250 MG/5ML','6468','no regulado'),
(1,'MEDICAMENTOS','MED245','METOTREXATO','TABLETA','2.5MG','404','no regulado'),
(1,'MEDICAMENTOS','MED246','METRONIDAZOL','TABLETA',' 500 MG','143','no regulado'),
(1,'MEDICAMENTOS','MED247','METRONIDAZOL','OVULOS','500 MG','412','no regulado'),
(1,'MEDICAMENTOS','MED248','METRONIDAZOL','AMPOLLA','500 MG','3196','no regulado'),
(1,'MEDICAMENTOS','MED249','MIDAZOLAM','AMPOLLA','5 MG/5ML','3532','no regulado'),
(1,'MEDICAMENTOS','MED250','MISOPROSTROL','TABLETA',' 200MG','4585','no regulado'),
(1,'MEDICAMENTOS','MED251','NALOXONA','AMPOLLA','0.4MG','33655','no regulado'),
(1,'MEDICAMENTOS','MED252','NAPROXENO','SUSPENSION','150MG/5ML','5108','no regulado'),
(1,'MEDICAMENTOS','MED253','NAPROXENO','TABLETA','250 MG','156','no regulado'),
(1,'MEDICAMENTOS','MED254','N-BUTIL BROMURO HIOSCINA','TABLETA','10 MG','364','no regulado'),
(1,'MEDICAMENTOS','MED255','N-BUTIL BROMURO HIOSINA ','AMPOLLA','20 MG','1337','no regulado'),
(1,'MEDICAMENTOS','MED256','NIFEDIPINO','CAPSULAS','10 MG','462','no regulado'),
(1,'MEDICAMENTOS','MED257','NIFEDIPINO','CAPSULAS','30 MG','320','no regulado'),
(1,'MEDICAMENTOS','MED258','NIMODIPINO','CAPSULAS','30MG','184','no regulado'),
(1,'MEDICAMENTOS','MED259','NISTATINA','SUSPENSION*60ML','10OOO UI ','5906','no regulado'),
(1,'MEDICAMENTOS','MED260','NISTATINA','CREMA','100000UI-200MG/G','15734','no regulado'),
(1,'MEDICAMENTOS','MED261','NISTATINA','OVULOS','100000 UI','766','no regulado'),
(1,'MEDICAMENTOS','MED262','NITROFURANTOINA ','CAPSULA','100 MG','305','no regulado'),
(1,'MEDICAMENTOS','MED263','NITROGLICERINA','AMPOLLA','50MG/10ML','21427','no regulado'),
(1,'MEDICAMENTOS','MED264','NITROPRUSIATO','AMPOLLA','50MG','49438','no regulado'),
(1,'MEDICAMENTOS','MED265','NORFLOXACINO','TABLETA',' 400 MG','236','no regulado'),
(1,'MEDICAMENTOS','MED266','OLANZAPINA','TABLETA','5MG','208','2150'),
(1,'MEDICAMENTOS','MED267','OLANZAPINA','TABLETA','10MG','375','4301'),
(1,'MEDICAMENTOS','MED268','OMEPRAZOL','CAPSULA','20 MG','76','no regulado'),
(1,'MEDICAMENTOS','MED269','OMEPRAZOL','AMPOLLA','40 MG','4643','no regulado'),
(1,'MEDICAMENTOS','MED270','OXACILINA','AMPOLLA','1 GR','2702','no regulado'),
(1,'MEDICAMENTOS','MED271','OXITOCINA','AMPOLLA','10 UI','5398','no regulado'),
(1,'MEDICAMENTOS','MED272','PAMOATO PIRANTEL','TABLETA','250MG','509','no regulado'),
(1,'MEDICAMENTOS','MED273','PAMOATO PIRANTEL','FRASCO','250MG','2861','no regulado'),
(1,'MEDICAMENTOS','MED274','DIMENHIDRINATO','TABLETA','50MG','95','no regulado'),
(1,'MEDICAMENTOS','MED275','PENICILINA BENZATINICA SODICA','AMPOLLA','1000000 UI','2831','no regulado'),
(1,'MEDICAMENTOS','MED276','PENICILINA BENZATICA','AMPOLLA','1200000 UI','2540','no regulado'),
(1,'MEDICAMENTOS','MED277','PENICILINA BENZATICA','AMPOLLA','2400000 UI','4036','no regulado'),
(1,'MEDICAMENTOS','MED278','PENICILINA BENZATICA','AMPOLLA','5000000 UI','4771','no regulado'),
(1,'MEDICAMENTOS','MED279','PENICILINA BENZATICA','AMPOLLA','800000 UI','4391','no regulado'),
(1,'MEDICAMENTOS','MED280','PIPERAZINA','FRASCO*60ML','20%','15700','no regulado'),
(1,'MEDICAMENTOS','MED281','PIPOTIAZINA','AMPOLLA','25MG','27419','no regulado'),
(1,'MEDICAMENTOS','MED282','PIRIDOXINA','TABLETA','50MG','101','no regulado'),
(1,'MEDICAMENTOS','MED283','PODOFILINA','FRASCO*5ML','100ML/20G','29987','no regulado'),
(1,'MEDICAMENTOS','MED284','PREDNISOLONA + FELINEFRINA','FRASCO*15ML','10 MG + 1.2 MG/ML','22516','no regulado'),
(1,'MEDICAMENTOS','MED285','PREDNISOLONA','TABLETA','5 MG','72','no regulado'),
(1,'MEDICAMENTOS','MED286','PREDNISOLONA','SOLUCION ORAL *120 ML','1MG/1ML','70537','no regulado'),
(1,'MEDICAMENTOS','MED287','PREDNISONA','TABLETA',' 50MG','1373','no regulado'),
(1,'MEDICAMENTOS','MED288','PROPRANOLOL','TABLETA','40MG','110','no regulado'),
(1,'MEDICAMENTOS','MED289','PROPRANOLOL','TABLETA',' 80MG','284','no regulado'),
(1,'MEDICAMENTOS','MED290','HIDROCLOROTIAZIDA+LOSARTAN','TABLETA','12.5MG+50MG','123','no regulado'),
(1,'MEDICAMENTOS','MED291','ATAZANAVIR+RITONAVIR','TABLETA',' 300MG+100MG','3532','no regulado'),
(1,'MEDICAMENTOS','MED294','ROXICAINA CON EPINEFRINA','VIAL 50ML','5MCG+20MG','28500','no regulado'),
(1,'MEDICAMENTOS','MED295','ROXICAINA LIDOCAINA CLORHIDRATO (POMADA)','TUBO 10ML','5','39796','no regulado'),
(1,'MEDICAMENTOS','MED296','LIDOCAINA','JALEA','2%','19986','no regulado'),
(1,'MEDICAMENTOS','MED297','ROXICAINA SIMPLE','FRASCO*50ML','10MG/M (1%)','29513','no regulado'),
(1,'MEDICAMENTOS','MED298','ROXICAINA 2% +LIDOCAINA TAPA AZUL','FRASCO*50ML','20MG/ML','17009','no regulado'),
(1,'MEDICAMENTOS','MED299','RISPERIDONA','POLVO','25MG','344029','344029'),
(1,'MEDICAMENTOS','MED300','SALBUTAMOL','INHALADOR','100MCG','6391','no regulado'),
(1,'MEDICAMENTOS','MED302','SALBUTAMOL ','FRASCO *120ML','2MG/5ML','2645','7512'),
(1,'MEDICAMENTOS','MED303','SALBUTAMOL SOL. NEBULIZAR','FRASCO*10ML','5MG/ML ','36418','no regulado'),
(1,'MEDICAMENTOS','MED304','SALES DE REHIDRATACION','SOBRE','284G','2404','no regulado'),
(1,'MEDICAMENTOS','MED305','SERTRALINA','TABLETA','100MG','347','no regulado'),
(1,'MEDICAMENTOS','MED306','SERTRALINA','TABLETA','50MG','164','no regulado'),
(1,'MEDICAMENTOS','MED307','SOLUCION SALINA','BOLSA 500ML','0.9%','3952','no regulado'),
(1,'MEDICAMENTOS','MED308','SOLUCION SALINA','BOLSA 100ML','0.9%','3292','no regulado'),
(1,'MEDICAMENTOS','MED309','SUCRALFATO','TABLETA','1MG','509','no regulado'),
(1,'MEDICAMENTOS','MED310','SUERO ANTIOFIDICO','FRASCO*10ML','','354599','no regulado'),
(1,'MEDICAMENTOS','MED312','SULFADIAZINA DE PLATA','CREMA','1%','5046','no regulado'),
(1,'MEDICAMENTOS','MED313','SULFATO FERROSO ','FRASCO  120ML','200MG/5ML','3996','no regulado'),
(1,'MEDICAMENTOS','MED314','SULFATO FERROSO MAGNES','FRASCO*20ML','125MG','3233','no regulado'),
(1,'MEDICAMENTOS','MED315','SULFATO FERROSO','TABLETA','300MG','73','no regulado'),
(1,'MEDICAMENTOS','MED316','SULFATO DE MAGNESIO','AMPOLLA','20%','2416','no regulado'),
(1,'MEDICAMENTOS','MED317','SULFATO DE ZINC','FRASCO*80ML','2MG/ML','7534','no regulado'),
(1,'MEDICAMENTOS','MED318','SULFATO DE ZINC','FRASCO*120ML','2MG/ML','5832','no regulado'),
(1,'MEDICAMENTOS','MED319','SUPOSITORIO GLICERINA ADULTO','TABLETA','13672G','1918','no regulado'),
(1,'MEDICAMENTOS','MED320','SUPOSITORIO GLICERINA PEDIATRICO','','','2000','no regulado'),
(1,'MEDICAMENTOS','MED321','TAMOXIFENO','TABLETA','20MG','473','no regulado'),
(1,'MEDICAMENTOS','MED322','TAMSULOSINA','CAPSULA','0.4MG','488','no regulado'),
(1,'MEDICAMENTOS','MED323','TELMISARTAN','CAPSULA','80MG ','566','1043'),
(1,'MEDICAMENTOS','MED324','TEOFILINA','CAPSULA','125MG','302','no regulado'),
(1,'MEDICAMENTOS','MED325','TEOFILINA','CAPSULA','300MG','300','no regulado'),
(1,'MEDICAMENTOS','MED326','TERBUTALINA','FRASCO*10ML','10 mg','15397','no regulado'),
(1,'MEDICAMENTOS','MED327','TERBUTALINA','AMPOLLA',' 05 MG','15300','no regulado'),
(1,'MEDICAMENTOS','MED328','TETRACICLINA','CAPSULA','500MG','3390','no regulado'),
(1,'MEDICAMENTOS','MED329','TIAMINA','AMPOLLA','100 MG','7231','no regulado'),
(1,'MEDICAMENTOS','MED330','TIAMINA','TABLETA',' 300MG','191','no regulado'),
(1,'MEDICAMENTOS','MED331','TIMOLOL','FRASCO*5ML','0.5%','3952','11672'),
(1,'MEDICAMENTOS','MED332','TINIDAZOL','FRASCO*15ML','200 MG','3167','no regulado'),
(1,'MEDICAMENTOS','MED333','TINIDAZOL','TABLETA','500 MG','211','no regulado'),
(1,'MEDICAMENTOS','MED334','TRAMADOL','AMPOLLA','100MG/2ML','1399','no regulado'),
(1,'MEDICAMENTOS','MED335','TRAMADOL','FRASCO*10ML','100MG','2838','no regulado'),
(1,'MEDICAMENTOS','MED336','TRAMADOL','AMPOLLA','50 mg/ML','734','no regulado'),
(1,'MEDICAMENTOS','MED337','TRAZODONA','TABLETA','100MG','4610','no regulado'),
(1,'MEDICAMENTOS','MED338','TRAZODONA','TABLETA','50MG','139','no regulado'),
(1,'MEDICAMENTOS','MED339','TRIMET SULFA - TRIMETOPRIN SULFAMETOXAZOL','TABLETA','160MG - 800MG','308','no regulado'),
(1,'MEDICAMENTOS','MED340','TRIMET SULFA','FRASCO*60ML','40MG-200MG/5ML','4042','no regulado'),
(1,'MEDICAMENTOS','MED341','TRIMET SULFA','FRASCO*120ML','40MG-200MG/5ML','4042','no regulado'),
(1,'MEDICAMENTOS','MED342','TRIMET SULFA - TRIMETOPRIN SULFAMETOXAZOL','TABLETA','80MG/400MG','232','no regulado'),
(1,'MEDICAMENTOS','MED343','VACUNA ANTITETANICA','AMPOLLA*3ML','40 UI','17169','no regulado'),
(1,'MEDICAMENTOS','MED344','VASOPRESINA','AMPOLLA','20 UI','17481','no regulado'),
(1,'MEDICAMENTOS','MED345','VERAPAMILO','TABLETA','120MG','308','308'),
(1,'MEDICAMENTOS','MED346','VERAPAMILO','TABLETA','80MG','205','205'),
(1,'MEDICAMENTOS','MED347','VIDALGLIPTINA + METFORMINA ','TABLETA','50MG/1000MG','2079','2570'),
(1,'MEDICAMENTOS','MED348','VITAMINA A','CAPSULA','50000UI','135','no regulado'),
(1,'MEDICAMENTOS','MED349','VITAMINA B12','AMPOLLA','1MG/ML','1854','no regulado'),
(1,'MEDICAMENTOS','MED350','ACIDO ASCORBICO','TABLETA','500MG','185','no regulado'),
(1,'MEDICAMENTOS','MED351','ACIDO ASCORBICO','FRASCO*30ML','100MG/ML','5886','no regulado'),
(1,'MEDICAMENTOS','MED352','FITOMENADIONA','AMPOLLA','1MG/ML','2544','no regulado'),
(1,'MEDICAMENTOS','MED353','FITOMENADIONA','AMPOLLA','10MG/ML','2699','no regulado'),
(1,'MEDICAMENTOS','MED354','WARFARINA','TABLETA','5MG','181','no regulado'),
(1,'MEDICAMENTOS','MED355','OXIMETASOLINA HCL','FRASCO*15ML','500%','3968','no regulado'),
(1,'MEDICAMENTOS','MED356','DEXAMETASONA+NEOMICINA +POLIMIXINA B','FRASCO*5ML','1MG+3.5MG+6.600UI','5293','no regulado'),
(1,'MEDICAMENTOS','MED357','ZIDOVUDINA','FRASCO*240ml',' 10 MG/ML','42375','no regulado'),
(1,'MEDICAMENTOS','MED358','ATAZANAVIR','TABLETA','300MG','2547','32394'),
(1,'MEDICAMENTOS','MED359','DARUNAVIR','TABLETA','800MG','8408','36296'),
(1,'MEDICAMENTOS','MED360','DOLUTEGRAVIR','TABLETA','50MG','21477','52505'),
(1,'MEDICAMENTOS','MED361','RITONAVIR','TABLETA','100MG','1169','2272'),
(1,'MEDICAMENTOS','MED362','TENOFOVIR + EMTRICITABINA','TABLETA','300MG-200MG','1704','35308'),
(1,'MEDICAMENTOS','MED363','TENOFOVIR','TABLETA','300MG','1580','26130'),
(1,'MEDICAMENTOS','MED364','OXIBUTININA','COMPRIMIDOS','5MG','282','333'),
(1,'MEDICAMENTOS','MED365','LATANOPROST','FRASCO*5ML','50MG/ML','12276','41343'),
(1,'MEDICAMENTOS','MED366','DOMPERIDONA','TABLETA','10 MG','179','179'),
(1,'MEDICAMENTOS','MED367','MEPERIDINA','AMPOLLA','100 MG','2809','no regulado'),
(1,'MEDICAMENTOS','MED368','CEFEPIMA','AMPOLLA','1GR','5474','no regulado'),
(1,'MEDICAMENTOS','MED369','PIPERACILINA + TAZOBACTAN','AMPOLLA','4G+05G','12154','no regulado'),
(1,'MEDICAMENTOS','MED370','LEVONORGESTREL IMPLANTE SUBDERMICO KIT','UNIDAD','75MG','126134','154724'),
(1,'MEDICAMENTOS','MED371','SITAGLIPTINA+METFORMINA','CAPSULA','50MG/1000MG','2570','2570'),
(1,'MEDICAMENTOS','MED372','CARVEDILOL ','TABLETA','125MG','115','594'),
(1,'MEDICAMENTOS','MED373','ACEITE DE RECINO','FRASCO*60ML','','6075','no regulado'),
(1,'MEDICAMENTOS','MED375','ADENOCINA','','','27315','27315'),
(1,'MEDICAMENTOS','MED385','KETOCONAZOL','FRASCO','100MG/5ML','14830','no regulado'),
(1,'MEDICAMENTOS','MED386','CARBOXIMETILCELULOSA','GOTAS OFTALMICAS','5','9946','no regulado'),
(1,'MEDICAMENTOS','MED388','ACIDO FOLICO ','TABLETA','5MG','157','no regulado'),
(1,'MEDICAMENTOS','MED389','PRAZOSINA ','TABLETA','1 MG','67','no regulado'),
(1,'MEDICAMENTOS','MED390','DIOSMINA','TABLETA','500 MG','877','877'),
(1,'MEDICAMENTOS','MED391','RIFAMPICINA + ISONIAZIDA ','TABLETA','300+150','56044','no regulado'),
(1,'MEDICAMENTOS','MED392','BETAHISTINA DICLORIDRATO','TABLETA','8 MG','376','no regulado'),
(1,'MEDICAMENTOS','MED394','DARUNAVIR+RITONAVIR  ','TABLETA','600MG+100MG','8226','no regulado'),
(1,'MEDICAMENTOS','MED395','DARUNAVIR+RITONAVIR','TABLETA','800MG+100MG','13601','no regulado'),
(1,'MEDICAMENTOS','MED396','ZIDOVUDINA','TABLETA','300MG','1153','no regulado'),
(1,'MEDICAMENTOS','MED397','ABACAVIR+LAMIVUDINA','FRASCO','600MG+300MG','2489','29310'),
(1,'MEDICAMENTOS','MED400','QUETIAPINA','TABLETA','100 MG ','425','2239'),
(1,'MEDICAMENTOS','MED401','QUETIAPINA','TABLETAS','200MG','827','4478'),
(1,'MEDICAMENTOS','MED402','SEMAGLUTIDA 05 MG','LAPICERO','134MG/ML','599383','599383'),
(1,'MEDICAMENTOS','MED403','METFORMINA CLORHIDRATO TABLETA DE LIBERACI N PROLOMGADA','TABLETA','1000MG','501','no regulado'),
(1,'MEDICAMENTOS','MED404','INSULINA DEGLUTEC/LIRAGLUTIDA','SOLUCI N INYECTABLE','1000/36 MG','157629','157629'),
(1,'MEDICAMENTOS','MED405','ROSUVASTATINA','TABLETA','40 MG','408','no regulado'),
(1,'MEDICAMENTOS','MED406','LEVOTIROXINA','TABLETA','125 MG','203','no regulado'),
(1,'MEDICAMENTOS','MED407','POLIETILENGLICOL+PROPILENGLICOL  (SYSTANE ULTRA) ','SOLUCION OFTALMICA','(4MG+3MG)/ML SOL OFT GTS FCO*10ML ','41753','no regulado'),
(1,'MEDICAMENTOS','MED410','PANTOPRAZOL SODICO','TABLETA','40 MG','350','no regulado'),
(1,'MEDICAMENTOS','MED411','CLOZAPINA','TABLETA','100MG','240','no regulado'),
(1,'MEDICAMENTOS','MED412','SULFASALAZINA 500MG C*10 GG (ROSULFANT) - ROPSOHN','TABLETA','500 MG','571','no regulado'),
(1,'MEDICAMENTOS','MED413','DUTASTERIDA/TAMSULOSINA','CAPSULA','05 + 04 MG','2009','2372'),
(1,'MEDICAMENTOS','MED414','CICLOFOSFAMIDA 1G POL INY C*1 VIAL','POLVO INYENTABLE','1G ','82902','no regulado'),
(1,'MEDICAMENTOS','MED415','FLUOROMETALONA ','SOLUCION OFTALMICA','1','12470','no regulado'),
(1,'MEDICAMENTOS','MED416','HIDROCLOROTIAZIDA+VALSARTAN','TABLETA','12.5MG+160MG','1707','no regulado'),
(1,'MEDICAMENTOS','MED417','LEVETIRACETAM','TABLETA','1000 MG','1239','2940'),
(1,'MEDICAMENTOS','MED418','OXIBUTININA','COMPRIMIDOS','10MG','2900','2900'),
(1,'MEDICAMENTOS','MED419','PREDNISOLONA','SOLUCION OFTALMICA','10MG/ML','9904','no regulado'),
(1,'MEDICAMENTOS','MED420','RITUXIMAB','SOLUCION (VIAL)','500MG/50ML','3863132','4737550'),
(1,'MEDICAMENTOS','MED421','VALSARTAN ','TABLETA','160 MG','558','1596'),
(1,'MEDICAMENTOS','MED422','CARBONATO DE CALCIO','TABLETA','1500MG','118','no regulado'),
(1,'MEDICAMENTOS','MED423','FORMULA TERAPEUTICA F-75','POLVO ORAL LATA *400 GR','75KCAL/100ML','93161','no regulado'),
(1,'MEDICAMENTOS','MED424','FORMULA TERAPEUTICA FTCL','POLVO ORAL SOB *92GR','500 KCAL','9249','no regulado'),
(1,'MEDICAMENTOS','MED425','DIENOGEST ESTROGENO + ETINILESTRADIOL (bellafaxe)','CAJA * 28 TABLETAS','','1605','1605'),
(1,'MEDICAMENTOS','MED426','MISOPROSTROL CAJA * 3 TABLETAS','TABLETA ',' 200MG','4531','no regulado'),
(1,'MEDICAMENTOS','MED427','ZIDOVUDINA','TABLETA','100MG','NO SE OFERTA','no regulado'),
(1,'MEDICAMENTOS','MED428','LOPINAVIR + RITONAVIR','SOLUCION ORAL ','400/100MG/5ML','136950','no regulado'),
(1,'MEDICAMENTOS','MED429','LOPINAVIR + RITONAVIR','TABLETA','100/25MG','NO SE OFERTA','no regulado'),
(1,'MEDICAMENTOS','MED430','LOPINAVIR + RITONAVIR','TABLETA','200/50MG','1472','no regulado'),
(1,'MEDICAMENTOS','MED431','ABACAVIR','SOLUCION ORAL','20MG/ML','71468','no regulado'),
(1,'MEDICAMENTOS','MED432','ABACAVIR','TABLETA','300MG','566','no regulado'),
(1,'MEDICAMENTOS','MED433','RALTEGRAVIR','TABLETA MASTICABLE','25MG','1982','1982'),
(1,'MEDICAMENTOS','MED434','RALTEGRAVIR','TABLETA MASTICABLE','100 MG','7929','7929'),
(1,'MEDICAMENTOS','MED435','RALTEGRAVIR','TABLETA RECUBIERTA','400MG','17326','31716'),
(1,'MEDICAMENTOS','MED436','QUETIAPINA','TABLETA','25MG','177','559'),
(1,'MEDICAMENTOS','MED437','VILDAGLIPTINA','TABLETA','50MG','1810','2084'),
(1,'MEDICAMENTOS','MED438','LAMIVUDINA','TABLETA','150MG','1648','no regulado'),
(1,'MEDICAMENTOS','MED439','PREGABALINA','CAPSULA','75MG','219','1667'),
(1,'MEDICAMENTOS','MED440','AMLODIPINO + HIDROCLOROTIAZIDA+VALSARTAN','TABLETA','5MG+125 MG+160 MG','2035','2035'),
(1,'MEDICAMENTOS','MED441','HIDRALAZINA','AMPOLLA','20 MG','NO SE OFERTA','no regulado'),
(1,'MEDICAMENTOS','MED442','CEFTRIAZONA','AMPOLLA','500 MG','2018','no regulado'),
(1,'MEDICAMENTOS','MED443','AZITROMICINA','SUSPENSION * 120 ML','250 MG/15 ML','NO SE OFERTA','no regulado'),
(1,'MEDICAMENTOS','MED444','FENTANILO','AMPOLLA','50MCG/ML','0','0'),
(1,'MEDICAMENTOS','MED445','DINITRATO DE ISORBIDE','BLISTER X 10','10 MG','0','0'),
(1,'MEDICAMENTOS','MED446','DIOSMINA HESPERIDINA','ampolla','450 MG / 50 MG','0','0'),
(1,'MEDICAMENTOS','MED447','SALES DE REHIDRATACION','CAJA X 30 SOBRES','','0','0'),
(1,'MEDICAMENTOS','MED448','ERGOTAMINA','AMPOLLA','0.2','0','0'),
(1,'MEDICAMENTOS','MED449','FORMULA TERAPEUTICA F-100','POLVO ORAL LATA *400 GR','100KCAL/100ML','0','0'),
(1,'MEDICO_QUIRURGICO','MDQ001','AGUA DESTILADA','BOLSA*500 ML','BAXTER','5.112','5.112'),
(1,'MEDICO_QUIRURGICO','MDQ002','AGUA OXIGENADA','FCO*120 ML','OSA','6.369','6.369'),
(1,'MEDICO_QUIRURGICO','MDQ003','AGUJA HIPODERMICA 18*1','CJA*100 UND','RYMCO','19.462','23.160'),
(1,'MEDICO_QUIRURGICO','MDQ004','AGUJA HIPODERMICA 19*1','CJA*100 UND','LIFE CARE','21.617','25.724'),
(1,'MEDICO_QUIRURGICO','MDQ005','AGUJA HIPODERMICA 20*1','CJA*100 UND','RYMCO','21.617','25.724'),
(1,'MEDICO_QUIRURGICO','MDQ006','AGUJA HIPODERMICA 21*1  1/2','CJA*100 UND','RYMCO','21.617','25.724'),
(1,'MEDICO_QUIRURGICO','MDQ007','AGUJA HIPODERMICA 22*1','CJA*100 UND','RYMCO','21.617','25.724'),
(1,'MEDICO_QUIRURGICO','MDQ008','AGUJA HIPODERMICA 23*1','CJA*100 UND','RYMCO','21.617','25.724'),
(1,'MEDICO_QUIRURGICO','MDQ009','AGUJA HIPODERMICA 26*1','CJA*100 UND','RYMCO','21.617','25.724'),
(1,'MEDICO_QUIRURGICO','MDQ010','AGUJA MINI PEN 4MM X 0.23MM CALIBRE 32G PARA INSULINA CAJA DE COLOR VERDE','CJA*100 UND','RYMCO','112.503','133.879'),
(1,'MEDICO_QUIRURGICO','MDQ011','AGUJA PEN MINI 31G*5 MM','CJA*100 UND','RYMCO','112.542','133.925'),
(1,'MEDICO_QUIRURGICO','MDQ012','ALCOHOL','GALON','OSA','37.508','37.508'),
(1,'MEDICO_QUIRURGICO','MDQ013','ALCOHOL 70% * 700 ML','BOTELLA','OSA','8.074','8.074'),
(1,'MEDICO_QUIRURGICO','MDQ014','ALGODON  HOSPITALARIO','ROLLO','TECNOQUIMICAS','23.892','23.892'),
(1,'MEDICO_QUIRURGICO','MDQ015','RESUCITADOR ADULTO','UNIDAD','IMCOLMEDICA S.A.','202.078','240.473'),
(1,'MEDICO_QUIRURGICO','MDQ016','RESUCITADOR NEONATAL','UNIDAD','IMCOLMEDICA S.A.','201.224','239.456'),
(1,'MEDICO_QUIRURGICO','MDQ017','RESUCITADOR PEDIATRICO','UNIDAD','IMCOLMEDICA S.A.','201.224','239.456'),
(1,'MEDICO_QUIRURGICO','MDQ018','APLICADORES DE ALGOD N','PAQX100','OPTIMAL QUALITY','3.268','3.889'),
(1,'MEDICO_QUIRURGICO','MDQ019','YODOPOVIDONA ESPUMA','GALON','ECAR','129.795','129.795'),
(1,'MEDICO_QUIRURGICO','MDQ020','YODOPOVIDONA ESPUMA  (DOSIS PERSONAL)','FRASCO X 60ML','ECAR','9.236','9.236'),
(1,'MEDICO_QUIRURGICO','MDQ021','GEL ANTIBACTERIAL ','FCO*990 ML','OSA','32.372','32.372'),
(1,'MEDICO_QUIRURGICO','MDQ022','YODOPOVIDONA SOLUCION','GALON','ECAR','129.795','129.795'),
(1,'MEDICO_QUIRURGICO','MDQ023','YODOPOVIDONA SOLUCION ( DOSIS PERSONAL)','FRASCO X 60ML','ECAR','9.236','9.236'),
(1,'MEDICO_QUIRURGICO','MDQ024','BAJALENGUAS','PAQUETE*20 UND','ZIBOJECT  ','1.887','2.245'),
(1,'MEDICO_QUIRURGICO','MDQ025','BALON DE BAKRI','UNIDAD','COOK MEDICAL LLC','1.750.000','1.750.000'),
(1,'MEDICO_QUIRURGICO','MDQ026','BATA DESECHABLE MANGA CORTA','UNIDAD','EMA','5.146','6.124'),
(1,'MEDICO_QUIRURGICO','MDQ027','BATA DESECHABLE MANGA LARGA','UNIDAD','EMA','6.818','8.114'),
(1,'MEDICO_QUIRURGICO','MDQ028','EQUIPO BURETROL SENCILLA*150 ML','UNIDAD','LIFE CARE','8.105','8.105'),
(1,'MEDICO_QUIRURGICO','MDQ029','CAMPANAS DE OTOSCOPIO BOLSA X 60 UNIDADES (WELCH ALLYN DE PARED) PEDIATRICO','PAQUETE','BIOLIFE','11.435','13.608'),
(1,'MEDICO_QUIRURGICO','MDQ030','CAMPANAS DE OTOSCOPIO BOLSA X 60 UNIDADES (GENERICO PARA PORTATIL)','PAQUETE','BIOLIFE','20.367','24.237'),
(1,'MEDICO_QUIRURGICO','MDQ031','CANULA GUEDEL 0 UNID','UNIDAD','GOLDEN CARE','5.226','6.219'),
(1,'MEDICO_QUIRURGICO','MDQ032','CANULA GUEDEL 1 UNID','UNIDAD','GOLDEN CARE','5.226','6.219'),
(1,'MEDICO_QUIRURGICO','MDQ033','CANULA GUEDEL 2 UNID','UNIDAD','GOLDEN CARE','5.226','6.219'),
(1,'MEDICO_QUIRURGICO','MDQ034','CANULA GUEDEL 3 UNID','UNIDAD','GOLDEN CARE','5.226','6.219'),
(1,'MEDICO_QUIRURGICO','MDQ035','CANULA GUEDEL 4 UNID','UNIDAD','GOLDEN CARE','5.226','6.219'),
(1,'MEDICO_QUIRURGICO','MDQ036','CANULA GUEDEL 5 UNID','UNIDAD','GOLDEN CARE','5.226','6.219'),
(1,'MEDICO_QUIRURGICO','MDQ038','CANULA NASAL OXIGENO NEONATO','UNIDAD','LIFE CARE ','4.226','5.029'),
(1,'MEDICO_QUIRURGICO','MDQ039','CANULA NASAL OXIGENO PEDI TRICA','UNIDAD','LIFE CARE ','4.327','5.149'),
(1,'MEDICO_QUIRURGICO','MDQ040','CANULA NASAL OXIGENO ADULTO','UNIDAD','LIFE CARE ','4.385','5.218'),
(1,'MEDICO_QUIRURGICO','MDQ041','CARBON ACTIVADO - KILO','KILO','FORMULA MAGISTRAL','41.727','49.655'),
(1,'MEDICO_QUIRURGICO','MDQ042','CATETER No. 14','UNIDAD','B BRAUN','3.997','3.997'),
(1,'MEDICO_QUIRURGICO','MDQ043','CATETER No. 16','UNIDAD','B BRAUN','3.997','3.997'),
(1,'MEDICO_QUIRURGICO','MDQ044','CATETER No.18','UNIDAD','LIFE CARE','3.747','3.747'),
(1,'MEDICO_QUIRURGICO','MDQ045','CATETER No.20','UNIDAD','LIFE CARE','3.747','3.747'),
(1,'MEDICO_QUIRURGICO','MDQ046','CATETER No.22','UNIDAD','LIFE CARE','3.747','3.747'),
(1,'MEDICO_QUIRURGICO','MDQ047','CATETER No.24','UNIDAD','LIFE CARE','3.747','3.747'),
(1,'MEDICO_QUIRURGICO','MDQ048','CATETER UMBILICAL','UNIDAD','ALFA TRADING S.A.S','12.768','12.768'),
(1,'MEDICO_QUIRURGICO','MDQ049','CATGUT CROM. GNRAL 0','UNIDAD','MEIYI','22.767','22.767'),
(1,'MEDICO_QUIRURGICO','MDQ050','CATGUT CROM. GNRAL 1','UNIDAD','MEIYI','24.565','24.565'),
(1,'MEDICO_QUIRURGICO','MDQ051','CATGUT CROM. GNRAL 2-0','UNIDAD','MEIYI','25.247','25.247'),
(1,'MEDICO_QUIRURGICO','MDQ052','CATGUT CROM. GNRAL 3-0','UNIDAD','MEIYI','25.758','25.758'),
(1,'MEDICO_QUIRURGICO','MDQ053','CATGUT CROM. GNRAL 4-0','UNIDAD','MEIYI','26.401','26.401'),
(1,'MEDICO_QUIRURGICO','MDQ054','CATGUT CROM. GNRAL 5-0','UNIDAD','MEIYI','26.956','26.956'),
(1,'MEDICO_QUIRURGICO','MDQ055','CATGUT CROM. GNRAL 6-0','UNIDAD','MEIYI','26.956','26.956'),
(1,'MEDICO_QUIRURGICO','MDQ056','CINTA ESTERIL VAPOR','ROLLO','SURGIPLAST LTDA','29.585','35.206'),
(1,'MEDICO_QUIRURGICO','MDQ057','CITOFIJADOR SPRAY','FCO*160 CC','DOTAMEDICAS','45.195','53.782'),
(1,'MEDICO_QUIRURGICO','MDQ058','CLAMP UMBILICAL','UNIDAD','GOTHAPLAST','1.136','1.352'),
(1,'MEDICO_QUIRURGICO','MDQ059','COMPRESA 45*45','PAQ*5','PROTEX','9.861','9.861'),
(1,'MEDICO_QUIRURGICO','MDQ060','PRESERVATIVOS','UNIDAD','DISPOCOL','501','501'),
(1,'MEDICO_QUIRURGICO','MDQ061','CONECTORES DE OXIGENO','UNIDAD','CORALMEDICA LTDA.','29.804','29.804'),
(1,'MEDICO_QUIRURGICO','MDQ062','CUCHILLA P/ BISTURI No. 21','UNIDAD','ELITE','481','572'),
(1,'MEDICO_QUIRURGICO','MDQ063','CUCHILLA P/ BISTURI No. 23','UNIDAD','ELITE','481','572'),
(1,'MEDICO_QUIRURGICO','MDQ064','CUCHILLA P/BISTURI No. 10','UNIDAD','ELITE','481','572'),
(1,'MEDICO_QUIRURGICO','MDQ065','CUCHILLA P/BISTURI No. 15','UNIDAD','ELITE','481','572'),
(1,'MEDICO_QUIRURGICO','MDQ066','CUCHILLA P/BISTURI No. 22','UNIDAD','ELITE','481','572'),
(1,'MEDICO_QUIRURGICO','MDQ067','CUCHILLA P/BISTURI No.11','UNIDAD','ELITE','481','572'),
(1,'MEDICO_QUIRURGICO','MDQ068','CUCHILLA P/BISTURI No.20','UNIDAD','ELITE','481','572'),
(1,'MEDICO_QUIRURGICO','MDQ069','CUCHILLA P/BISTURI No.24','UNIDAD','ELITE','481','572'),
(1,'MEDICO_QUIRURGICO','MDQ070','CUELLO ORTOPEDICO PHILADELPHIA ADULTO L','UNIDAD','DISPROMED','37.762','37.762'),
(1,'MEDICO_QUIRURGICO','MDQ071','CUELLO ORTOPEDICO PHILADELPHIA ADULTO M','UNIDAD','DISPROMED','37.762','37.762'),
(1,'MEDICO_QUIRURGICO','MDQ072','CUELLO ORTOPEDICO PHILADELPHIA PEDIATRICO  S','UNIDAD','DISPROMED','37.762','37.762'),
(1,'MEDICO_QUIRURGICO','MDQ073','CUELLO ORTOPEDICO PHILADELPHIA PEDIATRICO XS','UNIDAD','DISPROMED','37.762','37.762'),
(1,'MEDICO_QUIRURGICO','MDQ074','BOLSA RECOLECTORA DE ORINA 2000 ML ADULTO','BOLSA','LIFE CARE','10.212','12.152'),
(1,'MEDICO_QUIRURGICO','MDQ075','BOLSA RECOLECTORA DE ORINA 500ML PEDIATRICA','BOLSA','OPTIMAL QUALITY','7.929','9.435'),
(1,'MEDICO_QUIRURGICO','MDQ076','BOLSA BLANCA PARA CADAVER','UNIDAD','UNION MEDICAL S.A.S','35.755','42.549'),
(1,'MEDICO_QUIRURGICO','MDQ077','DEXTROSA 10% AGUA DESTILADA','BOLSA*500 ML','BAXTER','4.203','4.203'),
(1,'MEDICO_QUIRURGICO','MDQ078','DEXTROSA 5% AGUA DESTILADA','BOLSA*500 ML','BAXTER','4.139','4.139'),
(1,'MEDICO_QUIRURGICO','MDQ079','DEXTROSA 5% S.S.N','BOLSA*500 ML','BAXTER','4.139','4.139'),
(1,'MEDICO_QUIRURGICO','MDQ080','DISPOSITIVO INTRAUTERINO ( T DE COBRE)','UNIDAD','SAFE LOAD','12.038','12.038'),
(1,'MEDICO_QUIRURGICO','MDQ081','ELECTRODO ADULTO * 100 UNDS (Electrodo Electrocardiografo Ad8232 Motiroreo Ritmo Cardiaco)','PAQ*100','3M COLOMBIA S.A','171.147','203.665'),
(1,'MEDICO_QUIRURGICO','MDQ082','ENEMA ','BOLSA*133 ML','TECNOQUIMICAS','16.395','16.395'),
(1,'MEDICO_QUIRURGICO','MDQ083','EQUIPO DE TRANSFUSION SANGUINEA','UNIDAD','PRECISION CARE','8.428','8.428'),
(1,'MEDICO_QUIRURGICO','MDQ084','EQUIPO MACROGOTERO','UNIDAD','LIFE CARE ','3.388','3.388'),
(1,'MEDICO_QUIRURGICO','MDQ085','EQUIPO MICROGOTERO','UNIDAD','PROTEX','4.255','4.255'),
(1,'MEDICO_QUIRURGICO','MDQ086','EQUIPO MICROGOTERO AMARILLO (PARA LIQUIDO FOTOSENSIBLE)','UNIDAD','DLP MEDICAL COLOMBIA SA','4.017','4.017'),
(1,'MEDICO_QUIRURGICO','MDQ087','EQUIPO PERICRANEAL 19G','UNIDAD','RYMCO','1.276','1.276'),
(1,'MEDICO_QUIRURGICO','MDQ088','EQUIPO PERICRANEAL 21G','UNIDAD','RYMCO','1.276','1.276'),
(1,'MEDICO_QUIRURGICO','MDQ089','EQUIPO PERICRANEAL 23G','UNIDAD','RYMCO','1.276','1.276'),
(1,'MEDICO_QUIRURGICO','MDQ090','EQUIPO PERICRANEAL 25G','UNIDAD','RYMCO','1.276','1.276'),
(1,'MEDICO_QUIRURGICO','MDQ091','ESPARADRAPO ','TARRO*6 UND','BSN MEDICAL','145.757','145.757'),
(1,'MEDICO_QUIRURGICO','MDQ092','"ESPARADRAPO MICROPORO 2"""','TARRO*6 UND','3M','84.194','84.194'),
(1,'MEDICO_QUIRURGICO','MDQ093','ESPECULO SENCILLO','UNIDAD','CEPILAB S.A.S.','1.895','2.255'),
(1,'MEDICO_QUIRURGICO','MDQ094','EXTRACTOR DE LECHE MATERNA','UNIDAD','MEDELA','18.702','22.255'),
(1,'MEDICO_QUIRURGICO','MDQ095','GAFAS PROTECTORAS','UNIDAD','ORBIDENTAL S.A.S.','12.098','14.397'),
(1,'MEDICO_QUIRURGICO','MDQ096','GARHOX-30','GALON','PROQUIDENT','101.043','101.043'),
(1,'MEDICO_QUIRURGICO','MDQ097','GASA  HOSPITALARIA  ','ROLLO','MEDICAL SUPPLIES ','110.478','110.478'),
(1,'MEDICO_QUIRURGICO','MDQ098','GASA ESTERIL','PAQUETE','PRO-H S.A.','2.039','2.039'),
(1,'MEDICO_QUIRURGICO','MDQ099','GEL ULTRASONIDO','GALON','QUIRUMEDICAS','45.049','45.049'),
(1,'MEDICO_QUIRURGICO','MDQ100','GLUCOMETRO BD LIFE ','UNIDAD','DIAGNOSTICOS BIOMEDICOS','144.034','171.400'),
(1,'MEDICO_QUIRURGICO','MDQ101','GLUTARALDEHIDO 2 %','GALON','EUFAR S.A.','67.558','67.558'),
(1,'MEDICO_QUIRURGICO','MDQ102','GORRO DESECHABLE (ORUGA)','PAQ *50 UND','LIFE CARE','24.265','28.875'),
(1,'MEDICO_QUIRURGICO','MDQ103','OVEROL ENTERIZO TELA BLANCA TALLA L','UNIDAD','GOTHAPLAST LTDA.','68.051','80.981'),
(1,'MEDICO_QUIRURGICO','MDQ104','GUANTE LATEX EXAMEN TALLA  L','CJA*100 UND','PROTEX','17.787','21.166'),
(1,'MEDICO_QUIRURGICO','MDQ105','GUANTE LATEX EXAMEN TALLA  XS','CJA*100 UND','PROTEX','17.787','21.166'),
(1,'MEDICO_QUIRURGICO','MDQ106','GUANTE LATEX EXAMEN TALLA M','CJA*100 UND','PROTEX','17.787','21.166'),
(1,'MEDICO_QUIRURGICO','MDQ107','GUANTE LATEX EXAMEN TALLA S','CJA*100 UND','PROTEX','17.787','21.166'),
(1,'MEDICO_QUIRURGICO','MDQ108','GUANTES ESTERILES TALLA 7.5','PAR','PROTEX','2.187','2.602'),
(1,'MEDICO_QUIRURGICO','MDQ109','GUANTES ESTERILES TALLA 6','PAR','PROTEX','2.187','2.602'),
(1,'MEDICO_QUIRURGICO','MDQ110','GUANTES ESTERILES TALLA 6.5','PAR','PROTEX','2.187','2.602'),
(1,'MEDICO_QUIRURGICO','MDQ111','GUANTES ESTERILES TALLA 7','PAR','PROTEX','2.187','2.602'),
(1,'MEDICO_QUIRURGICO','MDQ112','GUANTES ESTERILES TALLA 8','PAR','PROTEX','2.187','2.602'),
(1,'MEDICO_QUIRURGICO','MDQ113','GUANTES ESTERILES TALLA 9','PAR','PROTEX','2.187','2.602'),
(1,'MEDICO_QUIRURGICO','MDQ114','GUANTES NITRILO  T S','CJA*100 UND','M&H CARE','25.800','30.702'),
(1,'MEDICO_QUIRURGICO','MDQ115','GUANTES NITRILO T L','CJA*100 UND','M&H CARE','25.800','30.702'),
(1,'MEDICO_QUIRURGICO','MDQ116','GUANTES NITRILO T M','CJA*100 UND','M&H CARE','25.800','30.702'),
(1,'MEDICO_QUIRURGICO','MDQ117','GUARDIAN 0.3 LTS','UNIDAD',' BIOLIFE','4.122','4.905'),
(1,'MEDICO_QUIRURGICO','MDQ118','YODOPOVIDONA SOLUCION ( DOSIS PERSONAL)','FRASCO X120ML','ECAR','14.114','14.114'),
(1,'MEDICO_QUIRURGICO','MDQ119','GUARDIAN 1.5 LTS','UNIDAD','BIOLIFE','5.465','6.503'),
(1,'MEDICO_QUIRURGICO','MDQ120','GUARDIAN 2.9 LTS','UNIDAD','BIOLIFE','7.566','9.003'),
(1,'MEDICO_QUIRURGICO','MDQ121','GUARDIAN 5 LTS','UNIDAD','BIOLIFE','18.408','21.906'),
(1,'MEDICO_QUIRURGICO','MDQ122','GUIA PARA ENTUBACION ADULTO 10FR','UNIDAD','ALLMED','5.164','6.145'),
(1,'MEDICO_QUIRURGICO','MDQ123','GUIA PARA ENTUBACION PEDI TRICA 6FR','UNIDAD','ALLMED','5.164','6.145'),
(1,'MEDICO_QUIRURGICO','MDQ124','HUMIDIFICADOR CONEXI N VENTURY','UNIDAD','BIOPLAST S.A.S','27.518','32.746'),
(1,'MEDICO_QUIRURGICO','MDQ125','HUMIDIFICADOR DE OXIGENO','UNIDAD','LIFE CARE','13.640','16.232'),
(1,'MEDICO_QUIRURGICO','MDQ126','IMPLANTE SUBDERMICO JADELLE','UNIDAD','BAYER','154.700','154.700'),
(1,'MEDICO_QUIRURGICO','MDQ127','INDICADOR QUIMICO','BOLSA *50','SURGIPLAST LTDA.','19.170','22.812'),
(1,'MEDICO_QUIRURGICO','MDQ128','INDICADORES BIOLOGICOS','UNIDAD','TERRAGENE','8.824','10.500'),
(1,'MEDICO_QUIRURGICO','MDQ129','INHALOCAMARA ADULTO','UNIDAD','MEDICAL NISSI SAS','9.568','11.386'),
(1,'MEDICO_QUIRURGICO','MDQ130','INHALOCAMARA PEDI TRICA','UNIDAD','MEDICAL NISSI SAS','9.568','11.386'),
(1,'MEDICO_QUIRURGICO','MDQ131','INMOVILIZADOR DE RODILLA (ESTANDAR O AJUSTABLE)','UNIDAD','KROMIA S.A.S','118.225','118.225'),
(1,'MEDICO_QUIRURGICO','MDQ132','INMOVILIZADOR EXTREMIDAD INFERIOR ADULTO ','UNIDAD','ZANNA S.A.S','90.233','90.233'),
(1,'MEDICO_QUIRURGICO','MDQ133','INMOVILIZADOR EXTREMIDAD INFERIOR PEDIATRICO','UNIDAD','ZANNA S.A.S','80.656','80.656'),
(1,'MEDICO_QUIRURGICO','MDQ134','INMOVILIZADOR EXTREMIDAD SUPERIOR ADULTO','UNIDAD','ZANNA S.A.S','90.233','90.233'),
(1,'MEDICO_QUIRURGICO','MDQ135','INMOVILIZADOR EXTREMIDAD SUPERIOR PEDIATRICO','UNIDAD','ZANNA S.A.S','80.656','80.656'),
(1,'MEDICO_QUIRURGICO','MDQ136','JABON ENZIMATICO','GALON','QUIRUMEDICAS LTDA.','225.100','225.100'),
(1,'MEDICO_QUIRURGICO','MDQ137','JABON QUIRURGICO','GALON','PROASEPSIS S.A.S','81.087','96.494'),
(1,'MEDICO_QUIRURGICO','MDQ138','JERINGA  3 ML','UNIDAD','PROTEX','260','309'),
(1,'MEDICO_QUIRURGICO','MDQ139','JERINGA 0.5ML','UNIDAD','SUPPLA S.A.','894','1.064'),
(1,'MEDICO_QUIRURGICO','MDQ141','JERINGA 1 ML (30G X 1/2)','UNIDAD','PROTEX','312','371'),
(1,'MEDICO_QUIRURGICO','MDQ142','JERINGA 1 ML (25G X5/8)','UNIDAD','PROTEX','312','371'),
(1,'MEDICO_QUIRURGICO','MDQ143','JERINGA 10 ML','UNIDAD','PROTEX S.A.S','421','501'),
(1,'MEDICO_QUIRURGICO','MDQ144','JERINGA 2 ML','UNIDAD','PROTEX S.A.S','312','371'),
(1,'MEDICO_QUIRURGICO','MDQ145','JERINGA 20  ML','UNIDAD','PROTEX S.A.S','802','954'),
(1,'MEDICO_QUIRURGICO','MDQ146','JERINGA 5 ML','UNIDAD','PROTEX S.A.S','335','399'),
(1,'MEDICO_QUIRURGICO','MDQ147','JERINGA 50 ML','UNIDAD','PROTEX S.A.S','1.401','1.667'),
(1,'MEDICO_QUIRURGICO','MDQ148','KIT CITOLOGICO DESECHABLE','UNIDAD','CEPIMAX','5.968','7.102'),
(1,'MEDICO_QUIRURGICO','MDQ149','KIT CITOLOGICO VIRGINAL','UNIDAD','BIOLIFE','5.390','6.414'),
(1,'MEDICO_QUIRURGICO','MDQ150','YODOPOVIDONA ESPUMA ( DOSIS PERSONAL)','FRASCO X120ML','ECAR','14.114','14.114'),
(1,'MEDICO_QUIRURGICO','MDQ151','KIT NEBULIZADOR ADULTO','UNIDAD','BIOLIFE','6.665','7.931'),
(1,'MEDICO_QUIRURGICO','MDQ152','KIT NEBULIZADOR PEDIATRICO','UNIDAD','BIOLIFE','6.665','7.931'),
(1,'MEDICO_QUIRURGICO','MDQ153','LACTATO RINGER','BOLSA*500 ML','BAXTER','4.088','4.088'),
(1,'MEDICO_QUIRURGICO','MDQ154','LANCETAS','CAJA X 50','ROCHE / ACCU-CHEK','24.503','29.159'),
(1,'MEDICO_QUIRURGICO','MDQ155','LLAVE 3 VIAS','UNIDAD','LIFECARE','2.366','2.816'),
(1,'MEDICO_QUIRURGICO','MDQ156','KIT ASPIRADO DE SECRECIONES (VASO- MANGUERA- FILTRO)','UNIDAD','SILIMEDICAL S.A.S','100.183','119.218'),
(1,'MEDICO_QUIRURGICO','MDQ157','MANTA T RMICA','UNIDAD','AQUANOX A ESTHETIC S.A.S','49.750','59.202'),
(1,'MEDICO_QUIRURGICO','MDQ158','MASCARA OXIGENO NEONATAL','UNIDAD','LIFE CARE','6.375','7.586'),
(1,'MEDICO_QUIRURGICO','MDQ159','MASCARA OXIGENO PEDI TRICA','UNIDAD','LIFE CARE','4.636','5.517'),
(1,'MEDICO_QUIRURGICO','MDQ160','MASCARA OXIGENO ADULTO','UNIDAD','LIFE CARE','4.636','5.517'),
(1,'MEDICO_QUIRURGICO','MDQ166','MASCARA LARINGEA # 1','UNIDAD','GOTHAPLAST','56.217','66.898'),
(1,'MEDICO_QUIRURGICO','MDQ167','MASCARA LARINGEA # 1.5','UNIDAD','GOTHAPLAST','111.275','132.417'),
(1,'MEDICO_QUIRURGICO','MDQ168','MASCARA LARINGEA # 2','UNIDAD','GOTHAPLAST','56.217','66.898'),
(1,'MEDICO_QUIRURGICO','MDQ169','MASCARA LARINGEA # 2.5','UNIDAD','GOTHAPLAST','56.217','66.898'),
(1,'MEDICO_QUIRURGICO','MDQ170','MASCARA LARINGEA # 3','UNIDAD','GOTHAPLAST','67.440','80.254'),
(1,'MEDICO_QUIRURGICO','MDQ171','MASCARA LARINGEA # 3.5','UNIDAD','GOTHAPLAST','111.275','132.417'),
(1,'MEDICO_QUIRURGICO','MDQ172','MASCARA LARINGEA # 4','UNIDAD','GOTHAPLAST','56.217','66.898'),
(1,'MEDICO_QUIRURGICO','MDQ173','MASCARA LARINGEA # 4.5','UNIDAD','GOTHAPLAST','67.440','80.254'),
(1,'MEDICO_QUIRURGICO','MDQ174','MASCARA LARINGEA # 5','UNIDAD','GOTHAPLAST','56.217','66.898'),
(1,'MEDICO_QUIRURGICO','MDQ175','MASCARA LARINGEA # 6','UNIDAD','KRAMER','111.275','132.417'),
(1,'MEDICO_QUIRURGICO','MDQ176','MASCARA LARINGEA PEDI TRICA # 2-0','UNIDAD','INTERSURGICAL S.A.S.','67.376','80.177'),
(1,'MEDICO_QUIRURGICO','MDQ177','MASCARA LARINGEA PEDI TRICA # 3-0','UNIDAD','INTERSURGICAL S.A.S.','111.275','132.417'),
(1,'MEDICO_QUIRURGICO','MDQ178','MASCARA LARINGEA PEDI TRICA # 5-0','UNIDAD','INTERSURGICAL S.A.S.','116.881','139.088'),
(1,'MEDICO_QUIRURGICO','MDQ179','MASCARA LARINGEA PEDI TRICA #4-0','UNIDAD','INTERSURGICAL S.A.S.','116.881','139.088'),
(1,'MEDICO_QUIRURGICO','MDQ180','MASCARILLA ALTA EFICIENCIA N- 95','UNIDAD','BIOLIFE','9.411','11.199'),
(1,'MEDICO_QUIRURGICO','MDQ181','MASCARILLA CON RESERVORIO ADULTO /NO REINHALACION','UNIDAD','BIOLIFE','12.072','14.366'),
(1,'MEDICO_QUIRURGICO','MDQ182','MASCARILLA CON RESERVORIO NEONATAL/NO REINHALACION','UNIDAD','BIOLIFE','12.072','14.366'),
(1,'MEDICO_QUIRURGICO','MDQ183','MASCARILLA CON RESERVORIO PEDI TRICA/NO REINHALACION','UNIDAD','BIOLIFE','12.072','14.366'),
(1,'MEDICO_QUIRURGICO','MDQ185','KIT NEBULIZADOR NEONATAL','UNIDAD','BIOLIFE','6.665','7.931'),
(1,'MEDICO_QUIRURGICO','MDQ187','PANTALON DESECHABLE','UNIDAD','RYMCO MEDICAL S.A.S','8.445','10.049'),
(1,'MEDICO_QUIRURGICO','MDQ188','PAPEL CREPADO','ROLLO * 100 m','SURGIPLAST','143.956','171.308'),
(1,'MEDICO_QUIRURGICO','MDQ189','PAPEL DE EQUIPO DE QUIMICA SANGUINEA BTS-350','CUADERNILLO','LUMIRA S.A.S','29.705','35.349'),
(1,'MEDICO_QUIRURGICO','MDQ190','PAPEL DESFIBRILADOR MINDRAY BENEHEART D3','ROLLO',' MINDRAY ','12.212','14.532'),
(1,'MEDICO_QUIRURGICO','MDQ191','PAPEL ELECTRO 50 MM*30 MT REF. MEQO 381','ROLLO','PAINMED','11.070','13.173'),
(1,'MEDICO_QUIRURGICO','MDQ192','PAPEL ELECTRO SCHILLER AT-1','CUADERNILLO','SCHILLER','16.399','19.515'),
(1,'MEDICO_QUIRURGICO','MDQ193','PAPEL ELECTROCARDIOGRAFO EDAN SE-1 ','ROLLO','EDAN INSTRUMENTS INC','16.168','19.240'),
(1,'MEDICO_QUIRURGICO','MDQ194','PAPEL ELECTROCARDIOGRAFO EDAN SE-3','ROLLO','EDAN INSTRUMENTS INC','21.855','26.008'),
(1,'MEDICO_QUIRURGICO','MDQ196','PAPEL ELECTROCARDIOGRAFO EDAN SE-601 X110 MMX140 MMX144 SH','CUADERNILLO','EDAN INSTRUMENTS- INC','20.863','24.827'),
(1,'MEDICO_QUIRURGICO','MDQ197','PAPEL EQUIPO DE HEMATOLOGIA MINDRAY BC-20S Y BC-30S','ROLLO','MINDRAY','20.018','23.822'),
(1,'MEDICO_QUIRURGICO','MDQ198','PAPEL HEMATOLOGIA  LUMIRATE H3 (5.5CM ANCHO)','ROLLO','LUMIRA S.A.S','20.018','23.822'),
(1,'MEDICO_QUIRURGICO','MDQ199','PAPEL HEMATOLOGIA MINDRAY - BC-3000 PLUS ','ROLLO','MINDRAY','20.018','23.822'),
(1,'MEDICO_QUIRURGICO','MDQ201','PAPEL MONITOL FETAL  EDAN F3','CUADERNILLO','EDAN','10.171','12.104'),
(1,'MEDICO_QUIRURGICO','MDQ202','PEROXIDO DE HIDROGENO AL 30 %','GALON','OSA','59.609','59.609'),
(1,'MEDICO_QUIRURGICO','MDQ203','POLAINAS ','UNIDAD','RYMCO MEDICAL S.A.S','1.291','1.536'),
(1,'MEDICO_QUIRURGICO','MDQ204','PROLENE No. 0 PS-2 ETHICON','UNIDAD','MEIYI','20.712','20.712'),
(1,'MEDICO_QUIRURGICO','MDQ205','PROLENE No. 1/0 PS-2 ETHICON','UNIDAD','MEIYI','25.553','25.553'),
(1,'MEDICO_QUIRURGICO','MDQ206','PROLENE No.2/0 PS-2 ETHICON','UNIDAD','MEIYI','23.661','23.661'),
(1,'MEDICO_QUIRURGICO','MDQ207','PROLENE No.3/0 PS-2 ETHICON','UNIDAD','MEIYI','25.553','25.553'),
(1,'MEDICO_QUIRURGICO','MDQ208','PROLENE No.4/0 PS-2 ETHICON','UNIDAD','MEIYI','25.999','25.999'),
(1,'MEDICO_QUIRURGICO','MDQ209','PROLENE No.5/0 PS-2 ETHICON','UNIDAD','MEIYI','27.048','27.048'),
(1,'MEDICO_QUIRURGICO','MDQ210','PROLENE No.6/0 PS-2 ETHICON','UNIDAD','MEIYI','28.552','28.552'),
(1,'MEDICO_QUIRURGICO','MDQ211','RECOLECTOR COPROLOGICO','UNIDAD','CEPILAB','497','592'),
(1,'MEDICO_QUIRURGICO','MDQ212','RECOLECTOR ORINA ADULTO','PAQUETE *50','CEPILAB','23.546','28.020'),
(1,'MEDICO_QUIRURGICO','MDQ213','ROXICAINA CON EPINEFRINA','FCO*50 CC TAPA ROJA','ROPSOHN ','24.141','24.141'),
(1,'MEDICO_QUIRURGICO','MDQ214','ROXICAINA JALEA','TBO* 30ML','PROCLIN PHARMA S.A','16.332','16.332'),
(1,'MEDICO_QUIRURGICO','MDQ215','ROXICAINA LIDOCAINA 5% (POMADA)','TUBO *10GR','ROPSOHN','22.620','22.620'),
(1,'MEDICO_QUIRURGICO','MDQ216','ROXICAINA SIMPLE 2%','FCO*50 CC TAPA AZUL','ROPSOHN','17.685','17.685'),
(1,'MEDICO_QUIRURGICO','MDQ217','ROXICAINA SPRAY','FCO*80 ML','ROPSOHN','74.341','74.341'),
(1,'MEDICO_QUIRURGICO','MDQ218','SABANA DESECHABLE','UNIDAD','EMA DISTRIBUCIONES-MARMAG','6.561','7.808'),
(1,'MEDICO_QUIRURGICO','MDQ219','SEDA 0 CON AGUJA UNI','UNIDAD','FUNDACION CARDIOVASCULAR','24.471','24.471'),
(1,'MEDICO_QUIRURGICO','MDQ220','SEDA 1/0 CON AGUJA UNI','UNIDAD','MEIYI','24.161','24.161'),
(1,'MEDICO_QUIRURGICO','MDQ221','SEDA 2/0 CON AGUJA UNI','UNIDAD','MEIYI','25.595','25.595'),
(1,'MEDICO_QUIRURGICO','MDQ222','SEDA 3/0 CON AGUJA UNI','UNIDAD','MEIYI','26.356','26.356'),
(1,'MEDICO_QUIRURGICO','MDQ223','SEDA 4/0 CON AGUJA UNI','UNIDAD','MEIYI','28.074','28.074'),
(1,'MEDICO_QUIRURGICO','MDQ224','SEDA 5/0 CON AGUJA UNI','UNIDAD','MEIYI','29.399','29.399'),
(1,'MEDICO_QUIRURGICO','MDQ225','SEDA 6/0 CON AGUJA UNI','UNIDAD','MEIYI','32.506','32.506'),
(1,'MEDICO_QUIRURGICO','MDQ226','SOLUCION SALINA NORMAL','BOLSA*100 ML','BAXTER','3.191','3.191'),
(1,'MEDICO_QUIRURGICO','MDQ227','SOLUCION SALINA NORMAL','BOLSA*500 ML','BAXTER','4.037','4.037'),
(1,'MEDICO_QUIRURGICO','MDQ228','SONDA FOLEY DOS VIAS No. 10','UNIDAD','BIOPLAST S.A.S','6.068','6.068'),
(1,'MEDICO_QUIRURGICO','MDQ229','SONDA FOLEY DOS VIAS No. 12','UNIDAD','BIOPLAST S.A.S','4.859','4.859'),
(1,'MEDICO_QUIRURGICO','MDQ230','SONDA FOLEY DOS VIAS No. 14','UNIDAD','BIOPLAST S.A.S','6.156','6.156'),
(1,'MEDICO_QUIRURGICO','MDQ231','SONDA FOLEY DOS VIAS No. 16','UNIDAD','BIOPLAST S.A.S','4.882','4.882'),
(1,'MEDICO_QUIRURGICO','MDQ232','SONDA FOLEY DOS VIAS No. 18','UNIDAD','BIOPLAST S.A.S','6.602','6.602'),
(1,'MEDICO_QUIRURGICO','MDQ233','SONDA FOLEY DOS VIAS No. 20','UNIDAD','BIOPLAST S.A.S','7.685','7.685'),
(1,'MEDICO_QUIRURGICO','MDQ234','SONDA FOLEY DOS VIAS No. 22','UNIDAD','BIOPLAST S.A.S','7.685','7.685'),
(1,'MEDICO_QUIRURGICO','MDQ235','SONDA FOLEY DOS VIAS No. 24','UNIDAD','BIOPLAST S.A.S','7.685','7.685'),
(1,'MEDICO_QUIRURGICO','MDQ236','SONDA FOLEY DOS VIAS No. 6','UNIDAD','BIOPLAST S.A.S','4.882','4.882'),
(1,'MEDICO_QUIRURGICO','MDQ237','SONDA FOLEY DOS VIAS No. 8','UNIDAD','BIOPLAST S.A.S','6.068','6.068'),
(1,'MEDICO_QUIRURGICO','MDQ239','OVEROL ENTERIZO TELA BLANCA TALLA M','UNIDAD','GOTHAPLAST LTDA.','68.051','80.981'),
(1,'MEDICO_QUIRURGICO','MDQ244','SONDA NASOFARINGEA N  5.5','UNIDAD','IMCOLMEDICA S.A.','2.134','2.134'),
(1,'MEDICO_QUIRURGICO','MDQ245','SONDA NASOFARINGEA N 6','UNIDAD','IMCOLMEDICA S.A.','2.134','2.134'),
(1,'MEDICO_QUIRURGICO','MDQ246','SONDA NASOFARINGEA N 6.5','UNIDAD','IMCOLMEDICA S.A.','2.134','2.134'),
(1,'MEDICO_QUIRURGICO','MDQ247','SONDA NASOFARINGEA N 7','UNIDAD','IMCOLMEDICA S.A.','2.134','2.134'),
(1,'MEDICO_QUIRURGICO','MDQ248','SONDA NASOFARINGEA N 7.5','UNIDAD','IMCOLMEDICA S.A.','2.134','2.134'),
(1,'MEDICO_QUIRURGICO','MDQ249','SONDA NASOFARINGEA N 8','UNIDAD','IMCOLMEDICA S.A.','2.134','2.134'),
(1,'MEDICO_QUIRURGICO','MDQ250','SONDA NASOGASTRICA No. 16','UNIDAD','SHERLEG','2.436','2.436'),
(1,'MEDICO_QUIRURGICO','MDQ251','SONDA NASOGASTRICA No. 18','UNIDAD','SHERLEG','2.429','2.429'),
(1,'MEDICO_QUIRURGICO','MDQ252','SONDA NASOGASTRICA No. 6','UNIDAD','SHERLEG','2.517','2.517'),
(1,'MEDICO_QUIRURGICO','MDQ253','SONDA NASOGASTRICA No. 8','UNIDAD','SHERLEG','2.436','2.436'),
(1,'MEDICO_QUIRURGICO','MDQ254','SONDA NASOGASTRICA No.10','UNIDAD','SHERLEG','2.632','2.632'),
(1,'MEDICO_QUIRURGICO','MDQ255','SONDA NASOGASTRICA No.12','UNIDAD','SHERLEG','1.829','1.829'),
(1,'MEDICO_QUIRURGICO','MDQ256','SONDA NASOGASTRICA No.14','UNIDAD','SHERLEG','2.856','2.856'),
(1,'MEDICO_QUIRURGICO','MDQ257','SONDA NASOGASTRICA No.20','UNIDAD','SHERLEG','2.856','2.856'),
(1,'MEDICO_QUIRURGICO','MDQ258','SONDA NASOGASTRICA No.22','UNIDAD','SHERLEG','2.856','2.856'),
(1,'MEDICO_QUIRURGICO','MDQ259','SONDA NELATON No.10','UNIDAD','SHERLEG','2.157','2.157'),
(1,'MEDICO_QUIRURGICO','MDQ260','SONDA NELATON No.12','UNIDAD','SHERLEG','2.157','2.157'),
(1,'MEDICO_QUIRURGICO','MDQ261','SONDA NELATON No.14','UNIDAD','SHERLEG','2.157','2.157'),
(1,'MEDICO_QUIRURGICO','MDQ262','SONDA NELATON No.16','UNIDAD','SHERLEG','1.761','1.761'),
(1,'MEDICO_QUIRURGICO','MDQ263','SONDA NELATON No.18','UNIDAD','SHERLEG','2.157','2.157'),
(1,'MEDICO_QUIRURGICO','MDQ264','SONDA NELATON No.20','UNIDAD','SHERLEG','2.157','2.157'),
(1,'MEDICO_QUIRURGICO','MDQ265','SONDA NELATON No.6','UNIDAD','SHERLEG','2.157','2.157'),
(1,'MEDICO_QUIRURGICO','MDQ266','SONDA NELATON No.8','UNIDAD','SHERLEG','2.157','2.157'),
(1,'MEDICO_QUIRURGICO','MDQ267','SONDA SUCCION No 14','UNIDAD','SHERLEG','15.026','15.026'),
(1,'MEDICO_QUIRURGICO','MDQ268','SUPOSITORIO GLICERINA ADULTO','UNIDAD','BUSSI  S.A.','1.194','1.194'),
(1,'MEDICO_QUIRURGICO','MDQ270','TABLA PARA AGUDEZA VISUAL CERCANA ADULTO','UNIDAD','LABORATORIOS RETINA S.A.S','34.771','41.378'),
(1,'MEDICO_QUIRURGICO','MDQ271','TABLA PARA AGUDEZA VISUAL LEJANA ADULTO','UNIDAD','LABORATORIOS RETINA S.A.S','34.771','41.378'),
(1,'MEDICO_QUIRURGICO','MDQ272','TABLA SNELL PEDI TRICA','UNIDAD','LABORATORIOS RETINA S.A.S','27.837','33.126'),
(1,'MEDICO_QUIRURGICO','MDQ273','TALLIMETRO (PARED)','UNIDAD','CHARDER','159.073','189.297'),
(1,'MEDICO_QUIRURGICO','MDQ274','TAPABOCAS','CJA*50 UND','PROTEX','10.202','12.140'),
(1,'MEDICO_QUIRURGICO','MDQ275','TAPON DE HEPARINA','UNIDAD','LIFE CARE','1.004','1.195'),
(1,'MEDICO_QUIRURGICO','MDQ276','TERMOMETRO DIGITAL','UNIDAD','PROTEX','16.677','19.846'),
(1,'MEDICO_QUIRURGICO','MDQ277','TERMOMETRO DIGITAL PEDIATRICO','UNIDAD','ALFA TRADING S.A.S','16.677','19.846'),
(1,'MEDICO_QUIRURGICO','MDQ278','TIJERAS CORTA TODO','UNIDAD','ALCON LABORATORIES INC','25.830','30.738'),
(1,'MEDICO_QUIRURGICO','MDQ279','TIRILLA PARA GUCOMETRO MATCH II','FCO*50 UND','DIAGNOSTICOS BIOMEDICOS','92.855','92.855'),
(1,'MEDICO_QUIRURGICO','MDQ280','TOALLAS DESECHABLES PAQUETE X 100 UNIDADES','PAQUETE','SCOTT','11.118','13.231'),
(1,'MEDICO_QUIRURGICO','MDQ281','TORNIQUETE ADULTOS KRAMER','UNIDAD','LM INSTRUMENTS S.A','4.040','4.808'),
(1,'MEDICO_QUIRURGICO','MDQ282','TORNIQUETE PEDIATRICO KRAMER','UNIDAD','LM INSTRUMENTS S.A','4.040','4.808'),
(1,'MEDICO_QUIRURGICO','MDQ284','TUBO ENDOTRAQUEAL  SIN BALON No. 2.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ285','TUBO ENDOTRAQUEAL  SIN BALON No. 2.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ286','TUBO ENDOTRAQUEAL  SIN BALON No. 3.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ287','TUBO ENDOTRAQUEAL  SIN BALON No. 3.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ288','TUBO ENDOTRAQUEAL  SIN BALON No. 4.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ289','TUBO ENDOTRAQUEAL  SIN BALON No. 4.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ290','TUBO ENDOTRAQUEAL  SIN BALON No. 5.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ291','TUBO ENDOTRAQUEAL  SIN BALON No. 5.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ292','TUBO ENDOTRAQUEAL  SIN BALON No. 6.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ293','TUBO ENDOTRAQUEAL  SIN BALON No. 6.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ294','TUBO ENDOTRAQUEAL  SIN BALON No. 7.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ295','TUBO ENDOTRAQUEAL  SIN BALON No. 7.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ296','TUBO ENDOTRAQUEAL  SIN BALON No. 8.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ297','TUBO ENDOTRAQUEAL  SIN BALON No. 8.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ298','TUBO ENDOTRAQUEAL CON  BALON No. 9.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ299','TUBO ENDOTRAQUEAL CON  BALON No.8.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ300','TUBO ENDOTRAQUEAL CON BALON No. 2.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ301','TUBO ENDOTRAQUEAL CON BALON No. 2.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ302','TUBO ENDOTRAQUEAL CON BALON No. 3.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ303','TUBO ENDOTRAQUEAL CON BALON No. 3.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ304','TUBO ENDOTRAQUEAL CON BALON No. 4.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ305','TUBO ENDOTRAQUEAL CON BALON No. 4.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ306','TUBO ENDOTRAQUEAL CON BALON No. 5.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ307','TUBO ENDOTRAQUEAL CON BALON No. 5.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ308','TUBO ENDOTRAQUEAL CON BALON No. 6.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ309','TUBO ENDOTRAQUEAL CON BALON No. 6.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ310','TUBO ENDOTRAQUEAL CON BALON No. 7.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ311','TUBO ENDOTRAQUEAL CON BALON No. 7.5','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ312','TUBO ENDOTRAQUEAL CON BALON No. 8.0','UNIDAD','BIOPLAST S.A.S','4.654','5.538'),
(1,'MEDICO_QUIRURGICO','MDQ313','TUBO TORAX CON TRAMPA ','UNIDAD ','FUTUMEDICA LTDA.','13.014','13.014'),
(1,'MEDICO_QUIRURGICO','MDQ314','VASELINA','TARRO 500 GR','BHOGA INTERNATIONAL S.A.S','30.797','36.649'),
(1,'MEDICO_QUIRURGICO','MDQ315','VENDA ALGOD N 3*5','UNIDAD','PROTEX','6.316','6.316'),
(1,'MEDICO_QUIRURGICO','MDQ316','VENDA ALGOD N 4*5','UNIDAD','PROTEX','6.515','6.515'),
(1,'MEDICO_QUIRURGICO','MDQ317','VENDA ALGOD N 5*5','UNIDAD','PROTEX','7.475','7.475'),
(1,'MEDICO_QUIRURGICO','MDQ318','VENDA ALGOD N 6*5','UNIDAD','PROTEX','8.824','8.824'),
(1,'MEDICO_QUIRURGICO','MDQ321','VENDA ELASTICA 2*5','UNIDAD','PROTEX S.A.S','3.038','3.038'),
(1,'MEDICO_QUIRURGICO','MDQ322','VENDA ELASTICA 3*5','UNIDAD','PROTEX S.A.S','4.093','4.093'),
(1,'MEDICO_QUIRURGICO','MDQ323','VENDA ELASTICA 4*5','UNIDAD','PROTEX S.A.S','4.095','4.095'),
(1,'MEDICO_QUIRURGICO','MDQ324','VENDA ELASTICA 5*5','UNIDAD','PROTEX S.A.S','4.341','4.341'),
(1,'MEDICO_QUIRURGICO','MDQ325','VENDA ELASTICA 6*5','UNIDAD','PROTEX S.A.S','5.277','5.277'),
(1,'MEDICO_QUIRURGICO','MDQ327','"VENDA YESO  3*5"""','UNIDAD','PROTEX','14.139','14.139'),
(1,'MEDICO_QUIRURGICO','MDQ328','"VENDA YESO 4*5"""','UNIDAD','PROTEX','15.395','15.395'),
(1,'MEDICO_QUIRURGICO','MDQ329','"VENDA YESO 5*5"""','UNIDAD','PROTEX','15.357','15.357'),
(1,'MEDICO_QUIRURGICO','MDQ330','"VENDA YESO 6*5"""','UNIDAD','PROTEX','17.943','17.943'),
(1,'MEDICO_QUIRURGICO','MDQ331','VENDAS TRIANGULARES','UNIDAD','INVERSIONES DERCA','11.822','11.822'),
(1,'MEDICO_QUIRURGICO','MDQ332','VENTURY ADULTO','UNIDAD','NORSTRAY NUART S.A.S','13.098','15.587'),
(1,'MEDICO_QUIRURGICO','MDQ333','VENTURY PEDIATRICO','UNIDAD','NORSTRAY NUART S.A.S','13.098','15.587'),
(1,'MEDICO_QUIRURGICO','MDQ334','PAPEL TERMICO FETAL 112X100X200 G6A PAINMED F112N10X20','CUADERNILLO','PAINMED','29.705','35.349'),
(1,'MEDICO_QUIRURGICO','MDQ335','TUBO TORAXICO ( CATETER TORAXICO)','UNIDAD','SHERLEG ','5.321','5.321'),
(1,'MEDICO_QUIRURGICO','MDQ336','TUBO DE SUCCION','UNIDAD','BIOPLAST S.A.S','8.955','10.656'),
(1,'MEDICO_QUIRURGICO','MDQ337','MANGUERA DE SUCCION','UNIDAD','GLOBAL HEALTHCARE','14.418','17.157'),
(1,'MEDICO_QUIRURGICO','MDQ338','JERINGA 1 ML (27GX1/2)','UNIDAD','ALFA TRADING ','328','390'),
(1,'MEDICO_QUIRURGICO','MDQ339','PAPEL GRADO MEDICO PARA ESTERILIZACION PLANO','300MM X 200 MTRS','NATURAL MASTER','380.000','380.000'),
(1,'MEDICO_QUIRURGICO','MDQ340','PAPEL GRADO MEDICO PARA ESTERILIZACION PLANO','250MM X 200 MTRS','NATURAL MASTER','300.000','300.000'),
(1,'MEDICO_QUIRURGICO','MDQ341','BALON DE TAPONAMIENTO UTERINO ELLAVI','UNIDAD','SINAPI BIOMEDICAL','950.000','950.000'),
(1,'MEDICO_QUIRURGICO','MDQ342','KIT DE CIRUGIA 13 PIEZAS','PAQUETE','ALLIANCE','150.420','179.000'),
(1,'MEDICO_QUIRURGICO','MDQ343','PORTA AGUJA PUNTA MOSQUITO ','UND','IMCOLMEDICA S.A.','28.571','34.000'),
(1,'MEDICO_QUIRURGICO','MDQ344','ESPARADRAPO SURTIDO','TARRO*5 UND','BSN MEDICAL','145.757','145.757'),
(1,'MEDICO_QUIRURGICO','MDQ345','IMPLANTE SUBDERMICO SINOIMPANT','UNIDAD','LAFRANCOL','160.323','160.323'),
(1,'MEDICO_QUIRURGICO','MDQ346','AGUJA HIPODERMICA 18*1 1/2','CJA*100 UND','PROTEX','19.462','23.160'),
(1,'MEDICO_QUIRURGICO','MDQ347','AGUJA HIPODERMICA 19*1 1/2','CJA*100 UND','PROTEX','21.617','25.724'),
(1,'MEDICO_QUIRURGICO','MDQ348','TIRILLA PARA GUCOMETRO BD-LIFE','FCO*50 UND','DIAGNOSTICOS BIOMEDICOS','92.855','92.855'),
(1,'MEDICO_QUIRURGICO','MDQ349','CLORHEXIDINA 2% JAB TOP BOL*30ML (JABON WESCOHEX) ','BOL *30ML','WEST','7.500','7.500'),
(1,'MEDICO_QUIRURGICO','MDQ350','CLORHEXIDINA 2G JABON 2% BOL*60ML CAJA*50 (WESCOHEX) ','BOL *60ML','WEST','8.900','8.900'),
(1,'MEDICO_QUIRURGICO','MDQ351','TOALLA IMPREGNADA CON ALCOHOL ISOPROPILICO 70% C*100','CAJA*100','MEDICAL SUPPLIES','15.000','15.000'),
(1,'MEDICO_QUIRURGICO','MDQ352','EXTENSION DE ANESTESIA R33','UNIDAD','SHERLEG','2.500','2.500'),
(1,'MEDICO_QUIRURGICO','MDQ353','ALGOD N TURUNDAS','BOL*500','TECNOQUIMICAS','37.172','37.172'),
(1,'MEDICO_QUIRURGICO','MDQ354','GASA NO TEJIDA NO ESTERIL','PQT*200','PROTEX','12.500','12.500'),
(1,'MEDICO_QUIRURGICO','MDQ355','PRUEBA EMBARAZO','UNIDAD','DB','2.940','2.940'),
(1,'MEDICO_QUIRURGICO','MDQ356','ALCOHOL AL 70% - BOTELLA 120 ML','BOTELLA','OSA','3.442','3.442'),
(1,'MEDICO_QUIRURGICO','MDQ357','CONECTOR LIBRE DE AGUJA','CAJA X 100','ONCE MEDICAL','1.662','1.978'),
(1,'MEDICO_QUIRURGICO','MDQ358','SELLO DESECHABLE PARA CARRO DE PARO NUMERADO ROJO','BOLSA X 50','BILIFE','50.420','60.000'),
(1,'MEDICO_QUIRURGICO','MDQ359','JABON DE PH NEUTRO','GALON','WEST','174.210','207.310'),
(1,'MEDICO_QUIRURGICO','MDQ360','ALKA DDS','GALON','ALKAMEDICA','269.850','269.850'),
(1,'MEDICO_QUIRURGICO','MDQ361','BONZYME DETERGENTE MULTIENZIMATICO LIQUIDO CONCENTRADO','GALON','EUFAR','182.000','182.000'),
(1,'MEDICO_QUIRURGICO','MDQ362','BONZYME SPRAY (DETERGENTE Y PRE-DESINFECTANTE EN ESPUMA)','SPRAY 750 ML','EUFAR','109.800','109.800'),
(1,'MEDICO_QUIRURGICO','MDQ363','CLORHEDIXIDINA 2% SOLUCION  (WESCOHEX) ','BOLSA * 30ML','WEST','9.200','9.200'),
(1,'MEDICO_QUIRURGICO','MDQ364','CLORHEDIXIDINA 2% ESPUMA (WESCOHEX) ','BOLSA * 60ML','WEST','10.800','10.800'),
('1','LABORATORIO','LABO001','ACIDO URICO ','FCO *200 ML','BIOSYSTEMS','395.472','395.472'),
('1','LABORATORIO','LABO002','AGUA AMORTIGUADORA','FCO *500 ML','CORPAUL','61.175','61.175'),
('1','LABORATORIO','LABO003','ALBUMINA','1*250ML','ALBUMIN','134.584','134.584'),
('1','LABORATORIO','LABO004','AGUJAS  VACUTAINER PEDIATRICO ','CAJA *100','BD VACUTAINER','103.957','123.709'),
('1','LABORATORIO','LABO005','AGUJAS PARA VACUTAINER ADULTO ','CAJA *100','H&M TEST','98.984','117.791'),
('1','LABORATORIO','LABO007','ALCOHOL ACETONA ','FCO *500 ML','IHR','83.750','83.750'),
('1','LABORATORIO','LABO008','ALCOHOL ACIDO PARA BK*500ML ALCOHOL ACIDO ZIEL NELSEN','FCO *500 ML','IHR','78.567','78.567'),
('1','LABORATORIO','LABO010','ALCOHOL ETILICO AL 96%','*1000','IHR','63.106','75.096'),
('1','LABORATORIO','LABO013','ANTIESTREPTOLISINA ASO','CAJA','BIOSYSTEMS','101.958','101.958'),
('1','LABORATORIO','LABO015','CONTROL DE ORINA I Y II (AUTION CHEK PLUS I Y II)','KIT','BIOSYSTEMS','1.255.762','1.255.762'),
('1','LABORATORIO','LABO016','AZUL DE BROMOTINOL','FCO *500 ML','','71.360','71.360'),
('1','LABORATORIO','LABO017','AZUL DE LACTOFENOL','FCO *500 ML','NOVALAB','71.360','71.360'),
('1','LABORATORIO','LABO018','AZUL DE METILENO ','FCO *500 ML','IHR','60.580','60.580'),
('1','LABORATORIO','LABO019','BILIRRUBINA TOTAL O DIRECTA BYOSISTEM ','FCO *50ML','BIOSYSTEMS','234.812','234.812'),
('1','LABORATORIO','LABO020','FOSFATASA ALKALINA','1*50ML','BIOSYSTEMS','149.538','149.538'),
('1','LABORATORIO','LABO021','FOSFATASA ACIDA','1*40ML','BIOSYSTEMS','380.642','380.642'),
('1','LABORATORIO','LABO022','CAJA DE CURAS REDONDAS ','CAJA *100','LIFECARE ','19.774','19.774'),
('1','LABORATORIO','LABO023','CAJA DE PETRI EN VIDRIO','UNIDAD','','24.467','24.467'),
('1','LABORATORIO','LABO024','CARGA DE GLUCOSA *25GRS','CAJA *50 SOBRES','GLUCOTEST','126.590','126.590'),
('1','LABORATORIO','LABO025','CLEANER SOLUCION EZ LIMPIADOR DE EQUIPO HEMATOLOGIA ','FRASCO *100 ML','MINDRAY','557.989','664.007'),
('1','LABORATORIO','LABO026','COLESTEROL HDL NORMAL','KIT 2*50ML','BIOSYSTEM','356.067','356.067'),
('1','LABORATORIO','LABO027','COLESTEROL HDL DIRECTO','FCO *500ML','BIOSYSTEM','795.270','795.270'),
('1','LABORATORIO','LABO028','COLESTEROL TOTAL ','FCO *500ML','BIOSYSTEM','587.140','587.140'),
('1','LABORATORIO','LABO029','COLORACION FIELD A ','FCO *500ML','IHR','163.132','163.132'),
('1','LABORATORIO','LABO030','COLORACION FIELD B ','FCO *500ML','IHR','135.944','135.944'),
('1','LABORATORIO','LABO031','COLORANTE DE WRIGTH IHR ','FCO *500ML','IHR','135.009','160.661'),
('1','LABORATORIO','LABO033','CONTROL DE QUIMICA CLINICA I','UNIDAD','BIOSYSTEMS','325.177','386.961'),
('1','LABORATORIO','LABO034','CONTROL DE QUIMICA CLINICA II','UNIDAD','BIOSYSTEMS','461.120','548.733'),
('1','LABORATORIO','LABO035','CLEANER SOLUCION PB PARA EQUIPO HEMATOLOGIA ZYBIO','FRASCO *100 ML','LUMIRATEK','557.989','664.007'),
('1','LABORATORIO','LABO036','CONTROL DE HEMATOLOGIA STRECK/MINDRAY','KIT','DIAGON','803.303','803.303'),
('1','LABORATORIO','LABO037','CLEANER SOLUCION DIATRO PARA EQUIPO HEMATOLOGIA ZYBIO','PORRON','MINDRAY','610.403','610.403'),
('1','LABORATORIO','LABO038','CREATININA CINETICA 4*50','CAJA','BIOSYSTEMS','254.190','254.190'),
('1','LABORATORIO','LABO039','DETERGENTE  NEUTRO IHR','LITRO','IHR','89.676','106.714'),
('1','LABORATORIO','LABO040','DETERGENTE  EXTRAN NEUTRO MERCK','GALON','MERCK','501.444','596.718'),
('1','LABORATORIO','LABO041','DILUYENTE PARA EQUIPO HEMATOLOGIA ZYBIO','PORRON','','610.403','610.403'),
('1','LABORATORIO','LABO042','RINSE PARA HEMATOLOGIA MINDRAY 30S','PORRON','MINDRAY','566.147','673.715'),
('1','LABORATORIO','LABO043','DILUYENTE PARA HEMATOLOGIA MINDRAY  30S','PORRON','MINDRAY','531.486','531.486'),
('1','LABORATORIO','LABO044','DILUYENTE HEMATOLOGIA MINDRAY EQUIPO 20S','PORRON','MINDRAY','610.403','610.403'),
('1','LABORATORIO','LABO045','ESCOBILLONES','UNIDAD','N.A','10.875','12.941'),
('1','LABORATORIO','LABO046','FACTOR REMATOIDEO','FRASCO','BIOSYSTEMS','101.958','101.958'),
('1','LABORATORIO','LABO047','FUSCINA BASICA DE GRAM','FCO *500ML','IHR','126.044','126.044'),
('1','LABORATORIO','LABO048','FUSCINA FENICADA DE BK =FUSCINA PARA ZIEHL NEELSEN','FCO *500ML','IHR','114.934','114.934'),
('1','LABORATORIO','LABO049','GLUCOSA O GLICEMIA  ','FCO *500ML','BIOSYSTEMS','271.135','271.135'),
('1','LABORATORIO','LABO050','GLUCOSA O GLICEMIA  ','FCO *1000ML','BIOSYSTEMS','529.385','529.385'),
('1','LABORATORIO','LABO051','GRADILLA RECTANGULAR 90 TUBOS PLASTICA','UNIDAD','POBEL','156.336','186.040'),
('1','LABORATORIO','LABO052','HBSAG CTK','CAJA *30 CASESETES','CTK','271.887','271.887'),
('1','LABORATORIO','LABO053','HEMOCLASIFICADORES ANTI A- B- D','KIT','ELIPLUS DIAGNOSTIC','186.021','186.021'),
('1','LABORATORIO','LABO054','HEMOCLASIFICADORES ANTI A','FRASCO','ELIPLUS DIAGNOSTIC','67.972','67.972'),
('1','LABORATORIO','LABO055','HEMOCLASIFICADORES ANTI B   ','FRASCO','ELIPLUS DIAGNOSTIC','67.972','67.972'),
('1','LABORATORIO','LABO056','HEMOCLASIFICADORES ANTI D   ','FRASCO','ELIPLUS DIAGNOSTIC','80.330','80.330'),
('1','LABORATORIO','LABO057','HIV 1/2 3.0 SD ABBOTT','CAJA *30 CASSETES','ABBOTT','356.019','356.019'),
('1','LABORATORIO','LABO058','HIV 1/2 3.0 CTK','CAJA *30 CASSETES','CTK','308.769','308.769'),
('1','LABORATORIO','LABO060','PRUEBA DE MICROALBUMINURIA','1*250ML','BIOSYSTEMS','747.689','747.689'),
('1','LABORATORIO','LABO061','LAMINA CUBREOBJETOS (LAMINILLA)','CAJA *100','KNITELL','6.024','7.169'),
('1','LABORATORIO','LABO062','LAMINA PORTA OBJETOS LISA','CAJA','IHR','15.536','18.488'),
('1','LABORATORIO','LABO063','LAMINAS DE CUARZO ','CAJA','SUPERIOR','74.671','88.858'),
('1','LABORATORIO','LABO064','LAMINAS ESMERILADAS','CAJA','IHR','15.536','18.488'),
('1','LABORATORIO','LABO065','LANCETAS ','CAJA*200UNIDADES','OSSA','35.414','42.143'),
('1','LABORATORIO','LABO066','LYSE PARA EQUIPO HEMATOLOGIA ZYBIO','*500 ML','MINDRAY','566.147','566.147'),
('1','LABORATORIO','LABO067','LUGOL DE GRAM X500','FCO *500ML','IHR','61.793','61.793'),
('1','LABORATORIO','LABO068','LUGOL PARASITOLICO','FCO *500ML','IHR','54.377','54.377'),
('1','LABORATORIO','LABO069','M-20CFL  LYSE  MINDRAY EQUIPO 20S','*400ML','MINDRAY','694.193','694.193'),
('1','LABORATORIO','LABO070','M-30CFL LYSE MINDRAY EQUIPO 30S','FCO *500ML','MINDRAY','566.147','566.147'),
('1','LABORATORIO','LABO071','MECHA PARA MECHERO','PAQUETE','N.A','13.418','15.967'),
('1','LABORATORIO','LABO072','MICROHEMATOCRITOS TUBO TAPA AZUL ','FCO *100','VITREX','14.850','17.672'),
('1','LABORATORIO','LABO073','MICROHEMATOCRITOS TUBO TAPA ROJA ','FCO *100','VITREX','16.508','19.645'),
('1','LABORATORIO','LABO074','NITROGENO UREICO 4*50 BIOSYSTEMS- REACTIVO DE BUN-UREA BUN ','UNIDAD','BIOSYSTEMS','256.933','256.933'),
('1','LABORATORIO','LABO076','PALILLOS DE MADERA REDONDOS DOBL','PAQUETE','N.A','9.139','10.875'),
('1','LABORATORIO','LABO078','PAPEL EQUIPO HEMATOLOGIA MINDRAY (57.25)PARA ZIBIO Y URONALISIS)','ROLLO','MINDRAY','23.990','28.548'),
('1','LABORATORIO','LABO079','PAPEL FILTRO 12.5 CM*100','CAJA','BOECO','37.698','44.861'),
('1','LABORATORIO','LABO080','PAPEL TERMICO DE 5.5 DE ANCHO X 4.8 DIAMETRO','ROLLO','ALERE','34.271','40.782'),
('1','LABORATORIO','LABO081','PCR','KIT','BIOSYSTEMS','93.925','93.925'),
('1','LABORATORIO','LABO082','PLASTILINA PARA HEMATOCRITO','UNIDAD','IHR','58.261','69.331'),
('1','LABORATORIO','LABO083','PRUEBA DE EMBARAZO ','CAJA *25 CASSETES','WONDFO','66.467','66.467'),
('1','LABORATORIO','LABO084','PRUEBA DE EMBARAZO -OPTIMUS TEST','CAJA *25 CASSETES','OPTIMUS','66.467','66.467'),
('1','LABORATORIO','LABO085','PRUEBA DE SIFILIS SD ABBOTT','CAJA *40 CASSETES','ABBOTT','346.038','346.038'),
('1','LABORATORIO','LABO086','PRUEBA DE SIFILIS X30 CTK','CAJA *30 CASSETES','CTK','259.529','259.529'),
('1','LABORATORIO','LABO087','PUNTAS AMARILLAS  ','PAQ *1000','IHR','102.815','122.350'),
('1','LABORATORIO','LABO088','PUNTAS AZULES ','PAQ *1000','IHR','102.815','122.350'),
('1','LABORATORIO','LABO090','PROBE X 50 ML MINDRAY (limpiador de sonda)','FRASCO 50ML','MINDRAY','262.748','312.670'),
('1','LABORATORIO','LABO092','RECIPIENTE PARA BK','UNIDAD','URINTAINER','1.943','2.312'),
('1','LABORATORIO','LABO093','RECOLECTOR COPROLOGICO','BOLSA','','39.984','47.581'),
('1','LABORATORIO','LABO094','RECOLECTOR ORINA','BOLSA *50 UNI','','28.584','34.015'),
('1','LABORATORIO','LABO095','RINSE PARA HEMATOLOGIA MINDRAY 20S','PORRON','MINDRAY','630.849','750.710'),
('1','LABORATORIO','LABO097','RPR CARBON *100','UNIDAD','BIOSYSTEMS','258.293','258.293'),
('1','LABORATORIO','LABO098','SAFRANINA DE GRAM ','FCO *500ML','IHR','88.967','88.967'),
('1','LABORATORIO','LABO099','SANGRE OCULTA EN HECES IHR','FRASCO','IHR','155.288','155.288'),
('1','LABORATORIO','LABO100','SEROLOGIA VDRL C/CONTROL WIENER','CAJA/KIT','','232.481','232.481'),
('1','LABORATORIO','LABO101','SOLUCION DE TURK ','FRASCO 500ML','IHR','90.217','90.217'),
('1','LABORATORIO','LABO102','TIRA DE ORINA DIRUI H13','TARRO *100','DIRUI','135.944','135.944'),
('1','LABORATORIO','LABO103','TGO','1*50ML','BIOSYSTEMS','133.225','133.225'),
('1','LABORATORIO','LABO104','TIRILLA PARA GUCOMETRO X 50 OK METER','UNIDAD','ACON','120.162','120.162'),
('1','LABORATORIO','LABO105','GLUCOMETRO OK METER','UNIDAD','ON CALL PLUS-ACON-MEDICLAS','85.644','85.644'),
('1','LABORATORIO','LABO106','TORNIQUETE ADHESIVO ','UNIDAD','LORD','38.059','45.290'),
('1','LABORATORIO','LABO107','TOXOPLASMA IGG IGM MACRA CTK','CAJA','CTK','401.034','401.034'),
('1','LABORATORIO','LABO108','TRIGLICERIDOS','2*250 ML','BIOSYSTEMS','1.841.417','1.841.417'),
('1','LABORATORIO','LABO109','TROPONINA','CAJA *10 CASSETES','ALL TEST','246.486','246.486'),
('1','LABORATORIO','LABO110','TUBO DE VIDRIO 12X75MM PARA QUIMICA  SIN TAPA  X100 UND = TUBO DE VIDRIO 75*100 MM PARA QUIMICA','CAJA','IHR','196.490','233.823'),
('1','LABORATORIO','LABO111','TUBO DE VIDRIO 13 MM','PAQUETE *100','KRAMER','169.280','201.443'),
('1','LABORATORIO','LABO112','TUBO PLASTICO CONICO 12 X 1.5 ML','UNIDAD','IHR','1.141','1.358'),
('1','LABORATORIO','LABO113','TUBO TAPA AMARILLA ','PAQ *100','BD','149.297','177.663'),
('1','LABORATORIO','LABO114','TUBO TAPA GRIS ','PAQ *100','BD','142.109','169.110'),
('1','LABORATORIO','LABO115','TUBOS CONICOS PARA CENTRIFUGA CON TAPA ROSCA AZUL PARA TRANSPORTE DE ORINA','UNIDAD','OSSA','7.655','9.109'),
('1','LABORATORIO','LABO116','TUBOS MICROTAINER LILA ','PAQ *100','BD','209.057','248.778'),
('1','LABORATORIO','LABO117','TUBO TAPA AZUL ','PAQ *100','HYM','124.623','148.301'),
('1','LABORATORIO','LABO118','TUBOS MICROTAINER ROJA','PAQ *100','BD','209.057','248.778'),
('1','LABORATORIO','LABO119','TUBOS TAPA LILA ','PAQ *100','BD','108.007','128.528'),
('1','LABORATORIO','LABO120','TUBOS TAPA ROJA PLASTICO','PAQ *100','BD','124.521','148.180'),
('1','LABORATORIO','LABO121','TUBOS VIALES','PAQUETE','OSSA','148.510','176.727'),
('1','LABORATORIO','LABO122','VIOLETA CRISTAL  ','FRASCO 500ML','IHR','92.689','92.689'),
('1','LABORATORIO','LABO124','TGP','1*50ML','BIOSYSTEMS','133.225','133.225'),
('1','LABORATORIO','LABO125','BUFER COLORANTE  WRIGHT','FCO *500ML','IHR','106.759','106.759'),
('1','LABORATORIO','LABO126','CONTROL DE ORINA POSITIVO','FCO','','133.225','133.225'),
('1','LABORATORIO','LABO127','CONTROL DE ORINA NEGATIVO','FCO','','133.225','133.225'),
('1','LABORATORIO','LABO128','PUNTA BLANCA DESECHABLE ','PAQ *1000','','305.201','363.189'),
('1','LABORATORIO','LABO129','ACEITE DE INMERSION ','FCO *100ML','IHR','228.477','271.888'),
('1','LABORATORIO','LABO131','TABLA DE LECTURA MICROHEMATOCRITOS','UNIDAD','NAL','5.828','6.935'),
('1','LABORATORIO','LABO132','KOH (HIDROXIDO DE POTASIO)','FCO','IHR','50.266','59.817'),
('1','LABORATORIO','LABO133','CAMISA VACUTAINER','UNIDAD','BD','7.197','8.564'),
('1','LABORATORIO','LABO136','TUBO MICROTAINER AMARILLO ','PAQ *100','BD','226.193','269.170'),
('1','LABORATORIO','LABO137','TERMOMETRO DIGITAL CON SONDA','UNIDAD','ALLFRANCE','125.663','149.539'),
('1','LABORATORIO','LABO138','AGUA DESMINERALIZADA ','*500ML','','68.671','68.671'),
('1','LABORATORIO','LABO139','TERMOHIGROMETRO DIGITAL PANTALLA ANCHA','UNIDAD','ALLFRANCE','279.883','333.061'),
('1','LABORATORIO','LABO140','HBSAG X 30 CASSETES -CTK','CAJA *30 CASSETES','CTK','345.696','345.696'),
('1','LABORATORIO','LABO141','PRUEBA PSA ANTIGENO PROSTATICO','CAJA *30 CASSETES','ALL TEST','576.876','576.876'),
('1','LABORATORIO','LABO142','CULTURE SWAB CARY BLAIR AGAR','PAQ *50','','991.904','1.180.366'),
('1','LABORATORIO','LABO143','TUBO FALCON ESTERIL','PAQ *50','OSSA','184.422','219.462'),
('1','LABORATORIO','LABO145','CAMARA DE NEWBAUER LINEA BLANCA','UNIDAD','BOECO','274.172','326.265'),
('1','LABORATORIO','LABO146','CAMARA DE NEWBAUER LINEA BRILLANTE','UNIDAD','BOECO','685.155','815.334'),
('1','LABORATORIO','LABO148','TIMER PARA LABORATORIO MULTITIEMPOS ALLA FRANCE','UNIDAD','ALLFRANCE','239.901','285.482'),
('1','LABORATORIO','LABO149','GRADILLA DE COLORACION Y FLAVEO','UNIDAD','IHR','218.194','259.651'),
('1','LABORATORIO','LABO154','HIV AG/AB 4 GENERACION DETERMINE COMBO X 20 PRUEBAS ALERE','CAJA *20 CASSETES','ALERE','300.300','300.300'),
('1','LABORATORIO','LABO155','HIV AG/AB 4 GENERACION DETERMINE COMBO X 100 PRUEBAS ALERE','CAJA 100 CASSETES','ALERE','1.131.900','1.131.900'),
('1','LABORATORIO','LABO157','TIRAS PARA ORINA X 100 UROCOLOR','TARRO *100','IHR','121.994','121.994'),
('1','LABORATORIO','LABO158','TORNIQUETE PEDIATRICO ','UNIDAD','','4.907','5.839'),
('1','LABORATORIO','LABO159','TORNIQUETE ADULTO ','UNIDAD','','4.907','5.839'),
('1','LABORATORIO','LABO161','CEPILLO VIPER VPH','UNIDAD','','4.828','5.745'),
('1','LABORATORIO','LABO162','MEDIO VIAL VIPER VPH','UNIDAD','','5.854','5.854'),
('1','LABORATORIO','LABO163','COVID-19 ANTIGEN RAPID TEST CASSETTE*25','CAJA*25','','488.161','488.161'),
('1','LABORATORIO','LABO167','LAPIZ DE CERA PARA VIDRIO ','UNIDAD','N.A','25.963','30.896'),
('1','LABORATORIO','LABO166','PRUEBA RAPIDA ONSITE DUO DENGUE AG IgG/IgM','*10PBS','CTK','735.701','735.701'),
('1','LABORATORIO','LABO168','PRUEBA RAPIDA ONSITE DUO DENGUE AG IgG/IgM','CAJA*30','CTK','2.182.950','2.182.950'),
('1','LABORATORIO','LABO169','PIPETA PARA VSG','CAJA*200','','467.544','556.377'),
('1','LABORATORIO','LABO170','PROGRAMA DE CALIDAD QUIMICA CLINICA BIMESTRAL MARCA SIGMA','UNIDAD','SIGMA','3.465.000','3.465.000'),
('1','LABORATORIO','LABO171','PROGRAMA DE CALIDAD HEMATOLOGIA BIMESTRAL MARCA SIGMA','UNIDAD','SIGMA','3.465.000','3.465.000'),
('1','LABORATORIO','LABO172','PROGRAMA DE CALIDAD PARASITOLOGIA BIMESTRAL MARCA SIGMA','UNIDAD','SIGMA','3.465.000','3.465.000'),
('1','LABORATORIO','LABO173','PROGRAMA DE CALIDAD EXTERNO PARA QUIMICA CLINICA- 12 EVENTOS POR A O MARCA ESFEQA','UNIDAD','ESFEQA','8.085.000','8.085.000'),
('1','LABORATORIO','LABO174','PROGRAMA DE CALIDAD EXTERNO PARA HEMATOLOGIA- 12 EVENTOS POR A O MARCA ESFEQA','UNIDAD','ESFEQA','8.085.000','8.085.000'),
('1','LABORATORIO','LABO175','MULTICALIBRADOR BIOSYSTEMS PARA CONTROL LIPIDOS','UNIDAD','BIOSYSTEMS','404.250','481.058'),
('1','LABORATORIO','LABO176','COLORANTE DE WRIGTH MERK','*1000ML','MERCK','399.000','474.810'),
('1','LABORATORIO','LABO177','PRUEBA DE SIFILIS SD ABBOTT','CAJA *30 CASSETES','ABBOTT','259.529','259.529'),
('1','LABORATORIO','LABO178','TUBOS MICROTAINER LILA ','PAQ *50','BD','104.529','124.390'),
('1','LABORATORIO','LABO179','TUBO MICROTAINER AMARILLO ','PAQ *50','BD','113.097','134.585'),
('1','LABORATORIO','LABO180','TUBOS MICROTAINER ROJO','PAQ *50','BD','104.529','124.390'),
('1','LABORATORIO','LABO181','PLACA SEROLOGIA 12 CAVIDADES ','UNIDAD','MARIENFELD','242.647','288.750'),
('1','LABORATORIO','LABO182','OXIMETRO','UNIDAD','GMD','220.500','262.395'),
('1','LABORATORIO','LABO183','TERMOMETRO INFRAROJO DE TEMPERATURA','UNIDAD','','63.000','74.970'),
('1','LABORATORIO','LABO184','TUBO AL VACIO TAPA GRIS POTASSIUM OXALATE 12MG (FX)','CAJA*100','BD','194.250','231.158'),
('1','LABORATORIO','LABO185','CINTA INDICADORA PH 1-14 MARCA HYDRION ','ROLLO*5 MTS','HYDRION','89.250','106.208'),
('1','LABORATORIO','LABO186','HBSAG X 40 CASSETES ABBOTT','CAJA *40 CASSETES','ABBOTT','460.919','460.919'),
('1','LABORATORIO','LABO187','ACEITE SPRAY LUBRISPRAY 400CC - QUIRUDENT','UNIDAD','QUIRUDENT','58.706','69.860'),
('1','LABORATORIO','LABO188','BONZYME- DETERGENTE MULTIENZIMATICO LIQUIDO CONCENTRADO','GALON','ZYME','170.000','170.000'),
(1,'ASEO_PAPELERIA','PAPE001','AGENDA','UNIDAD','','0','32.373'),
(1,'ASEO_PAPELERIA','PAPE004','ALMOHADILLA','UNIDAD','','0','17.290'),
(1,'ASEO_PAPELERIA','PAPE009','AZ CARTA','UNIDAD','','0','10.671'),
(1,'ASEO_PAPELERIA','PAPE010','AZ OFICIO','UNIDAD','','0','10.671'),
(1,'ASEO_PAPELERIA','PAPE011','BLOCK DE COLORES','CUADERNILLO','','0','8.273'),
(1,'ASEO_PAPELERIA','PAPE012','BOLSILLO CATALOGO','PAQUETE*100','','0','20.719'),
(1,'ASEO_PAPELERIA','PAPE013','BOMBAS R12','PAQUETE X12','','0','10.168'),
(1,'ASEO_PAPELERIA','PAPE017','BORRADOR DE NATA - IGA DE PAN NEGRO','UNIDAD','','0','972'),
(1,'ASEO_PAPELERIA','PAPE018','BORRADOR PARA TABLERO ACRÍLICO','UNIDAD','','0','5.863'),
(1,'ASEO_PAPELERIA','PAPE022','CAJA DE ARCHIVO INACTIVO NO  12','UNIDAD','','0','9.868'),
(1,'ASEO_PAPELERIA','PAPE024','CAJA PLÁSTICA EXTRA GRANDE','UNIDAD','','0','108.881'),
(1,'ASEO_PAPELERIA','PAPE025','CAJA PLÁSTICA MEDIANA','UNIDAD','','0','98.714'),
(1,'ASEO_PAPELERIA','PAPE028','CALCULADORA MEDIANA','UNIDAD','','0','51.102'),
(1,'ASEO_PAPELERIA','PAPE037','CARPETA  LEGAJADOR CAFÉ','UNIDAD','','0','1.438'),
(1,'ASEO_PAPELERIA','PAPE038','"CARPETA BLANCA DE TRES AROS 1.5"""','UNIDAD','','0','22.289'),
(1,'ASEO_PAPELERIA','PAPE041','CARTELERA EN CORCHO 1 METRO X 1.20 METRO','UNIDAD','','0','207.187'),
(1,'ASEO_PAPELERIA','PAPE042','CARTON PAJA','LAMINA','','0','9.879'),
(1,'ASEO_PAPELERIA','PAPE044','CARTILINA OCTAVOS COLORES VIVOS','PAQUETE','','0','3.622'),
(1,'ASEO_PAPELERIA','PAPE045','CARTULINA  PLIEGO COLORES VARIADOS','PLIEGO','','0','3.549'),
(1,'ASEO_PAPELERIA','PAPE046','CARTULINA ESPAÑOLA OCTAVOS','PAQUETE','','0','5.863'),
(1,'ASEO_PAPELERIA','PAPE047','CD PRINCO','PAQUETE X100 ','','0','187.764'),
(1,'ASEO_PAPELERIA','PAPE048','CD R','UNIDAD','','0','2.074'),
(1,'ASEO_PAPELERIA','PAPE049','CD REGRABABLE','UNIDAD','','0','2.973'),
(1,'ASEO_PAPELERIA','PAPE051','CHINCHES','UNIDAD','','0','3.238'),
(1,'ASEO_PAPELERIA','PAPE052','CINTA AISLANTE NEGRA 10M * 19mm','ROLO','','0','9.064'),
(1,'ASEO_PAPELERIA','PAPE053','CINTA ANTIDEZLIZANTE 5m *25m','ROLLO','','0','82.346'),
(1,'ASEO_PAPELERIA','PAPE054','CINTA DE EMPAQUE  ANCHA 40m*48mm','ROLLO','','0','6.859'),
(1,'ASEO_PAPELERIA','PAPE055','CINTA DE ENMASCARAR  24 MM/40 M','UNIDAD','','0','8.417'),
(1,'ASEO_PAPELERIA','PAPE061','CINTA METRICA MEDICA','UNIDAD','','0','3.622'),
(1,'ASEO_PAPELERIA','PAPE062','CINTA PARA TIQUETEADORA AMARILLA','PAQUETE X 5','','0','8.093'),
(1,'ASEO_PAPELERIA','PAPE063','CINTA PARA TIQUETEADORA ROJA (FUSIA)','PAQUETE X 5','','0','8.093'),
(1,'ASEO_PAPELERIA','PAPE064','CINTA PARA TIQUETEADORA VERDE','PAQUET X 3','','0','8.093'),
(1,'ASEO_PAPELERIA','PAPE067','CLIP MARIPOSA - GRANDES','CAJA','','0','5.827'),
(1,'ASEO_PAPELERIA','PAPE068','CLIP MEDIANO','CAJA','','0','4.269'),
(1,'ASEO_PAPELERIA','PAPE069','CLIP PEQUEÑO','CAJA','','0','1.942'),
(1,'ASEO_PAPELERIA','PAPE070','COLBON PEGANTE X 115 GS','TARRO','','0','11.967'),
(1,'ASEO_PAPELERIA','PAPE071','COLBON TARRO GRANDE 225 GM','TARRO','','0','14.892'),
(1,'ASEO_PAPELERIA','PAPE072','COLORES','CAJAX12','','0','21.786'),
(1,'ASEO_PAPELERIA','PAPE075','CORRECTOR LIQUIDO PAPERMATE','UNIDAD','','0','10.072'),
(1,'ASEO_PAPELERIA','PAPE076','COSEDORA  STUDMARK','UNIDAD','','0','21.533'),
(1,'ASEO_PAPELERIA','PAPE077','CUADERNO ARGOLLADO GRANDE','UNIDAD','','0','18.777'),
(1,'ASEO_PAPELERIA','PAPE078','CUADERNO DE 100 HOJAS GRAPADOS','UNIDAD','','0','7.182'),
(1,'ASEO_PAPELERIA','PAPE079','CUADERNO DE 50 H','UNIDAD','','0','4.989'),
(1,'ASEO_PAPELERIA','PAPE083','DVD 4.7 GB','UNIDAD','','0','3.478'),
(1,'ASEO_PAPELERIA','PAPE084','DVD REGRABABLE 4.7 GB','UNIDAD','','0','4.171'),
(1,'ASEO_PAPELERIA','PAPE088','EXACTOS BASICOS','UNIDAD','','0','8.117'),
(1,'ASEO_PAPELERIA','PAPE092','FECHADOR','UNIDAD','','0','14.520'),
(1,'ASEO_PAPELERIA','PAPE093','FOMY COLORES VARIADOS','PLIEGO','','0','9.713'),
(1,'ASEO_PAPELERIA','PAPE094','FOMY COLORES VARIADOS OCTAVOS','PAQUETE X 10','','0','15.647'),
(1,'ASEO_PAPELERIA','PAPE095','FORMAS CONTINUAS 9 1/2 X 5 1/2 2 PARTES','CAJA','','0','198.196'),
(1,'ASEO_PAPELERIA','PAPE098','GANCHO COSEDORA WINGO','CAJA','','0','5.863'),
(1,'ASEO_PAPELERIA','PAPE099','GANCHO LEGAJADOR PLÁSTICO','PTE','','0','5.827'),
(1,'ASEO_PAPELERIA','PAPE101','GUILLOTINA','UNIDAD','','0','194.237'),
(1,'ASEO_PAPELERIA','PAPE102','HUELLERO','UNIDAD','','0','6.211'),
(1,'ASEO_PAPELERIA','PAPE106','LAPICERO  TINTA NEGRA PUNTA FINA','CAJA X12UN','','0','14.687'),
(1,'ASEO_PAPELERIA','PAPE107','LAPICERO  TINTA ROJA','CAJA X12UN','','0','14.687'),
(1,'ASEO_PAPELERIA','PAPE108','LAPICERO TINTA AZUL','CAJA X 12 UN','','0','14.687'),
(1,'ASEO_PAPELERIA','PAPE109','LÁPIZ  NO 2 NEGRO','UNIDAD','','0','1.402'),
(1,'ASEO_PAPELERIA','PAPE110','LAPIZ NEGRO -  PREGUNTAR ANTES','CAJA X12UN','','0','16.834'),
(1,'ASEO_PAPELERIA','PAPE111','LAPIZ NO-  2 ROJO','UNIDAD','','0','1.402'),
(1,'ASEO_PAPELERIA','PAPE112','LEGAJADOR COLGANTE CAFÉ','UNIDAD','','0','2.326'),
(1,'ASEO_PAPELERIA','PAPE113','LIBRO CONTABILIDAD 3 COLUMNAS 100 FOLIOS','UNIDAD','','0','21.990'),
(1,'ASEO_PAPELERIA','PAPE114','LIBRO CONTABILIDAD 3 COLUMNAS 200 FOLIOS','UNIDAD','','0','38.851'),
(1,'ASEO_PAPELERIA','PAPE115','LIBRO CONTABILIDAD 3 COLUMNAS 400 FOLIOS','UNIDAD','','0','63.104'),
(1,'ASEO_PAPELERIA','PAPE117','MARCADOR  (  BORRABLE ) PARA ACRÍLICO COLORES SURTIDOS','CAJAX10','','0','47.194'),
(1,'ASEO_PAPELERIA','PAPE118','MARCADOR PERMANENTE COLOR NEGRO','UNIDAD','','0','4.305'),
(1,'ASEO_PAPELERIA','PAPE119','MARCADOR PERMANENTE COLORES SURTIDOS','UNIDAD','','0','4.305'),
(1,'ASEO_PAPELERIA','PAPE120','MARCADOR PUNTA FINA SHARPIE COLOR NEGRO','CAJAX12','','0','54.374'),
(1,'ASEO_PAPELERIA','PAPE121','MARCADOR SHARPIE COLORES SURTIDOS PTA FINA','UNIDAD','','0','4.532'),
(1,'ASEO_PAPELERIA','PAPE127','NUMERADOR','UNIDAD','','0','24.387'),
(1,'ASEO_PAPELERIA','PAPE129','PAPEL BOND - PERIÓDICO','PLIEGO','','0','647'),
(1,'ASEO_PAPELERIA','PAPE130','PAPEL CARBON','HOJA','','0','780'),
(1,'ASEO_PAPELERIA','PAPE131','PAPEL CONTAC BLANCO','ROLLO','','0','100.141'),
(1,'ASEO_PAPELERIA','PAPE132','PAPEL CONTAC AZUL','ROLLO','','0','100.141'),
(1,'ASEO_PAPELERIA','PAPE133','PAPEL CONTAC NEGRO','ROLLO','','0','100.141'),
(1,'ASEO_PAPELERIA','PAPE134','PAPEL CONTAC ROJO','ROLLO','','0','100.141'),
(1,'ASEO_PAPELERIA','PAPE135','PAPEL CONTAC TRANSPARENTE','ROLLO','','0','100.141'),
(1,'ASEO_PAPELERIA','PAPE136','PAPEL CONTAC VERDE','ROLLO','','0','100.141'),
(1,'ASEO_PAPELERIA','PAPE137','PAPEL CREPADO','PAQUETE X 5','','0','7.268'),
(1,'ASEO_PAPELERIA','PAPE138','PAPEL CRISTAFLEX','ROLLO','','0','20.768'),
(1,'ASEO_PAPELERIA','PAPE139','PAPEL KIMBERLY * 176 GR AMARILLO','HOJA','','0','1.617'),
(1,'ASEO_PAPELERIA','PAPE140','PAPEL KIMBERLY * 90 GR AMARILLO','RESMA','','0','352.746'),
(1,'ASEO_PAPELERIA','PAPE141','PAPEL KRAFF ROLLO GRANDE','ROLLO','','0','89.349'),
(1,'ASEO_PAPELERIA','PAPE142','PAPEL REGALO','PLIEGO','','0','1.870'),
(1,'ASEO_PAPELERIA','PAPE143','PAPEL TAMAÑO CARTA BOND DE 500 HOJAS 75 GR BLANCO','RESMA','','0','33.212'),
(1,'ASEO_PAPELERIA','PAPE144','PAPEL TAMAÑO OFICIO BOND DE 500 HOJAS 75 GR BLANCO','RESMA','','0','39.807'),
(1,'ASEO_PAPELERIA','PAPE145','PAPEL TÉRMICO DE 57 MM X 36','ROLLO','','0','4.868'),
(1,'ASEO_PAPELERIA','PAPE146','PAPELILLO COLORES SURTIDOS CLAROS','PLIEGO','','0','311'),
(1,'ASEO_PAPELERIA','PAPE148','PEGA STICK X 46 G','UNIDAD','','0','15.696'),
(1,'ASEO_PAPELERIA','PAPE149','PERFORADORA 2 HUECOS SEMI- INDUSTRIAL PARA 70 HOJAS','UNIDAD','','0','117.982'),
(1,'ASEO_PAPELERIA','PAPE150','PERFORADORA GRANDE 50 H','UNIDAD','','0','96.892'),
(1,'ASEO_PAPELERIA','PAPE151','PERFORADORA PEQUEÑA','UNIDAD','','0','23.417'),
(1,'ASEO_PAPELERIA','PAPE152','PESAS DE PIE PERSONALES','UNIDAD','','0','127.741'),
(1,'ASEO_PAPELERIA','PAPE153','PILA 9 V ALKALINA','PAR','','0','30.946'),
(1,'ASEO_PAPELERIA','PAPE154','PILA CUADRADA DE 9 VOLTIOS  CARBON','PAR','','0','18.285'),
(1,'ASEO_PAPELERIA','PAPE155','PILA DE 9 VOLTIOS CUADRADA RECARGABLE','UNIDAD','','0','49.207'),
(1,'ASEO_PAPELERIA','PAPE156','PILA DE LITIO 3 VOLTIOS','UNIDAD','','0','21.786'),
(1,'ASEO_PAPELERIA','PAPE157','PILA GRANDE  C2 CARBON','PAR','','0','12.038'),
(1,'ASEO_PAPELERIA','PAPE158','PILA MEDIANA CORRIENTE','PAR','','0','10.168'),
(1,'ASEO_PAPELERIA','PAPE159','PILA PARA GLUCÓMETRO','UNIDAD','','0','7.265'),
(1,'ASEO_PAPELERIA','PAPE160','PILA PARA GLUCOMETRO MAXIGIR CR 2023 H','PAR','','0','7.265'),
(1,'ASEO_PAPELERIA','PAPE161','PILA SONY LR41+HG','UNIDAD','','0','9.963'),
(1,'ASEO_PAPELERIA','PAPE162','PILAS  TRIPLE AAA ALCALINA','PAR','','0','7.374'),
(1,'ASEO_PAPELERIA','PAPE163','PILAS AA ALCALINA','PAR','','0','7.374'),
(1,'ASEO_PAPELERIA','PAPE164','PINCELES GRANDES','UNIDAD','','0','3.238'),
(1,'ASEO_PAPELERIA','PAPE167','PORTAMINAS 0.7 CON REPUESTO','UNIDAD','','0','4.916'),
(1,'ASEO_PAPELERIA','PAPE168','POST NOTAS PAQUETE','PAQUETE','','0','13.920'),
(1,'ASEO_PAPELERIA','PAPE173','REGLA DE 30 CM','UNIDAD','','0','4.112'),
(1,'ASEO_PAPELERIA','PAPE174','RESALTADOR COLORES VARIADOS','UNIDAD','','0','3.044'),
(1,'ASEO_PAPELERIA','PAPE175','ROTULADORES','UNIDAD','','0','300'),
(1,'ASEO_PAPELERIA','PAPE176','SACAGANCHOS','UNIDAD','','0','3.501'),
(1,'ASEO_PAPELERIA','PAPE177','SACAPUNTAS METÁLICO','UNIDAD','','0','815'),
(1,'ASEO_PAPELERIA','PAPE179','SEPARADOR PLASTICO PAQUETE X 5','PAQUETE','','0','5.517'),
(1,'ASEO_PAPELERIA','PAPE180','SILICONA LIQUIDA X 500  ML','UNIDAD','','0','22.938'),
(1,'ASEO_PAPELERIA','PAPE181','SILICONA LIQUIDA X 60 ML','UNIDAD','','0','6.019'),
(1,'ASEO_PAPELERIA','PAPE186','SOBRE DE MANILA CARTA','UNIDAD','','0','515'),
(1,'ASEO_PAPELERIA','PAPE187','SOBRE DE MANILA OFICIO 25X35','UNIDAD','','0','743'),
(1,'ASEO_PAPELERIA','PAPE188','SOBRE DE MANILA RADIOGRAFÍA','UNIDAD','','0','1.103'),
(1,'ASEO_PAPELERIA','PAPE191','TABLAS DE APOYO','UNIDAD','','0','13.189'),
(1,'ASEO_PAPELERIA','PAPE192','TABLERO EN ACRÍLICO 1.50 X 1.10','UNIDAD','','0','297.832'),
(1,'ASEO_PAPELERIA','PAPE197','TEMPERA (AMARILLO - AZUL - ROJO - NEGRO - BLANCO','TARRO','','0','3.909'),
(1,'ASEO_PAPELERIA','PAPE198','TIJERA  METALICA','UNIDAD','','0','15.647'),
(1,'ASEO_PAPELERIA','PAPE199','TIJERAS  OFICINA','UNIDAD','','0','9.160'),
(1,'ASEO_PAPELERIA','PAPE200','TIJERAS PARA CORTAR PAPEL PUNTA ROMA','UNIDAD','','0','4.328'),
(1,'ASEO_PAPELERIA','PAPE202','TINTAS COLOR AMARILLO - ROJO - AZUL*120 ML UNO DE CADA UNO PARA PARA IMPRESORA EPSON GENÉRICA','FRASCO','','0','0'),
(1,'ASEO_PAPELERIA','PAPE204','TINTA NEGRA PARA IMPRESORA EPSON L355*120 ML GENÉRICA','FRASCO','','0','30.491'),
(1,'ASEO_PAPELERIA','PAPE205','TINTA PARA IMPRESORA EPSON *LITRO COLOR AMARILLO - ROJO - AZUL UNO DE CADA UNO PARA RECARGA','UNIDAD','','0','88.054'),
(1,'ASEO_PAPELERIA','PAPE206','TINTA PARA IMPRESORA EPSON *LITRO COLOR NEGRO PARA RECARGA','UNIDAD','','0','88.054'),
(1,'ASEO_PAPELERIA','PAPE207','TINTA PARA IMPRESORA EPSON L355- COLORES CIAN AMARILLO - NEGRO - MAGENTA GENÉRICO','KIT','','0','121.926'),
(1,'ASEO_PAPELERIA','PAPE208','TINTA PARA IMPRESORA EPSON L355- COLORES CIAN AMARILLO - NEGRO - MAGENTA ORIGINAL','KIT','','0','121.926'),
(1,'ASEO_PAPELERIA','PAPE209','TINTA PARA SELLOS NEGRA','FRASCO','','0','8.860'),
(1,'ASEO_PAPELERIA','PAPE230','VINILOS - DIFERENTES COLOR GRANDE 160GM','TARRO','','0','6.282'),
(1,'ASEO_PAPELERIA','PAPE231','VINILOS - DIFERENTES COLOR KILO 1000 GM','TARRO','','0','27.902'),
(1,'ASEO_PAPELERIA','PAPE232','VINILOS INDUGUIN   X 20 CM CAJA POR 5','CAJA','','0','15.647'),
(1,'ASEO_PAPELERIA','PAPE236','BOMBAS R12  PAQUETE POR 50','PAQ *50','','0','29.783'),
(1,'ASEO_PAPELERIA','PAPE237','PAPEL KRAF PLIEGO','PLIEGO','','0','887'),
(1,'ASEO_PAPELERIA','PAPE238','PAPEL ADHESIVO CARTAPTE','PTE *10 UNI','','0','12.133'),
(1,'ASEO_PAPELERIA','PAPE244','CARPETAS DE 4 ALAS','UNIDAD','','0','6.581'),
(1,'ASEO_PAPELERIA','PAPE245','TINTA ORIGINAL NEGRA IMPRESORA L3110','UNIDAD','','0','91.844'),
(1,'ASEO_PAPELERIA','PAPE249','CERA DACTILAR','UNIDAD','','0','7.506'),
(1,'ASEO_PAPELERIA','PAPE256','"ESCUADRA 45"""','UNIDAD','','0','8.273'),
(1,'ASEO_PAPELERIA','PAPE257','CARPETA CON REFUERZO DOS TAPAS PARA ARCHIVO SIN LOGO','UNIDAD','','0','3.597'),
(1,'ASEO_PAPELERIA','PAPE258','SEPARADORES PLASTICOS ADHESIVOS (BANDERITAS)','PAQUETE','','0','5.876'),
(1,'ASEO_PAPELERIA','PAPE259','BOMBILLO AHORRADOR 30W LED 45W 25000 HORAS','UNIDAD','','0','45.658'),
(1,'ASEO_PAPELERIA','PAPE260','CINTA ADHESIVA PARA DEMARCACIÓN ROJA','UNIDAD','','0','14.387'),
(1,'ASEO_PAPELERIA','PAPE261','CINTA TRANSPARENTE ANCHA 300 MTS *45 MICRAS','UNIDAD','','0','51.579'),
(1,'ASEO_PAPELERIA','PAPE262','COSEDORA AH ROYAL 962 30 HOJAS','UNIDAD','','0','39.951'),
(1,'ASEO_PAPELERIA','PAPE263','COSEDORA TRITON 2615 20 HOJAS','UNIDAD','','0','21.402'),
(1,'ASEO_PAPELERIA','PAPE264','COSEDORA DE 140 HOJAS MARCA KANGARO','UNIDAD','','0','453.985'),
(1,'ASEO_PAPELERIA','PAPE265','COSEDORA DE 100 HOJAS MARCA STUDMARK','UNIDAD','','0','194.565'),
(1,'ASEO_PAPELERIA','PAPE266','COSEDORA DE 200 HOJAS MARCA STUDMARK','UNIDAD','','0','298.333'),
(1,'ASEO_PAPELERIA','PAPE292','DISPENSADOR CINTA ANCHA ','UNIDAD','','0','101.946'),
(1,'ASEO_PAPELERIA','PAPE293','PERFORADORA DE 3 HUECOS','UNIDAD','','0','55.646'),
(1,'ASEO_PAPELERIA','PAPE269','PERFORADORA TRITON 40 HOJAS','UNIDAD','','0','71.341'),
(1,'ASEO_PAPELERIA','PAPE270','PILA ALCALINA REF A23','UNIDAD','','0','14.268'),
(1,'ASEO_PAPELERIA','PAPE271','PILAS ALCALINA AA ENERGIZER','PAR','','0','15.565'),
(1,'ASEO_PAPELERIA','PAPE273','TIMBRE INALAMBRICO DE 32 SONIDOS ','UNIDAD','','0','88.462'),
(1,'ASEO_PAPELERIA','PAPE274','TINTA PARA IMPRESORA EPSON ”LITRO COLOR AZUL PARA RECARGA','UNIDAD','','0','88.054'),
(1,'ASEO_PAPELERIA','PAPE275','TINTA PARA IMPRESORA EPSON ”LITRO COLOR ROJO PARA RECARGA','UNIDAD','','0','88.054'),
(1,'ASEO_PAPELERIA','PAPE276','TINTA PARA IMPRESORA EPSON L355- COLORES CIAN  GENÉRICO','KIT','','0','121.926'),
(1,'ASEO_PAPELERIA','PAPE277','TINTA PARA IMPRESORA EPSON L355- COLORES MAGENTA GENÉRICO','KIT','','0','121.926'),
(1,'ASEO_PAPELERIA','PAPE278','TINTA PARA IMPRESORA EPSON L35S- COLORES CIAN ORIGINAL','KIT','','0','203.231'),
(1,'ASEO_PAPELERIA','PAPE279','TINTA PARA IMPRESORA EPSON L35S- COLORES NEGRO - ORIGINAL','KIT','','','203231'),
(1,'ASEO_PAPELERIA','PAPE280','TINTA PARA IMPRESORA EPSON L35S- COLORES - MAGENTA ORIGINAL','KIT','','','203231'),
(1,'ASEO_PAPELERIA','PAPE281','TINTAS COLOR AMARILLO *70 ML PARA PARA IMPRESORA EPSON GENËRICA','FRASCO','','','30491'),
(1,'ASEO_PAPELERIA','PAPE282','TINTAS COLOR AZUL*70 ML PARA PARA IMPRESORA EPSON GENËRICA','FRASCO','','','30491'),
(1,'ASEO_PAPELERIA','PAPE283','TINTAS COLOR ROJO *70 ML PARA PARA IMPRESORA EPSON GENËRICA','FRASCO','','','30491'),
(1,'ASEO_PAPELERIA','PAPE284','"PAPEL KRAFT 24"" 13*61"','UNIDAD *5KILOS','','','116739'),
(1,'ASEO_PAPELERIA','PAPE285','CARGADOR PARA PILAS 9 VOLTIOS AA','UNIDAD','','','110254'),
(1,'ASEO_PAPELERIA','PAPE286','CARGADOR PARA PILAS 9 VOLTIOS AAA','UNIDAD','','','110254'),
(1,'ASEO_PAPELERIA','PAPE287','TINTA PARA CANON C3160 NEGRA GENERICA','UNIDAD','','','155652'),
(1,'ASEO_PAPELERIA','PAPE288','TINTA PARA CANON C3160 AMARILLO GENERICA','UNIDAD','','','121926'),
(1,'ASEO_PAPELERIA','PAPE289','TINTA PARA CANON C3160 MAGENTA GENERICA','UNIDAD','','','121926'),
(1,'ASEO_PAPELERIA','PAPE290','TINTA PARA CANON C3160 AZUL GENERICA','UNIDAD','','','121926'),
(1,'ASEO_PAPELERIA','ASEO001','ACEITE MINERAL','','LITRO','13.997','16.656'),
(1,'ASEO_PAPELERIA','ASEO002','ACIDO MURIATICO DESMANCHADOR ','','GALON ','24.321','28.942'),
(1,'ASEO_PAPELERIA','ASEO003','AJAX EN POLVO 1 A *500 GR ','','TARRO ','7.139','8.495'),
(1,'ASEO_PAPELERIA','ASEO004','AMBIENTADOR AEROSOL X360ml ','HOSH','TARRO ','10.904','12.976'),
(1,'ASEO_PAPELERIA','ASEO005','AMBIENTADOR PARA PISO ','YILOP','GALON ','37.360','44.458'),
(1,'ASEO_PAPELERIA','ASEO006','AROMATICAS ','','CAJA ','5.706','6.790'),
(1,'ASEO_PAPELERIA','ASEO007','AXION CREMA X 235 G','AXION','TARRO ','9.024','10.739'),
(1,'ASEO_PAPELERIA','ASEO008','AXION CREMA X 500 G ','AXION','TARRO ','17.154','20.413'),
(1,'ASEO_PAPELERIA','ASEO009','AZUCAR EN SOBRE - BOLSA x 200 ','Manuelita','PAQUETE','12.066','14.359'),
(1,'ASEO_PAPELERIA','ASEO010','BENZALDINA ','','GALON ','113.150','113.150'),
(1,'ASEO_PAPELERIA','ASEO011','BOLSA ROJA PEQUEÑA 45 X 60 ','','PAQUETE X 50 ','22.569','26.857'),
(1,'ASEO_PAPELERIA','ASEO012','PASTILLAS DEHIPOCLORITO','','LIBRA','17.595','20.938'),
(1,'ASEO_PAPELERIA','ASEO013','BOLSA BLANCA GRANDE 90 X 110 ','','PAQUETE X 10 ','16.605','19.760'),
(1,'ASEO_PAPELERIA','ASEO014','BOLSA BLANCA MEDIANA 65 X 90 ','','PAQUETE X 50 ','22.569','26.857'),
(1,'ASEO_PAPELERIA','ASEO015','TRAPERO INDUSTRIAL - PALO METALICO','','UNIDAD','142.958','170.120'),
(1,'ASEO_PAPELERIA','ASEO016','ASERRIN POR ABSORCION DE DERRAME DE FLUIDOS','','LIBRA','1.499','1.784'),
(1,'ASEO_PAPELERIA','ASEO017','BOLSA NEGRA GRANDE 90 X 110','','PAQUETE X 10 ','16.605','19.760'),
(1,'ASEO_PAPELERIA','ASEO018','BOLSA ROJA GRANDE 90 X 110 ','','PAQUETE X 10 ','16.605','19.760'),
(1,'ASEO_PAPELERIA','ASEO019','BOLSA ROJA MEDIANA 65 X 90 ','','PAQUETE X 50 ','22.569','26.857'),
(1,'ASEO_PAPELERIA','ASEO020','CANECA PLÁSTICA VERDE DE 5 LTS ','','UNIDAD','20.994','24.983'),
(1,'ASEO_PAPELERIA','ASEO021','BOLSA VERDE  GRANDE 90 X 110 ','','PAQUETE X 10 ','16.605','19.760'),
(1,'ASEO_PAPELERIA','ASEO022','BOLSA NEGRA PEQUEÑA 45 X 60 ','','PAQUETE X 50 ','22.569','26.857'),
(1,'ASEO_PAPELERIA','ASEO023','BOLSA VERDE MEDIANA 65 X 90 ','','PAQUETE X 50 ','22.569','26.857'),
(1,'ASEO_PAPELERIA','ASEO024','BOLSA VERDE PEQUEÑA 45 X 60 ','','PAQUETE X 50 ','22.569','26.857'),
(1,'ASEO_PAPELERIA','ASEO025','BOMBA PARA DESTAPAR BAÑOS ','','UNIDAD ','10.109','12.030'),
(1,'ASEO_PAPELERIA','ASEO026','BOTAS DE CAUCHO BLANCAS  SENCILLAS','','PAR ','70.298','83.655'),
(1,'ASEO_PAPELERIA','ASEO027','CAFÉ ','LUKAFE','*400 GRAMOS','24.642','29.324'),
(1,'ASEO_PAPELERIA','ASEO028','CEPILLO PARA INSTRUMENTAL ','','UNIDAD ','4.743','5.644'),
(1,'ASEO_PAPELERIA','ASEO029','CEPILLO PLASTICO LAVAR BAÑOS ','','UNIDAD ','13.039','15.516'),
(1,'ASEO_PAPELERIA','ASEO030','CEPILLO PLASTICO LAVAR ROPA ','','UNIDAD ','13.039','15.516'),
(1,'ASEO_PAPELERIA','ASEO031','CEPILLO PLASTICO PISOS CON PALO ','','UNIDAD ','6.344','7.549'),
(1,'ASEO_PAPELERIA','ASEO032','CHURRUSCO DE BAÑO - PALO PLASTICO','','UNIDAD ','15.212','18.102'),
(1,'ASEO_PAPELERIA','ASEO033','CILICAGEL X KILO ','','BOLSA ','87.424','104.035'),
(1,'ASEO_PAPELERIA','ASE0034','CERA PLASTICA ','YILOP','GALON ','54.984','65.431'),
(1,'ASEO_PAPELERIA','ASEO035','PAPEL CRISTAFLEX ','','ROLLO ','16.481','19.612'),
(1,'ASEO_PAPELERIA','ASEO036','DELANTAN BLANCO IMPERMEABLE REFORZADO ','','UNIDAD ','40.441','48.125'),
(1,'ASEO_PAPELERIA','ASEO037','DETERGENTE EN POLVO (FAB O ARIEL) ','(FAB) ','BOLSA*700GR','12.817','15.252'),
(1,'ASEO_PAPELERIA','ASEO038','DISPENSADOR DE TOALLAS EN PAPEL EN Z','','UNIDAD','59.982','71.379'),
(1,'ASEO_PAPELERIA','ASEO039','ENVASE PLASTICO CON VALVULA X 500CC ','','UNIDAD','6.048','7.197'),
(1,'ASEO_PAPELERIA','ASEO040','ESCOBAS ','','UNIDAD','10.444','12.428'),
(1,'ASEO_PAPELERIA','ASEO041','ESPONJA DE ALAMBRE ','','UNIDAD','886','1.054'),
(1,'ASEO_PAPELERIA','ASEO042','ESPONJA DE BRILLO BON BRIL','BON BRIL','PQTE X 12','9.597','11.420'),
(1,'ASEO_PAPELERIA','ASEO043','ESPONJILLA SABRA ','','UNIDAD','905','1.077'),
(1,'ASEO_PAPELERIA','ASEO044','FORMOL X 500ML ','','FRASCO ','10.865','12.929'),
(1,'ASEO_PAPELERIA','ASEO045','GALONES PLASTICOS','','UNIDAD','9.997','11.896'),
(1,'ASEO_PAPELERIA','ASEO046','GANCHOS PARA ESCOBAS Y TRAPEROS','','UNIDAD','1.999','2.379'),
(1,'ASEO_PAPELERIA','ASEO047','GUANTES DE CAUCHO EXTRA LARGO (3/4 DE BRAZO) ','','PAR ','60.664','72.190'),
(1,'ASEO_PAPELERIA','ASEO048','GUANTES NEGRO TALLA 7 - 7.5 - 8 - 8.5 - 9 ','','PAR ','8.883','10.571'),
(1,'ASEO_PAPELERIA','ASEO049','GUANTES PARA ASEO ROJO TALLAS 7 - 7.5 - 8 - 8.5 - 9 (MANGA LARGA) ','','PAR ','8.883','10.571'),
(1,'ASEO_PAPELERIA','ASEO050','ESCOBAS INDUSTRIAL ','','UNIDAD','39.988','47.586'),
(1,'ASEO_PAPELERIA','ASEO051','TARRO ROJO CON TAPA Y PEDAL DE 20 LITROS ','',' UNIDAD ','63.389','75.433'),
(1,'ASEO_PAPELERIA','ASEO052','TARRO BLANCA CON TAPA Y PEDAL DE 20 LITROS ','','UNIDAD','63.390','75.434'),
(1,'ASEO_PAPELERIA','ASEO053','TARRO NEGRA CON TAPA Y PEDAL DE 20 LITROS ','','UNIDAD','63.389','75.433'),
(1,'ASEO_PAPELERIA','ASEO054','JABON BARRA  450 GR ','SUPER RIEL','UNIDAD','4.122','4.905'),
(1,'ASEO_PAPELERIA','ASEO055','JABON LIQUIDO PARA MANOS ANTIBACTERIAL ','YILOP','GALON ','31.713','37.738'),
(1,'ASEO_PAPELERIA','ASEO056','JARRA MEDIDORA PROBETAS PLASTICA ESCALA DE 50 ML * 1000ML ','','UNIDAD ','15.212','18.102'),
(1,'ASEO_PAPELERIA','ASEO057','REPUESTO DE TRAPERO INDUSTRIAL','','UNIDAD','37.735','44.905'),
(1,'ASEO_PAPELERIA','ASEO058','KIT DE LIMPIEZA PARA MONITORES (SCREEN CLEANER)','','KIT','22.994','27.363'),
(1,'ASEO_PAPELERIA','ASEO059','KIT LIMPIEZA DERRAMES DE FLUIDOS ','','UNIDAD','73.561','87.538'),
(1,'ASEO_PAPELERIA','ASEO060','LIMPIA TELARAÑAS ','','UNIDAD','12.678','15.087'),
(1,'ASEO_PAPELERIA','ASEO061','LIMPIA VIDRIOS X 500 ML ','YILOP','FRASCO ','11.085','13.191'),
(1,'ASEO_PAPELERIA','ASEO062','LIMPIDO PATOJITO X 3950 CC ','PATOJITO','GALON ','13.206','15.715'),
(1,'ASEO_PAPELERIA','ASEO063','LIMPIONES EN TELA ','','UNIDAD','5.499','6.544'),
(1,'ASEO_PAPELERIA','ASEO064','"LONCHERA  PLÁSTICAS DE 30"" PULGADAS/CAJA DE HERRAMIENTA DE 24"""','','UNIDAD','139.959','166.551'),
(1,'ASEO_PAPELERIA','ASEO065','MANGUERA EXTRA LARGA (30 MTS)','','ROLLO','81.977','97.553'),
(1,'ASEO_PAPELERIA','ASEO066','SOPORTES PARA ESCOBAS Y TRAPEADORES','','UNIDAD','28.041','33.369'),
(1,'ASEO_PAPELERIA','ASEO067','MATA CUCARACHAS ','RAID','FRASCO *1000ML ','16.496','19.630'),
(1,'ASEO_PAPELERIA','ASEO068','CANECA PLÁSTICA NEGRA DE 12 LTS CON PEDAL','','UNIDAD','52.785','62.814'),
(1,'ASEO_PAPELERIA','ASEO069','ORGANIZADOR PLASTICO ','','UNIDAD','331.002','393.892'),
(1,'ASEO_PAPELERIA','ASEO070','PALILLO HAMBURGUESA ','','CAJA ','1.902','2.263'),
(1,'ASEO_PAPELERIA','ASEO071','PALILLO MEZCLADORES','','PAQUETE','3.499','4.164'),
(1,'ASEO_PAPELERIA','ASEO072','PAPEL HIGIENICO (TRIPLE HOJA) ','RENDY','PAQUETE X 12 ','24.667','29.354'),
(1,'ASEO_PAPELERIA','ASEO073','PEROXIDO DE HIDROGENO','','GALON ','69.979','83.275'),
(1,'ASEO_PAPELERIA','ASEO074','PETO ANTIFLUIDO PARA MANEJO DE RESIDUOS','','UNIDAD','34.989','41.637'),
(1,'ASEO_PAPELERIA','ASEO075','BACTERIAS PARA TRATAMIENTO DE AGUAS RESIDUALES','','GALON ','63.982','76.139'),
(1,'ASEO_PAPELERIA','ASEO076','POMAS PLASTICAS ','','UNIDAD','10.600','12.614'),
(1,'ASEO_PAPELERIA','ASEO077','CANECA PLASTICA DE 60 LTS CON TAPA Y ARO','','UNIDAD','274.919','327.154'),
(1,'ASEO_PAPELERIA','ASEO078','PUNTO ECOLOGICO','','KIT','346.899','412.810'),
(1,'ASEO_PAPELERIA','ASEO079','QUITA GRASA-MULTIUSOS X 500 ML ','TANTE','SPRAY ','12.171','14.483'),
(1,'ASEO_PAPELERIA','ASEO080','RECIPIENTE DE VIDRIO AMBAR X 250 ML ','','UNIDAD','3.432','4.084'),
(1,'ASEO_PAPELERIA','ASEO081','RECOGEDOR DE BASURA CON PALO PLASTICO','','UNIDAD','6.972','8.297'),
(1,'ASEO_PAPELERIA','ASEO082','SERVILLETA PARA MESA ','FAMILIA','PAQUETE ','3.681','4.380'),
(1,'ASEO_PAPELERIA','ASEO083','SILICONA PARA SUPERFICIES x 500 ','YILOP','UNIDAD','24.993','29.742'),
(1,'ASEO_PAPELERIA','ASEO084','SOPORTES DE GUARDIAN ','','UNIDAD','41.835','49.784'),
(1,'ASEO_PAPELERIA','ASEO085','CANECA PLÁSTICA BLANCA DE 120 LTS CON RODACHINES','','UNIDAD','423.376','503.817'),
(1,'ASEO_PAPELERIA','ASEO086','TARRO BLANCO CON TAPA Y PEDAL DE 12 LITROS ','','UNIDAD','52.785','62.814'),
(1,'ASEO_PAPELERIA','ASEO087','CANECA PLÁSTICA NEGRA DE 120 LTS CON RODACHINES','','UNIDAD','423.376','503.817'),
(1,'ASEO_PAPELERIA','ASEO088','CANECA PLÁSTICA ROJA DE 120 LTS CON RODACHINES','','UNIDAD','423.376','503.817'),
(1,'ASEO_PAPELERIA','ASEO089','TARRO ROJO CON TAPA Y PEDAL DE 12 LITROS ','','UNIDAD','52.785','62.814'),
(1,'ASEO_PAPELERIA','ASEO090','CANECA PLÁSTICA BLANCA DE 189 LTS CON RODACHINES','','UNIDAD','1.319.612','1.570.338'),
(1,'ASEO_PAPELERIA','ASEO091','CANECA PLÁSTICA VERDE DE 120 LTS CON RODACHINES','','UNIDAD','423.376','503.817'),
(1,'ASEO_PAPELERIA','ASEO092','TARRO VERDE CON TAPA Y PEDAL DE 12 LITROS ','','UNIDAD','52.785','62.814'),
(1,'ASEO_PAPELERIA','ASEO093','TARRO VERDE CON TAPA Y PEDAL DE 20 LITROS ','','UNIDAD','63.389','75.433'),
(1,'ASEO_PAPELERIA','ASEO094','TIMBO PLASTICO','','UNIDAD','13.896','16.536'),
(1,'ASEO_PAPELERIA','ASEO095','TOALLA COCINA PTE X 3 UNIDADES ','','UNIDAD','12.755','15.178'),
(1,'ASEO_PAPELERIA','ASEO096','TOALLA DE HILO PARA MANOS ','','UNIDAD','10.775','12.822'),
(1,'ASEO_PAPELERIA','ASEO097','PAPEL HIGIENICO DOBLE HOJA JUMBO ','NUBE','PAQUETE X 4','67.980','80.896'),
(1,'ASEO_PAPELERIA','ASEO098','TRAPEADORES CON PALO COLOR   (BLANCOS) ','','UNIDAD','19.468','23.167'),
(1,'ASEO_PAPELERIA','ASEO099','ALCOHOL ISOPROPILICO ','','LITRO','34.489','41.042'),
(1,'ASEO_PAPELERIA','ASEO100','VALDE MEDIANO ','','UNIDAD','20.920','24.895'),
(1,'ASEO_PAPELERIA','ASEO101','VASO DESECHABLE ','','DOCENA ','5.706','6.790'),
(1,'ASEO_PAPELERIA','ASEO102','ATOMIZADOR DE 200CC ','','TARRO ','5.499','6.544'),
(1,'ASEO_PAPELERIA','ASEO103','BOLSA BLANCA PEQUEÑA 45 X 60 ','','PAQUETE X 50 ','22.569','26.857'),
(1,'ASEO_PAPELERIA','ASEO104','BOLSA NEGRA MEDIANA 65 X 90 ','','PAQUETE X 50 ','22.569','26.857'),
(1,'ASEO_PAPELERIA','ASEO105','BOLSA VERDE PEQUEÑA 45 X 60','','PAQUETE X 50','22.569','26.857'),
(1,'ASEO_PAPELERIA','ASEO106','CAJA PLÁSTICA CON TAPA GRANDE (55LT) ','','UNIDAD ','116.016','138.059'),
(1,'ASEO_PAPELERIA','ASEO107','CAJAS PLÁSTICAS CON TAPA MEDIANA','','UNIDAD ','44.987','53.535'),
(1,'ASEO_PAPELERIA','ASEO108','ESTIBA PLÁSTICA 110 * 110 CM ','','UNIDAD ','329.903','392.585'),
(1,'ASEO_PAPELERIA','ASEO109','TRAPEADOR DE MICROFIBRA CON PALO PLASTICO ','','UNIDAD ','35.000','41.650'),
(1,'ASEO_PAPELERIA','ASEO110','PAÑO REUTILIZABLE ','','PAQUETE ','33151','39450'),
(1,'ASEO_PAPELERIA','ASEO111','CANECA PLÁSTICA NEGRA DE 189 LTS CON RODACHINES','','UNIDAD','1.319.612','1.570.338'),
(1,'ASEO_PAPELERIA','ASEO112','CANECA PLÁSTICA ROJA DE 189 LTS CON RODACHINES','','UNIDAD','1.319.612','1.570.338'),
(1,'ASEO_PAPELERIA','ASEO113','CANECA PLÁSTICA VERDE DE 189 LTS CON RODACHINES','','UNIDAD','1.319.612','1.570.338'),
(1,'ASEO_PAPELERIA','ASEO114','CANECA PLÁSTICA BLANCA DE 5 LTS ','','UNIDAD','20.994','24.983'),
(1,'ASEO_PAPELERIA','ASEO115','CANECA PLÁSTICA NEGRA DE 5 LTS ','','UNIDAD','20.994','24.983'),
(1,'ASEO_PAPELERIA','ASEO116','CANECA PLÁSTICA ROJA DE 5 LTS ','','UNIDAD','20.994','24.983'),
(1,'ASEO_PAPELERIA','ASEO119','BOLSAS DE PAPEL TAMAÑO LIBRA (color  blanco)','','PAQUETE X 100','3.106','3.696'),
(1,'ASEO_PAPELERIA','ASEO120','BOLSA DE PAPEL TAMAÑO 15.2 (color  blanco)','','PAQUETE X 100','3.106','3.696'),
(1,'ASEO_PAPELERIA','ASEO121','BOLSA DE PAPEL TAMAÑO 102 (color blanco)','','PAQUETE X 100','3.106','3.696'),
(1,'ASEO_PAPELERIA','ASEO122','BOLSA PLASTICA T-15','','PAQUETE X 100','3.499','4.164'),
(1,'ASEO_PAPELERIA','ASEO123','TOALLA EN Z ','NUBE','PAQUETE X 150 HOJAS','9.027','10.742'),
(1,'ASEO_PAPELERIA','ASEO124','AXION CREMA X 450 G ','AXION','TARRO ','17.154','20.413'),
(1,'ASEO_PAPELERIA','ASEO125','BOLSAS DE PAPEL TAMAÑO LIBRA (color  blanco)','','PAQUETE X 100','3.106','3.696'),
(1,'ASEO_PAPELERIA','ASEO126','BOTAS BLANCAS DE CAUCHO CON PUNTERA DE SEGURIDAD','','PAR ','136.500','162.435'),
(1,'ASEO_PAPELERIA','ASEO127','DELANTAL CALIBRE 25 REFORZADO BLANCO O AMARILLO','','UNIDAD','68.250','81.218'),
(1,'ASEO_PAPELERIA','ASEO128','MEZCLADOR BOLSA INDIVIDUAL MADERA','','*500 UNIDADE','9.240','10.996'),
(1,'ASEO_PAPELERIA','ASEO129','PAÑO ULTRAABSORVENTE BOMBRIL EMPAQUE INDIVIDUAL','','UNIDAD','6.825','8.122'),
(1,'ASEO_PAPELERIA','ASEO130','RATICIDA EN SOBRE CLERAT ','','SOBRE','12.600','14.994'),
(1,'ASEO_PAPELERIA','ASEO131','TOALLAS PARA MANOS TRIPLE HOJA ','','*150 UNIDADES','12.132','14.437'),
(1,'ASEO_PAPELERIA','ASEO132','LIMPIONES DE COCINA EN MICROFIBRA ','','UNIDAD','9.345','11.121'),
(1,'ASEO_PAPELERIA','ASEO133','JABON AXION LIQUIDO','AXION','750 ml','19.845','23.616'),
(1,'ASEO_PAPELERIA','ASEO134','BOLSA BLANCA 45 * 60 CON LOGO DE TIPOS DE RESIDUOS','','UNIDAD','609','725'),
(1,'ASEO_PAPELERIA','ASEO135','BOLSA BLANCA 65 * 90 CON LOGO DE TIPOS DE RESIDUOS','','UNIDAD','651','775'),
(1,'ASEO_PAPELERIA','ASEO136','BOLSA BLANCA 90 * 110 CON LOGO DE TIPOS DE RESIDUOS','','UNIDAD','1.890','2.249'),
(1,'ASEO_PAPELERIA','ASEO137','BOLSA ROJA 45 * 60 CON LOGO DE TIPOS DE RESIDUOS','','UNIDAD','609','725'),
(1,'ASEO_PAPELERIA','ASEO138','BOLSA ROJA 65 * 90 CON LOGO DE TIPOS DE RESIDUOS','','UNIDAD','651','775'),
(1,'ASEO_PAPELERIA','ASEO139','BOLSA ROJA 90 * 110 CON LOGO DE TIPOS DE RESIDUOS','','UNIDAD','1.890','2.249'),
(1,'ASEO_PAPELERIA','ASEO140','REPUESTO DE TRAPEADOR DE MICROFRIBRA','','UNIDAD','29.400','34.986'),
(1,'ASEO_PAPELERIA','ASEO141','ESCOBA CON PALO PLASTICO - CON CERDA GRUESA','','UNIDAD','29.400','34.986'),
(1,'ASEO_PAPELERIA','ASEO142','JABON ENZIMATICO EN GALON - BONZYME','BONZYME','GALON ','170.000','202.300'),
(1,'ASEO_PAPELERIA','ASEO143','CQABSORB ','','FRASCO 90 GRAMOS ','95.000','113.050'),
(1,'ASEO_PAPELERIA','ASEO144','KLENDINA DETERGENTE AUTOCLAVE ','','FRASCO X500ML','60.000','71.400'),
(1,'ASEO_PAPELERIA','ASEO145','JABON NEUTRO WES PARA DISPENSADOR','','X850','78.000','92.820'),
(1,'ASEO_PAPELERIA','ASEO146','CLORHEXIDINA SOLUCION WESCOHEX','WESCOHEX','X30ML','8.300','9.877'),
(1,'ASEO_PAPELERIA','ASEO147','CLORHEXIDINA SOLUCION WESCOHEX','WESCOHEX','X120','13.000','15.470'),
(1,'ASEO_PAPELERIA','ASEO148','CLORHEXIDINA SOLUCION WESCOHEX','WESCOHEX','500','52.000','61.880'),
(1,'ASEO_PAPELERIA','ASEO149','BONZIME DETERGENTE ','','X500','42.000','42.000'),
(1,'ASEO_PAPELERIA','ASEO150','BONZIME EN SPRAY','','X750','73.000','73.000'),
(1,'ASEO_PAPELERIA','ASEO151','DISPENSADOR JABON DE WES','WEST','UNIDAD','45.000','45.000'),
(1,'ASEO_PAPELERIA','ASEO152','PANEL LED 18W PLANO 20.5 X20.5','','UNIDAD','45.000','45.000'),
(1,'ASEO_PAPELERIA','ASEO153','DISPENSADOR GEL ','','UNIDAD','45.000','45.000'),
(1,'ASEO_PAPELERIA','ASEO154','ALKAZIME SPRAY X550 ML ','','FRASCO 550ML','140.000','166.600'),
(1,'ASEO_PAPELERIA','ASEO155','CEPILLO CON CERDAS DE ALAMBRE (INSTRUMENTAL)','','UNIDAD','12.000','14.280'),
(1,'ASEO_PAPELERIA','ASEO156','JABON DE PH NEUTRO LIQUIDO WEST','WEST','GALON ','210.000','249.900'),
(1,'ASEO_PAPELERIA','ASEO157','JABON GERMIDINA * 500 ML CON DISPENSADOR DE PATO','','500ML','50.000','59.500'),
(1,'ASEO_PAPELERIA','ASEO158','ACEITE MINERAL - DISANFER','','LITRO','89.000','105.910'),
(1,'ASEO_PAPELERIA','ASEO159','ACIDO MURIATICO TIPO DESMANCHADOR ','','GALON ','33.000','39.270'),
(1,'ASEO_PAPELERIA','ASEO160','ALKA DDS - ALKAMEDICA','','LITRO','290.000','345.100'),
(1,'ASEO_PAPELERIA','ASEO161','PASTILLAS DE CLORO AL 90% (Paq X 50 de 20g)','YILOP','PAQUETE X 50','17.595','20.938'),
(1,'ASEO_PAPELERIA','ASEO162','BOMBA DESTAPAR BAÑOS - DE PLASTICO task 16cm - Diametro 16cm','','UNIDAD ','24.000','28.560'),
(1,'ASEO_PAPELERIA','ASEO163','FORMOL AL 37% X 3.800ml ','','GALON ','85.000','101.150'),
(1,'ASEO_PAPELERIA','ASEO164','PILAS ALCALINA AA','ENERGIZER','PAR','12.000','14.280'),
(1,'ASEO_PAPELERIA','ASEO165','PILAS ALCALINA AAA ','ENERGIZER','PAR','12.000','14.280'),
(1,'ASEO_PAPELERIA','ASEO166','PILA DE 9 VOLTIOS CUADRADA RECARGABLE','','UNIDAD','37.936','45.144'),
(1,'ASEO_PAPELERIA','ASEO167','CARGADOR PARA PILAS 9 VOLTIOS AA','','UNIDAD','85.000','101.150'),
(1,'ASEO_PAPELERIA','ASEO168','CARGADOR PARA PILAS 9 VOLTIOS AAA','','UNIDAD','85.000','101.150'),
(1,'ASEO_PAPELERIA','ASEO169','PAPELERA 55 LITROS BLANCA PARA PUNTO ECOLOGICO','','55 LTS','120.000','142.800'),
(1,'ASEO_PAPELERIA','ASEO170','PAPELERA 55 LITROS ROJA PARA PUNTO ECOLOGICO','','55 LTS','120.000','142.800'),
(1,'ASEO_PAPELERIA','ASEO171','PAPELERA 55 LITROS NEGRA PARA PUNTO ECOLOGICO','','55 LTS','120.000','142.800'),
(1,'ASEO_PAPELERIA','ASEO172','SEÑALETICA PISO MOJADO','','UNIDAD','60.000','71.400'),
(1,'ODONTOLOGIA','ODON004','ACEITE SPRAY LUBRISPRAY 500CC','UNIDAD',' MAYOR DENT ','91.037','108.334'),
(1,'ODONTOLOGIA','ODON007','ACEITE SPRAY LUBRISPRAY 250CC','UNIDAD',' MAYOR DENT ','36.387','43.300'),
(1,'ODONTOLOGIA','ODON008','SINGLE BOND 3 GR (ADHESIVO)','UNIDAD',' 3M ','195.000','195.000'),
(1,'ODONTOLOGIA','ODON009','SINGLE BOND 6 GR (ADHESIVO)','UNIDAD',' 3M ','275.000','275.000'),
(1,'ODONTOLOGIA','ODON010','AGUA OXIGENADA 13.5 VOL FCOX120ML SOLUCION TOPICA','UNIDAD',' JGB ','3.780','3.780'),
(1,'ODONTOLOGIA','ODON011','AGUJA DENTAL 30G X 21(CORTA)','CJ100',' DENJECT ','30.252','36.000'),
(1,'ODONTOLOGIA','ODON013','AGUJA DENTAL 27 X 30 MM (LARGA)','CJ100',' DENJECT ','30.252','36.000'),
(1,'ODONTOLOGIA','ODON019','ALGODON ODONTOLOGICO','CJ1000',' HIGIETEX ','33.000','33.000'),
(1,'ODONTOLOGIA','ODON021','ALVOFAR PLUS CONTROL DE ALVEOLITIS X 10G','UNIDAD',' EUFAR ','70.700','70.700'),
(1,'ODONTOLOGIA','ODON022','AMALGAMA CAPSULA X 2 DOSIS','CJ50',' NEW STETIC ','213.400','213.400'),
(1,'ODONTOLOGIA','ODON023','AMALGAMA CAPSULA X 1 DOSIS','CJ50',' NEW STETIC ','156.820','156.820'),
(1,'ODONTOLOGIA','ODON031','APLICADOR DE ADHESIVO PAQ.X100[MICROBRUS','UNIDAD',' COTISEN ','12.605','15.000'),
(1,'ODONTOLOGIA','ODON033','BABERO DESECHABLE COLOR AZUL ROLLO x 80 (61x53cm)','UNIDAD',' EURORONDA ','68.908','82.000'),
(1,'ODONTOLOGIA','ODON034','BANDA PORTA MATRIZ 1/4 ROLLO ANCHA','UNIDAD',' FEN PRODUCTS ','18.739','22.300'),
(1,'ODONTOLOGIA','ODON035','BANDA PORTA MATRIZ 3/16 ROLLO DELGADA','UNIDAD',' FEN PRODUCTS ','18.739','22.300'),
(1,'ODONTOLOGIA','ODON037','BOLSA P/ESTERILIZAR 8.3X16CM','BO200',' SUPERDENT ','31.933','38.000'),
(1,'ODONTOLOGIA','ODON039','BOLSA P/ESTERILIZAR 5.7X13CM','BO200',' SUPERDENT ','16.664','19.830'),
(1,'ODONTOLOGIA','ODON040','BOLSA P/ESTERILIZAR MED 13.5X28','CJ200',' SUPERDENT ','55.832','66.440'),
(1,'ODONTOLOGIA','ODON042','CARETA DE PROTECCION + 10 RESPUESTO','UNIDAD',' ORBIDENTAL S.A.S. ','27.312','32.501'),
(1,'ODONTOLOGIA','ODON043','CEPILLO DENTAL PARA ADULTOS','UNIDAD',' PROQUIDENT ','1.849','2.200'),
(1,'ODONTOLOGIA','ODON044','CEPILLO DENTAL JUNIOR DE 7-12 ANOS','UNIDAD',' PROQUIDENT ','1.849','2.200'),
(1,'ODONTOLOGIA','ODON045','CEPILLO PARA LAVAR MANGO CORTO','UNIDAD',' NACIONAL  ','9.318','11.089'),
(1,'ODONTOLOGIA','ODON046','CEPILLO PARA LAVAR MANGO LARGO','UNIDAD',' NACIONAL ','9.916','11.800'),
(1,'ODONTOLOGIA','ODON048','CEPILLO PARA PULIDO ASTROBRUSH','UNIDAD',' JOTA ','38.655','46.000'),
(1,'ODONTOLOGIA','ODON047','CEPILLOS PARA PROFILAXIS','CJ100',' STARMED-INVERSIONES AMALGADENT ','54.902','65.333'),
(1,'ODONTOLOGIA','ODON049','CINTA AUTOCLAVE 18MM X 50M','UNIDAD',' INVERSIONES QUIRURGICOS S.A.S ','34.950','34.950'),
(1,'ODONTOLOGIA','ODON052','BARNIZ DE FLUOR DE SODIO 5% REF. 12246','CJ100',' 3M ','655.462','780.000'),
(1,'ODONTOLOGIA','ODON053','COLTOSOL RELLENO TEMP SIN EUGENOL FCOX38G','UNIDAD',' COLTENE ','105.000','105.000'),
(1,'ODONTOLOGIA','ODON062','CONO GUTAPERCHA 1RA SERIE 15-40 CJA X120','UNIDAD',' COLTENE ','51.000','51.000'),
(1,'ODONTOLOGIA','ODON054','CONO ACCESORIO FINE FINE','UNIDAD',' COLTENE ','51.000','51.000'),
(1,'ODONTOLOGIA','ODON055','CONO ACCESORIO EXTRA FINE # XF CJX100','UNIDAD',' COLTENE ','45.000','45.000'),
(1,'ODONTOLOGIA','ODON056','CONOS ACCESORIO  M DIUM FINE CJX100','UNIDAD',' COLTENE ','51.000','51.000'),
(1,'ODONTOLOGIA','ODON063','CONO GUTAPERCHA 2DA SERIE DE LA 45/80','CJ100',' COLTENE ','51.000','51.000'),
(1,'ODONTOLOGIA','ODON057','CONO GUTAPERCHA # 15  CAJA X 100','CJ 100',' COLTENE ','51.000','51.000'),
(1,'ODONTOLOGIA','ODON058','CONO GUTAPERCHA # 25 CAJA X 100','CJ 100',' COLTENE ','51.000','51.000'),
(1,'ODONTOLOGIA','ODON059','CONO GUTAPERCHA # 35','CJ100',' COLTENE ','51.000','51.000'),
(1,'ODONTOLOGIA','ODON060','CONOS GUTAPERCHA  N  60','CJ100',' COLTENE  ','51.000','51.000'),
(1,'ODONTOLOGIA','ODON061','CONOS GUTAPERCHA  N  70','CJ100',' COLTENE  ','43.000','43.000'),
(1,'ODONTOLOGIA','ODON064','COPA DE CAUCHO PARA PROFILAXIS','CJ100',' STARMED-INVERSIONES AMALGADENT ','67.227','80.000'),
(1,'ODONTOLOGIA','ODON065','CREMA DENTAL SONRIDENT 100ml  GRANERO','UNIDAD',' PROQUIDENT ','3.466','4.125'),
(1,'ODONTOLOGIA','ODON067','PAPEL CRISTAFLEX 200 MTS','UNIDAD',' NACIONAL ','21.849','26.000'),
(1,'ODONTOLOGIA','ODON066','PAPEL CRISTAFLEX 300 MT','UNIDAD',' NACIONAL ','31.933','38.000'),
(1,'ODONTOLOGIA','ODON071','CUNA DE MADERA PAQX50','UNIDAD',' SUPERDENT ','23.866','28.400'),
(1,'ODONTOLOGIA','ODON072','DENTOPRAXIL (DENTOFAR) LIQUIDO X 5 ML','UNIDAD',' EUFAR ','33.400','33.400'),
(1,'ODONTOLOGIA','ODON073','DESMINERALIZANTE JERINGA 5 ML','UNIDAD',' 3M ','68.670','68.670'),
(1,'ODONTOLOGIA','ODON074','DESMINERALIZANTE SUPER ETCH JERIGA X12GR','UNIDAD',' SDI ','54.500','54.500'),
(1,'ODONTOLOGIA','ODON076','DETARTROL REMOVEDOR DE CALCULO X 60 ML','UNIDAD',' LA TORRE ','42.333','42.333'),
(1,'ODONTOLOGIA','ODON077','DETERGENTE ENZIMATICO GALON','UNIDAD',' ORGANICA BIOTECH ','102.941','122.500'),
(1,'ODONTOLOGIA','ODON078','DISCO LIJA SOFLEX PULIR RESINAX120 2381L','UNIDAD',' 3M ','476.190','566.666'),
(1,'ODONTOLOGIA','ODON079','DYCAL KIT X 2 [BASE+CATALIZADOR](LINER)','UNIDAD',' COLTENE ','98.600','98.600'),
(1,'ODONTOLOGIA','ODON080','ENDO FROST SPRAY 200 ML','UNIDAD',' ROEKO ','87.395','104.000'),
(1,'ODONTOLOGIA','ODON082','FRESA DE CARBURO ZECRYA DE 23MM','unidad ',' DENTSPLY MAILLEFER ','30.252','36.000'),
(1,'ODONTOLOGIA','ODON209','POSICIONADOR ENDORAY','UNIDAD',' DENTSPLY ','180.672','215.000'),
(1,'ODONTOLOGIA','ODON084','ENJUAGUE BUCAL FRASCO X 1LT [ZERO]','UNIDAD',' PROQUIDENT ','33.193','39.500'),
(1,'ODONTOLOGIA','ODON085','ENJUAGUE BUCAL CLORHEXIDINA 180 ML','UNIDAD',' FARPAG ','44.286','52.700'),
(1,'ODONTOLOGIA','ODON086','ENJUAGUE BUCAL FRASCO X 200(ZERO)','UNIDAD',' PROQUIDENT ','14.005','16.666'),
(1,'ODONTOLOGIA','ODON088','ESPACIADORES DIGITALES AMARILLO 108122 BLISTER X4','UNIDAD',' DENTSPLY MAILLEFER ','79.832','95.000'),
(1,'ODONTOLOGIA','ODON089','ESPEJO PLANO NO 5','UNIDAD',' SUPERDENT ','3.782','4.500'),
(1,'ODONTOLOGIA','ODON090','EUCIDA DESINFECTANTE INSTRUMENTAL 240ML','UNIDAD',' EUFAR ','19.900','19.900'),
(1,'ODONTOLOGIA','ODON092','EUGENOL FRASCO X 15 ML GOTERO','UNIDAD',' PROQUIDENT ','20.000','20.000'),
(1,'ODONTOLOGIA','ODON093','EYECTORES DESECHABLES','PQTE *100',' NEW STETIC ','23.529','28.000'),
(1,'ODONTOLOGIA','ODON094','REVELADOR+FIJADOR KIT RAYO X DE ODONTOLOGIA 480 CC','UNIDAD',' JGB ','26.050','31.000'),
(1,'ODONTOLOGIA','ODON096','DURAPHAT C/GUIA + PUNTA FCO 10ML BARNIZ','UNIDAD',' COLGATE ','152.661','181.667'),
(1,'ODONTOLOGIA','ODON099','FRESA DIAMANTE DORADA 801-010ML','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON101','FRESA DIATECH CIL PLA REDO G835R-012-4-F','UNIDAD',' DIATECH ','17.227','20.500'),
(1,'ODONTOLOGIA','ODON102','FRESA DIATECH CIL PLA REDO G836R-014-6-F','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON103','FRESA DIATECH CONO IN 805-010-08 ML','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON104','FRESA DIATECH CONO IN 805-012-09 ML','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON105','FRESA DIATECH INTERPROX G859-014-10-XF','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON106','FRESA DIATECH INTERPROX ROJ G392-016-8-F','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON107','FRESA DIATECH INTERPROXI 859-10-10 XF','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON108','FRESA DIATECH INTERPROXIMAL  G392-314-021-10','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON109','FRESA DIATECH LLAMA 368-023-5 XF','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON110','FRESA DIATECH REDON G801-016-XF','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON111','FRESA DIATECH REDON AMARILLA G801-018-XF','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON112','FRESA DIATECH REDON AZUL G801-012-ML','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON113','FRESA DIATECH REDON AZUL G801-014-ML','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON114','FRESA DIATECH REDONDA  G801-314-009 ML','UNIDAD',' DIATECH ','19.118','22.751'),
(1,'ODONTOLOGIA','ODON140','FRESERO DE ALUMINIO AUTOCLAVABLE IMPORTADO','UNIDAD',' EURORONDA ','22.773','27.100'),
(1,'ODONTOLOGIA','ODON141','GAFA PARA FOTOCURADO','UNIDAD',' ENCO ','23.672','28.170'),
(1,'ODONTOLOGIA','ODON143','GANCHO PARA REVELADO SENCILLO','UNIDAD',' SUPERDENT ','7.328','8.720'),
(1,'ODONTOLOGIA','ODON145','GARHOX SUPERFICIES 500 ML','UNIDAD',' FARPAG ','28.000','28.000'),
(1,'ODONTOLOGIA','ODON147','GASA PRECORTADA PARA EXODONCIA X 200','UNIDAD',' PROTECTS CLINIC ','6.161','6.161'),
(1,'ODONTOLOGIA','ODON150','GEL ANTIBACTERIAL DE 500 ML','UNIDAD',' PROQUIDENT ','18.234','18.234'),
(1,'ODONTOLOGIA','ODON151','GELATAM FCOX20 UNDS REF 274002','UNIDAD',' ROEKO ','132.500','132.500'),
(1,'ODONTOLOGIA','ODON152','GELATAM X 50 UND TARRO REF 274007','UNIDAD',' ROEKO ','240.000','240.000'),
(1,'ODONTOLOGIA','ODON153','GLICERINA 1 KG','UNIDAD',' QUIMESCO ','30.092','35.810'),
(1,'ODONTOLOGIA','ODON157','GORRO  ORUGA DESECHABLE','PQTE *100',' EMA ','21.664','25.780'),
(1,'ODONTOLOGIA','ODON166','HEMOSTATICO DENTAL LIQUIDO FRASCO X 7ML','UNIDAD',' EUFAR ','20.000','20.000'),
(1,'ODONTOLOGIA','ODON168','HIDROXIDO DE CALCIO USP POLVO X 7G','UNIDAD',' PROQUIDENT ','8.667','8.667'),
(1,'ODONTOLOGIA','ODON087','HIPOCLORITO DE SODIO 5%X120 ML ZONIDENT','UNIDAD',' PROQUIDENT ','7.280','7.280'),
(1,'ODONTOLOGIA','ODON172','INSERTO PARA CAVITRON 25K','UNIDAD',' DENTSPLY ','554.829','660.246'),
(1,'ODONTOLOGIA','ODON174','IONOSIT - BASELINER JERINGA 0.33G','UNIDAD',' DMG ','35.000','35.000'),
(1,'ODONTOLOGIA','ODON175','JABON ANTIBACTERIAL 800ML (ASEPTIGERM)','UNIDAD',' PROASEPSIS ','49.200','49.200'),
(1,'ODONTOLOGIA','ODON176','JERINGA ENDODONCIA MONOJET PARA IRRIGAR','UNIDAD',' MONOJET ','299.899','356.880'),
(1,'ODONTOLOGIA','ODON178','CREMA DENTAL FLUOCARDENT + CEPILLO','UNIDAD',' JGB ','3.193','3.800'),
(1,'ODONTOLOGIA','ODON179','HIDROXIDO DE CALCIO USP POLVO X 10G','UNIDAD',' EUFAR ','10.360','10.360'),
(1,'ODONTOLOGIA','ODON027','LIDOCAINA 2% C/E CARPUL','CJ50',' NEW STETIC ','78.000','78.000'),
(1,'ODONTOLOGIA','ODON029','LIDOCAINA ATOMIZADOR DE 80 GR / 10GR CAJA X 1 SOLUCION TOPICA','UNIDAD',' ROPSOHN ','113.333','113.333'),
(1,'ODONTOLOGIA','ODON182','LIMAS 1RA SERIE 15-40 25 MM','CJ6',' THOMAS ','47.563','56.600'),
(1,'ODONTOLOGIA','ODON188','LIMAS 2DA SERIE 45-80 25 MM','CJ6',' THOMAS ','67.227','80.000'),
(1,'ODONTOLOGIA','ODON180','LIMAS K-FLEXOFIL READYS 15/40 21MM','CJ6',' MAILLEFER ','60.629','72.149'),
(1,'ODONTOLOGIA','ODON183','LIMAS M-ACCESS FLEXOFILE BLIS X 6  15/40 EN 31MM','UNIDAD',' MAILLEFER ','50.144','59.671'),
(1,'ODONTOLOGIA','ODON189','LIMAS K-FILES 45/80 EN 31MM BLIS X6 P/S','UNIDAD',' ZIPPERER ','68.403','81.400'),
(1,'ODONTOLOGIA','ODON185','LIMA PRESERIE 0.8 X 25MM CAJA X 6','UNIDAD',' MAILLEFER ','67.927','80.833'),
(1,'ODONTOLOGIA','ODON186','LIMA PRESERIE 0.10X 25MM CAJA X 6','UNIDAD',' MAILLEFER ','67.927','80.833'),
(1,'ODONTOLOGIA','ODON190','LIMAS K-FILES 45/80 EN 31MM BLIS X6 P/S','UNIDAD',' ZIPPERER ','63.445','75.500'),
(1,'ODONTOLOGIA','ODON187','LIMAS M-ACCESS K-FILE # 45-80 EN 21MM','UNIDAD',' MAILLEFER ','57.983','69.000'),
(1,'ODONTOLOGIA','ODON191','MANGO PARA ESPEJO','UNIDAD',' SUPERDENT ','6.639','7.900'),
(1,'ODONTOLOGIA','ODON192','MECHA PARA MECHERO','UNIDAD',' SIN MARCA ','697','830'),
(1,'ODONTOLOGIA','ODON193','MECHERO METALICO','UNIDAD',' SIN MARCA ','10.785','12.834'),
(1,'ODONTOLOGIA','ODON194','MOMIFICANTE PULPAR X 7 ML','UNIDAD',' EUFAR ','14.000','14.000'),
(1,'ODONTOLOGIA','ODON026','ODONTOCAINA 3% MEPIVACAIN SOL INYECTABLE','CJ50',' NEW STETIC ','94.700','94.700'),
(1,'ODONTOLOGIA','ODON195','OXIDO DE ZINC 175 GRANULADO','UNIDAD',' EUFAR ','19.420','19.420'),
(1,'ODONTOLOGIA','ODON198','PAPEL CREPADO PARA ESTERILIZACION 50X100','UNIDAD',' SURGIPLAST ','113.339','134.874'),
(1,'ODONTOLOGIA','ODON199','PAPEL ARTICULADOR CUADERNILLO X 12','UNIDAD',' COLTENE ','37.227','44.300'),
(1,'ODONTOLOGIA','ODON201','PASTA PROFILACTICA (DETARFAR)POTE X 50GR','UNIDAD',' DETARFAR ','14.118','16.800'),
(1,'ODONTOLOGIA','ODON202','PASTA PROFILACTICA POTE X 60 GR','UNIDAD',' PROQUIDENT ','14.286','17.000'),
(1,'ODONTOLOGIA','ODON210','PIEDRA DE ARKANZA CY-1 CILINDRICA','UNIDAD',' BESQUAL ','4.034','4.800'),
(1,'ODONTOLOGIA','ODON204','PIEDRA DE ARKANZA RD-1','UNIDAD',' BESQUAL ','3.922','4.667'),
(1,'ODONTOLOGIA','ODON205','PIEDRA DE ARKANZA CN-1 CONICA','UNIDAD',' BESQUAL ','3.782','4.500'),
(1,'ODONTOLOGIA','ODON206','PIEDRA DE ARKANZA FL-3A LLAMA REDONDEADA','UNIDAD',' BESQUAL ','3.642','4.334'),
(1,'ODONTOLOGIA','ODON207','PIEDRA ARKANSA FL-2 LLAMA ALARGADA','UNIDAD',' NACIONAL ','3.922','4.667'),
(1,'ODONTOLOGIA','ODON208','PORTA AMALGAMA EN TEFLON FUSIL','UNIDAD',' SUPERDENT ','77.311','92.000'),
(1,'ODONTOLOGIA','ODON213','POLIPROPILENO 3 ','UNIDAD',' MEIYI ','28.270','28.270'),
(1,'ODONTOLOGIA','ODON214','POLIPROPILENO 4 -','UNIDAD',' MEIYI ','28.270','28.270'),
(1,'ODONTOLOGIA','ODON217','PROTECTOR DE JERINGA TRIPLE PAQ X 50','UNIDAD',' QUIRUDENT ','18.207','21.666'),
(1,'ODONTOLOGIA','ODON218','PUNTAS DE PAPEL 15 - 40 CAJA X 120','UNIDAD',' CASA DENTAL ','25.630','30.500'),
(1,'ODONTOLOGIA','ODON219','PUNTAS DE PAPEL 45 - 80 CAJA X 120 2A','UNIDAD',' CASA DENTAL ','25.630','30.500'),
(1,'ODONTOLOGIA','ODON220','PUNTAS SILICONADAS PULIR RESINA SURTIDAS','UNIDAD',' DENTSPLY ','61.017','72.610'),
(1,'ODONTOLOGIA','ODON221','PELICULA PERIAPICAL ADULTO S-SPEED X 150','UNIDAD',' CARESTREAM ','327.731','390.000'),
(1,'ODONTOLOGIA','ODON222','RC PREP JERINGA PREMIER','UNIDAD',' PREMIER ','56.000','56.000'),
(1,'ODONTOLOGIA','ODON231','RESINA FOTOCU Z250 XT A1 FILTEKX3GR','UNIDAD',' 3M ','132.000','132.000'),
(1,'ODONTOLOGIA','ODON227','RESINA FOTOCU Z250 XT B1 FILTEKX3GR','UNIDAD',' 3M ','132.000','132.000'),
(1,'ODONTOLOGIA','ODON237','RESINA FOTOCU Z350 XT A1 FILTEK BODYX4GR','UNIDAD',' 3M ','265.000','265.000'),
(1,'ODONTOLOGIA','ODON236','RESINA FILTEK Z350 XT B1 BODY  4 GR','UNIDAD',' 3M ','265.000','265.000'),
(1,'ODONTOLOGIA','ODON238','RESINA FILTEK Z350 XT B3 BODY 4 GR','UNIDAD',' 3M ','265.000','265.000'),
(1,'ODONTOLOGIA','ODON228','RESINA FOTOCU.BRILLANT FLOW A1/B1','UNIDAD',' COLTENE ','69.000','69.000'),
(1,'ODONTOLOGIA','ODON229','RESINA  FOTOCU.BRILLANT FLOW A2/B2','UNIDAD',' COLTENE ','69.000','69.000'),
(1,'ODONTOLOGIA','ODON223','RESINA FOTOCU FLOW BULK A1 FILT KIT X 2','UNIDAD',' 3M ','260.000','260.000'),
(1,'ODONTOLOGIA','ODON224','RESINA FOTOCU FLOW BULK A2 FILT KIT X 2','UNIDAD',' 3M ','260.000','260.000'),
(1,'ODONTOLOGIA','ODON225','RESINA FOTOCU FLOW BULK A3 FILT KIT X 2','UNIDAD',' 3M ','260.000','260.000'),
(1,'ODONTOLOGIA','ODON242','RESINA P-60 A3 JERINGA','UNIDAD',' 3M ','253.000','253.000'),
(1,'ODONTOLOGIA','ODON243','RESINA P-60 B2 JERINGA','UNIDAD',' 3M ','253.000','253.000'),
(1,'ODONTOLOGIA','ODON253','RESINA Z250 COLOR B1 X 4G','JERINGA',' 3M ','135.000','135.000'),
(1,'ODONTOLOGIA','ODON255','RESINA FOTOCU Z250 A1 FILTEKX4GR','UNIDAD',' 3M ','83.800','83.800'),
(1,'ODONTOLOGIA','ODON256','RESINA FOTOCU Z250 A2 FILTEK X 4GR','UNIDAD',' 3M ','83.800','83.800'),
(1,'ODONTOLOGIA','ODON254','RESINA FOTOCU Z250 A3 FILTEK X 4GR','UNIDAD',' 3M ','83.800','83.800'),
(1,'ODONTOLOGIA','ODON257','RESINA FOTOCU Z250 A3.5 FILTEK X 4GR','UNIDAD',' 3M ','83.800','83.800'),
(1,'ODONTOLOGIA','ODON258','RESINA FOTOCU Z250 B2 FILTEK X 4GR','UNIDAD',' 3M ','83.800','83.800'),
(1,'ODONTOLOGIA','ODON245','RESINA FOTOCU Z250 XT A3 FILTEKX3GR','UNIDAD',' 3M ','141.000','141.000'),
(1,'ODONTOLOGIA','ODON246','RESINA FOTOCU Z250 XT A3.5 FILTEKX3GR','UNIDAD',' 3M ','141.000','141.000'),
(1,'ODONTOLOGIA','ODON247','RESINA FOTOCU Z250 XT B2 FILTEKX3GR','UNIDAD',' 3M ','141.000','141.000'),
(1,'ODONTOLOGIA','ODON248','RESINA FOTOCU Z250 XT B3 FILTEKX3GR','UNIDAD',' 3M ','141.000','141.000'),
(1,'ODONTOLOGIA','ODON232','RESINA FOTOCU Z350 XT A2 FILTEK BODYX4GR','UNIDAD',' 3M ','266.667','266.667'),
(1,'ODONTOLOGIA','ODON233','RESINA FOTOCU Z350 XT A3 FILTEK BODY 4GR','UNIDAD',' 3M ','266.667','266.667'),
(1,'ODONTOLOGIA','ODON234','RESINA FOTOCU Z350 XT A3.5 FILTE BODYX4G','UNIDAD',' 3M ','266.667','266.667'),
(1,'ODONTOLOGIA','ODON235','RESINA FILTEK Z350 XT B2B BODY X4GR +','UNIDAD',' 3M ','266.667','266.667'),
(1,'ODONTOLOGIA','ODON265','REVELADOR + FIJADOR RAYO X 5 L 860 6899','UNIDAD',' CARESTREAM ','113.150','113.150'),
(1,'ODONTOLOGIA','ODON263','REVELADOR PLACA BACTERIANA 10 ML','UNIDAD',' PROQUIDENT ','8.235','9.800'),
(1,'ODONTOLOGIA','ODON267','SEALAPEX ESTUCHE','UNIDAD',' KERR ','399.650','399.650'),
(1,'ODONTOLOGIA','ODON271','SUTURA 3/0 ODONTOLOGICA CAJA X 12 C/AGU','UNIDAD',' MEIYI ','45.000','45.000'),
(1,'ODONTOLOGIA','ODON272','SUTURA 4/0 ODONTOLOGICA CAJA X 12','UNIDAD',' MEIYI ','45.000','45.000'),
(1,'ODONTOLOGIA','ODON275','SEDA DENTAL X 400 METROS','UNIDAD',' DENTOLINE ','18.700','18.700'),
(1,'ODONTOLOGIA','ODON276','SELLANTE FOTOCURADO 2FCOX12ML+1ACIDOX12G','UNIDAD',' 3M ','462.185','550.000'),
(1,'ODONTOLOGIA','ODON278','SUPER SNAP KIT X 8','UNIDAD',' SHOFU ','22.970','27.334'),
(1,'ODONTOLOGIA','ODON281','SUTURA POLYGLYCOLIC 3/0 SOBRE','CJ12',' MEIYI ','181.000','181.000'),
(1,'ODONTOLOGIA','ODON283','SUTURA POLYGLYCOLIC 4/0 SOBRE','CJ12',' MEIYI ','181.000','181.000'),
(1,'ODONTOLOGIA','ODON290','TIME LINE 4GR','UNIDAD',' DENTSPLY ','213.000','213.000'),
(1,'ODONTOLOGIA','ODON291','TIRA NERVIO 25/40 25MM THOMAS X 6','UNIDAD',' THOMAS ','27.664','32.920'),
(1,'ODONTOLOGIA','ODON292','TIRAS DE MYLLAR','CJ50',' TM NACIONAL ','11.008','13.100'),
(1,'ODONTOLOGIA','ODON296','TIRAS DE POLYESTER  4MMX170MM CAJA X 100','UNIDAD',' MICRODONT ','31.933','38.000'),
(1,'ODONTOLOGIA','ODON294','TIRAS METALICAS PAQUETE X 12','UNIDAD',' MICRODONT ','20.420','24.300'),
(1,'ODONTOLOGIA','ODON299','VASO DAPEN DE VIDRIO','UNIDAD',' NACIONAL ','4.622','5.500'),
(1,'ODONTOLOGIA','ODON300','VITREBOND ESTUCHEX2 (IONOMERO VIDRI AUTO','UNIDAD','3M','690.000','690.000'),
(1,'ODONTOLOGIA','ODON301','VITRIMER IONOMERO RECONST POLVO Y LIQUIDO','UNIDAD','3M','487.800','487.800'),
(1,'ODONTOLOGIA','ODON302','XILOL [DISOLVENTE GUTAPERCHA] 20ML','UNIDAD','PROQUIDENT','8.655','10.300'),
(1,'ODONTOLOGIA','ODON020','ARTICAINE C/EPINEFRINA 4% CARPULE X 50','CJ50','NEW STETIC','110.000','110.000'),
(1,'ODONTOLOGIA','ODON284','DIQUE DE GOMA  O TELA DE CAUCHO','UNIDAD','HYGENYC','75.630','90.000'),
(1,'ODONTOLOGIA','ODON285','ARCOS DE YOUNG','UNIDAD','SUPERDENT','12.605','15.000'),
(1,'ODONTOLOGIA','ODON286','GRAPAS METALICAS # 5','UNIDAD','SUPERDENT','50.840','60.500'),
(1,'ODONTOLOGIA','ODON287','PERFORADORA T/CAUCHO','UNIDAD','SUPERDENT','44.538','53.000'),
(1,'ODONTOLOGIA','ODON288','PORTA GRAPAS','UNIDAD','SUPERDENT','47.059','56.000'),
(1,'ODONTOLOGIA','ODON289','TAPABOCAS CAJA  50 UNIDADES -MASCARILLAS','CAJA X 50','PROTEX','15.126','18.000'),
(1,'ODONTOLOGIA','ODON303','ZECRYA ALP EN','UNIDAD','DENTSPLY MAILLEFER','47.059','56.000'),
(1,'ODONTOLOGIA','ODON304','ALGODON ODONTOLOGICO TRENZADO','BOLSA X 1000','HIGIENTEX','42.000','42.000'),
(1,'ODONTOLOGIA','ODON305','PIEZA DE ALTA (KIT)','KIT','','0','0'),
(1,'ODONTOLOGIA','ODON306','LAMPARA DE FOTOCURADO','KIT','','0','0'),
(1,'ODONTOLOGIA','ODON307','BONZYME - DETERGENTE MULTIENZIMATICO LIQUIDO CONCENTRADO','GALON','EUFAR','182.000','182.000'),
(1,'ODONTOLOGIA','ODON308','JABON DE PH NEUTRO','GALON','WEST','174.210','207.310'),
(1,'ODONTOLOGIA','ODON309','CEPILLO DE CERDAS METALICAS','UNIDAD','','0','0'),
(1,'ODONTOLOGIA','ODON310','ALKA DDS','GALON','ALKAMEDICA','269.850','269.850'),
(1,'ODONTOLOGIA','ODON311','BONZYME SPRAY (DETERGENTE Y PRE-DESINFECTANTE EN ESPUMA)','SPRAY 750 ML','EUFAR','109.800','109.800'),
(1,'ODONTOLOGIA','','GEL ANTIBACTERIAL DE 990 ML','UNIDAD','OSA','18.234','32.372');

SELECT table_name AS 'Tabla',
       ROUND((data_length + index_length) / 1024 / 1024, 2) AS 'Tamaño_MB',
       table_rows AS 'Filas_aprox'
FROM information_schema.tables
WHERE table_schema = 'soporte'
ORDER BY (data_length + index_length) DESC;

SELECT categoria, COUNT(*) AS total_filas
FROM catalogo_items
GROUP BY categoria;

INSERT IGNORE INTO users (nombres, apellidos, email, telefono, password, empresa_id,
    rol_id, cargo_id, municipio_id) VALUES
  ('Admin', 'Sistemas', 'sistemas@esesurorientecauca.gov.co', '', '$12$RW7SpcVLQspgwzzaPihIPOFiyafD3mYnYk0Huw/DOvyVpxEEU2abm', 1, 1, 1, 1);
  
/*
node -e "require('bcrypt').hash('ESESURORIENTECAUCA2026@',12).then(h=>console.log(h))"
*/
use soporte;
RENAME TABLE items_recepcion_medicamentos TO items_recepcion_inventario;

