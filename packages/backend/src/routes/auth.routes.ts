import { Router } from 'express';
// Importar los controladores
import { registerUser, loginUser } from '../controllers/auth.controller';

const router = Router();

// Ruta para registrar un nuevo usuario
router.post('/register', registerUser);
// router.post('/register', (req, res) => { 
//   res.status(501).json({ message: 'Registro no implementado aún' }); 
// });


// Ruta para iniciar sesión
router.post('/login', loginUser);
// router.post('/login', (req, res) => {
//   res.status(501).json({ message: 'Login no implementado aún' });
// });


export default router;