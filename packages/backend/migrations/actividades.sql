-- Tabla para registrar actividades de los usuarios
CREATE TABLE actividades (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_accion VARCHAR(50) NOT NULL, -- 'crear_usuario', 'modificar_rol', etc.
    descripcion TEXT NOT NULL, -- Descripción legible de la acción
    entidad_tipo VARCHAR(50), -- 'usuario', 'rol', 'permiso', etc.
    entidad_id INTEGER, -- ID de la entidad afectada
    entidad_nombre VARCHAR(255), -- Nombre de la entidad afectada
    datos_adicionales JSONB, -- Datos adicionales en formato JSON
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_actividades_usuario_id ON actividades(usuario_id);
CREATE INDEX idx_actividades_fecha_creacion ON actividades(fecha_creacion);
CREATE INDEX idx_actividades_tipo_accion ON actividades(tipo_accion);

-- Comentarios para documentar la tabla
COMMENT ON TABLE actividades IS 'Registro de actividades de los usuarios en el sistema';
COMMENT ON COLUMN actividades.tipo_accion IS 'Tipo de acción realizada (crear_usuario, modificar_rol, etc.)';
COMMENT ON COLUMN actividades.entidad_tipo IS 'Tipo de entidad afectada (usuario, rol, permiso, etc.)';
COMMENT ON COLUMN actividades.entidad_id IS 'ID de la entidad afectada';
COMMENT ON COLUMN actividades.entidad_nombre IS 'Nombre de la entidad afectada para facilitar la visualización';
COMMENT ON COLUMN actividades.datos_adicionales IS 'Datos adicionales en formato JSON para detalles específicos de la acción';
