const express = require('express');
const Router = express.Router;
import {
  getAreas,
  createArea,
  updateArea,
  deleteArea,
  // associateAreaToCP, // Renombrada
  // dissociateAreaFromCP, // Renombrada
  getAssociatedBudgetCodes,
  associateCodeToArea,    // Importar nueva función
  dissociateCodeFromArea  // Importar nueva función
} from '../controllers/areas.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';

const router = Router();

// CRUD de áreas
router.get('/', authenticateToken, checkPermission('ver_areas'), getAreas);
router.post('/', authenticateToken, checkPermission('crear_areas'), createArea);
router.put('/:id', authenticateToken, checkPermission('editar_areas'), updateArea);
router.delete('/:id', authenticateToken, checkPermission('eliminar_areas'), deleteArea);

// Asociar y desasociar áreas a códigos presupuestales
// Rutas antiguas eliminadas
// router.post('/associate', authenticateToken, checkPermission('editar_areas'), associateAreaToCP);
// router.post('/dissociate', authenticateToken, checkPermission('editar_areas'), dissociateAreaFromCP);

// Nuevas rutas RESTful para asociar/desasociar códigos a áreas
router.post('/:areaId/budget-codes', authenticateToken, checkPermission('editar_areas'), associateCodeToArea);
router.delete('/:areaId/budget-codes/:cpId', authenticateToken, checkPermission('editar_areas'), dissociateCodeFromArea);

// Obtener códigos presupuestales asociados a un área
router.get('/:id/budget-codes', authenticateToken, checkPermission('ver_areas'), getAssociatedBudgetCodes);

export default router;