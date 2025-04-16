// packages/backend/src/routes/notifications.routes.ts
const express = require('express');
const Router = express.Router;
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount
} from '../controllers/notifications.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Ruta para obtener notificaciones del usuario actual
router.get('/', getUserNotifications);

// Ruta para obtener el conteo de notificaciones no leídas
router.get('/unread-count', getUnreadNotificationsCount);

// Ruta para marcar una notificación como leída
router.put('/:id/read', markNotificationAsRead);

// Ruta para marcar todas las notificaciones como leídas
router.put('/mark-all-read', markAllNotificationsAsRead);

export default router;
