import pool from '../config/db';
import { PoolClient } from 'pg';

// Interfaz para los datos de actividad
export interface ActivityData {
  usuario_id: number;
  tipo_accion: string;
  descripcion: string;
  entidad_tipo?: string;
  entidad_id?: number;
  entidad_nombre?: string;
  datos_adicionales?: any;
}

/**
 * Registra una nueva actividad en la base de datos
 * @param data Datos de la actividad a registrar
 * @returns El ID de la actividad registrada
 */
export async function registerActivity(data: ActivityData): Promise<number> {
  let client: PoolClient | null = null;
  
  try {
    client = await pool.connect();
    
    const query = `
      INSERT INTO actividades (
        usuario_id, 
        tipo_accion, 
        descripcion, 
        entidad_tipo, 
        entidad_id, 
        entidad_nombre, 
        datos_adicionales
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const values = [
      data.usuario_id,
      data.tipo_accion,
      data.descripcion,
      data.entidad_tipo || null,
      data.entidad_id || null,
      data.entidad_nombre || null,
      data.datos_adicionales ? JSON.stringify(data.datos_adicionales) : null
    ];
    
    const result = await client.query(query, values);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error al registrar actividad:', error);
    // No lanzamos el error para evitar que falle la operación principal
    // Solo registramos el error y devolvemos -1 para indicar que falló
    return -1;
  } finally {
    client?.release();
  }
}

/**
 * Obtiene las actividades recientes del sistema
 * @param limit Número máximo de actividades a obtener
 * @returns Lista de actividades recientes
 */
export async function getRecentActivities(limit: number = 10): Promise<any[]> {
  let client: PoolClient | null = null;
  
  try {
    client = await pool.connect();
    
    const query = `
      SELECT 
        a.id,
        a.tipo_accion,
        a.descripcion,
        a.entidad_tipo,
        a.entidad_id,
        a.entidad_nombre,
        a.datos_adicionales,
        a.fecha_creacion,
        u.id as usuario_id,
        u.nombre as usuario_nombre
      FROM actividades a
      JOIN usuarios u ON a.usuario_id = u.id
      ORDER BY a.fecha_creacion DESC
      LIMIT $1
    `;
    
    const result = await client.query(query, [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error al obtener actividades recientes:', error);
    throw error;
  } finally {
    client?.release();
  }
}

/**
 * Obtiene las actividades recientes de un usuario específico
 * @param userId ID del usuario
 * @param limit Número máximo de actividades a obtener
 * @returns Lista de actividades recientes del usuario
 */
export async function getUserActivities(userId: number, limit: number = 10): Promise<any[]> {
  let client: PoolClient | null = null;
  
  try {
    client = await pool.connect();
    
    const query = `
      SELECT 
        a.id,
        a.tipo_accion,
        a.descripcion,
        a.entidad_tipo,
        a.entidad_id,
        a.entidad_nombre,
        a.datos_adicionales,
        a.fecha_creacion
      FROM actividades a
      WHERE a.usuario_id = $1
      ORDER BY a.fecha_creacion DESC
      LIMIT $2
    `;
    
    const result = await client.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    console.error(`Error al obtener actividades del usuario ${userId}:`, error);
    throw error;
  } finally {
    client?.release();
  }
}
