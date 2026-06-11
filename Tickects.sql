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
CREATE TABLE catalogo_medicamentos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id      INT NOT NULL,
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
  UNIQUE KEY uq_codigo_empresa (codigo_interno, empresa_id)
);

CREATE TABLE recepciones_medicamentos (
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

CREATE TABLE items_recepcion_medicamentos (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  recepcion_id              INT NOT NULL,
  catalogo_id               INT DEFAULT NULL,
  tipo_recepcion ENUM('MEDICAMENTOS','LABORATORIO','MEDICO_QUIRURGICO','ASEO_PAPELERIA')
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
  FOREIGN KEY (catalogo_id)  REFERENCES catalogo_medicamentos(id) ON DELETE SET NULL
);

CREATE TABLE salidas_medicamentos (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id   INT NOT NULL,
  item_id      INT NOT NULL,
  municipio_destino_id INT NULL,
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
  tipo              ENUM('KIT','URGENCIAS','HOSPITALIZACION','CARRO_PARO') NOT NULL,
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
    
INSERT INTO catalogo_medicamentos (
  empresa_id,
  codigo_interno,
  nombre,
  presentacion,
  concentracion,
  precio_2026,
  precio_regulado
)
VALUES
(1,'MED001','ACETAMINOFEN','FRASCO *60ML','150MG','2684','no regulado'),
(1,'MED002','ACETAMINOFEN','TABLETA','500MG','70','no regulado'),
(1,'MED003','ACETAMINOFEN','FRASCO*30ML','100MG/ML','3390','no regulado'),
(1,'MED004','PARACETAMOL','VIAL 100 ML','10MG/ML','11300','no regulado'),
(1,'MED005','ACETATO ALUMINIO','SOBRE','3645MG','796','no regulado'),
(1,'MED007','ACETILCISTEINA','SOBRE','200MG','396','no regulado'),
(1,'MED008','ACETAZOLAMIDA','TABLETA','250 MG','687','no regulado'),
(1,'MED009','ACICLOVIR ','TABLETA','200MG','238','no regulado'),
(1,'MED010','ACICLOVIR','TABLETA','800MG','885','no regulado'),
(1,'MED011','ACICLOVIR','CREMA *15GR','5%','3636','no regulado'),
(1,'MED012','ACICLOVIR','FRASCO','200 MG','10456','no regulado'),
(1,'MED013','ACICLOVIR','AMPOLLA','250 MG','33106','78295'),
(1,'MED015','ACIDO ACETIL','TABLETA','100 MG','53','no regulado'),
(1,'MED016','ACIDO FOLICO','TABLETA','1 MG','41','no regulado'),
(1,'MED017','ACIDO FUSIDICO','CREMA','2%','6562','no regulado'),
(1,'MED019','ACIDO TRANEXAMICO','TABLETA',' 500MG','1242','no regulado'),
(1,'MED020','ACIDO TRANEXAMICO','AMPOLLA','500MG/5ML','3766','no regulado'),
(1,'MED021','ACIDO VALPROICO','CAPSULA','250 MG','265','1220'),
(1,'MED022','ACIDO VALPROICO','FRASCO * 120ML','250 MG/5ML','7817','no regulado'),
(1,'MED023','EPINEFRINA','AMPOLLA','1 MG','1317','no regulado'),
(1,'MED024','AGUA DESTILADA','BOLSA*500ML','','6267','no regulado'),
(1,'MED025','AGUA ESTERIL','AMPOLLA*5ML','','1258','no regulado'),
(1,'MED026','ALBENDAZOL','TABLETA','200 MG','506','no regulado'),
(1,'MED027','ALBENDAZOL','FRASCO*20ML','4G/100ML','2405','no regulado'),
(1,'MED028','ALBENDAZOL','FRASCO*20ML','2G/100ML','2439','no regulado'),
(1,'MED029','ALFAMETILDOPA','TABLETA','250 MG','2287','no regulado'),
(1,'MED030','ALOPURINOL','TABLETA','100MG','179','no regulado'),
(1,'MED031','ALPRAZOLAM','TABLETA','0.25MG','1555','no regulado'),
(1,'MED032','AMANTADINA','CAPSULA','100MG','1598','no regulado'),
(1,'MED033','AMIKACINA','AMPOLLA','100MG/2ML','3441','no regulado'),
(1,'MED034','AMINOFILINA','AMPOLLA','500MG/2ML','169000','no regulado'),
(1,'MED035','AMIODARONA','AMPOLLA','150 MG','5171','no regulado'),
(1,'MED036','AMITRIPTILINA','TABLETA',' 25 MG','67','no regulado'),
(1,'MED037','AMLODIPINO','TABLETA','10MG','80','no regulado'),
(1,'MED038','AMLODIPINO','TABLETA','5 MG','34','no regulado'),
(1,'MED039','AMOXICILINA','FRASCO*100ML',' 250 MG/5ML','7096','no regulado'),
(1,'MED040','AMOXICILINA','FRASCO*60ML',' 250 MG','5450','no regulado'),
(1,'MED041','AMOXICILINA','FRASCO*45ML',' 250 MG','6054','no regulado'),
(1,'MED042','AMOXICILINA','CAPSULA',' 500 MG','370','no regulado'),
(1,'MED043','AMOXICILINA+ ACIDO CLAVULANICO','TABLETA','125MG+500MG','2332','no regulado'),
(1,'MED044','AMPICILINA','AMPOLLA','1 GR','2498','no regulado'),
(1,'MED045','AMPICILINA','FRASCO*60ML','250MG/5ML','4605','no regulado'),
(1,'MED046','AMPICILINA','CAPSULA','500 MG','341','no regulado'),
(1,'MED047','AMPICILINA+SULBACTAM','AMPOLLA','1G+0.5G','3179','no regulado'),
(1,'MED048','ATORVASTATINA','TABLETA','20 MG','68','no regulado'),
(1,'MED049','ATORVASTATINA','TABLETA','40 MG','127','no regulado'),
(1,'MED050','ATROPINA','AMPOLLA','1 MG','1440','no regulado'),
(1,'MED051','AZATIOPRINA','TABLETA','50 MG','471','no regulado'),
(1,'MED052','AZITROMICINA','FRASCO*15ML','200 MG/5ML','12482','no regulado'),
(1,'MED053','AZITROMICINA','TABLETA','500MG','1102','no regulado'),
(1,'MED054','BECLOMETASONA','FRASCO*10ML','250MCG','12558','no regulado'),
(1,'MED055','BECLOMETASONA INHA NASAL','FRASCO*10ML','50 MCG','12270','no regulado'),
(1,'MED056','BECLOMETASONA INHA BUCAL','FRASCO*10ML','50 MCG','12034','no regulado'),
(1,'MED057','BENZOATO DE BENCILO','FRASCO*120ML',' 30G/100ML','8392','no regulado'),
(1,'MED058','BETAMETASONA','AMPOLLA','4 MG','1077','no regulado'),
(1,'MED059','BETAMETASONA','AMPOLLA',' 8MG','5460','no regulado'),
(1,'MED060','BETAMETASONA','CREMA','20G','4591','no regulado'),
(1,'MED061','BETAMETILDIGOXINA','GOTAS','06MG/ML','4743','no regulado'),
(1,'MED062','BICARBONATO DE SODIO','AMPOLLA','840MG/10ML','4919','no regulado'),
(1,'MED063','BIPERIDENO','TABLETA',' 2 MG','350','no regulado'),
(1,'MED064','BISACODILO ','TABLETA',' 5MG','70','no regulado'),
(1,'MED065','BROMURO IPATROPIO','FRASCO','20MCG/10ML','12593','19560'),
(1,'MED066','BROMURO IPRATROPIO','FRASCO*15ML','025MG','24450','24450'),
(1,'MED067','BRIMONIDINA','FRASCO*5ML','2MG','19554','23280'),
(1,'MED068','BROMURO DE VECURONIO','AMPOLLA','10MG','32504','no regulado'),
(1,'MED069','CALCITRIOL','CAPSULA','025 mcg','196','no regulado'),
(1,'MED070','CALCITRIOL','CAPSULA','050 mcg','219','no regulado'),
(1,'MED071','CAPTOPRIL','TABLETA','25 MG','98','no regulado'),
(1,'MED072','CAPTOPRIL','TABLETA',' 50MG','115','no regulado'),
(1,'MED073','CARBAMAZEPINA','TABLETA','200 mg','146','146'),
(1,'MED074','CARBAMAZEPINA','FRASCO*120ML','100MG/5ML','8952','8952'),
(1,'MED075','CARBON ACTIVADO','BOLSA*KG','','26428','no regulado'),
(1,'MED076','CARBONATO CALCIO + V D','TABLETA','1250MG+330UI ','191','no regulado'),
(1,'MED077','CARBONATO CALCIO','TABLETA','600 MG','118','no regulado'),
(1,'MED078','CARBIDOPA+LEVODOPA','TABLETA','25MG/250MG','499','no regulado'),
(1,'MED079','CARBONATO DE LITIO','TABLETA','300MG','757','no regulado'),
(1,'MED080','CARVEDILOL','TABLETA','625 MG','90','297'),
(1,'MED081','CEFALEXINA','FRASCO*60ML',' 250 MG/5ML','6545','no regulado'),
(1,'MED082','CEFALEXINA','TABLETA','500 MG','530','no regulado'),
(1,'MED083','CEFALOTINA','AMPOLLA',' 1 GR','2943','no regulado'),
(1,'MED084','CEFAZOLINA','AMPOLLA',' 1 GR','2943','no regulado'),
(1,'MED085','CEFRADINA','AMPOLLA',' 1GR','6724','no regulado'),
(1,'MED086','CEFRADINA','TABLETA','500MG','609','no regulado'),
(1,'MED087','CEFTRIAXONA','AMPOLLA','1 GR','2018','no regulado'),
(1,'MED088','CEFUROXIMA','FRASCO*70ML','250MG/5ML','86765','86765'),
(1,'MED089','CETIRIZINA','TABLETA','10MG','68','no regulado'),
(1,'MED090','CIPROFLOXACINO','AMPOLLA','100 MG/10ML','2311','no regulado'),
(1,'MED091','CIPROFLOXACINO','TABLETA','500MG','349','no regulado'),
(1,'MED092','CLARITROMICINA','FRASCO','250MG/5ML','17657','no regulado'),
(1,'MED093','CLARITROMICINA','TABLETA',' 500 MG','1962','no regulado'),
(1,'MED094','CLARITROMICINA','AMPOLLA','500 MG','22449','no regulado'),
(1,'MED095','CLINDAMICINA','AMPOLLA','600 MG','10470','no regulado'),
(1,'MED096','CLONIDINA','TABLETA','0150 MG','55','no regulado'),
(1,'MED097','CLOPIDROGEL','TABLETA','75 MG','171','1540'),
(1,'MED098','CLORFENIRAMINA','TABLETA',' 4MG','48','no regulado'),
(1,'MED099','CLORFENIRAMINA','FRASCO*120ML','2MG/5ML','3214','no regulado'),
(1,'MED100','CLOROQUINA','TABLETA','250MG','252','no regulado'),
(1,'MED101','CLORURO DE POTASIO','AMPOLLA','20MEQ/10ML','1496','no regulado'),
(1,'MED102','CLORURO DE SODIO','AMPOLLA','20MEQ/10ML','1417','no regulado'),
(1,'MED103','CLOTRIMAZOL','TABLETA','100MG','288','no regulado'),
(1,'MED104','CLOTRIMAZOL','CREMA TOPICA','40G','3767','no regulado'),
(1,'MED105','CLOTRIMAZOL ','CREMA VAGINAL','40G','6837','no regulado'),
(1,'MED106','CLOTRIMAZOL','FRASCO*30ML','1%','3542','no regulado'),
(1,'MED107','CLOZAPINA','TABLETA','25MG','157','no regulado'),
(1,'MED108','COLCHICINA','TABLETA','0.5MG','132','no regulado'),
(1,'MED109','COMPLEJO B','AMPOLLA','','6753','no regulado'),
(1,'MED110','COMPLEJO B','TABLETA','','100','no regulado'),
(1,'MED111','CROMOGLICATO SODIO','SOL OFT FRASCO*10ML','4','11124','no regulado'),
(1,'MED112','CROMOGLICATO SODIO','SOL NAS FRASCO*10ML','4','4836','no regulado'),
(1,'MED113','CROMOGLICATO SODIO','SOL NAS FRASCO* 10ML','2','7492','no regulado'),
(1,'MED114','CROMOGLICATO SODIO','SOL OFT FRASCO*5ML','2','7176','no regulado'),
(1,'MED115','CROTAMITON LOCION','FRASCO*60ML','1%','9005','no regulado'),
(1,'MED116','DAPAGLIFLOZINA','TABLETA','10MG','5040','50405'),
(1,'MED117','DESLORATADINA','FRASCO*60ML','25MG/5ML','3673','no regulado'),
(1,'MED118','DEXAMETASONA','AMPOLLA','4 mg','589','no regulado'),
(1,'MED119','DEXAMETASONA','AMPOLLA','8 MG','1079','no regulado'),
(1,'MED120','DEXTROSA','BOLSA*500ML','10%','5325','no regulado'),
(1,'MED121','DEXTROSA','BOLSA*500ML','5%','4747','no regulado'),
(1,'MED122','DEXTROSA CON SOLUCION SALINA','BOLSA*500ML','5%','5456','no regulado'),
(1,'MED123','DIAZEPAM','AMPOLLA','10 MG/2ML','6096','no regulado'),
(1,'MED124','DICLOFENACO','TABLETA','50 MG','59','no regulado'),
(1,'MED125','DICLOFENACO','AMPOLLA','75 MG/3ML','870','no regulado'),
(1,'MED126','DICLOXACILINA','FRASCO*80ML','250MG/5ML','4961','no regulado'),
(1,'MED127','DICLOXACILINA','CAPSULA','500 MG','442','no regulado'),
(1,'MED128','DIFENHIDRAMINA','CAPSULA','50 MG','263','no regulado'),
(1,'MED129','DIFENHIDRAMINA','FRASCO*120ML','125MG/5ML','4639','no regulado'),
(1,'MED130','DIHIDROCODEINA ','FRASCO*120ML','242MG/ML','8829','no regulado'),
(1,'MED131','DINITRATO','TABLETA','5MG','1886','no regulado'),
(1,'MED132','DIPIRONA','AMPOLLA','1 GR/2ML','1422','no regulado'),
(1,'MED133','DIPIRONA','AMPOLLA','25GR/5ML','1597','no regulado'),
(1,'MED134','DIPIRONA','AMPOLLA','2 GR/5ML','6123','no regulado'),
(1,'MED135','N-BUTIL BROMURO HIOSINA  + DIPIRONA','AMPOLLA','20MG + 25G/5ML','2854','no regulado'),
(1,'MED136','DOBUTAMINA','AMPOLLA','250MG/5ML','12549','no regulado'),
(1,'MED137','DOPAMINA','AMPOLLA','200MG/5ML','3135','no regulado'),
(1,'MED138','DOXICICLINA','TABLETA','100 MG','261','no regulado'),
(1,'MED139','ENALAPRIL','TABLETA','20 MG','172','no regulado'),
(1,'MED140','ENALAPRIL','TABLETA','5 MG','219','no regulado'),
(1,'MED141','ENOXAPARINA','AMPOLLA',' 40MG/04ML','13064','13064'),
(1,'MED142','ENEMA TRAVAD','BOLSA','25%/1000ML','40055','no regulado'),
(1,'MED143','ERGOTAMINA+CAFEINA','TABLETA','100MG/1MG','336','no regulado'),
(1,'MED144','ERITROMICINA','FRASCO*60ML',' 250 MG/5ML','9868','no regulado'),
(1,'MED145','ERITROMICINA','TABLETA','500 MG','869','no regulado'),
(1,'MED146','ESOMEPRAZOL','TABLETA','20 MG','143','no regulado'),
(1,'MED147','ESOMEPRAZOL','TABLETA','40 MG','156','no regulado'),
(1,'MED148','ESPIRONOLACTONA','TABLETA','25MG','157','no regulado'),
(1,'MED149','ESTROGENOS CONJUGADOS','CREMA','625 mg','33684','33684'),
(1,'MED150','ESTROGENOS CONJUGADOS','TABLETA','0.625MG','889','1029'),
(1,'MED151','FENITOINA','TABLETA','100MG','2878','no regulado'),
(1,'MED152','FENITOINA','AMPOLLA','250MG/5ML','3058','no regulado'),
(1,'MED153','NEOMICINA+HIDROCORTISONA+COLISTINA','FRASCO*15ML','5MG+05MG+1538MG/ML','29434','no regulado'),
(1,'MED154','FLUCONAZOL','TABLETA','200 MG','692','no regulado'),
(1,'MED155','FLUIMUCIL','FRASCO*25ML','10MG/ML','36800','no regulado'),
(1,'MED156','FLUOXETINA','TABLETA','20MG','73','no regulado'),
(1,'MED157','FLUOXETINA','FRASCO*70ML','20MG/5ML','5611','no regulado'),
(1,'MED158','FLUINARIZINA','TABLETA','10MG','97','no regulado'),
(1,'MED159','FLUINARIZINA','TABLETA','5MG','429','no regulado'),
(1,'MED160','FUROSEMIDA','AMPOLLA','20 MG/2ML','1345','no regulado'),
(1,'MED161','FUROSEMIDA','TABLETA','40MG','58','no regulado'),
(1,'MED162','GEMFIBROZILO','TABLETA','600MG','344','no regulado'),
(1,'MED163','GENTAMICINA','AMPOLLA','160 MG/2ML','1667','no regulado'),
(1,'MED164','GENTAMICINA','AMPOLLA','40MG/2ML','2260','no regulado'),
(1,'MED165','HIDROXIDO DE ALUMINIO','FRASCO 360ML','6G/100ML','11048','no regulado'),
(1,'MED166','GENTAMICINA','AMPOLLA','80 MG/2ML','8111','no regulado'),
(1,'MED167','GENTAMICINA','CREMA','1MG','10381','no regulado'),
(1,'MED168','GENTAMICINA','FRASCO*6ML','300%','3503','no regulado'),
(1,'MED169','GENTAMICINA','UNG ENTO','5G','17199','no regulado'),
(1,'MED170','GLIBENCLAMIDA','TABLETA','5 MG','101','no regulado'),
(1,'MED171','GLUCONATO DE CALCIO','AMPOLLA','1','2649','no regulado'),
(1,'MED172','HALOPERIDOL','TABLETA','10MG','246','no regulado'),
(1,'MED173','HALOPERIDOL','TABLETA','5MG','182','no regulado'),
(1,'MED174','HALOPERIDOL','AMPOLLA',' 5MG/ML','2187','no regulado'),
(1,'MED175','HALOPERIDOL','FRASCO*15ML','2MG/ML','6727','no regulado'),
(1,'MED176','HEPARINA','AMPOLLA','5000 UI','28588','no regulado'),
(1,'MED177','VACUNA CONTRA LA HEPATITIS B','AMPOLLA','','63901','no regulado'),
(1,'MED178','HIDROCLOROTIAZIDA','TABLETA','25 MG','39','no regulado'),
(1,'MED179','HIDROCORTIZONA','AMPOLLA','100 MG','4624','no regulado'),
(1,'MED180','HIDROCORTIZONA','CREMA','1%','4459','no regulado'),
(1,'MED181','HIDROCORTIZONA','FRASCO','30G','7278','no regulado'),
(1,'MED182','HIDROXICINA','AMPOLLA','100MG/2ML','13663','no regulado'),
(1,'MED183','HIDROXICINA','TABLETA','25MG','134','no regulado'),
(1,'MED184','HIDROXIDO DE ALUMINIO+MAGNESIO+SIMETICONA','FRASCO*360ML','40G+40G+400MG','8493','no regulado'),
(1,'MED185','IBUPROFENO','FRASCO','100 MG','6276','no regulado'),
(1,'MED186','IBUPROFENO ','TABLETA','400MG','151','no regulado'),
(1,'MED187','INSULINA APIDRA','AMPOLLA','10ML','80240','80240'),
(1,'MED188','INSULINA APIDRA','AMPOLLA','3ML','24072','24072'),
(1,'MED189','INSULINA ASPARTA','LAPICERO','100UI','24204','24204'),
(1,'MED190','INSULINA DEGLUDEC','AMPOLLA','3 ML','50022','50022'),
(1,'MED191','INSULINA GLARGINA','VIAL X 10ML','100UI/ML','94893','127800'),
(1,'MED192','INSULINA GLARGINA','AMPOLLA','3ML','38340','38340'),
(1,'MED193','HIDROXIDO DE ALUMINIO+MAGNESIO+SIMETICONA','FRASCO*150ML','40G+40G+400MG','9288','no regulado'),
(1,'MED194','INSULINA R','AMPOLLA','1000 UI','19453','no regulado'),
(1,'MED195','INSULINA NPH','AMPOLLA','100 UI','18511','no regulado'),
(1,'MED196','IMIPRAMINA','TABLETA','25 mg','126','no regulado'),
(1,'MED197','IVERMECTINA','FRASCO*5ML','6MG/ML','4944','no regulado'),
(1,'MED198','KALETRA (LOPINAVIR + RITONAVIR)','TABLETA','200MG/50MG','1213','no regulado'),
(1,'MED199','KALETRA (LOPINAVIR + RITONAVIR)','FRASCO*160ML','80MG/20ML','1346','no regulado'),
(1,'MED200','KETAMINA','AMPOLLA','500MG','22425','no regulado'),
(1,'MED201','KETOCONAZOL','TABLETA','200MG','375','no regulado'),
(1,'MED202','KETOCONAZOL','CREMA','2%','7259','no regulado'),
(1,'MED203','KETOTIFENO','TABLETA','1 MG','92','no regulado'),
(1,'MED204','KETOTIFENO','FRASCO*100ML','276MG','4114','no regulado'),
(1,'MED205','LABETALOL','AMPOLLA','100MG/120ML','19863','19863'),
(1,'MED206','LACTATO RINGER','BOLSA*500ML','','4378','no regulado'),
(1,'MED207','LAMIVUDINA','FRASCO*240ML','10MG/ML','42040','no regulado'),
(1,'MED208','LAMIVUDINA+ ZIDOVUDINA','TABLETA','150MG+300MG','726','no regulado'),
(1,'MED209','LANSOPRAZOL','TABLETA','30MG','269','829'),
(1,'MED210','LEFLUNOMIDA','TABLETA','20MG','947','6453'),
(1,'MED211','LEVONOGESTREL','TABLETA',' 0.75 MG','4159','8707'),
(1,'MED212','LEVONOGESTREL+ ETINILESTRADIOL','CAJA X 21 TABLETAS','150MCG+30MCG','87','290'),
(1,'MED213','LEVOTIROXINA','TABLETA','100MCG','58','no regulado'),
(1,'MED214','LEVOTIROXINA','TABLETA','50MCG','111','no regulado'),
(1,'MED215','LEVOTIROXINA','TABLETA','75MCG','429','no regulado'),
(1,'MED216','LEVOTIROXINA','TABLETA','25MCG','137','no regulado'),
(1,'MED217','LEVOMPROMAZINA','TABLETA','25MG','342','no regulado'),
(1,'MED218','LEVOMEPROMAZINA','FRASCO*20ML','40MG/ML','13417','no regulado'),
(1,'MED219','LEVOFLOXACINA','TABLETA','500MG','1842','no regulado'),
(1,'MED220','LIDOPROCTO','UNG ENTO','10G','25224','no regulado'),
(1,'MED221','LOPERAMIDA','TABLETA','2MG','76','no regulado'),
(1,'MED222','LORATADINA','FRASCO*100ML','1MG/ML','4087','no regulado'),
(1,'MED223','LORATADINA','TABLETA','10 MG','81','no regulado'),
(1,'MED224','LOSARTAN','TABLETA','100MG','157','no regulado'),
(1,'MED225','LOSARTAN','TABLETA','50 MG','61','no regulado'),
(1,'MED226','LOVASTATINA','TABLETA','20MG','94','no regulado'),
(1,'MED227','MANITOL','BOLSA*250ML','20%','37480','no regulado'),
(1,'MED228','MEBENDAZOL','FRASCO*20ML','100MG/5ML','2225','no regulado'),
(1,'MED229','MEBENDAZOL','TABLETA','100MG','2225','no regulado'),
(1,'MED230','MEDROXIPROGESTRONA+ESTRADIOL','AMPOLLA','25MG+5MG','7673','14037'),
(1,'MED231','MEDROXIPROGESTRONA+ ACETATO','AMPOLLA','150MG /3ML','11325','11325'),
(1,'MED232','MEDROXIPROGESTERONA','TABLETA',' 5MG','369','369'),
(1,'MED233','METFORMINA','TABLETA','1000MG','501','no regulado'),
(1,'MED234','METFORMINA','TABLETA','850MG','127','no regulado'),
(1,'MED235','METHERGYN METILERGOMETRINA','AMPOLLA','0.2MG','1547','1547'),
(1,'MED236','METILPREDNISOLONA','AMPOLLA','500 MG','21535','67935'),
(1,'MED237','METOCARBAMOL','TABLETA','750 MG','283','no regulado'),
(1,'MED238','METOCLOPRAMIDA','AMPOLLA','10 MG','1064','no regulado'),
(1,'MED239','METOCLOPRAMIDA','TABLETA','10 MG','97','no regulado'),
(1,'MED240','METOCLOPRAMIDA ','GOTAS','4MG/ML','3165','no regulado'),
(1,'MED241','METOPROLOL','TABLETA','100MG','208','977'),
(1,'MED242','METOPROLOL','TABLETA','50 MG','73','488'),
(1,'MED243','METOPROLOL','AMPOLLA','5MG/5ML','25689','no regulado'),
(1,'MED244','METRONIDAZOL','SUSPENSI N*120ML','250 MG/5ML','6468','no regulado'),
(1,'MED245','METOTREXATO','TABLETA','2.5MG','404','no regulado'),
(1,'MED246','METRONIDAZOL','TABLETA',' 500 MG','143','no regulado'),
(1,'MED247','METRONIDAZOL','OVULOS','500 MG','412','no regulado'),
(1,'MED248','METRONIDAZOL','AMPOLLA','500 MG','3196','no regulado'),
(1,'MED249','MIDAZOLAM','AMPOLLA','5 MG/5ML','3532','no regulado'),
(1,'MED250','MISOPROSTROL','TABLETA',' 200MG','4585','no regulado'),
(1,'MED251','NALOXONA','AMPOLLA','0.4MG','33655','no regulado'),
(1,'MED252','NAPROXENO','SUSPENSION','150MG/5ML','5108','no regulado'),
(1,'MED253','NAPROXENO','TABLETA','250 MG','156','no regulado'),
(1,'MED254','N-BUTIL BROMURO HIOSCINA','TABLETA','10 MG','364','no regulado'),
(1,'MED255','N-BUTIL BROMURO HIOSINA ','AMPOLLA','20 MG','1337','no regulado'),
(1,'MED256','NIFEDIPINO','CAPSULAS','10 MG','462','no regulado'),
(1,'MED257','NIFEDIPINO','CAPSULAS','30 MG','320','no regulado'),
(1,'MED258','NIMODIPINO','CAPSULAS','30MG','184','no regulado'),
(1,'MED259','NISTATINA','SUSPENSION*60ML','10OOO UI ','5906','no regulado'),
(1,'MED260','NISTATINA','CREMA','100000UI-200MG/G','15734','no regulado'),
(1,'MED261','NISTATINA','OVULOS','100000 UI','766','no regulado'),
(1,'MED262','NITROFURANTOINA ','CAPSULA','100 MG','305','no regulado'),
(1,'MED263','NITROGLICERINA','AMPOLLA','50MG/10ML','21427','no regulado'),
(1,'MED264','NITROPRUSIATO','AMPOLLA','50MG','49438','no regulado'),
(1,'MED265','NORFLOXACINO','TABLETA',' 400 MG','236','no regulado'),
(1,'MED266','OLANZAPINA','TABLETA','5MG','208','2150'),
(1,'MED267','OLANZAPINA','TABLETA','10MG','375','4301'),
(1,'MED268','OMEPRAZOL','CAPSULA','20 MG','76','no regulado'),
(1,'MED269','OMEPRAZOL','AMPOLLA','40 MG','4643','no regulado'),
(1,'MED270','OXACILINA','AMPOLLA','1 GR','2702','no regulado'),
(1,'MED271','OXITOCINA','AMPOLLA','10 UI','5398','no regulado'),
(1,'MED272','PAMOATO PIRANTEL','TABLETA','250MG','509','no regulado'),
(1,'MED273','PAMOATO PIRANTEL','FRASCO','250MG','2861','no regulado'),
(1,'MED274','DIMENHIDRINATO','TABLETA','50MG','95','no regulado'),
(1,'MED275','PENICILINA BENZATINICA SODICA','AMPOLLA','1000000 UI','2831','no regulado'),
(1,'MED276','PENICILINA BENZATICA','AMPOLLA','1200000 UI','2540','no regulado'),
(1,'MED277','PENICILINA BENZATICA','AMPOLLA','2400000 UI','4036','no regulado'),
(1,'MED278','PENICILINA BENZATICA','AMPOLLA','5000000 UI','4771','no regulado'),
(1,'MED279','PENICILINA BENZATICA','AMPOLLA','800000 UI','4391','no regulado'),
(1,'MED280','PIPERAZINA','FRASCO*60ML','20%','15700','no regulado'),
(1,'MED281','PIPOTIAZINA','AMPOLLA','25MG','27419','no regulado'),
(1,'MED282','PIRIDOXINA','TABLETA','50MG','101','no regulado'),
(1,'MED283','PODOFILINA','FRASCO*5ML','100ML/20G','29987','no regulado'),
(1,'MED284','PREDNISOLONA + FELINEFRINA','FRASCO*15ML','10 MG + 1.2 MG/ML','22516','no regulado'),
(1,'MED285','PREDNISOLONA','TABLETA','5 MG','72','no regulado'),
(1,'MED286','PREDNISOLONA','SOLUCION ORAL *120 ML','1MG/1ML','70537','no regulado'),
(1,'MED287','PREDNISONA','TABLETA',' 50MG','1373','no regulado'),
(1,'MED288','PROPRANOLOL','TABLETA','40MG','110','no regulado'),
(1,'MED289','PROPRANOLOL','TABLETA',' 80MG','284','no regulado'),
(1,'MED290','HIDROCLOROTIAZIDA+LOSARTAN','TABLETA','12.5MG+50MG','123','no regulado'),
(1,'MED291','ATAZANAVIR+RITONAVIR','TABLETA',' 300MG+100MG','3532','no regulado'),
(1,'MED294','ROXICAINA CON EPINEFRINA','VIAL 50ML','5MCG+20MG','28500','no regulado'),
(1,'MED295','ROXICAINA LIDOCAINA CLORHIDRATO (POMADA)','TUBO 10ML','5','39796','no regulado'),
(1,'MED296','LIDOCAINA','JALEA','2%','19986','no regulado'),
(1,'MED297','ROXICAINA SIMPLE','FRASCO*50ML','10MG/M (1%)','29513','no regulado'),
(1,'MED298','ROXICAINA 2% +LIDOCAINA TAPA AZUL','FRASCO*50ML','20MG/ML','17009','no regulado'),
(1,'MED299','RISPERIDONA','POLVO','25MG','344029','344029'),
(1,'MED300','SALBUTAMOL','INHALADOR','100MCG','6391','no regulado'),
(1,'MED302','SALBUTAMOL ','FRASCO *120ML','2MG/5ML','2645','7512'),
(1,'MED303','SALBUTAMOL SOL. NEBULIZAR','FRASCO*10ML','5MG/ML ','36418','no regulado'),
(1,'MED304','SALES DE REHIDRATACION','SOBRE','284G','2404','no regulado'),
(1,'MED305','SERTRALINA','TABLETA','100MG','347','no regulado'),
(1,'MED306','SERTRALINA','TABLETA','50MG','164','no regulado'),
(1,'MED307','SOLUCION SALINA','BOLSA 500ML','0.9%','3952','no regulado'),
(1,'MED308','SOLUCION SALINA','BOLSA 100ML','0.9%','3292','no regulado'),
(1,'MED309','SUCRALFATO','TABLETA','1MG','509','no regulado'),
(1,'MED310','SUERO ANTIOFIDICO','FRASCO*10ML','','354599','no regulado'),
(1,'MED312','SULFADIAZINA DE PLATA','CREMA','1%','5046','no regulado'),
(1,'MED313','SULFATO FERROSO ','FRASCO  120ML','200MG/5ML','3996','no regulado'),
(1,'MED314','SULFATO FERROSO MAGNES','FRASCO*20ML','125MG','3233','no regulado'),
(1,'MED315','SULFATO FERROSO','TABLETA','300MG','73','no regulado'),
(1,'MED316','SULFATO DE MAGNESIO','AMPOLLA','20%','2416','no regulado'),
(1,'MED317','SULFATO DE ZINC','FRASCO*80ML','2MG/ML','7534','no regulado'),
(1,'MED318','SULFATO DE ZINC','FRASCO*120ML','2MG/ML','5832','no regulado'),
(1,'MED319','SUPOSITORIO GLICERINA ADULTO','TABLETA','13672G','1918','no regulado'),
(1,'MED320','SUPOSITORIO GLICERINA PEDIATRICO','','','2000','no regulado'),
(1,'MED321','TAMOXIFENO','TABLETA','20MG','473','no regulado'),
(1,'MED322','TAMSULOSINA','CAPSULA','0.4MG','488','no regulado'),
(1,'MED323','TELMISARTAN','CAPSULA','80MG ','566','1043'),
(1,'MED324','TEOFILINA','CAPSULA','125MG','302','no regulado'),
(1,'MED325','TEOFILINA','CAPSULA','300MG','300','no regulado'),
(1,'MED326','TERBUTALINA','FRASCO*10ML','10 mg','15397','no regulado'),
(1,'MED327','TERBUTALINA','AMPOLLA',' 05 MG','15300','no regulado'),
(1,'MED328','TETRACICLINA','CAPSULA','500MG','3390','no regulado'),
(1,'MED329','TIAMINA','AMPOLLA','100 MG','7231','no regulado'),
(1,'MED330','TIAMINA','TABLETA',' 300MG','191','no regulado'),
(1,'MED331','TIMOLOL','FRASCO*5ML','0.5%','3952','11672'),
(1,'MED332','TINIDAZOL','FRASCO*15ML','200 MG','3167','no regulado'),
(1,'MED333','TINIDAZOL','TABLETA','500 MG','211','no regulado'),
(1,'MED334','TRAMADOL','AMPOLLA','100MG/2ML','1399','no regulado'),
(1,'MED335','TRAMADOL','FRASCO*10ML','100MG','2838','no regulado'),
(1,'MED336','TRAMADOL','AMPOLLA','50 mg/ML','734','no regulado'),
(1,'MED337','TRAZODONA','TABLETA','100MG','4610','no regulado'),
(1,'MED338','TRAZODONA','TABLETA','50MG','139','no regulado'),
(1,'MED339','TRIMET SULFA - TRIMETOPRIN SULFAMETOXAZOL','TABLETA','160MG - 800MG','308','no regulado'),
(1,'MED340','TRIMET SULFA','FRASCO*60ML','40MG-200MG/5ML','4042','no regulado'),
(1,'MED341','TRIMET SULFA','FRASCO*120ML','40MG-200MG/5ML','4042','no regulado'),
(1,'MED342','TRIMET SULFA - TRIMETOPRIN SULFAMETOXAZOL','TABLETA','80MG/400MG','232','no regulado'),
(1,'MED343','VACUNA ANTITETANICA','AMPOLLA*3ML','40 UI','17169','no regulado'),
(1,'MED344','VASOPRESINA','AMPOLLA','20 UI','17481','no regulado'),
(1,'MED345','VERAPAMILO','TABLETA','120MG','308','308'),
(1,'MED346','VERAPAMILO','TABLETA','80MG','205','205'),
(1,'MED347','VIDALGLIPTINA + METFORMINA ','TABLETA','50MG/1000MG','2079','2570'),
(1,'MED348','VITAMINA A','CAPSULA','50000UI','135','no regulado'),
(1,'MED349','VITAMINA B12','AMPOLLA','1MG/ML','1854','no regulado'),
(1,'MED350','ACIDO ASCORBICO','TABLETA','500MG','185','no regulado'),
(1,'MED351','ACIDO ASCORBICO','FRASCO*30ML','100MG/ML','5886','no regulado'),
(1,'MED352','FITOMENADIONA','AMPOLLA','1MG/ML','2544','no regulado'),
(1,'MED353','FITOMENADIONA','AMPOLLA','10MG/ML','2699','no regulado'),
(1,'MED354','WARFARINA','TABLETA','5MG','181','no regulado'),
(1,'MED355','OXIMETASOLINA HCL','FRASCO*15ML','500%','3968','no regulado'),
(1,'MED356','DEXAMETASONA+NEOMICINA +POLIMIXINA B','FRASCO*5ML','1MG+3.5MG+6.600UI','5293','no regulado'),
(1,'MED357','ZIDOVUDINA','FRASCO*240ml',' 10 MG/ML','42375','no regulado'),
(1,'MED358','ATAZANAVIR','TABLETA','300MG','2547','32394'),
(1,'MED359','DARUNAVIR','TABLETA','800MG','8408','36296'),
(1,'MED360','DOLUTEGRAVIR','TABLETA','50MG','21477','52505'),
(1,'MED361','RITONAVIR','TABLETA','100MG','1169','2272'),
(1,'MED362','TENOFOVIR + EMTRICITABINA','TABLETA','300MG-200MG','1704','35308'),
(1,'MED363','TENOFOVIR','TABLETA','300MG','1580','26130'),
(1,'MED364','OXIBUTININA','COMPRIMIDOS','5MG','282','333'),
(1,'MED365','LATANOPROST','FRASCO*5ML','50MG/ML','12276','41343'),
(1,'MED366','DOMPERIDONA','TABLETA','10 MG','179','179'),
(1,'MED367','MEPERIDINA','AMPOLLA','100 MG','2809','no regulado'),
(1,'MED368','CEFEPIMA','AMPOLLA','1GR','5474','no regulado'),
(1,'MED369','PIPERACILINA + TAZOBACTAN','AMPOLLA','4G+05G','12154','no regulado'),
(1,'MED370','LEVONORGESTREL IMPLANTE SUBDERMICO KIT','UNIDAD','75MG','126134','154724'),
(1,'MED371','SITAGLIPTINA+METFORMINA','CAPSULA','50MG/1000MG','2570','2570'),
(1,'MED372','CARVEDILOL ','TABLETA','125MG','115','594'),
(1,'MED373','ACEITE DE RECINO','FRASCO*60ML','','6075','no regulado'),
(1,'MED375','ADENOCINA','','','27315','27315'),
(1,'MED385','KETOCONAZOL','FRASCO','100MG/5ML','14830','no regulado'),
(1,'MED386','CARBOXIMETILCELULOSA','GOTAS OFTALMICAS','5','9946','no regulado'),
(1,'MED388','ACIDO FOLICO ','TABLETA','5MG','157','no regulado'),
(1,'MED389','PRAZOSINA ','TABLETA','1 MG','67','no regulado'),
(1,'MED390','DIOSMINA','TABLETA','500 MG','877','877'),
(1,'MED391','RIFAMPICINA + ISONIAZIDA ','TABLETA','300+150','56044','no regulado'),
(1,'MED392','BETAHISTINA DICLORIDRATO','TABLETA','8 MG','376','no regulado'),
(1,'MED394','DARUNAVIR+RITONAVIR  ','TABLETA','600MG+100MG','8226','no regulado'),
(1,'MED395','DARUNAVIR+RITONAVIR','TABLETA','800MG+100MG','13601','no regulado'),
(1,'MED396','ZIDOVUDINA','TABLETA','300MG','1153','no regulado'),
(1,'MED397','ABACAVIR+LAMIVUDINA','FRASCO','600MG+300MG','2489','29310'),
(1,'MED400','QUETIAPINA','TABLETA','100 MG ','425','2239'),
(1,'MED401','QUETIAPINA','TABLETAS','200MG','827','4478'),
(1,'MED402','SEMAGLUTIDA 05 MG','LAPICERO','134MG/ML','599383','599383'),
(1,'MED403','METFORMINA CLORHIDRATO TABLETA DE LIBERACI N PROLOMGADA','TABLETA','1000MG','501','no regulado'),
(1,'MED404','INSULINA DEGLUTEC/LIRAGLUTIDA','SOLUCI N INYECTABLE','1000/36 MG','157629','157629'),
(1,'MED405','ROSUVASTATINA','TABLETA','40 MG','408','no regulado'),
(1,'MED406','LEVOTIROXINA','TABLETA','125 MG','203','no regulado'),
(1,'MED407','POLIETILENGLICOL+PROPILENGLICOL  (SYSTANE ULTRA) ','SOLUCION OFTALMICA','(4MG+3MG)/ML SOL OFT GTS FCO*10ML ','41753','no regulado'),
(1,'MED410','PANTOPRAZOL SODICO','TABLETA','40 MG','350','no regulado'),
(1,'MED411','CLOZAPINA','TABLETA','100MG','240','no regulado'),
(1,'MED412','SULFASALAZINA 500MG C*10 GG (ROSULFANT) - ROPSOHN','TABLETA','500 MG','571','no regulado'),
(1,'MED413','DUTASTERIDA/TAMSULOSINA','CAPSULA','05 + 04 MG','2009','2372'),
(1,'MED414','CICLOFOSFAMIDA 1G POL INY C*1 VIAL','POLVO INYENTABLE','1G ','82902','no regulado'),
(1,'MED415','FLUOROMETALONA ','SOLUCION OFTALMICA','1','12470','no regulado'),
(1,'MED416','HIDROCLOROTIAZIDA+VALSARTAN','TABLETA','12.5MG+160MG','1707','no regulado'),
(1,'MED417','LEVETIRACETAM','TABLETA','1000 MG','1239','2940'),
(1,'MED418','OXIBUTININA','COMPRIMIDOS','10MG','2900','2900'),
(1,'MED419','PREDNISOLONA','SOLUCION OFTALMICA','10MG/ML','9904','no regulado'),
(1,'MED420','RITUXIMAB','SOLUCION (VIAL)','500MG/50ML','3863132','4737550'),
(1,'MED421','VALSARTAN ','TABLETA','160 MG','558','1596'),
(1,'MED422','CARBONATO DE CALCIO','TABLETA','1500MG','118','no regulado'),
(1,'MED423','FORMULA TERAPEUTICA F-75','POLVO ORAL LATA *400 GR','75KCAL/100ML','93161','no regulado'),
(1,'MED424','FORMULA TERAPEUTICA FTCL','POLVO ORAL SOB *92GR','500 KCAL','9249','no regulado'),
(1,'MED425','DIENOGEST ESTROGENO + ETINILESTRADIOL (bellafaxe)','CAJA * 28 TABLETAS','','1605','1605'),
(1,'MED426','MISOPROSTROL CAJA * 3 TABLETAS','TABLETA ',' 200MG','4531','no regulado'),
(1,'MED427','ZIDOVUDINA','TABLETA','100MG','NO SE OFERTA','no regulado'),
(1,'MED428','LOPINAVIR + RITONAVIR','SOLUCION ORAL ','400/100MG/5ML','136950','no regulado'),
(1,'MED429','LOPINAVIR + RITONAVIR','TABLETA','100/25MG','NO SE OFERTA','no regulado'),
(1,'MED430','LOPINAVIR + RITONAVIR','TABLETA','200/50MG','1472','no regulado'),
(1,'MED431','ABACAVIR','SOLUCION ORAL','20MG/ML','71468','no regulado'),
(1,'MED432','ABACAVIR','TABLETA','300MG','566','no regulado'),
(1,'MED433','RALTEGRAVIR','TABLETA MASTICABLE','25MG','1982','1982'),
(1,'MED434','RALTEGRAVIR','TABLETA MASTICABLE','100 MG','7929','7929'),
(1,'MED435','RALTEGRAVIR','TABLETA RECUBIERTA','400MG','17326','31716'),
(1,'MED436','QUETIAPINA','TABLETA','25MG','177','559'),
(1,'MED437','VILDAGLIPTINA','TABLETA','50MG','1810','2084'),
(1,'MED438','LAMIVUDINA','TABLETA','150MG','1648','no regulado'),
(1,'MED439','PREGABALINA','CAPSULA','75MG','219','1667'),
(1,'MED440','AMLODIPINO + HIDROCLOROTIAZIDA+VALSARTAN','TABLETA','5MG+125 MG+160 MG','2035','2035'),
(1,'MED441','HIDRALAZINA','AMPOLLA','20 MG','NO SE OFERTA','no regulado'),
(1,'MED442','CEFTRIAZONA','AMPOLLA','500 MG','2018','no regulado'),
(1,'MED443','AZITROMICINA','SUSPENSION * 120 ML','250 MG/15 ML','NO SE OFERTA','no regulado');

INSERT IGNORE INTO users (nombres, apellidos, email, telefono, password, empresa_id,
    rol_id, cargo_id, municipio_id) VALUES
  ('Admin', 'Sistemas', 'sistemas@esesurorientecauca.gov.co', '', '$12$RW7SpcVLQspgwzzaPihIPOFiyafD3mYnYk0Huw/DOvyVpxEEU2abm', 1, 1, 1, 1);
  
/*
node -e "require('bcrypt').hash('ESESURORIENTECAUCA2026@',12).then(h=>console.log(h))"
*/