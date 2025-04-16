// import { Request, Response } from 'express';
import bcrypt from 'bcrypt'; // Importar bcrypt
import pool from '../config/db';
import { PoolClient, QueryResult } from 'pg';
import { registerActivity } from '../services/activity.service';
// import { AuthenticatedRequest } from '../request'; // Importar interfaz extendida

// Usar any para evitar problemas de tipos
type Response = any;
type AuthenticatedRequest = any;
type Request = any;

const SALT_ROUNDS = 10; // Definir SALT_ROUNDS
// Eliminar importación duplicada
// Eliminar esta línea duplicada
// --- Controlador para obtener todos los usuarios ---
export const getAllUsers = async (req: Request, res: Response): Promise<Response> => { // Usar Request estándar
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // Consulta ajustada según el esquema
    const usersQuery = `
      SELECT
        u.id,
        u.nombre AS name,
        u.email,
        r.nombre AS role,
        ur.rol_id, -- Añadir rol_id
        -- u.departamento AS department, -- Columna no existe en el esquema
        u.estado AS status,
        -- u.ultimo_login AS "lastLogin", -- Columna no existe en el esquema
        u.fecha_creacion AS "createdAt", -- No necesita comillas
        u.avatar_url AS avatar,
        u.area_id, -- Añadir area_id
        a.nombre AS area_nombre -- Añadir nombre del área
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      LEFT JOIN areas a ON u.area_id = a.id -- Añadir JOIN con areas
      ORDER BY u.fecha_creacion DESC;
    `;

    const usersResult: QueryResult = await client.query(usersQuery);
    const users = usersResult.rows;

    return res.status(200).json(users); // Devolver el array de usuarios

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener usuarios.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para obtener todos los roles ---
export const getAllRoles = async (req: Request, res: Response): Promise<Response> => { // Usar Request estándar
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // Consulta corregida para obtener roles y contar usuarios/permisos asociados
    const rolesQuery = `
      SELECT
        r.id,
        r.nombre AS name,
        r.descripcion AS description, -- Añadido para obtener la descripción
        r.fecha_creacion AS "createdAt",
        -- r.fecha_actualizacion AS "updatedAt", -- Asumiendo que no existe o no se necesita
        COUNT(DISTINCT ur.usuario_id)::int AS users, -- Contar usuarios únicos por rol
        COUNT(DISTINCT rp.permiso_id)::int AS permissions -- Contar permisos únicos por rol
      FROM roles r
      LEFT JOIN usuario_roles ur ON r.id = ur.rol_id
      LEFT JOIN rol_permisos rp ON r.id = rp.rol_id
      GROUP BY r.id, r.nombre, r.descripcion, r.fecha_creacion -- Añadido r.descripcion al GROUP BY
      ORDER BY r.nombre ASC;
    `;

    const rolesResult: QueryResult = await client.query(rolesQuery);
    const roles = rolesResult.rows;

    return res.status(200).json(roles); // Devolver el array de roles

  } catch (error) {
    console.error('Error al obtener roles:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener roles.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para obtener todos los permisos ---
export const getAllPermissions = async (req: Request, res: Response): Promise<Response> => { // Usar Request estándar
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // Consulta corregida para obtener todos los permisos
    const permissionsQuery = `
      SELECT
        p.id,
        p.clave AS name, -- Usar 'clave' como 'name'
        p.descripcion AS description
        -- p.categoria AS category -- Columna no existe en permisos
      FROM permisos p
      ORDER BY p.clave ASC; -- Ordenar por clave ya que no hay categoría
    `;

    const permissionsResult: QueryResult = await client.query(permissionsQuery);
    let permissions = permissionsResult.rows;

    // Intentar inferir categoría desde la clave (name)
    permissions = permissions.map(perm => {
      let category = 'General'; // Categoría por defecto
      if (perm.name && perm.name.includes('_')) {
        const parts = perm.name.split('_');
        if (parts.length > 1) {
          // Capitalizar la primera letra de la categoría inferida
          const inferredCategory = parts.slice(1).join('_'); // Unir el resto por si hay más '_'
          category = inferredCategory.charAt(0).toUpperCase() + inferredCategory.slice(1);
        }
      }
      return { ...perm, category }; // Añadir la propiedad category
    });

    return res.status(200).json(permissions); // Devolver permisos con categoría inferida

  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener permisos.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para crear un nuevo rol ---
export const createRole = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest (para req.user.id)
  // Añadir 'description' a la desestructuración
  const { name, description, permissionIds } = req.body;

  // Validación básica
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'El nombre del rol es requerido.' });
  }
  // Validar que permissionIds sea un array (puede estar vacío)
  if (!Array.isArray(permissionIds)) {
     return res.status(400).json({ message: 'Se esperaba un array de IDs de permisos.' });
  }

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN'); // Iniciar transacción

    // 1. Insertar el nuevo rol (con descripción)
    const insertRoleQuery = `
      INSERT INTO roles (nombre, descripcion)
      VALUES ($1, $2)
      RETURNING id, nombre, descripcion, fecha_creacion AS "createdAt"
    `;
    // Pasar 'name' y 'description' a la consulta
    const roleResult: QueryResult = await client.query(insertRoleQuery, [name.trim(), description || null]); // Usar null si la descripción está vacía
    const newRole = roleResult.rows[0];

    // 2. Asociar los permisos seleccionados (IDs numéricos) al nuevo rol
    if (permissionIds.length > 0) {
      // Validar que los IDs sean números (opcional pero recomendado)
      const numericPermissionIds = permissionIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

      if (numericPermissionIds.length > 0) {
        // Crear los valores para la inserción múltiple
        const insertPermissionsValues = numericPermissionIds.map(permId => `(${newRole.id}, ${permId})`).join(',');
        const insertPermissionsQuery = `INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ${insertPermissionsValues}`;
        await client.query(insertPermissionsQuery);
      } else {
         console.warn("Se recibieron permissionIds, pero no eran IDs numéricos válidos:", permissionIds);
      }
    }

    await client.query('COMMIT'); // Confirmar transacción

    // Registrar la actividad de creación de rol
    if (req.user && req.user.id) { // Usar req.user.id
      await registerActivity({
        usuario_id: req.user.id, // Usar req.user.id
        tipo_accion: 'crear_rol',
        descripcion: `Se creó un nuevo rol: ${name}`,
        entidad_tipo: 'rol',
        entidad_id: newRole.id,
        entidad_nombre: name,
        datos_adicionales: { permisos: permissionIds.length }
      }).catch(err => console.error('Error al registrar actividad de creación de rol:', err));
    }

    // Devolver el rol creado (con descripción)
    // Añadir campos 'users' y 'permissions' con valor 0 por defecto para consistencia con getAllRoles
    const roleToReturn = { ...newRole, users: 0, permissions: permissionIds.length };
    return res.status(201).json(roleToReturn);

  } catch (error) {
    await client?.query('ROLLBACK'); // Revertir transacción en caso de error
    console.error('Error al crear rol:', error);
    // Manejar error de nombre duplicado (unique constraint)
    if (error instanceof Error && (error as any).code === '23505') { // Código de error PostgreSQL para unique_violation
       return res.status(409).json({ message: `El nombre de rol '${name}' ya existe.` });
    }
    return res.status(500).json({ message: 'Error interno del servidor al crear rol.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para obtener los permisos de un rol específico ---
export const getRolePermissions = async (req: Request, res: Response): Promise<Response> => { // Usar Request estándar
  const { roleId } = req.params;
  let client: PoolClient | null = null;

  try {
    client = await pool.connect();

    // Consulta para obtener los permisos asociados a un rol_id
    const permissionsQuery = `
      SELECT p.id, p.clave AS name, p.descripcion AS description -- , p.categoria AS category (si existiera)
      FROM permisos p
      JOIN rol_permisos rp ON p.id = rp.permiso_id
      WHERE rp.rol_id = $1
      ORDER BY p.clave ASC;
    `;

    const permissionsResult: QueryResult = await client.query(permissionsQuery, [roleId]);
    const permissions = permissionsResult.rows;

    return res.status(200).json(permissions); // Devolver array de permisos para ese rol

  } catch (error) {
    console.error(`Error al obtener permisos para el rol ${roleId}:`, error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener permisos del rol.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para actualizar el rol de un usuario ---
export const updateUserRole = async (req: Request, res: Response): Promise<Response> => { // Usar Request estándar
  const { userId } = req.params; // Obtener userId de los parámetros de la ruta
  const { roleId } = req.body; // Obtener roleId del cuerpo de la solicitud

  // Validación básica
  if (!roleId) {
    return res.status(400).json({ message: 'El ID del rol es requerido.' });
  }

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN'); // Iniciar transacción

    // 1. Eliminar cualquier rol existente para este usuario
    const deleteExistingRoleQuery = `DELETE FROM usuario_roles WHERE usuario_id = $1`;
    await client.query(deleteExistingRoleQuery, [userId]);

    // 2. Insertar la nueva asignación de rol
    // Asegurarse de que roleId sea un número si la columna es INTEGER
    const numericRoleId = parseInt(roleId, 10);
    if (isNaN(numericRoleId)) {
       await client.query('ROLLBACK');
       return res.status(400).json({ message: 'El ID del rol proporcionado no es válido.' });
    }

    const insertNewRoleQuery = `
      INSERT INTO usuario_roles (usuario_id, rol_id)
      VALUES ($1, $2)
    `;
    await client.query(insertNewRoleQuery, [userId, numericRoleId]);

    await client.query('COMMIT'); // Confirmar transacción

    // Opcional: Devolver el usuario actualizado o un mensaje de éxito
    // Para devolver el usuario actualizado, necesitaríamos hacer otra consulta
    // Por ahora, devolvemos un mensaje de éxito.
    return res.status(200).json({ message: 'Rol de usuario actualizado exitosamente.' });

  } catch (error) {
    await client?.query('ROLLBACK'); // Revertir transacción en caso de error
    console.error('Error al actualizar rol de usuario:', error);
    // Podríamos añadir manejo específico para foreign key constraints si userId o roleId no existen
    return res.status(500).json({ message: 'Error interno del servidor al actualizar rol de usuario.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para eliminar un rol ---
export const deleteRole = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest (para req.user.id)
  const { roleId } = req.params;
  let client: PoolClient | null = null;

  // Validar que roleId sea un número
  const numericRoleId = parseInt(roleId, 10);
  if (isNaN(numericRoleId)) {
    return res.status(400).json({ message: 'El ID del rol proporcionado no es válido.' });
  }

  try {
    client = await pool.connect();
    // No es necesario BEGIN/COMMIT para una sola sentencia DELETE
    const deleteQuery = 'DELETE FROM roles WHERE id = $1 RETURNING id'; // RETURNING para confirmar
    const result = await client.query(deleteQuery, [numericRoleId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Rol con ID ${numericRoleId} no encontrado.` });
    }

    // Registrar la actividad de eliminación de rol
    if (req.user && req.user.id) { // Usar req.user.id
      await registerActivity({
        usuario_id: req.user.id, // Usar req.user.id
        tipo_accion: 'eliminar_rol',
        descripcion: `Se eliminó un rol con ID ${numericRoleId}`,
        entidad_tipo: 'rol',
        entidad_id: numericRoleId
      }).catch(err => console.error('Error al registrar actividad de eliminación de rol:', err));
    }

    console.log(`[AdminCtrl] Rol con ID ${numericRoleId} eliminado.`);
    return res.status(200).json({ message: `Rol con ID ${numericRoleId} eliminado exitosamente.` }); // O status 204 No Content

  } catch (error: any) {
    console.error(`Error al eliminar rol ${numericRoleId}:`, error);
    // Podríamos manejar errores específicos, como si un rol protegido no se puede eliminar
    return res.status(500).json({ message: 'Error interno del servidor al eliminar rol.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para actualizar los permisos de un rol ---
export const updateRolePermissions = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest (para req.user.id)
  const { roleId } = req.params;
  const { permissionIds } = req.body; // Espera un array de IDs numéricos de permisos

  // Validar roleId
  const numericRoleId = parseInt(roleId, 10);
  if (isNaN(numericRoleId)) {
    return res.status(400).json({ message: 'El ID del rol proporcionado no es válido.' });
  }

  // Validar permissionIds
  if (!Array.isArray(permissionIds)) {
    return res.status(400).json({ message: 'Se esperaba un array de IDs de permisos.' });
  }
  const numericPermissionIds = permissionIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  // Podríamos añadir una validación extra para asegurar que los IDs existen en la tabla permisos

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // 1. Eliminar todos los permisos existentes para este rol
    const deleteQuery = 'DELETE FROM rol_permisos WHERE rol_id = $1';
    await client.query(deleteQuery, [numericRoleId]);

    // 2. Insertar las nuevas asignaciones de permisos (si hay alguna)
    if (numericPermissionIds.length > 0) {
      const insertPermissionsValues = numericPermissionIds.map(permId => `(${numericRoleId}, ${permId})`).join(',');
      const insertPermissionsQuery = `INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ${insertPermissionsValues}`;
      await client.query(insertPermissionsQuery);
    }

    await client.query('COMMIT');

    // Registrar la actividad de actualización de permisos de rol
    if (req.user && req.user.id) { // Usar req.user.id
      await registerActivity({
        usuario_id: req.user.id, // Usar req.user.id
        tipo_accion: 'actualizar_permisos_rol',
        descripcion: `Se actualizaron los permisos del rol con ID ${numericRoleId}`,
        entidad_tipo: 'rol',
        entidad_id: numericRoleId,
        datos_adicionales: { permisos: numericPermissionIds.length }
      }).catch(err => console.error('Error al registrar actividad de actualización de permisos de rol:', err));
    }

    console.log(`[AdminCtrl] Permisos actualizados para rol ID ${numericRoleId}. Nuevos permisos: ${numericPermissionIds.length}`);
    // Devolver los nuevos permisos asignados o un mensaje de éxito
    // Podríamos hacer una consulta para devolver los permisos actualizados
    return res.status(200).json({ message: 'Permisos del rol actualizados exitosamente.', assignedPermissions: numericPermissionIds.length });

  } catch (error: any) {
    await client?.query('ROLLBACK');
    console.error(`Error al actualizar permisos para rol ${numericRoleId}:`, error);
    return res.status(500).json({ message: 'Error interno del servidor al actualizar permisos del rol.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para obtener los permisos directos de un usuario ---
export const getUserDirectPermissions = async (req: Request, res: Response): Promise<Response> => { // Usar Request estándar
  const { userId } = req.params;
  let client: PoolClient | null = null;

  const numericUserId = parseInt(userId, 10);
  if (isNaN(numericUserId)) {
    return res.status(400).json({ message: 'El ID de usuario proporcionado no es válido.' });
  }

  try {
    client = await pool.connect();
    const query = `
      SELECT p.id, p.clave, p.descripcion
      FROM permisos p
      JOIN usuario_permisos_directos upd ON p.id = upd.permiso_id
      WHERE upd.usuario_id = $1
      ORDER BY p.clave ASC;
    `;
    const result = await client.query(query, [numericUserId]);
    return res.status(200).json(result.rows); // Devuelve array de objetos Permission

  } catch (error: any) {
    console.error(`Error al obtener permisos directos para usuario ${userId}:`, error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener permisos directos.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para actualizar los permisos directos de un usuario ---
export const updateUserDirectPermissions = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest (para req.user.id)
  const { userId } = req.params;
  const { permissionIds } = req.body; // Espera array de IDs numéricos de permisos directos

  const numericUserId = parseInt(userId, 10);
  if (isNaN(numericUserId)) {
    return res.status(400).json({ message: 'El ID de usuario proporcionado no es válido.' });
  }

  if (!Array.isArray(permissionIds)) {
    return res.status(400).json({ message: 'Se esperaba un array de IDs de permisos.' });
  }
  const numericPermissionIds = permissionIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // 1. Eliminar todos los permisos directos existentes para este usuario
    const deleteQuery = 'DELETE FROM usuario_permisos_directos WHERE usuario_id = $1';
    await client.query(deleteQuery, [numericUserId]);

    // 2. Insertar las nuevas asignaciones de permisos directos (si hay alguna)
    if (numericPermissionIds.length > 0) {
      const insertPermissionsValues = numericPermissionIds.map(permId => `(${numericUserId}, ${permId})`).join(',');
      const insertPermissionsQuery = `INSERT INTO usuario_permisos_directos (usuario_id, permiso_id) VALUES ${insertPermissionsValues}`;
      await client.query(insertPermissionsQuery);
    }

    await client.query('COMMIT');

    // Registrar la actividad de actualización de permisos directos de usuario
    if (req.user && req.user.id) { // Usar req.user.id
      await registerActivity({
        usuario_id: req.user.id, // Usar req.user.id
        tipo_accion: 'actualizar_permisos_usuario',
        descripcion: `Se actualizaron los permisos directos del usuario con ID ${numericUserId}`,
        entidad_tipo: 'usuario',
        entidad_id: numericUserId,
        datos_adicionales: { permisos: numericPermissionIds.length }
      }).catch(err => console.error('Error al registrar actividad de actualización de permisos de usuario:', err));
    }

    console.log(`[AdminCtrl] Permisos directos actualizados para usuario ID ${numericUserId}. Nuevos permisos directos: ${numericPermissionIds.length}`);
    return res.status(200).json({ message: 'Permisos directos del usuario actualizados exitosamente.', assignedDirectPermissions: numericPermissionIds.length });

  } catch (error: any) {
    await client?.query('ROLLBACK');
    console.error(`Error al actualizar permisos directos para usuario ${userId}:`, error);
    return res.status(500).json({ message: 'Error interno del servidor al actualizar permisos directos.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para eliminar un usuario ---
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest (para req.user.id)
  const { userId } = req.params;

  // Validación básica
  if (!userId) {
    return res.status(400).json({ message: 'ID del usuario es requerido.' });
  }

  // Convertir a número
  const numericUserId = parseInt(userId, 10);
  if (isNaN(numericUserId)) {
    return res.status(400).json({ message: 'ID del usuario debe ser un número válido.' });
  }

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Obtener información del usuario antes de eliminarlo (para el registro de actividad)
    const getUserQuery = 'SELECT nombre, email FROM usuarios WHERE id = $1';
    const userResult = await client.query(getUserQuery, [numericUserId]);

    if (userResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: `Usuario con ID ${numericUserId} no encontrado.` });
    }

    const userName = userResult.rows[0].nombre;
    const userEmail = userResult.rows[0].email;

    // Verificar si el usuario tiene órdenes de compra asociadas
    const checkOrdersQuery = 'SELECT COUNT(*) FROM ordenes_compra WHERE usuario_id = $1';
    const ordersResult = await client.query(checkOrdersQuery, [numericUserId]);
    const orderCount = parseInt(ordersResult.rows[0].count);

    if (orderCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        message: `No se puede eliminar el usuario porque tiene ${orderCount} ${orderCount === 1 ? 'orden de compra asociada' : 'órdenes de compra asociadas'}.`,
        error: 'user_has_orders',
        orderCount: orderCount
      });
    }

    // Eliminar el usuario (las restricciones de clave foránea con ON DELETE CASCADE se encargarán de las tablas relacionadas)
    const deleteQuery = 'DELETE FROM usuarios WHERE id = $1 RETURNING id';
    const result = await client.query(deleteQuery, [numericUserId]);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: `Usuario con ID ${numericUserId} no encontrado.` });
    }

    await client.query('COMMIT');

    // Registrar la actividad de eliminación de usuario
    if (req.user && req.user.id) { // Usar req.user.id
      await registerActivity({
        usuario_id: req.user.id, // Usar req.user.id
        tipo_accion: 'eliminar_usuario',
        descripcion: `Se eliminó el usuario ${userName} (${userEmail})`,
        entidad_tipo: 'usuario',
        entidad_nombre: userName,
        datos_adicionales: { email: userEmail }
      }).catch(err => console.error('Error al registrar actividad de eliminación de usuario:', err));
    }

    console.log(`[AdminCtrl] Usuario con ID ${numericUserId} (${userName}) eliminado.`);
    return res.status(200).json({
      message: `Usuario ${userName} eliminado exitosamente.`,
      deletedUser: {
        id: numericUserId,
        name: userName,
        email: userEmail
      }
    });

  } catch (error: any) {
    await client?.query('ROLLBACK');
    console.error(`Error al eliminar usuario ${userId}:`, error);

    // Manejar errores específicos
    if (error.code === '23503') { // Foreign key violation
      return res.status(409).json({
        message: 'No se puede eliminar el usuario porque tiene registros asociados que no se pueden eliminar automáticamente.',
        error: 'foreign_key_violation'
      });
    }

    return res.status(500).json({ message: 'Error interno del servidor al eliminar usuario.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para activar/desactivar un usuario ---
export const toggleUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest (para req.user.id)
  const { userId } = req.params;
  const { status } = req.body; // 'Activo' o 'Inactivo'

  const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : '';

  if (!['activo', 'inactivo', 'pendiente'].includes(normalizedStatus)) {
    return res.status(400).json({ message: 'El estado debe ser "activo", "inactivo" o "pendiente".' });
  }

  const numericUserId = parseInt(userId, 10);
  if (isNaN(numericUserId)) {
    return res.status(400).json({ message: 'El ID de usuario proporcionado no es válido.' });
  }

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // Verificar si el usuario existe y obtener su nombre para el registro de actividad
    const userQuery = 'SELECT nombre, email, estado FROM usuarios WHERE id = $1';
    const userResult = await client.query(userQuery, [numericUserId]);

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: `Usuario con ID ${numericUserId} no encontrado.` });
    }

    const userName = userResult.rows[0].nombre;
    const userEmail = userResult.rows[0].email;
    const currentStatus = userResult.rows[0].estado;

    // Si el estado actual es el mismo que el solicitado (ignorando mayúsculas/minúsculas), no hacer nada
    if (currentStatus.toLowerCase() === normalizedStatus) {
      return res.status(200).json({
        message: `El usuario ya tiene el estado ${status}.`,
        user: {
          id: numericUserId,
          name: userName,
          email: userEmail,
          status: status
        }
      });
    }

    // Actualizar el estado del usuario
    const updateQuery = 'UPDATE usuarios SET estado = $1 WHERE id = $2 RETURNING id';
    const result = await client.query(updateQuery, [normalizedStatus, numericUserId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Usuario con ID ${numericUserId} no encontrado.` });
    }

    // Registrar la actividad de cambio de estado
    // Corregido: Usar req.user.id y añadir entidad_id
    if (req.user && req.user.id) {
      await registerActivity({
        usuario_id: req.user.id, // Corregido de req.user.userId
        tipo_accion: normalizedStatus === 'activo' ? 'activar_usuario' : 'desactivar_usuario',
        descripcion: `Se ${normalizedStatus === 'activo' ? 'activó' : 'desactivó'} el usuario ${userName} (${userEmail})`,
        entidad_tipo: 'usuario',
        entidad_id: numericUserId, // Añadido ID del usuario afectado
        entidad_nombre: userName,
        datos_adicionales: { email: userEmail, nuevo_estado: normalizedStatus }
      }).catch(err => console.error('Error al registrar actividad de cambio de estado de usuario:', err));
    }

    console.log(`[AdminCtrl] Usuario con ID ${numericUserId} (${userName}) ${normalizedStatus === 'activo' ? 'activado' : 'desactivado'}.`);
    return res.status(200).json({
      message: `Usuario ${userName} ${normalizedStatus === 'activo' ? 'activado' : 'desactivado'} exitosamente.`,
      user: {
        id: numericUserId,
        name: userName,
        email: userEmail,
        status: normalizedStatus
      }
    });

  } catch (error) {
    console.error(`Error al cambiar estado de usuario ${userId}:`, error);
    return res.status(500).json({ message: 'Error interno del servidor al cambiar estado de usuario.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para actualizar un usuario ---
export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { userId } = req.params;
  const { nombre, email, rol_id, area_id, estado, password } = req.body;

  // Validación básica
  if (!nombre || !email || !rol_id || !estado) {
    return res.status(400).json({ message: 'Nombre, email, rol_id y estado son requeridos.' });
  }

  const numericUserId = parseInt(userId, 10);
   if (isNaN(numericUserId)) {
     return res.status(400).json({ message: 'El ID de usuario proporcionado no es válido.' });
   }
   const numericRoleId = parseInt(rol_id, 10);
    if (isNaN(numericRoleId)) {
     return res.status(400).json({ message: 'El ID de rol proporcionado no es válido.' });
   }
   const numericAreaId = area_id ? parseInt(area_id, 10) : null;
    if (area_id && isNaN(numericAreaId as number)) {
      return res.status(400).json({ message: 'El ID de área proporcionado no es válido.' });
   }


  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // 1. Actualizar datos básicos del usuario
    let updateFields = ['nombre = $1', 'email = $2', 'area_id = $3', 'estado = $4'];
    const queryParams: any[] = [nombre, email, numericAreaId, estado];
    let paramIndex = 5;

    // 2. Hashear y actualizar contraseña solo si se proporcionó una nueva
    if (password) {
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      updateFields.push(`password_hash = $${paramIndex}`);
      queryParams.push(passwordHash);
      paramIndex++;
    }

    const updateUserQuery = `
      UPDATE usuarios
      SET ${updateFields.join(', ')}, fecha_actualizacion = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, nombre, email, estado, avatar_url, area_id, fecha_creacion
    `;
    queryParams.push(numericUserId);

    const userResult = await client.query(updateUserQuery, queryParams);

    if (userResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: `Usuario con ID ${numericUserId} no encontrado.` });
    }
    const updatedUser = userResult.rows[0];

    // 3. Actualizar rol (eliminar anterior, insertar nuevo)
    await client.query('DELETE FROM usuario_roles WHERE usuario_id = $1', [numericUserId]);
    await client.query('INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2)', [numericUserId, numericRoleId]);

    await client.query('COMMIT');

    // Registrar actividad
     if (req.user && req.user.id) {
       await registerActivity({
         usuario_id: req.user.id,
         tipo_accion: 'actualizar_usuario',
         descripcion: `Se actualizó el usuario ${updatedUser.nombre} (${updatedUser.email})`,
         entidad_tipo: 'usuario',
         entidad_id: numericUserId,
         entidad_nombre: updatedUser.nombre,
         datos_adicionales: { email: updatedUser.email, rol_id: numericRoleId, area_id: numericAreaId, estado: estado }
       }).catch(err => console.error('Error al registrar actividad de actualización de usuario:', err));
     }

    // Devolver usuario actualizado (sin hash de contraseña)
    // Necesitamos obtener el nombre del rol y del área para devolver la interfaz completa
     const roleResult = await client.query('SELECT nombre FROM roles WHERE id = $1', [numericRoleId]);
     const areaResult = numericAreaId ? await client.query('SELECT nombre FROM areas WHERE id = $1', [numericAreaId]) : null;

     const finalUserData = {
         id: updatedUser.id,
         name: updatedUser.nombre,
         email: updatedUser.email,
         role: roleResult.rows[0]?.nombre || 'Desconocido',
         rol_id: numericRoleId,
         status: updatedUser.estado,
         createdAt: updatedUser.fecha_creacion,
         avatar: updatedUser.avatar_url,
         area_id: numericAreaId,
         area_nombre: areaResult?.rows[0]?.nombre || null
     };


    return res.status(200).json(finalUserData);

  } catch (error: any) {
    await client?.query('ROLLBACK');
    console.error(`Error al actualizar usuario ${userId}:`, error);
     if (error.code === '23505' && error.constraint === 'usuarios_email_key') {
        return res.status(409).json({ message: `El email "${email}" ya está registrado por otro usuario.` });
     }
     if (error.code === '23503') { // Foreign key violation (rol_id o area_id inválido)
         return res.status(400).json({ message: 'El rol o área especificado no existe.' });
     }
    return res.status(500).json({ message: 'Error interno del servidor al actualizar usuario.' });
  } finally {
    client?.release();
  }
};
