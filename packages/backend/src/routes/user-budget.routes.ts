// packages/backend/src/routes/user-budget.routes.ts
const express = require('express');
const Router = express.Router;
import {
  getUserBudgetCodes,
  getUserAreas
} from '../controllers/user-budget.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Ruta para obtener códigos presupuestales del usuario actual
router.get('/budget-codes', getUserBudgetCodes);

// Ruta para obtener áreas del usuario actual
router.get('/areas', getUserAreas);

export default router;
