// packages/backend/src/routes/suppliers.routes.ts
const express = require('express');
const Router = express.Router;
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierCategories
} from '../controllers/suppliers.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Ruta para obtener todos los proveedores
router.get('/', checkPermission('ver_proveedores'), getAllSuppliers);

// Ruta para obtener categorías de proveedores
router.get('/categories', checkPermission('ver_proveedores'), getSupplierCategories);

// Ruta para obtener un proveedor específico por ID
router.get('/:id', checkPermission('ver_proveedores'), getSupplierById);

// Ruta para crear un nuevo proveedor
router.post('/', checkPermission('crear_proveedores'), createSupplier);

// Ruta para actualizar un proveedor
router.put('/:id', checkPermission('editar_proveedores'), updateSupplier);

// Ruta para eliminar un proveedor
router.delete('/:id', checkPermission('eliminar_proveedores'), deleteSupplier);

export default router;
