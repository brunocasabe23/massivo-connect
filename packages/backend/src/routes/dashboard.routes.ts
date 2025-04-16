const express = require('express');
const Router = express.Router;
import {
  getAdminDashboardStats,
  getRecentUsers,
  getRolesWithStats,
  getRecentActivity,
  getBudgetSummary,
  getBudgetByDepartment,
  getPurchaseCenterSummary, // Importar nueva función
  getUpcomingDeliveries     // Importar nueva función
} from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';

const router = Router();

// Rutas para el dashboard de administración
router.get('/admin/stats', authenticateToken, checkPermission('ver_administracion'), getAdminDashboardStats);
router.get('/admin/recent-users', authenticateToken, checkPermission('ver_administracion'), getRecentUsers);
router.get('/admin/roles-stats', authenticateToken, checkPermission('ver_administracion'), getRolesWithStats);
router.get('/admin/recent-activity', authenticateToken, checkPermission('ver_administracion'), getRecentActivity);

// Rutas para el dashboard de presupuestos
router.get('/budget/summary', authenticateToken, checkPermission('ver_dashboard_presupuestos'), getBudgetSummary);
router.get('/budget/by-department', authenticateToken, checkPermission('ver_dashboard_presupuestos'), getBudgetByDepartment);

// Rutas para el dashboard del Centro de Compras
router.get('/purchase-center/summary', authenticateToken, checkPermission('ver_centro_compras'), getPurchaseCenterSummary); // Permiso específico
router.get('/purchase-center/upcoming', authenticateToken, checkPermission('ver_centro_compras'), getUpcomingDeliveries); // Permiso específico

export default router;
