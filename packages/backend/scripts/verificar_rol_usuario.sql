-- Script para verificar si el rol "Usuario" existe y crearlo si no existe

DO $$
DECLARE
    rol_usuario_id INTEGER;
    rol_usuario_existe BOOLEAN;
BEGIN
    -- Verificar si el rol "Usuario" existe
    SELECT EXISTS(SELECT 1 FROM roles WHERE nombre = 'Usuario') INTO rol_usuario_existe;
    
    IF rol_usuario_existe THEN
        -- Obtener el ID del rol "Usuario"
        SELECT id INTO rol_usuario_id FROM roles WHERE nombre = 'Usuario';
        RAISE NOTICE 'El rol "Usuario" ya existe con ID: %', rol_usuario_id;
    ELSE
        -- Crear el rol "Usuario"
        INSERT INTO roles (nombre, descripcion)
        VALUES ('Usuario', 'Rol básico para usuarios registrados')
        RETURNING id INTO rol_usuario_id;
        
        RAISE NOTICE 'Se ha creado el rol "Usuario" con ID: %', rol_usuario_id;
        
        -- Asignar permisos básicos al rol "Usuario"
        -- Aquí puedes agregar los permisos que deseas que tengan los usuarios por defecto
        -- Por ejemplo:
        INSERT INTO rol_permisos (rol_id, permiso_id)
        SELECT rol_usuario_id, id FROM permisos WHERE clave = 'ver_compras';
        
        INSERT INTO rol_permisos (rol_id, permiso_id)
        SELECT rol_usuario_id, id FROM permisos WHERE clave = 'ver_viaticos';
        
        RAISE NOTICE 'Se han asignado permisos básicos al rol "Usuario"';
    END IF;
END $$;
