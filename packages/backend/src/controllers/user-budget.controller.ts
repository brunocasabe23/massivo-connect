// packages/backend/src/controllers/user-budget.controller.ts
// Usar any para evitar problemas de tipos
type Response = any;
type Request = any;

import pool from '../config/db';
import { PoolClient, QueryResult } from 'pg';

// Obtener códigos presupuestales disponibles para el usuario actual
export const getUserBudgetCodes = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const userId = req.user.id;
    const userAreaId = req.user.area_id;
    // Obtener el parámetro areaId de la consulta si existe
    const requestedAreaId = req.query.areaId ? parseInt(req.query.areaId as string) : null;

    client = await pool.connect();

    let query = '';
    let queryParams: any[] = [];

    // Si se especificó un área en la consulta y el usuario tiene permisos para ver todos los códigos
    // o el área solicitada coincide con el área del usuario
    if (requestedAreaId && (req.user.permisos?.includes('ver_codigos_presupuestales') || requestedAreaId === userAreaId)) {
      query = `
        SELECT
          cp.*,
          cp.monto_disponible,
          CASE
            WHEN cp.monto_disponible <= 0 THEN 'Agotado'
            WHEN cp.fecha_fin_vigencia < CURRENT_DATE THEN 'Vencido'
            ELSE 'Activo'
          END AS estado
        FROM codigos_presupuestales cp
        JOIN area_codigos_presupuestales acp ON cp.id = acp.cp_id
        WHERE acp.area_id = $1
        ORDER BY cp.nombre ASC
      `;
      queryParams.push(requestedAreaId);
    }
    // Si el usuario tiene permisos para ver todos los códigos presupuestales, mostrarlos todos
    else if (req.user.permisos && req.user.permisos.includes('ver_codigos_presupuestales')) {
      query = `
        SELECT
          cp.*,
          cp.monto_disponible,
          CASE
            WHEN cp.monto_disponible <= 0 THEN 'Agotado'
            WHEN cp.fecha_fin_vigencia < CURRENT_DATE THEN 'Vencido'
            ELSE 'Activo'
          END AS estado
        FROM codigos_presupuestales cp
        ORDER BY cp.nombre ASC
      `;
    }
    // Si el usuario tiene un área asignada, mostrar los códigos de esa área
    else if (userAreaId) {
      query = `
        SELECT
          cp.*,
          cp.monto_disponible,
          CASE
            WHEN cp.monto_disponible <= 0 THEN 'Agotado'
            WHEN cp.fecha_fin_vigencia < CURRENT_DATE THEN 'Vencido'
            ELSE 'Activo'
          END AS estado
        FROM codigos_presupuestales cp
        JOIN area_codigos_presupuestales acp ON cp.id = acp.cp_id
        WHERE acp.area_id = $1
        ORDER BY cp.nombre ASC
      `;
      queryParams.push(userAreaId);
    }
    // Si el usuario tiene códigos presupuestales asignados directamente
    else {
      query = `
        SELECT
          cp.*,
          cp.monto_disponible,
          CASE
            WHEN cp.monto_disponible <= 0 THEN 'Agotado'
            WHEN cp.fecha_fin_vigencia < CURRENT_DATE THEN 'Vencido'
            ELSE 'Activo'
          END AS estado
        FROM codigos_presupuestales cp
        JOIN usuario_codigos_presupuestales ucp ON cp.id = ucp.cp_id
        WHERE ucp.usuario_id = $1
        ORDER BY cp.nombre ASC
      `;
      queryParams.push(userId);
    }

    const result: QueryResult = await client.query(query, queryParams);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener códigos presupuestales del usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client?.release();
  }
};

// Obtener áreas disponibles para el usuario actual
export const getUserAreas = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const userId = req.user.id;

    client = await pool.connect();

    // Si el usuario tiene permisos para ver todas las áreas, mostrarlas todas
    if (req.user.permisos && req.user.permisos.includes('ver_areas')) {
      const query = `
        SELECT id, nombre, descripcion, departamento
        FROM areas
        ORDER BY nombre ASC
      `;
      const result = await client.query(query);
      return res.status(200).json(result.rows);
    }
    // Si no, mostrar solo el área asignada al usuario
    else {
      const query = `
        SELECT a.id, a.nombre, a.descripcion, a.departamento
        FROM areas a
        JOIN usuarios u ON a.id = u.area_id
        WHERE u.id = $1
      `;
      const result = await client.query(query, [userId]);
      return res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error('Error al obtener áreas del usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client?.release();
  }
};
