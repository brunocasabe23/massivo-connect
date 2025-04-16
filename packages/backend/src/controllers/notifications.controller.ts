// packages/backend/src/controllers/notifications.controller.ts
import pool from '../config/db';
import { PoolClient } from 'pg';

// Usar any para evitar problemas de tipos
type Response = any;
type AuthenticatedRequest = any;
type Request = any;

// Función para crear una notificación
export const createNotification = async (
  userId: number,
  tipoEvento: string,
  mensaje: string,
  urlRelacionada?: string
): Promise<boolean> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const query = `
      INSERT INTO notificaciones
        (usuario_id, tipo_evento, mensaje, url_relacionada)
      VALUES
        ($1, $2, $3, $4)
      RETURNING id;
    `;
    const params = [userId, tipoEvento, mensaje, urlRelacionada || null];
    await client.query(query, params);
    return true;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return false;
  } finally {
    client?.release();
  }
};

// Controlador para obtener notificaciones del usuario actual
export const getUserNotifications = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    const userId = req.user.id;
    client = await pool.connect();

    // Obtener parámetros de consulta
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const onlyUnread = req.query.onlyUnread === 'true';

    // Construir consulta
    let query = `
      SELECT *
      FROM notificaciones
      WHERE usuario_id = $1
    `;
    const queryParams: any[] = [userId];

    if (onlyUnread) {
      query += ` AND leida = false`;
    }

    query += ` ORDER BY fecha_creacion DESC LIMIT $2`;
    queryParams.push(limit);

    const result = await client.query(query, queryParams);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({ message: 'Error al obtener notificaciones' });
  } finally {
    client?.release();
  }
};

// Controlador para marcar una notificación como leída
export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    const userId = req.user.id;
    const { id } = req.params;
    client = await pool.connect();

    // Verificar que la notificación pertenezca al usuario
    const checkQuery = `
      SELECT id FROM notificaciones
      WHERE id = $1 AND usuario_id = $2
    `;
    const checkResult = await client.query(checkQuery, [id, userId]);
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    // Marcar como leída
    const updateQuery = `
      UPDATE notificaciones
      SET leida = true
      WHERE id = $1
      RETURNING *
    `;
    const result = await client.query(updateQuery, [id]);
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    return res.status(500).json({ message: 'Error al marcar notificación como leída' });
  } finally {
    client?.release();
  }
};

// Controlador para marcar todas las notificaciones del usuario como leídas
export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    const userId = req.user.id;
    client = await pool.connect();

    const updateQuery = `
      UPDATE notificaciones
      SET leida = true
      WHERE usuario_id = $1 AND leida = false
      RETURNING id
    `;
    const result = await client.query(updateQuery, [userId]);
    return res.status(200).json({ 
      message: 'Notificaciones marcadas como leídas', 
      count: result.rowCount 
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    return res.status(500).json({ message: 'Error al marcar notificaciones como leídas' });
  } finally {
    client?.release();
  }
};

// Controlador para obtener el conteo de notificaciones no leídas
export const getUnreadNotificationsCount = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    const userId = req.user.id;
    client = await pool.connect();

    const query = `
      SELECT COUNT(*)::int as unread_count
      FROM notificaciones
      WHERE usuario_id = $1 AND leida = false
    `;
    const result = await client.query(query, [userId]);
    return res.status(200).json({ count: result.rows[0].unread_count });
  } catch (error) {
    console.error('Error al obtener conteo de notificaciones no leídas:', error);
    return res.status(500).json({ message: 'Error al obtener conteo de notificaciones' });
  } finally {
    client?.release();
  }
};
