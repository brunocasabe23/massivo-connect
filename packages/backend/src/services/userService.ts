// packages/backend/src/services/userService.ts
import pool from '../config/db'; // Asumiendo que db.ts exporta un pool de pg
import bcrypt from 'bcrypt'; // Importar bcrypt para contraseñas
import { PoolClient } from 'pg'; // Importar PoolClient
import fs from 'fs/promises'; // Usar fs.promises para operaciones asíncronas
import path from 'path';

const SALT_ROUNDS = 10; // Mover constante aquí o a un archivo de config

export interface UserSettings {
    theme: 'light' | 'dark';
    app_notifications_enabled: boolean;
    email_order_status_enabled: boolean;
}

// Interfaz para datos de perfil actualizables
export interface UserProfileData {
    nombre: string;
    // Podríamos añadir otros campos como username, bio aquí si se implementan
}

/**
 * Obtiene las configuraciones de un usuario.
 * Si no existen, inserta los valores por defecto y los devuelve.
 * @param userId - El ID del usuario.
 * @returns Las configuraciones del usuario.
 */
export async function getUserSettings(userId: number): Promise<UserSettings> {
    // ... (código sin cambios) ...
    console.log(`[UserService] Getting settings for user ID: ${userId}`);

    if (!userId || isNaN(userId)) {
        console.error(`[UserService] Invalid user ID: ${userId}`);
        return { theme: 'light', app_notifications_enabled: true, email_order_status_enabled: true };
    }

    const client = await pool.connect();
    try {
        const userExists = await client.query('SELECT 1 FROM usuarios WHERE id = $1', [userId]);
        if (userExists.rows.length === 0) {
            console.error(`[UserService] User with ID ${userId} does not exist`);
            return { theme: 'light', app_notifications_enabled: true, email_order_status_enabled: true };
        }

        let result = await client.query(
            'SELECT theme, app_notifications_enabled, email_order_status_enabled FROM user_settings WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            console.log(`[UserService] No settings found for user ${userId}, creating default settings`);
            try {
                await client.query(
                    'INSERT INTO user_settings (user_id, theme, app_notifications_enabled, email_order_status_enabled) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO NOTHING',
                    [userId, 'light', true, true]
                );
                result = await client.query(
                    'SELECT theme, app_notifications_enabled, email_order_status_enabled FROM user_settings WHERE user_id = $1',
                    [userId]
                );
                if (result.rows.length === 0) {
                    console.error(`[UserService] Could not retrieve or insert default settings for user ${userId}. Returning hardcoded defaults.`);
                    return { theme: 'light', app_notifications_enabled: true, email_order_status_enabled: true };
                }
            } catch (insertError) {
                console.error(`[UserService] Error inserting default settings for user ${userId}:`, insertError);
                return { theme: 'light', app_notifications_enabled: true, email_order_status_enabled: true };
            }
        }
        const settings = result.rows[0];
        console.log(`[UserService] Retrieved settings for user ${userId}:`, settings);
        return {
            theme: settings.theme,
            app_notifications_enabled: settings.app_notifications_enabled,
            email_order_status_enabled: settings.email_order_status_enabled,
        };
    } catch (error) {
        console.error(`[UserService] Error in getUserSettings for user ${userId}:`, error);
        return { theme: 'light', app_notifications_enabled: true, email_order_status_enabled: true };
    } finally {
        client.release();
    }
}

/**
 * Actualiza las configuraciones de un usuario.
 * @param userId - El ID del usuario.
 * @param settings - Un objeto parcial con las configuraciones a actualizar.
 * @returns Las configuraciones actualizadas.
 */
