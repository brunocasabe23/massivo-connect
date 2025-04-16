// packages/backend/src/controllers/userController.ts
// import { Request, Response } from 'express';
import {
    getUserSettings,
    updateUserSettings,
    updateUserProfile,
    changeUserPassword,
    updateAvatarUrl, // Importar nueva función
    UserSettings,
    UserProfileData
} from '../services/userService';
import path from 'path'; // Importar path para manejar rutas

// Usar any para evitar problemas de tipos
type Response = any;
type AuthenticatedRequest = any;

/**
 * Maneja la solicitud GET para obtener las configuraciones del usuario autenticado.
 */
export async function handleGetUserSettings(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    if (!req.user?.id) {
        return res.status(401).json({ message: 'No autorizado' });
    }
    try {
        const userId = req.user.id;
        const settings = await getUserSettings(userId);
        res.status(200).json(settings);
    } catch (error) {
        console.error('Error getting user settings:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener la configuración.' });
    }
}

/**
 * Maneja la solicitud PUT para actualizar las configuraciones del usuario autenticado.
 */
export async function handleUpdateUserSettings(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    if (!req.user?.id) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const userId = req.user.id;
    const settingsToUpdate: Partial<UserSettings> = req.body;

    // Validación básica del body
    if (typeof settingsToUpdate !== 'object' || settingsToUpdate === null) {
         return res.status(400).json({ message: 'Cuerpo de la solicitud inválido.' });
    }
    if (settingsToUpdate.theme && !['light', 'dark'].includes(settingsToUpdate.theme)) {
        return res.status(400).json({ message: 'Valor de tema inválido. Debe ser "light" o "dark".' });
    }
     if (settingsToUpdate.app_notifications_enabled !== undefined && typeof settingsToUpdate.app_notifications_enabled !== 'boolean') {
        return res.status(400).json({ message: 'Valor de app_notifications_enabled inválido. Debe ser booleano.' });
    }
    if (settingsToUpdate.email_order_status_enabled !== undefined && typeof settingsToUpdate.email_order_status_enabled !== 'boolean') {
        return res.status(400).json({ message: 'Valor de email_order_status_enabled inválido. Debe ser booleano.' });
    }

    try {
        const updatedSettings = await updateUserSettings(userId, settingsToUpdate);
        res.status(200).json(updatedSettings);
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar la configuración.' });
    }
}

/**
 * Maneja la solicitud PUT para actualizar el perfil del usuario autenticado (nombre).
 */
export async function handleUpdateUserProfile(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
     if (!req.user?.id) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const userId = req.user.id;
    const { nombre } = req.body as UserProfileData;

    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        return res.status(400).json({ message: 'El nombre es requerido y no puede estar vacío.' });
    }

    try {
        await updateUserProfile(userId, { nombre: nombre.trim() });
        res.status(200).json({ message: 'Perfil actualizado correctamente.' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        if (error instanceof Error && error.message === 'Usuario no encontrado para actualizar perfil.') {
             return res.status(404).json({ message: error.message });
        } else {
            return res.status(500).json({ message: 'Error interno del servidor al actualizar el perfil.' });
        }
    }
}

/**
 * Maneja la solicitud PUT para cambiar la contraseña del usuario autenticado.
 */
export async function handleChangePassword(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    if (!req.user?.id) {
        return res.status(401).json({ message: 'No autorizado' });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'La contraseña actual y la nueva son requeridas.' });
    }
     if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
         return res.status(400).json({ message: 'Las contraseñas deben ser strings.' });
     }

    try {
        await changeUserPassword(userId, currentPassword, newPassword);
        res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
    } catch (error) {
        console.error('Error changing password:', error);
        if (error instanceof Error) {
            if (error.message === 'La contraseña actual es incorrecta.') {
                return res.status(400).json({ message: error.message });
            }
            if (error.message === 'La nueva contraseña debe tener al menos 6 caracteres.') {
                 return res.status(400).json({ message: error.message });
            }
             if (error.message === 'Usuario no encontrado.') {
                 return res.status(404).json({ message: error.message });
            }
        }
        return res.status(500).json({ message: 'Error interno del servidor al cambiar la contraseña.' });
    }
}

/**
 * Maneja la solicitud POST para actualizar el avatar del usuario autenticado.
 */
export async function handleUpdateAvatar(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
     if (!req.user?.id) {
        return res.status(401).json({ message: 'No autorizado' });
    }
     if (!req.file) {
         return res.status(400).json({ message: 'No se proporcionó ningún archivo de imagen.' });
     }

    const userId = req.user.id;
    const avatarFile = req.file;

    try {
        // La ruta completa del archivo guardado por multer
        const fullPath = avatarFile.path;
        // Obtener la ruta relativa desde la raíz del proyecto para guardar en DB y usar en URL
        // Asumiendo que 'uploads' está en la raíz del proyecto (un nivel arriba de 'packages/backend')
        const projectRoot = path.resolve(__dirname, '../../../'); // Ajustar si la estructura es diferente
        const relativePath = path.relative(projectRoot, fullPath);
        // Convertir a formato URL (forward slashes) y asegurar que empiece con /uploads/
        const avatarUrl = '/uploads/' + relativePath.replace(/\\/g, '/').split('uploads/')[1];

        console.log(`[UserController] Avatar uploaded for user ${userId}. Path: ${fullPath}, Relative: ${relativePath}, URL: ${avatarUrl}`);

        // Llamar al servicio para actualizar la DB y eliminar avatar anterior
        // Pasar la URL pública y la ruta completa
        await updateAvatarUrl(userId, avatarUrl, fullPath);

        // Devolver la URL pública del nuevo avatar
        res.status(200).json({ message: 'Avatar actualizado correctamente.', avatarUrl: avatarUrl });

    } catch (error) {
        console.error('Error updating user avatar:', error);
         if (error instanceof Error && (error as any).code === 'INVALID_FILE_TYPE') {
             return res.status(400).json({ message: error.message });
         }
         if (error instanceof Error && error.message === 'Usuario no encontrado.') {
              return res.status(404).json({ message: error.message });
         }
        return res.status(500).json({ message: 'Error interno del servidor al actualizar el avatar.' });
    }
}