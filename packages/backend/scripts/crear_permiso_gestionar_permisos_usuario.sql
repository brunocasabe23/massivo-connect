-- Script para crear el permiso gestionar_permisos_usuario
-- Ejecutar este script en la base de datos

DO $$
DECLARE
    permiso_id INTEGER;
    rol_admin_id INTEGER;
    permiso_existe BOOLEAN;
    asignacion_existe BOOLEAN;
BEGIN
    -- Iniciar una transacción
    BEGIN
        -- Verificar si el permiso ya existe
        SELECT EXISTS(SELECT 1 FROM permisos WHERE clave = 'gestionar_permisos_usuario') INTO permiso_existe;
        
        IF permiso_existe THEN
            RAISE NOTICE 'El permiso gestionar_permisos_usuario ya existe.';
            
            -- Obtener el ID del permiso existente
            SELECT id INTO permiso_id FROM permisos WHERE clave = 'gestionar_permisos_usuario';
        ELSE
            -- Crear el permiso
            INSERT INTO permisos (clave, descripcion) 
            VALUES ('gestionar_permisos_usuario', 'Permite gestionar los permisos directos de los usuarios')
            RETURNING id INTO permiso_id;
            
            RAISE NOTICE 'Permiso gestionar_permisos_usuario creado con ID: %', permiso_id;
        END IF;
        
        -- Obtener el ID del rol Administrador
        SELECT id INTO rol_admin_id FROM roles WHERE nombre = 'Administrador';
        
        IF rol_admin_id IS NULL THEN
            RAISE EXCEPTION 'No se encontró el rol Administrador';
        END IF;
        
        -- Verificar si el permiso ya está asignado al rol Administrador
        SELECT EXISTS(
            SELECT 1 FROM rol_permisos 
            WHERE rol_id = rol_admin_id AND permiso_id = permiso_id
        ) INTO asignacion_existe;
        
        IF asignacion_existe THEN
            RAISE NOTICE 'El permiso ya está asignado al rol Administrador.';
        ELSE
            -- Asignar el permiso al rol Administrador
            INSERT INTO rol_permisos (rol_id, permiso_id) 
            VALUES (rol_admin_id, permiso_id);
            
            RAISE NOTICE 'Permiso asignado al rol Administrador.';
        END IF;
        
        -- Confirmar la transacción
        COMMIT;
        RAISE NOTICE 'Operación completada exitosamente.';
    EXCEPTION
        WHEN OTHERS THEN
            -- Revertir la transacción en caso de error
            ROLLBACK;
            RAISE EXCEPTION 'Error: %', SQLERRM;
    END;
END $$;
