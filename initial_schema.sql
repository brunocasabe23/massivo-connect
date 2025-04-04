-- Script SQL para crear el esquema inicial de la base de datos gestion_compras_db

-- Función para actualizar automáticamente la columna fecha_actualizacion
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.fecha_actualizacion = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabla Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Permisos
CREATE TABLE permisos (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'activo',
    avatar_url VARCHAR(512),
    preferencias_notificaciones JSONB,
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para actualizar fecha_actualizacion en usuarios
CREATE TRIGGER update_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Tabla Usuario_Roles (Relación Muchos-a-Muchos)
CREATE TABLE usuario_roles (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuario_roles_pkey PRIMARY KEY (usuario_id, rol_id)
);

-- Tabla Rol_Permisos (Relación Muchos-a-Muchos)
CREATE TABLE rol_permisos (
    rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    asignado BOOLEAN NOT NULL DEFAULT true, -- Columna 'asignado' podría no ser necesaria si solo se insertan los asignados
    CONSTRAINT rol_permisos_pkey PRIMARY KEY (rol_id, permiso_id)
);

-- Tabla Codigos_Presupuestales
CREATE TABLE codigos_presupuestales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    monto_presupuesto DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    fecha_inicio_vigencia DATE,
    fecha_fin_vigencia DATE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para actualizar fecha_actualizacion en codigos_presupuestales
CREATE TRIGGER update_codigos_presupuestales_updated_at
BEFORE UPDATE ON codigos_presupuestales
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Tabla Usuario_Codigos_Presupuestales (Relación Muchos-a-Muchos)
CREATE TABLE usuario_codigos_presupuestales (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cp_id INTEGER NOT NULL REFERENCES codigos_presupuestales(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuario_codigos_presupuestales_pkey PRIMARY KEY (usuario_id, cp_id)
);

-- Tabla Ordenes_Compra
CREATE TABLE ordenes_compra (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id), -- ON DELETE SET NULL o RESTRICT podría ser mejor
    cp_id INTEGER NOT NULL REFERENCES codigos_presupuestales(id), -- ON DELETE RESTRICT podría ser mejor
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT NOT NULL,
    monto DECIMAL(15, 2) NOT NULL,
    proveedor VARCHAR(255),
    estado VARCHAR(50) NOT NULL DEFAULT 'Nueva',
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_actualizacion_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Trigger para actualizar fecha_actualizacion en ordenes_compra
CREATE TRIGGER update_ordenes_compra_updated_at
BEFORE UPDATE ON ordenes_compra
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Tabla Notificaciones
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT false,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    url_relacionada VARCHAR(512)
);

-- Index para buscar notificaciones no leídas por usuario
CREATE INDEX idx_notificaciones_usuario_leida ON notificaciones (usuario_id, leida);

-- Tabla Usuario_Permisos_Directos (Relación Muchos-a-Muchos)
CREATE TABLE usuario_permisos_directos (
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    permiso_id INTEGER NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuario_permisos_directos_pkey PRIMARY KEY (usuario_id, permiso_id)
);

-- Mensaje final (opcional)
-- SELECT 'Esquema inicial creado exitosamente.';