-- Script detallado para crear el permiso eliminar_usuarios
-- Este script incluye manejo de errores y verificaciones adicionales

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
        SELECT EXISTS(SELECT 1 FROM permisos WHERE clave = 'eliminar_usuarios') INTO permiso_existe;
        
        IF permiso_existe THEN
            RAISE NOTICE 'El permiso eliminar_usuarios ya existe.';
            
            -- Obtener el ID del permiso existente
            SELECT id INTO permiso_id FROM permisos WHERE clave = 'eliminar_usuarios';
        ELSE
            -- Crear el permiso
            INSERT INTO permisos (clave, descripcion) 
            VALUES ('eliminar_usuarios', 'Permite eliminar usuarios del sistema')
            RETURNING id INTO permiso_id;
            
            RAISE NOTICE 'Permiso eliminar_usuarios creado con ID: %', permiso_id;
        END IF;
        
        -- Verificar si el rol Administrador existe
        SELECT id INTO rol_admin_id FROM roles WHERE nombre = 'Administrador';
        
        IF rol_admin_id IS NULL THEN
            RAISE EXCEPTION 'El rol Administrador no existe.';
        END IF;
        
        -- Verificar si la asignación ya existe
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
        
    EXCEPTION WHEN OTHERS THEN
        -- Revertir la transacción en caso de error
        ROLLBACK;
        RAISE EXCEPTION 'Error al crear o asignar el permiso: %', SQLERRM;
    END;
END $$;
