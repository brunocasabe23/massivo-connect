import { Router } from 'express';
import { getAllUsers, getAllRoles, getAllPermissions, createRole, updateUserRole, getRolePermissions, deleteRole, updateRolePermissions, getUserDirectPermissions, updateUserDirectPermissions } from '../controllers/admin.controller'; // Añadir controladores de permisos directos
// Importar middlewares
import { authenticateToken } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';

const router = Router();

// Ruta para obtener todos los usuarios (protegida, requiere ser admin?)
// TODO: Añadir middleware authenticateToken y authorizeAdmin si se requiere
router.get('/users', /* authenticateToken, authorizeAdmin, */ getAllUsers);

// Ruta para obtener todos los roles
// TODO: Añadir middleware si es necesario
router.get('/roles', /* authenticateToken, authorizeAdmin, */ getAllRoles);

// Ruta para obtener todos los permisos
// TODO: Añadir middleware si es necesario
router.get('/permissions', /* authenticateToken, authorizeAdmin, */ getAllPermissions);

// Ruta para crear un nuevo rol - Protegida por autenticación y permiso 'Crear roles'
router.post(
  '/roles',
  authenticateToken, // Primero autenticar
  checkPermission('crear_roles'), // Corregido a la clave snake_case
  createRole // Finalmente, ejecutar controlador si todo está OK
);

// Ruta para actualizar el rol de un usuario específico
// TODO: Añadir middleware si es necesario
router.put('/users/:userId/role', /* authenticateToken, authorizeAdmin, */ updateUserRole);

// Ruta para obtener los permisos de un rol específico
// TODO: Añadir middleware si es necesario
router.get('/roles/:roleId/permissions', /* authenticateToken, authorizeAdmin, */ getRolePermissions);

// Ruta para eliminar un rol específico
// TODO: Confirmar clave de permiso 'eliminar_roles' y añadir middleware
router.delete('/roles/:roleId', authenticateToken, checkPermission('eliminar_roles'), deleteRole);

// Ruta para actualizar los permisos de un rol específico
// TODO: Confirmar clave de permiso 'editar_permisos_rol' y añadir middleware
router.put('/roles/:roleId/permissions', authenticateToken, checkPermission('editar_permisos_rol'), updateRolePermissions);

// Rutas para gestionar permisos directos de usuario
// TODO: Crear y asignar permiso 'gestionar_permisos_usuario'
router.get('/users/:userId/direct-permissions', authenticateToken, checkPermission('gestionar_permisos_usuario'), getUserDirectPermissions);
router.put('/users/:userId/direct-permissions', authenticateToken, checkPermission('gestionar_permisos_usuario'), updateUserDirectPermissions);

// Aquí irían otras rutas de admin (editar rol, etc.)

export default router;