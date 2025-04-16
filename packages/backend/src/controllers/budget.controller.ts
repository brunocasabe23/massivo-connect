// import { Request, Response } from 'express'; // Importar Request y Response
import pool from '../config/db';
import { PoolClient, QueryResult } from 'pg';
import { isValid, parseISO } from 'date-fns';
// import { AuthenticatedRequest } from '../request'; // Mantener importación

// Usar any para evitar problemas de tipos
type Response = any;
type AuthenticatedRequest = any;
type Request = any;

// --- Obtener Códigos Presupuestales (filtrados por área si aplica) ---
export const getBudgetCodes = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest aquí
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const userAreaId = req.user?.area_id;
    // TODO: Añadir lógica para verificar si el usuario tiene permiso para ver TODOS los códigos,
    // independientemente de su área (ej. 'ver_todos_codigos_presupuestales')
    // const canViewAll = req.user?.permisos?.includes('ver_todos_codigos_presupuestales');

    let query = `
      SELECT
        cp.* -- Seleccionar todas las columnas existentes, incluyendo monto_disponible
        -- El estado se puede determinar en el frontend basado en monto_disponible > 0 o fechas de vigencia
      FROM codigos_presupuestales cp
    `;
    const queryParams: any[] = [];

    // Si el usuario tiene un área asignada (y no puede ver todos), filtrar por área
    if (userAreaId /* && !canViewAll */) {
      query += `
        JOIN areas_codigos_presupuestales acp ON cp.id = acp.cp_id
        WHERE acp.area_id = $1
      `;
      queryParams.push(userAreaId);
    }

    query += ` ORDER BY cp.nombre ASC`;

    const result: QueryResult = await client.query(query, queryParams);

    return res.status(200).json(result.rows);

  } catch (error) {
    console.error('Error al obtener códigos presupuestales:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client?.release();
  }
};

// --- Obtener un Código Presupuestal por ID --- (Placeholder)
export const getBudgetCodeById = async (req: Request, res: Response): Promise<Response> => { // Usar Request estándar aquí
   const { id } = req.params;
   let client: PoolClient | null = null;

   // Validar que el ID sea un número
   const numericId = parseInt(id, 10);
   if (isNaN(numericId)) {
     return res.status(400).json({ message: 'El ID debe ser un número válido.' });
   }

   try {
     client = await pool.connect();
     const query = 'SELECT * FROM codigos_presupuestales WHERE id = $1';
     const result: QueryResult = await client.query(query, [numericId]);

     if (result.rowCount === 0) {
       return res.status(404).json({ message: `Código presupuestal con ID ${numericId} no encontrado.` });
     }

     return res.status(200).json(result.rows[0]);

   } catch (error) {
     console.error(`Error al obtener código presupuestal ${numericId}:`, error);
     return res.status(500).json({ message: 'Error interno del servidor.' });
   } finally {
     client?.release();
   }
};

