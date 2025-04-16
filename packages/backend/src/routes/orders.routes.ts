const express = require('express');
const Router = express.Router;
import {
  // getUserOrders, // Eliminado
  getUserOrderStats,
  getAllOrders,
  createOrder,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus
} from '../controllers/orders.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware'; // Importar checkPermission

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Ruta /me eliminada, getAllOrders con RLS la reemplaza

// Ruta para obtener estadísticas de órdenes de compra del usuario
// (Esta ruta también debería usar RLS implícitamente si consulta ordenes_compra)
router.get('/me/stats', getUserOrderStats);

// Ruta para obtener TODAS las órdenes (admin/compras)
// Ajustar permiso: requiere al menos poder crear para ver la lista (RLS filtra)
router.get('/', checkPermission('crear_orden_compra'), getAllOrders);

// Ruta para crear una nueva orden
router.post('/', checkPermission('crear_orden_compra'), createOrder); // Permiso específico

// Ruta para obtener una orden específica por ID
router.get('/:id', checkPermission('ver_detalle_orden'), getOrderById); // Permiso específico

// Ruta para actualizar una orden
router.put('/:id', checkPermission('editar_orden_compra'), updateOrder); // Permiso específico

// Ruta para eliminar una orden
router.delete('/:id', checkPermission('eliminar_orden_compra'), deleteOrder); // Permiso específico

// Ruta para actualizar el estado de una orden
router.put('/:id/status', checkPermission('actualizar_estado_orden'), updateOrderStatus); // Permiso específico


export default router;
