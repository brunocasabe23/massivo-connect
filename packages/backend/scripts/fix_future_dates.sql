-- Script para corregir fechas futuras en la base de datos

-- Actualizar fechas de creación futuras en la tabla usuarios
UPDATE usuarios
SET fecha_creacion = CURRENT_TIMESTAMP,
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE fecha_creacion > CURRENT_TIMESTAMP;

-- Actualizar fechas de actualización futuras en la tabla usuarios
UPDATE usuarios
SET fecha_actualizacion = CURRENT_TIMESTAMP
WHERE fecha_actualizacion > CURRENT_TIMESTAMP;

-- Actualizar fechas de creación futuras en la tabla actividades
UPDATE actividades
SET fecha_creacion = CURRENT_TIMESTAMP
WHERE fecha_creacion > CURRENT_TIMESTAMP;

-- Actualizar fechas de creación futuras en la tabla roles
UPDATE roles
SET fecha_creacion = CURRENT_TIMESTAMP
WHERE fecha_creacion > CURRENT_TIMESTAMP;

-- Actualizar fechas de creación futuras en la tabla permisos
UPDATE permisos
SET fecha_creacion = CURRENT_TIMESTAMP
WHERE fecha_creacion > CURRENT_TIMESTAMP;

-- Actualizar fechas de asignación futuras en la tabla usuario_roles
UPDATE usuario_roles
SET fecha_asignacion = CURRENT_TIMESTAMP
WHERE fecha_asignacion > CURRENT_TIMESTAMP;

-- Actualizar fechas de asignación futuras en la tabla usuario_permisos_directos
UPDATE usuario_permisos_directos
SET fecha_asignacion = CURRENT_TIMESTAMP
WHERE fecha_asignacion > CURRENT_TIMESTAMP;

-- Actualizar fechas futuras en la tabla codigos_presupuestales
UPDATE codigos_presupuestales
SET fecha_creacion = CURRENT_TIMESTAMP,
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE fecha_creacion > CURRENT_TIMESTAMP OR fecha_actualizacion > CURRENT_TIMESTAMP;

-- Actualizar fechas futuras en la tabla ordenes_compra
UPDATE ordenes_compra
SET fecha_creacion = CURRENT_TIMESTAMP,
    fecha_actualizacion = CURRENT_TIMESTAMP
WHERE fecha_creacion > CURRENT_TIMESTAMP OR fecha_actualizacion > CURRENT_TIMESTAMP;
