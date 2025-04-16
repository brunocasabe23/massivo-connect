// packages/frontend/src/services/notifications.service.ts
import { callApi } from './api';

export interface Notification {
  id: number;
  tipo_evento: string;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
  url_relacionada: string | null;
}

/**
 * Obtiene las notificaciones del usuario actual
 * @param limit Número máximo de notificaciones a obtener
 * @param onlyUnread Si es true, solo obtiene las notificaciones no leídas
 * @returns Lista de notificaciones
 */
export async function getUserNotifications(limit = 10, onlyUnread = false): Promise<Notification[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('limit', limit.toString());
  if (onlyUnread) {
    queryParams.append('onlyUnread', 'true');
  }
  
  const endpoint = `/notifications?${queryParams.toString()}`;
  return await callApi(endpoint);
}

/**
 * Obtiene el conteo de notificaciones no leídas
 * @returns Objeto con el conteo de notificaciones no leídas
 */
export async function getUnreadNotificationsCount(): Promise<{ count: number }> {
  return await callApi('/notifications/unread-count');
}

/**
 * Marca una notificación como leída
 * @param id ID de la notificación
 * @returns La notificación actualizada
 */
export async function markNotificationAsRead(id: number): Promise<Notification> {
  return await callApi(`/notifications/${id}/read`, { method: 'PUT' });
}

/**
 * Marca todas las notificaciones como leídas
 * @returns Objeto con el mensaje de confirmación y el conteo de notificaciones marcadas
 */
export async function markAllNotificationsAsRead(): Promise<{ message: string; count: number }> {
  return await callApi('/notifications/mark-all-read', { method: 'PUT' });
}
