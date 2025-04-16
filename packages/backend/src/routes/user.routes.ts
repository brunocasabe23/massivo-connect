// packages/backend/src/routes/user.routes.ts
const express = require('express');
const Router = express.Router;
import {
    handleGetUserSettings,
    handleUpdateUserSettings,
    handleUpdateUserProfile,
    handleChangePassword,
    handleUpdateAvatar // Importar handler de avatar
} from '../controllers/userController';
import { authenticateToken } from '../middleware/auth.middleware';
import uploadAvatarMiddleware from '../middleware/upload.middleware'; // Importar middleware de subida

const router = Router();

// Aplicar middleware de autenticación a todas las rutas de este archivo
router.use(authenticateToken);

// --- Rutas de Configuración ---
router.get('/me/settings', handleGetUserSettings);
router.put('/me/settings', handleUpdateUserSettings);

// --- Rutas de Perfil ---
router.put('/me', handleUpdateUserProfile); // Actualizar nombre, etc.
router.post('/me/avatar', uploadAvatarMiddleware, handleUpdateAvatar); // Subir avatar

// --- Ruta de Contraseña ---
router.put('/me/password', handleChangePassword);

export default router;