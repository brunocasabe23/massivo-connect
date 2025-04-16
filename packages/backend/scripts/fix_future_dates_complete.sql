-- Script completo para corregir fechas futuras en la base de datos

-- Función para verificar si una fecha es futura
CREATE OR REPLACE FUNCTION is_future_date(check_date TIMESTAMP) RETURNS BOOLEAN AS $$
BEGIN
    RETURN check_date > CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Actualizar fechas de creación futuras en la tabla usuarios
UPDATE usuarios
SET fecha_creacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_creacion);

-- Actualizar fechas de actualización futuras en la tabla usuarios
UPDATE usuarios
SET fecha_actualizacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_actualizacion);

-- Actualizar fechas de expiración de reset de contraseña futuras en la tabla usuarios
UPDATE usuarios
SET reset_password_expires = NULL
WHERE is_future_date(reset_password_expires);

-- Actualizar fechas de creación futuras en la tabla actividades
UPDATE actividades
SET fecha_creacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_creacion);

-- Actualizar fechas de creación futuras en la tabla roles
UPDATE roles
SET fecha_creacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_creacion);

-- Actualizar fechas de creación futuras en la tabla permisos
UPDATE permisos
SET fecha_creacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_creacion);

-- Actualizar fechas de asignación futuras en la tabla usuario_roles
UPDATE usuario_roles
SET fecha_asignacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_asignacion);

-- Actualizar fechas de asignación futuras en la tabla usuario_permisos_directos
UPDATE usuario_permisos_directos
SET fecha_asignacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_asignacion);

-- Actualizar fechas futuras en la tabla codigos_presupuestales
UPDATE codigos_presupuestales
SET fecha_creacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_creacion);

UPDATE codigos_presupuestales
SET fecha_actualizacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_actualizacion);

-- Actualizar fechas de inicio de vigencia futuras en la tabla codigos_presupuestales
UPDATE codigos_presupuestales
SET fecha_inicio_vigencia = CURRENT_DATE
WHERE fecha_inicio_vigencia > CURRENT_DATE;

-- Actualizar fechas de fin de vigencia futuras en la tabla codigos_presupuestales
-- Solo si la fecha de inicio también es futura
UPDATE codigos_presupuestales
SET fecha_fin_vigencia = CURRENT_DATE + INTERVAL '1 year'
WHERE fecha_fin_vigencia > CURRENT_DATE AND fecha_inicio_vigencia > CURRENT_DATE;

-- Actualizar fechas de asignación futuras en la tabla usuario_codigos_presupuestales
UPDATE usuario_codigos_presupuestales
SET fecha_asignacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_asignacion);

-- Actualizar fechas futuras en la tabla ordenes_compra
UPDATE ordenes_compra
SET fecha_creacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_creacion);

UPDATE ordenes_compra
SET fecha_actualizacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_actualizacion);

-- Actualizar fechas de creación futuras en la tabla notificaciones
UPDATE notificaciones
SET fecha_creacion = CURRENT_TIMESTAMP
WHERE is_future_date(fecha_creacion);

-- Eliminar la función temporal
DROP FUNCTION IF EXISTS is_future_date;

-- Mostrar mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE 'Todas las fechas futuras han sido corregidas.';
END $$;