export async function updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings> {
    // ... (código sin cambios) ...
    const client = await pool.connect();
    const columns = ['user_id'];
    const insertPlaceholders = ['$1'];
    const queryValues: any[] = [userId];
    let placeholderIndex = 2;

    if (settings.theme !== undefined) { columns.push('theme'); insertPlaceholders.push(`$${placeholderIndex++}`); queryValues.push(settings.theme); }
    else { columns.push('theme'); insertPlaceholders.push(`$${placeholderIndex++}`); queryValues.push('light'); }

    if (settings.app_notifications_enabled !== undefined) { columns.push('app_notifications_enabled'); insertPlaceholders.push(`$${placeholderIndex++}`); queryValues.push(settings.app_notifications_enabled); }
    else { columns.push('app_notifications_enabled'); insertPlaceholders.push(`$${placeholderIndex++}`); queryValues.push(true); }

    if (settings.email_order_status_enabled !== undefined) { columns.push('email_order_status_enabled'); insertPlaceholders.push(`$${placeholderIndex++}`); queryValues.push(settings.email_order_status_enabled); }
    else { columns.push('email_order_status_enabled'); insertPlaceholders.push(`$${placeholderIndex++}`); queryValues.push(true); }

    const conflictUpdateSet: string[] = [];
    if (settings.theme !== undefined) { conflictUpdateSet.push(`theme = EXCLUDED.theme`); }
    if (settings.app_notifications_enabled !== undefined) { conflictUpdateSet.push(`app_notifications_enabled = EXCLUDED.app_notifications_enabled`); }
    if (settings.email_order_status_enabled !== undefined) { conflictUpdateSet.push(`email_order_status_enabled = EXCLUDED.email_order_status_enabled`); }

    const onConflictAction = conflictUpdateSet.length > 0 ? `DO UPDATE SET ${conflictUpdateSet.join(', ')}` : 'DO NOTHING';

    const finalQuery = `
        INSERT INTO user_settings (${columns.join(', ')})
        VALUES (${insertPlaceholders.join(', ')})
        ON CONFLICT (user_id) ${onConflictAction}
        RETURNING theme, app_notifications_enabled, email_order_status_enabled;
    `;

    try {
        const result = await client.query(finalQuery, queryValues);
        if (result.rows.length === 0) { return getUserSettings(userId); }
        const updatedSettings = result.rows[0];
        return {
            theme: updatedSettings.theme,
            app_notifications_enabled: updatedSettings.app_notifications_enabled,
            email_order_status_enabled: updatedSettings.email_order_status_enabled,
        };
    } catch (error) {
        console.error(`Error updating user settings for user ${userId}:`, error);
        throw new Error('Failed to update user settings');
    } finally {
        client.release();
    }
}

/**
 * Actualiza el perfil de un usuario (solo nombre por ahora).
 * @param userId - El ID del usuario.
 * @param profileData - Datos del perfil a actualizar.
 */
export async function updateUserProfile(userId: number, profileData: UserProfileData): Promise<void> {
    // ... (código sin cambios) ...
    if (!profileData.nombre || profileData.nombre.trim() === '') {
        throw new Error('El nombre no puede estar vacío.');
    }
    const client = await pool.connect();
    try {
        const result = await client.query(
            'UPDATE usuarios SET nombre = $1 WHERE id = $2',
            [profileData.nombre.trim(), userId]
        );
        if (result.rowCount === 0) { throw new Error('Usuario no encontrado para actualizar perfil.'); }
    } catch (error) {
         console.error(`Error updating profile for user ${userId}:`, error);
         throw new Error('Failed to update user profile');
    } finally {
        client.release();
    }
}

/**
 * Cambia la contraseña de un usuario.
 * @param userId - El ID del usuario.
 * @param currentPassword - La contraseña actual para verificación.
 * @param newPassword - La nueva contraseña.
 */
