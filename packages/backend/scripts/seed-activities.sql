-- Script para insertar datos de ejemplo en la tabla actividades
-- Asegúrate de que la tabla actividades ya existe antes de ejecutar este script

-- Verificar si la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'actividades') THEN
        RAISE EXCEPTION 'La tabla actividades no existe. Ejecuta primero el script de creación de la tabla.';
    END IF;
END
$$;

-- Obtener el ID del primer usuario (generalmente el administrador)
DO $$
DECLARE
    admin_id INTEGER;
    user_id INTEGER;
BEGIN
    -- Obtener ID del administrador
    SELECT u.id INTO admin_id
    FROM usuarios u
    JOIN usuario_roles ur ON u.id = ur.usuario_id
    JOIN roles r ON ur.rol_id = r.id
    WHERE r.nombre = 'Administrador'
    LIMIT 1;
    
    -- Si no hay administrador, usar el primer usuario
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM usuarios ORDER BY id LIMIT 1;
    END IF;
    
    -- Si no hay usuarios, mostrar un error
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'No hay usuarios en la base de datos. Crea al menos un usuario antes de ejecutar este script.';
    END IF;
    
    -- Obtener otro usuario (si existe)
    SELECT id INTO user_id FROM usuarios WHERE id != admin_id ORDER BY id LIMIT 1;
    
    -- Si no hay otro usuario, usar el mismo administrador
    IF user_id IS NULL THEN
        user_id := admin_id;
    END IF;
    
    -- Limpiar tabla de actividades (opcional)
    -- DELETE FROM actividades;
    
    -- Insertar actividades de ejemplo
    
    -- Actividades del administrador
    INSERT INTO actividades (usuario_id, tipo_accion, descripcion, entidad_tipo, entidad_id, entidad_nombre, fecha_creacion)
    VALUES
    (admin_id, 'inicio_sesion', 'El usuario inició sesión', 'usuario', admin_id, 'Administrador', NOW() - INTERVAL '1 hour'),
    (admin_id, 'crear_rol', 'Se creó un nuevo rol', 'rol', 1, 'Analista', NOW() - INTERVAL '2 hours'),
    (admin_id, 'actualizar_permisos_rol', 'Se actualizaron los permisos del rol', 'rol', 1, 'Administrador', NOW() - INTERVAL '3 hours'),
    (admin_id, 'crear_usuario', 'Se creó un nuevo usuario', 'usuario', user_id, 'Usuario', NOW() - INTERVAL '1 day');
    
    -- Actividades del usuario (si es diferente del administrador)
    IF user_id != admin_id THEN
        INSERT INTO actividades (usuario_id, tipo_accion, descripcion, entidad_tipo, entidad_id, entidad_nombre, fecha_creacion)
        VALUES
        (user_id, 'inicio_sesion', 'El usuario inició sesión', 'usuario', user_id, 'Usuario', NOW() - INTERVAL '30 minutes'),
        (user_id, 'actualizar_perfil', 'El usuario actualizó su perfil', 'usuario', user_id, 'Usuario', NOW() - INTERVAL '4 hours');
    END IF;
    
    -- Más actividades del administrador
    INSERT INTO actividades (usuario_id, tipo_accion, descripcion, entidad_tipo, entidad_id, entidad_nombre, fecha_creacion)
    VALUES
    (admin_id, 'eliminar_rol', 'Se eliminó un rol', 'rol', 2, 'Rol eliminado', NOW() - INTERVAL '2 days'),
    (admin_id, 'actualizar_codigo_presupuestal', 'Se actualizó un código presupuestal', 'codigo_presupuestal', 1, 'CP-2023', NOW() - INTERVAL '3 days');
    
    RAISE NOTICE 'Se han insertado actividades de ejemplo correctamente.';
END
$$;
