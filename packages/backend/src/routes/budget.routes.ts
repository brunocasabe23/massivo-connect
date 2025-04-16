const express = require('express');
const Router = express.Router;
// Importar controladores
import {
  getBudgetCodes,
  createBudgetCode,
  updateBudgetCode,
  deleteBudgetCode,
  getBudgetCodeById,
  getAreasByBudgetCode, // Importar nueva función
} from '../controllers/budget.controller';
import { authenticateToken } from '../middleware/auth.middleware'; // Middleware de autenticación
import { checkPermission } from '../middleware/permission.middleware'; // Importar middleware de permisos

const router = Router();

// --- Rutas para Códigos Presupuestales (CP) ---

// GET /api/budget-codes - Obtener todos los CP
router.get(
  '/',
  authenticateToken,
  checkPermission('ver_codigos_presupuestales'), // Requiere permiso de ver
  getBudgetCodes
);

// GET /api/budget-codes/:id - Obtener un CP por ID (protegido)
router.get(
  '/:id',
  authenticateToken,
  checkPermission('ver_codigos_presupuestales'), // Requiere permiso de ver
  getBudgetCodeById
);

// POST /api/budget-codes - Crear un nuevo CP (protegido por permiso)
router.post(
  '/',
  authenticateToken,
  checkPermission('crear_codigos_presupuestales'), // Requiere permiso de crear
  createBudgetCode
);

// PUT /api/budget-codes/:id - Actualizar un CP (protegido por permiso)
router.put(
  '/:id',
  authenticateToken,
  checkPermission('editar_codigos_presupuestales'), // Requiere permiso de editar
  updateBudgetCode
);

// DELETE /api/budget-codes/:id - Eliminar un CP (protegido por permiso)
router.delete(
  '/:id',
  authenticateToken,
  checkPermission('eliminar_codigos_presupuestales'), // Requiere permiso de eliminar
  deleteBudgetCode
);


// Obtener áreas asociadas a un código presupuestal
router.get('/:id/areas', authenticateToken, checkPermission('ver_codigos_presupuestales'), getAreasByBudgetCode);

export default router;