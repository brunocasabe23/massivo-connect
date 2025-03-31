import { Request, Response } from 'express';
import pool from '../config/db'; // Pool de conexiones a la BD
import { PoolClient, QueryResult } from 'pg';
import { isValid, parseISO } from 'date-fns'; // Importar funciones de date-fns

// --- Obtener todos los Códigos Presupuestales ---
export const getBudgetCodes = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const query = 'SELECT * FROM codigos_presupuestales ORDER BY nombre ASC'; 
    const result: QueryResult = await client.query(query);
    
    return res.status(200).json(result.rows);

  } catch (error) {
    console.error('Error al obtener códigos presupuestales:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  } finally {
    client?.release();
  }
};

// --- Obtener un Código Presupuestal por ID --- (Placeholder)
export const getBudgetCodeById = async (req: Request, res: Response): Promise<Response> => {
   const { id } = req.params;
   // TODO: Implementar lógica de consulta por ID
   return res.status(501).json({ message: `Obtener CP ${id} no implementado` });
};

// --- Crear un nuevo Código Presupuestal --- 
export const createBudgetCode = async (req: Request, res: Response): Promise<Response> => {
   const { 
     nombre, 
     descripcion, 
     monto_presupuesto, 
     fecha_inicio_vigencia, 
     fecha_fin_vigencia     
   } = req.body;

   // Validación básica
   if (!nombre || monto_presupuesto === undefined || monto_presupuesto === null) {
     return res.status(400).json({ message: 'Nombre y Monto Presupuesto son requeridos.' });
   }
   
   const monto = parseFloat(monto_presupuesto);
   if (isNaN(monto)) {
      return res.status(400).json({ message: 'Monto Presupuesto debe ser un número válido.' });
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
     const query = `
       INSERT INTO codigos_presupuestales 
         (nombre, descripcion, monto_presupuesto, fecha_inicio_vigencia, fecha_fin_vigencia) 
       VALUES 
         ($1, $2, $3, $4, $5) 
       RETURNING * 
     `;
     const params = [ nombre, descripcion || null, monto, inicioVigencia, finVigencia ];
     
     const result: QueryResult = await client.query(query, params);
     
     return res.status(201).json(result.rows[0]); 

   } catch (error: any) {
     console.error('Error al crear código presupuestal:', error);
     if (error.code === '23505' && error.constraint === 'codigos_presupuestales_nombre_key') {
        return res.status(409).json({ message: `El nombre de código presupuestal "${nombre}" ya existe.` });
     }
     // Manejar error de FK si se intenta asociar a algo que no existe (aunque no aplica aquí directamente)
     // if (error.code === '23503') { ... }
     return res.status(500).json({ message: 'Error interno del servidor.' });
   } finally {
     client?.release();
   }
};

// --- Actualizar un Código Presupuestal --- 
export const updateBudgetCode = async (req: Request, res: Response): Promise<Response> => {
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

// --- Eliminar un Código Presupuestal --- 
export const deleteBudgetCode = async (req: Request, res: Response): Promise<Response> => {
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