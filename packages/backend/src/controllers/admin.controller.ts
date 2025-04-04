import { Request, Response } from 'express';
import pool from '../config/db';
import { PoolClient, QueryResult } from 'pg';

// --- Controlador para obtener todos los usuarios ---
export const getAllUsers = async (req: Request, res: Response): Promise<Response> => {
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
        -- u.departamento AS department, -- Columna no existe en el esquema
        u.estado AS status,
        -- u.ultimo_login AS "lastLogin", -- Columna no existe en el esquema
        u.fecha_creacion AS "createdAt", -- No necesita comillas
        u.avatar_url AS avatar -- Usar avatar_url
        -- 'initials' se generará en el frontend si es necesario
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
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
export const getAllRoles = async (req: Request, res: Response): Promise<Response> => {
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
export const getAllPermissions = async (req: Request, res: Response): Promise<Response> => {
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
export const createRole = async (req: Request, res: Response): Promise<Response> => {
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
export const getRolePermissions = async (req: Request, res: Response): Promise<Response> => {
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
export const updateUserRole = async (req: Request, res: Response): Promise<Response> => {
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
export const deleteRole = async (req: Request, res: Response): Promise<Response> => {
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
export const updateRolePermissions = async (req: Request, res: Response): Promise<Response> => {
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
export const getUserDirectPermissions = async (req: Request, res: Response): Promise<Response> => {
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
export const updateUserDirectPermissions = async (req: Request, res: Response): Promise<Response> => {
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

// Aquí irían otros controladores de admin (editarRol, etc.)