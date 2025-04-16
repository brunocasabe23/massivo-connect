-- Script para crear el permiso eliminar_usuarios
-- Ejecutar este script en la base de datos

-- Verificar si el permiso ya existe
DO $$
DECLARE
    permiso_existe BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM permisos WHERE clave = 'eliminar_usuarios') INTO permiso_existe;
    
    IF permiso_existe THEN
        RAISE NOTICE 'El permiso eliminar_usuarios ya existe.';
    ELSE
        -- Crear el permiso
        INSERT INTO permisos (clave, descripcion) 
        VALUES ('eliminar_usuarios', 'Permite eliminar usuarios del sistema');
        
        RAISE NOTICE 'Permiso eliminar_usuarios creado exitosamente.';
        
        -- Asignar el permiso al rol Administrador (asumiendo que el ID del rol Administrador es 1)
        -- Verificar primero si el rol Administrador existe
        DECLARE
            rol_admin_id INTEGER;
        BEGIN
            SELECT id INTO rol_admin_id FROM roles WHERE nombre = 'Administrador';
            
            IF rol_admin_id IS NOT NULL THEN
                -- Obtener el ID del permiso recién creado
                DECLARE
                    permiso_id INTEGER;
                BEGIN
                    SELECT id INTO permiso_id FROM permisos WHERE clave = 'eliminar_usuarios';
                    
                    -- Verificar si la asignación ya existe
                    DECLARE
                        asignacion_existe BOOLEAN;
                    BEGIN
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
                    END;
                END;
            ELSE
                RAISE NOTICE 'No se encontró el rol Administrador.';
            END IF;
        END;
    END IF;
END $$;
