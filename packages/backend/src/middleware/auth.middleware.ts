import jwt from 'jsonwebtoken';
import pool from '../config/db'; // Importar el pool de la base de datos
import { AuthenticatedRequest } from '../types/request';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_secreto';

export const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extraer token 'Bearer <token>'

  if (token == null) {
    return res.status(401).json({ message: 'Acceso denegado: No se proporcionó token.' }); // No token
  }

  try {
    // Verificar el token
    const user: any = jwt.verify(token, JWT_SECRET);

    // Token válido, verificar si el usuario está activo en la BD
    const client = await pool.connect();

    try {
      // Obtener estado y area_id del usuario
      const dbUserResult = await client.query('SELECT estado, area_id FROM usuarios WHERE id = $1', [user.id]);

      if (dbUserResult.rows.length === 0) {
        console.error(`[AuthMiddleware] Usuario no encontrado en BD: ${user.id}`);
        return res.status(403).json({ message: 'Usuario no encontrado.' });
      }

      const dbUser = dbUserResult.rows[0];
      // Verificar si el estado NO es 'activo'
      if (dbUser.estado !== 'activo') {
        console.log(`[AuthMiddleware] Acceso denegado para usuario con estado '${dbUser.estado}': ${user.id}`);
        // Mensaje genérico para no revelar si está inactivo o pendiente
        return res.status(403).json({ message: 'Acceso denegado: Su cuenta no está activa.' });
      }

      // Obtener permisos del usuario
      const permissionsQuery = `
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

      const permissionsResult = await client.query(permissionsQuery, [user.id]);
            const userPermissions = permissionsResult.rows.map(row => row.clave);
      
            // Obtener el rol principal del usuario (asumiendo que un usuario tiene al menos un rol)
            const roleQuery = `
              SELECT r.nombre
              FROM roles r
              JOIN usuario_roles ur ON r.id = ur.rol_id
              WHERE ur.usuario_id = $1
              ORDER BY r.id -- O alguna lógica para determinar el rol principal si hay varios
              LIMIT 1;
            `;
            const roleResult = await client.query(roleQuery, [user.id]);
            const userRoleName = roleResult.rows.length > 0 ? roleResult.rows[0].nombre : null;
      
            // Usuario activo, adjuntar payload del usuario a la solicitud
            (req as AuthenticatedRequest).user = {
              ...user,
              area_id: dbUser.area_id,
              permisos: userPermissions,
              rolNombre: userRoleName // Añadir el nombre del rol
            };

      next(); // Pasar al siguiente middleware o controlador
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('[AuthMiddleware] Error:', error.message);

    // Diferenciar entre token expirado y otros errores
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.' });
    }

    return res.status(403).json({ message: 'Token inválido.' });
  }
};

// Podríamos añadir aquí un middleware para verificar roles/permisos específicos
// export const authorizeRoles = (...allowedRoles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//      if (!req.user || !req.user.roles || !req.user.roles.some(role => allowedRoles.includes(role))) {
//         return res.status(403).json({ message: 'Acceso denegado: Rol no autorizado.' });
//      }
//      next();
//   };
// };