// --- Crear un nuevo Código Presupuestal ---
export const createBudgetCode = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest si se necesita el usuario para el historial
   const {
     nombre,
     descripcion,
     monto_presupuesto,
     fecha_inicio_vigencia,
     fecha_fin_vigencia
   } = req.body;
   const userId = req.user?.id; // Obtener ID del usuario para el historial

   // Validación básica
   if (!nombre || monto_presupuesto === undefined || monto_presupuesto === null) {
     return res.status(400).json({ message: 'Nombre y Monto Presupuesto son requeridos.' });
   }

   const monto = parseFloat(monto_presupuesto);
   if (isNaN(monto) || monto < 0) { // Asegurar que el monto no sea negativo
      return res.status(400).json({ message: 'Monto Presupuesto debe ser un número válido y no negativo.' });
   }

   // Validación de fechas
   let inicioVigencia = null;
   if (fecha_inicio_vigencia) {
     const parsedDate = parseISO(fecha_inicio_vigencia);
     if (!isValid(parsedDate)) {
       return res.status(400).json({ message: 'Fecha de inicio de vigencia inválida. Use formato YYYY-MM-DD.' });
     }
     inicioVigencia = fecha_inicio_vigencia;
   }

   let finVigencia = null;
   if (fecha_fin_vigencia) {
     const parsedDate = parseISO(fecha_fin_vigencia);
     if (!isValid(parsedDate)) {
       return res.status(400).json({ message: 'Fecha de fin de vigencia inválida. Use formato YYYY-MM-DD.' });
     }
     if (inicioVigencia && parseISO(fecha_fin_vigencia) < parseISO(inicioVigencia)) {
        return res.status(400).json({ message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
     }
     finVigencia = fecha_fin_vigencia;
   }

   let client: PoolClient | null = null;
   try {
     client = await pool.connect();
     await client.query('BEGIN'); // Iniciar transacción

     // Insertar el código presupuestal inicializando monto_disponible
     const insertBudgetQuery = `
       INSERT INTO codigos_presupuestales
         (nombre, descripcion, monto_presupuesto, fecha_inicio_vigencia, fecha_fin_vigencia, monto_disponible)
       VALUES
         ($1, $2, $3, $4, $5, $3) -- monto_disponible = monto_presupuesto
       RETURNING *
     `;
     const budgetParams = [ nombre, descripcion || null, monto, inicioVigencia, finVigencia ];
     const budgetResult: QueryResult = await client.query(insertBudgetQuery, budgetParams);
     const newBudgetCode = budgetResult.rows[0];

     // Insertar registro en el historial
     const insertHistoryQuery = `
       INSERT INTO historial_presupuesto
         (cp_id, tipo_movimiento, monto_cambio, monto_anterior, monto_nuevo, usuario_id, descripcion)
       VALUES
         ($1, $2, $3, $4, $5, $6, $7)
     `;
     const historyParams = [
       newBudgetCode.id,
       'ASIGNACION_INICIAL',
       monto, // monto_cambio
       0,     // monto_anterior
       monto, // monto_nuevo
       userId || null, // ID del usuario que crea, si está disponible
       'Creación de código presupuestal'
     ];
     await client.query(insertHistoryQuery, historyParams);

     await client.query('COMMIT'); // Confirmar transacción

     return res.status(201).json(newBudgetCode);

   } catch (error: any) {
     await client?.query('ROLLBACK'); // Revertir transacción en caso de error
     console.error('Error al crear código presupuestal:', error);
     if (error.code === '23505' && error.constraint === 'codigos_presupuestales_nombre_key') {
        return res.status(409).json({ message: `El nombre de código presupuestal "${nombre}" ya existe.` });
     }
     return res.status(500).json({ message: 'Error interno del servidor.' });
   } finally {
     client?.release();
   }
};

// --- Actualizar un Código Presupuestal ---
export const updateBudgetCode = async (req: Request, res: Response): Promise<Response> => { // Usar Request estándar aquí
   const { id } = req.params;
   const {
     nombre,
     descripcion,
     monto_presupuesto,
     fecha_inicio_vigencia,
     fecha_fin_vigencia
   } = req.body;

   // Validación (similar a create)
   if (!nombre || monto_presupuesto === undefined || monto_presupuesto === null) {
     return res.status(400).json({ message: 'Nombre y Monto Presupuesto son requeridos.' });
   }
   const monto = parseFloat(monto_presupuesto);
   if (isNaN(monto)) {
      return res.status(400).json({ message: 'Monto Presupuesto debe ser un número válido.' });
   }
   let inicioVigencia = null;
   if (fecha_inicio_vigencia) {
     const parsedDate = parseISO(fecha_inicio_vigencia);
     if (!isValid(parsedDate)) {
       return res.status(400).json({ message: 'Fecha de inicio de vigencia inválida. Use formato YYYY-MM-DD.' });
     }
     inicioVigencia = fecha_inicio_vigencia;
   }
   let finVigencia = null;
   if (fecha_fin_vigencia) {
     const parsedDate = parseISO(fecha_fin_vigencia);
     if (!isValid(parsedDate)) {
       return res.status(400).json({ message: 'Fecha de fin de vigencia inválida. Use formato YYYY-MM-DD.' });
     }
     if (inicioVigencia && parseISO(fecha_fin_vigencia) < parseISO(inicioVigencia)) {
        return res.status(400).json({ message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
     }
     finVigencia = fecha_fin_vigencia;
   }

   let client: PoolClient | null = null;
   try {
     client = await pool.connect();
     const query = `
       UPDATE codigos_presupuestales
       SET
         nombre = $1,
         descripcion = $2,
         monto_presupuesto = $3,
         fecha_inicio_vigencia = $4,
         fecha_fin_vigencia = $5
         -- fecha_actualizacion se actualiza por trigger
       WHERE id = $6
       RETURNING *
     `;
     const params = [ nombre, descripcion || null, monto, inicioVigencia, finVigencia, id ];

     const result: QueryResult = await client.query(query, params);

     if (result.rowCount === 0) {
        return res.status(404).json({ message: `Código presupuestal con ID ${id} no encontrado.` });
     }

     return res.status(200).json(result.rows[0]);

   } catch (error: any) {
     console.error(`Error al actualizar código presupuestal ${id}:`, error);
      if (error.code === '23505' && error.constraint === 'codigos_presupuestales_nombre_key') {
        return res.status(409).json({ message: `El nombre de código presupuestal "${nombre}" ya existe.` });
     }
     return res.status(500).json({ message: 'Error interno del servidor.' });
   } finally {
     client?.release();
   }
};

// Obtener áreas asociadas a un código presupuestal
export const getAreasByBudgetCode = async (req: Request, res: Response) => { // Usar Request estándar aquí
  const { id } = req.params;
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query(
      `SELECT a.*
       FROM areas a
       JOIN areas_codigos_presupuestales acp ON a.id = acp.area_id -- Usar la tabla correcta
       WHERE acp.cp_id = $1
       ORDER BY a.nombre ASC`,
      [id]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error(`Error al obtener áreas para código presupuestal ${id}:`, error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    client?.release();
  }
};
// --- Eliminar un Código Presupuestal ---
export const deleteBudgetCode = async (req: Request, res: Response): Promise<Response> => { // Usar Request estándar aquí
    const { id } = req.params;
    let client: PoolClient | null = null;

    try {
      client = await pool.connect();
      const query = 'DELETE FROM codigos_presupuestales WHERE id = $1 RETURNING id';
      const result: QueryResult = await client.query(query, [id]);

      if (result.rowCount === 0) {
         return res.status(404).json({ message: `Código presupuestal con ID ${id} no encontrado.` });
      }

      return res.status(204).send(); // 204 No Content

    } catch (error: any) {
       console.error(`Error al eliminar código presupuestal ${id}:`, error);
       // Manejar error si el código está en uso (FK constraint)
       if (error.code === '23503') { // foreign_key_violation
          return res.status(409).json({ message: 'No se puede eliminar el código presupuestal porque está asociado a órdenes de compra o usuarios.' });
       }
       return res.status(500).json({ message: 'Error interno del servidor.' });
    } finally {
       client?.release();
    }
};