export async function changeUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
     // ... (código sin cambios) ...
     if (!currentPassword || !newPassword) { throw new Error('La contraseña actual y la nueva son requeridas.'); }
     if (newPassword.length < 6) { throw new Error('La nueva contraseña debe tener al menos 6 caracteres.'); }

    const client = await pool.connect();
    try {
        const result = await client.query('SELECT password_hash FROM usuarios WHERE id = $1', [userId]);
        if (result.rowCount === 0) { throw new Error('Usuario no encontrado.'); }
        const currentPasswordHash = result.rows[0].password_hash;

        const isMatch = await bcrypt.compare(currentPassword, currentPasswordHash);
        if (!isMatch) { throw new Error('La contraseña actual es incorrecta.'); }

        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        const updateResult = await client.query(
            'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, userId]
        );
        if (updateResult.rowCount === 0) { throw new Error('Error al actualizar la contraseña.'); }
    } catch (error) {
        console.error(`Error changing password for user ${userId}:`, error);
        if (error instanceof Error && (error.message === 'Usuario no encontrado.' || error.message === 'La contraseña actual es incorrecta.')) {
            throw error;
        }
        throw new Error('Failed to change user password');
    } finally {
        client.release();
    }
}

/**
 * Actualiza la URL del avatar de un usuario y elimina el avatar anterior si existe.
 * @param userId - El ID del usuario.
 * @param newAvatarPublicUrl - La URL pública relativa del nuevo avatar (ej: '/uploads/avatars/1-12345.png').
 * @param newAvatarFullPath - La ruta completa en el sistema de archivos del nuevo avatar (para eliminar en caso de error).
 */
export async function updateAvatarUrl(userId: number, newAvatarPublicUrl: string, newAvatarFullPath: string): Promise<void> {
    const client = await pool.connect();
    let oldAvatarPathRelative: string | null = null; // Para guardar la ruta del avatar viejo

    try {
        await client.query('BEGIN'); // Iniciar transacción

        // 1. Obtener la URL del avatar anterior para poder eliminarlo DESPUÉS de actualizar la DB
        const oldAvatarResult = await client.query('SELECT avatar_url FROM usuarios WHERE id = $1 FOR UPDATE', [userId]);
        if (oldAvatarResult.rowCount === 0) {
            throw new Error('Usuario no encontrado.'); // Asegurarse que el usuario exista
        }
        oldAvatarPathRelative = oldAvatarResult.rows[0]?.avatar_url;

        // 2. Actualizar la base de datos con la nueva URL pública
        const updateResult = await client.query(
            'UPDATE usuarios SET avatar_url = $1 WHERE id = $2',
            [newAvatarPublicUrl, userId]
        );
        if (updateResult.rowCount === 0) {
            // Esto no debería pasar debido al FOR UPDATE anterior
            throw new Error('Usuario no encontrado durante la actualización del avatar.');
        }

        await client.query('COMMIT'); // Confirmar transacción

        // 3. Eliminar el archivo del avatar anterior (si existía) DESPUÉS de confirmar la transacción
        if (oldAvatarPathRelative) {
            const projectRoot = path.resolve(__dirname, '../..'); // Asumiendo que services está en src/services
            const oldAvatarFullPath = path.join(projectRoot, oldAvatarPathRelative);
            try {
                await fs.unlink(oldAvatarFullPath);
                console.log(`[UserService] Deleted old avatar: ${oldAvatarFullPath}`);
            } catch (unlinkError: any) {
                if (unlinkError.code !== 'ENOENT') {
                     console.error(`[UserService] Error deleting old avatar ${oldAvatarFullPath}:`, unlinkError);
                }
            }
        }

    } catch (error) {
        await client.query('ROLLBACK'); // Revertir transacción en caso de error
        console.error(`Error updating avatar for user ${userId}:`, error);

        // Intentar eliminar el archivo recién subido si la transacción falló
        try {
            await fs.unlink(newAvatarFullPath);
             console.log(`[UserService] Deleted newly uploaded avatar due to transaction error: ${newAvatarFullPath}`);
        } catch (cleanupError) {
            console.error(`[UserService] Error cleaning up uploaded avatar ${newAvatarFullPath} after transaction error:`, cleanupError);
        }

        // Re-lanzar un error genérico o el específico si es relevante
        if (error instanceof Error && error.message === 'Usuario no encontrado.') {
             throw error;
        }
        throw new Error('Failed to update user avatar');
    } finally {
        client.release();
    }
}