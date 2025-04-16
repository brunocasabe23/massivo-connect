// import { Request, Response } from 'express'; // Restaurar importación original

// Usar any para evitar problemas de tipos
type Response = any;
type Request = any;
import pool from '../config/db';
import { PoolClient, QueryResult } from 'pg';

// Obtener todas las áreas
export const getAreas = async (_req: Request, res: Response) => { // Usar tipos estándar
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    // Modificar consulta para incluir presupuesto asignado
    const result = await client.query(`
      SELECT
        a.*,
        COALESCE(SUM(cp.monto_presupuesto), 0) AS presupuesto_asignado,
        COUNT(acp.cp_id) AS codigos_count
      FROM areas a
      LEFT JOIN area_codigos_presupuestales acp ON a.id = acp.area_id
      LEFT JOIN codigos_presupuestales cp ON acp.cp_id = cp.id
      GROUP BY a.id
      ORDER BY a.nombre ASC
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener áreas:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    client?.release();
  }
};

// Crear área
export const createArea = async (req: Request, res: Response) => { // Usar tipos estándar
  const { nombre, descripcion, departamento, responsable, empleados, presupuesto_inicial } = req.body;
  if (!nombre) return res.status(400).json({ message: 'Nombre es requerido' });

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query(
      'INSERT INTO areas (nombre, descripcion, departamento, responsable, empleados, presupuesto_inicial) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, descripcion, departamento, responsable, empleados || 0, presupuesto_inicial || 0]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear área:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    client?.release();
  }
};

// Actualizar área
export const updateArea = async (req: Request, res: Response) => { // Usar tipos estándar
  const { id } = req.params;
  const { nombre, descripcion, departamento, responsable, empleados, presupuesto_inicial } = req.body;

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query(
      'UPDATE areas SET nombre=$1, descripcion=$2, departamento=$3, responsable=$4, empleados=$5, presupuesto_inicial=$6, fecha_actualizacion=NOW() WHERE id=$7 RETURNING *',
      [nombre, descripcion, departamento, responsable, empleados || 0, presupuesto_inicial || 0, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Área no encontrada' });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar área:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    client?.release();
  }
};

// Eliminar área
export const deleteArea = async (req: Request, res: Response) => { // Usar tipos estándar
  const { id } = req.params;

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query('DELETE FROM areas WHERE id=$1 RETURNING id', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Área no encontrada' });
    return res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar área:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    client?.release();
  }
};

// Asociar Código Presupuestal a un Área
export const associateCodeToArea = async (req: Request, res: Response) => { // Usar tipos estándar
  const { areaId } = req.params; // Obtener areaId de la URL
  const { cp_id } = req.body; // Obtener cp_id del body

  if (!cp_id) return res.status(400).json({ message: 'cp_id es requerido en el cuerpo de la solicitud' });
  if (!areaId) return res.status(400).json({ message: 'areaId es requerido en la URL' });

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    // Usar la tabla correcta: areas_codigos_presupuestales
    await client.query(
      'INSERT INTO areas_codigos_presupuestales (area_id, cp_id) VALUES ($1, $2) ON CONFLICT (area_id, cp_id) DO NOTHING',
      [areaId, cp_id]
    );
    return res.status(201).json({ message: 'Código presupuestal asociado al área exitosamente' });
  } catch (error) {
    console.error(`Error al asociar CP ${cp_id} al área ${areaId}:`, error);
    return res.status(500).json({ message: 'Error interno del servidor al asociar código' });
  } finally {
    client?.release();
  }
};

// Obtener códigos presupuestales asociados a un área
export const getAssociatedBudgetCodes = async (req: Request, res: Response) => { // Usar tipos estándar
  const { id } = req.params; // ID del área
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query(
      `SELECT cp.*
       FROM codigos_presupuestales cp
       JOIN areas_codigos_presupuestales acp ON cp.id = acp.cp_id -- Usar tabla correcta
       WHERE acp.area_id = $1
       ORDER BY cp.nombre ASC`,
      [id]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error(`Error al obtener códigos para área ${id}:`, error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    client?.release();
  }
};

// Desasociar Código Presupuestal de un Área
export const dissociateCodeFromArea = async (req: Request, res: Response) => { // Usar tipos estándar
  const { areaId, cpId } = req.params; // Obtener IDs de la URL

  if (!areaId || !cpId) return res.status(400).json({ message: 'areaId y cpId son requeridos en la URL' });

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    // Usar la tabla correcta: areas_codigos_presupuestales
    const result = await client.query(
      'DELETE FROM areas_codigos_presupuestales WHERE area_id=$1 AND cp_id=$2 RETURNING *',
      [areaId, cpId]
    );
     if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Asociación no encontrada.' });
     }
    return res.status(200).json({ message: 'Código presupuestal desasociado del área exitosamente' });
  } catch (error) {
    console.error(`Error al desasociar CP ${cpId} del área ${areaId}:`, error);
    return res.status(500).json({ message: 'Error interno del servidor al desasociar código' });
  } finally {
    client?.release();
  }
};