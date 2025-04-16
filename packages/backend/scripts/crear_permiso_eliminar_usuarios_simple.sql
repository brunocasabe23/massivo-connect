-- Script simple para crear el permiso eliminar_usuarios
-- Este script ejecuta cada paso por separado para identificar dónde ocurre el error

-- Paso 1: Crear el permiso
INSERT INTO permisos (clave, descripcion) 
VALUES ('eliminar_usuarios', 'Permite eliminar usuarios del sistema');

-- Paso 2: Verificar que el permiso se creó correctamente
SELECT id, clave, descripcion FROM permisos WHERE clave = 'eliminar_usuarios';

-- Paso 3: Asignar el permiso al rol Administrador
INSERT INTO rol_permisos (rol_id, permiso_id) 
SELECT 1, id FROM permisos WHERE clave = 'eliminar_usuarios';

-- Paso 4: Verificar que la asignación se creó correctamente
SELECT r.nombre AS rol_nombre, p.clave AS permiso_clave
FROM rol_permisos rp
JOIN roles r ON rp.rol_id = r.id
JOIN permisos p ON rp.permiso_id = p.id
WHERE p.clave = 'eliminar_usuarios';
