import { Request, Response, NextFunction } from 'express';
import pool from '../config/db'; // Asegúrate que la ruta al pool de DB sea correcta
import { PoolClient, QueryResult } from 'pg';

/**
 * Middleware factory para verificar si el usuario autenticado tiene un permiso específico.
 * Considera tanto los permisos heredados del rol como los permisos directos.
 * @param requiredPermissionKey La clave (string) del permiso requerido (ej: 'crear_usuarios').
 */
export const checkPermission = (requiredPermissionKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log(`[PermMiddleware] Verificando permiso '${requiredPermissionKey}'. req.user:`, req.user); // Log de req.user al inicio
    // Asumimos que authenticateToken ya se ejecutó y adjuntó req.user
    // Corregir la comprobación y la asignación para usar 'userId' (camelCase) del payload del token
    if (!req.user || !req.user.userId) { 
      console.error('Middleware checkPermission: req.user o req.user.userId no encontrado. Asegúrate que authenticateToken se ejecute antes y que el token contenga userId.');
      return res.status(401).json({ message: 'Usuario no autenticado correctamente.' });
    }

    const userId = req.user.userId; // <--- Usar userId
    let client: PoolClient | null = null;

    try {
      client = await pool.connect();

      // Obtener TODOS los permisos efectivos del usuario (rol + directos)
      // Usamos UNION para combinar permisos de rol y directos, eliminando duplicados.
      const effectivePermissionsQuery = `
        SELECT p.clave
        FROM permisos p
        JOIN rol_permisos rp ON p.id = rp.permiso_id
        JOIN usuario_roles ur ON rp.rol_id = ur.rol_id
        WHERE ur.usuario_id = $1
        UNION
        SELECT p.clave
        FROM permisos p
        JOIN usuario_permisos_directos upd ON p.id = upd.permiso_id
        WHERE upd.usuario_id = $1;
      `;

      const permissionsResult: QueryResult = await client.query(effectivePermissionsQuery, [userId]);
      const userPermissionKeys: string[] = permissionsResult.rows.map(row => row.clave);

      console.log(`[PermMiddleware] Permisos efectivos para usuario ${userId}: [${userPermissionKeys.join(', ')}]`);

      // Verificar si el permiso requerido está en la lista de permisos efectivos
      if (userPermissionKeys.includes(requiredPermissionKey)) {
        // El usuario tiene el permiso, continuar al siguiente middleware/controlador
        next();
      } else {
        // El usuario no tiene el permiso
        console.warn(`Acceso denegado para usuario ${userId} al recurso que requiere permiso '${requiredPermissionKey}'.`);
        return res.status(403).json({ message: `Acceso denegado: Permiso '${requiredPermissionKey}' requerido.` });
      }

    } catch (error) {
      console.error('Error en middleware checkPermission:', error);
      return res.status(500).json({ message: 'Error interno del servidor al verificar permisos.' });
    } finally {
      client?.release();
    }
  };
};