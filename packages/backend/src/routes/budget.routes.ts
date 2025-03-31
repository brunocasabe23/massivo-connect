import { Router } from 'express';
// Importar controladores
import { 
  getBudgetCodes, 
  createBudgetCode, 
  updateBudgetCode, 
  deleteBudgetCode, // Importar deleteBudgetCode
  // getBudgetCodeById, // Placeholder
} from '../controllers/budget.controller'; 
import { authenticateToken } from '../middleware/auth.middleware'; // Importar middleware
// TODO: Importar middleware de autorización por roles

const router = Router();

// --- Rutas para Códigos Presupuestales (CP) ---

// GET /api/budget-codes - Obtener todos los CP 
router.get('/', authenticateToken, getBudgetCodes); 

// GET /api/budget-codes/:id - Obtener un CP por ID (protegido)
// TODO: Implementar controlador getBudgetCodeById
router.get('/:id', authenticateToken, (req, res) => {
   const { id } = req.params;
   res.status(501).json({ message: `Obtener CP ${id} no implementado` });
});

// POST /api/budget-codes - Crear un nuevo CP (protegido)
// TODO: Añadir authorizeRoles(['Admin', 'Compras'])
router.post('/', authenticateToken, createBudgetCode); 

// PUT /api/budget-codes/:id - Actualizar un CP (protegido)
// TODO: Añadir authorizeRoles(['Admin', 'Compras'])
router.put('/:id', authenticateToken, updateBudgetCode); 

// DELETE /api/budget-codes/:id - Eliminar un CP (protegido)
// TODO: Añadir authorizeRoles(['Admin', 'Compras'])
router.delete('/:id', authenticateToken, deleteBudgetCode); 


export default router;