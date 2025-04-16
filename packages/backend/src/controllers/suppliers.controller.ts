// packages/backend/src/controllers/suppliers.controller.ts
import { PoolClient } from 'pg';
import pool from '../config/db';
import { AuthenticatedRequest } from '../types/request';
import { Request, Response } from 'express-serve-static-core';

// Obtener todos los proveedores
export const getAllSuppliers = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // Obtener parámetros de consulta para filtrado
    const { estado, categoria, searchTerm } = req.query;

    // Construir la consulta base
    let query = `
      SELECT * FROM proveedores
      WHERE 1=1
    `;

    // Arreglo para parámetros
    const params: any[] = [];
    let paramIndex = 1;

    // Añadir filtros si existen
    if (estado) {
      query += ` AND estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    if (categoria) {
      query += ` AND categoria = $${paramIndex}`;
      params.push(categoria);
      paramIndex++;
    }

    if (searchTerm) {
      query += ` AND (
        nombre ILIKE $${paramIndex} OR
        rfc ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex} OR
        contacto_nombre ILIKE $${paramIndex}
      )`;
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // Ordenar por nombre
    query += ` ORDER BY nombre ASC`;

    const result = await client.query(query, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return res.status(500).json({ message: 'Error al obtener proveedores' });
  } finally {
    client?.release();
  }
};

// Obtener un proveedor por ID
export const getSupplierById = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    const { id } = req.params;
    client = await pool.connect();

    const result = await client.query('SELECT * FROM proveedores WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Error al obtener proveedor ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Error al obtener proveedor' });
  } finally {
    client?.release();
  }
};

// Obtener un proveedor por ID con sus productos asociados
export const getSupplierWithProducts = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    const { id } = req.params;
    client = await pool.connect();

    // 1. Obtener datos del proveedor
    const supplierResult = await client.query('SELECT * FROM proveedores WHERE id = $1', [id]);
    if (supplierResult.rowCount === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    const supplierData = supplierResult.rows[0];

    // 2. Obtener productos asociados
    const productsQuery = `
      SELECT p.id, p.nombre, p.sku, p.categoria
      FROM productos p
      JOIN proveedor_productos pp ON p.id = pp.producto_id
      WHERE pp.proveedor_id = $1
      ORDER BY p.nombre;
    `;
    const productsResult = await client.query(productsQuery, [id]);

    // 3. Obtener la fecha de la última compra (si existe)
    const lastPurchaseQuery = `
      SELECT MAX(fecha_creacion) as ultima_compra
      FROM ordenes_compra
      WHERE proveedor_id = $1
    `;
    const lastPurchaseResult = await client.query(lastPurchaseQuery, [id]);
    const ultimaCompra = lastPurchaseResult.rows[0]?.ultima_compra || null;

    // 4. Convertir el campo categoria a un array de categorias si existe
    let categorias = [];
    if (supplierData.categoria) {
      // Si es una cadena separada por comas, convertirla a array
      if (typeof supplierData.categoria === 'string') {
        if (supplierData.categoria.includes(',')) {
          categorias = supplierData.categoria.split(',').map((cat: string) => cat.trim());
        } else {
          categorias = [supplierData.categoria.trim()];
        }
      } else {
        categorias = [supplierData.categoria];
      }
    }

    // Combinar datos
    const responseData = {
      ...supplierData,
      categorias: categorias,
      ultima_compra: ultimaCompra,
      productos: productsResult.rows // Añadir array de productos asociados
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error(`Error al obtener proveedor detallado ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Error al obtener proveedor detallado' });
  } finally {
    client?.release();
  }
};

// Crear un nuevo proveedor y asociar productos opcionalmente
export const createSupplier = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    const {
      nombre,
      rfc,
      direccion,
      telefono,
      email,
      contacto_nombre,
      contacto_telefono,
      contacto_email,
      categoria,
      categorias, // Nuevo campo para recibir categorías como array
      estado,
      notas,
      producto_ids // Array opcional de IDs de productos a asociar
    } = req.body;

    // Convertir categorias (array) a categoria (string) si existe
    let categoriaFinal = categoria;
    if (categorias && Array.isArray(categorias) && categorias.length > 0) {
      // Siempre usar el array de categorias si está disponible
      categoriaFinal = categorias.join(',');
    }
    console.log('[createSupplier] Received categorias:', categorias);
    console.log('[createSupplier] Final categoria:', categoriaFinal);
    console.log('[createSupplier] Received producto_ids:', producto_ids); // Log IDs recibidos

    // Validación básica
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del proveedor es requerido' });
    }

    client = await pool.connect();

    const query = `
      INSERT INTO proveedores (
        nombre, rfc, direccion, telefono, email,
        contacto_nombre, contacto_telefono, contacto_email,
        categoria, estado, notas, sitio_web
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    // Extraer sitio_web del cuerpo de la solicitud
    const sitio_web = req.body.sitio_web;
    console.log('[createSupplier] Received sitio_web:', sitio_web);

    const values = [
      nombre,
      rfc || null,
      direccion || null,
      telefono || null,
      email || null,
      contacto_nombre || null,
      contacto_telefono || null,
      contacto_email || null,
      categoriaFinal || null,
      estado || 'activo',
      notas || null,
      sitio_web || null
    ];

    // Iniciar transacción
    await client.query('BEGIN');

    try {
      // 1. Insertar el proveedor
      const result = await client.query(query, values);
      const newSupplier = result.rows[0];

      // 2. Asociar productos si se proporcionaron IDs
      if (producto_ids && Array.isArray(producto_ids) && producto_ids.length > 0) {
        const associateQuery = `
          INSERT INTO proveedor_productos (proveedor_id, producto_id)
          SELECT $1, producto_id FROM unnest($2::int[]) AS producto_id
          ON CONFLICT (proveedor_id, producto_id) DO NOTHING;
        `;
        // Filtrar IDs no válidos (ej. 0, null, undefined) antes de pasar a la consulta
        const validProductoIds = producto_ids.filter(id => id && Number.isInteger(id) && id > 0);
        if (validProductoIds.length > 0) {
           await client.query(associateQuery, [newSupplier.id, validProductoIds]);
        }
      }

      // Confirmar transacción
      await client.query('COMMIT');
      // Devolver el proveedor creado Y los IDs recibidos para depuración
      // Devolver el proveedor creado Y los IDs recibidos (del req.body) para depuración
      return res.status(201).json({ ...newSupplier, producto_ids_recibidos: producto_ids || [] });

    } catch (transactionError) {
      // Revertir transacción en caso de error
      await client.query('ROLLBACK');
      console.error('Error al crear proveedor o asociar productos:', transactionError);
      // Manejar errores específicos si es necesario (ej. FK inválida en producto_ids)
       if ((transactionError as any).code === '23503') { // foreign_key_violation
           return res.status(400).json({ message: 'Error: Uno o más IDs de producto son inválidos.' });
       }
      return res.status(500).json({ message: 'Error interno al crear proveedor', error: transactionError }); // Incluir error
    }

  } catch (error) {
      // Este catch manejaría errores antes de iniciar la transacción (ej. conexión)
      console.error('Error general al crear proveedor:', error);
      return res.status(500).json({ message: 'Error interno al crear proveedor', error: error }); // Incluir error
  } finally {
    client?.release();
  }
};

// Actualizar un proveedor existente
export const updateSupplier = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  const id = (req as any).params.id; // Definir id fuera del try para que esté disponible en catch
  try {
    const {
      nombre,
      rfc,
      direccion,
      telefono,
      email,
      contacto_nombre,
      contacto_telefono,
      contacto_email,
      categoria,
      categorias, // Nuevo campo para recibir categorías como array
      estado,
      notas,
      producto_ids // Añadir para recibir IDs de productos asociados
    } = req.body;

    // Convertir categorias (array) a categoria (string) si existe
    let categoriaFinal = categoria;
    if (categorias && Array.isArray(categorias) && categorias.length > 0) {
      // Siempre usar el array de categorias si está disponible
      categoriaFinal = categorias.join(',');
    }
    console.log('[updateSupplier] Received categorias:', categorias);
    console.log('[updateSupplier] Final categoria:', categoriaFinal);

    // Validación básica
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del proveedor es requerido' });
    }

    client = await pool.connect();

    // Verificar si el proveedor existe
    const checkResult = await client.query('SELECT id FROM proveedores WHERE id = $1', [id]);
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    const query = `
      UPDATE proveedores
      SET
        nombre = $1,
        rfc = $2,
        direccion = $3,
        telefono = $4,
        email = $5,
        contacto_nombre = $6,
        contacto_telefono = $7,
        contacto_email = $8,
        categoria = $9,
        estado = $10,
        notas = $11,
        sitio_web = $12,
        fecha_actualizacion = NOW()
      WHERE id = $13
      RETURNING *
    `;

    // Extraer sitio_web del cuerpo de la solicitud
    const sitio_web = req.body.sitio_web;
    console.log('[updateSupplier] Received sitio_web:', sitio_web);

    const values = [
      nombre,
      rfc || null,
      direccion || null,
      telefono || null,
      email || null,
      contacto_nombre || null,
      contacto_telefono || null,
      contacto_email || null,
      categoriaFinal || null,
      estado || 'activo',
      notas || null,
      sitio_web || null,
      id
    ];

    // Iniciar transacción
    await client.query('BEGIN');
    try {
        // 1. Actualizar datos del proveedor
        const result = await client.query(query, values);
        const updatedSupplier = result.rows[0];

        // 2. Actualizar asociaciones en proveedor_productos (si se enviaron producto_ids)
        if (producto_ids && Array.isArray(producto_ids)) {
            const supplierId = parseInt(id);
            // Eliminar asociaciones antiguas para este proveedor
            await client.query('DELETE FROM proveedor_productos WHERE proveedor_id = $1', [supplierId]);

            // Insertar nuevas asociaciones (si hay alguna)
            const validProductoIds = producto_ids.filter(prodId => prodId && Number.isInteger(prodId) && prodId > 0);
            if (validProductoIds.length > 0) {
                const associateQuery = `
                  INSERT INTO proveedor_productos (proveedor_id, producto_id)
                  SELECT $1, producto_id FROM unnest($2::int[]) AS producto_id
                  ON CONFLICT (proveedor_id, producto_id) DO NOTHING;
                `;
                await client.query(associateQuery, [supplierId, validProductoIds]);
            }
        }

        await client.query('COMMIT'); // Confirmar transacción
        return res.status(200).json(updatedSupplier);

    } catch (transactionError) {
        await client.query('ROLLBACK'); // Revertir en caso de error
        console.error(`Error en transacción al actualizar proveedor ${id}:`, transactionError);
         if ((transactionError as any).code === '23503') { // foreign_key_violation (ej. producto_id inválido)
             return res.status(400).json({ message: 'Error: Uno o más IDs de producto son inválidos.' });
         }
        return res.status(500).json({ message: 'Error interno al actualizar proveedor' });
    }

  } catch (error) {
      // Este catch manejaría errores antes de iniciar la transacción (ej. conexión)
      console.error(`Error general al actualizar proveedor ${id}:`, error); // id ahora está disponible
      return res.status(500).json({ message: 'Error interno al actualizar proveedor' });
  } finally {
    client?.release();
  }
};

// Eliminar un proveedor
export const deleteSupplier = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    const { id } = req.params;
    client = await pool.connect();

    // Verificar si el proveedor existe
    const checkResult = await client.query('SELECT id FROM proveedores WHERE id = $1', [id]);
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    // Verificar si el proveedor está siendo utilizado en órdenes de compra por ID
    const usageCheck = await client.query('SELECT id FROM ordenes_compra WHERE proveedor_id = $1 LIMIT 1', [id]);
    if (usageCheck && usageCheck.rowCount && usageCheck.rowCount > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar el proveedor porque está asociado a una o más órdenes de compra.',
        // orderId: usageCheck.rows[0].id // Opcional: devolver ID de una orden asociada
      });
    }

    // Eliminar el proveedor
    await client.query('DELETE FROM proveedores WHERE id = $1', [id]);

    return res.status(204).send();
  } catch (error) {
    console.error(`Error al eliminar proveedor ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Error al eliminar proveedor' });
  } finally {
    client?.release();
  }
};

/**
 * Obtener los IDs de productos asociados a un proveedor
 */
export const getSupplierProducts = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    const { id } = req.params;
    client = await pool.connect();
    const result = await client.query(
      'SELECT producto_id FROM proveedor_productos WHERE proveedor_id = $1',
      [id]
    );
    const productoIds = result.rows.map(row => row.producto_id);
    return res.status(200).json(productoIds);
  } catch (error) {
    console.error('Error al obtener productos asociados al proveedor:', error);
    return res.status(500).json({ message: 'Error al obtener productos asociados al proveedor' });
  } finally {
    client?.release();
  }
};

// Obtener lista simple de proveedores (ID y Nombre)
export const getAllSuppliersSimple = async (_req: Request, res: Response): Promise<Response> => {
/**
 * Obtener los IDs de productos asociados a un proveedor
 */
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query("SELECT id, nombre FROM proveedores WHERE LOWER(estado) = 'activo' ORDER BY nombre ASC");
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener lista simple de proveedores:', error);
    return res.status(500).json({ message: 'Error al obtener lista simple de proveedores' });
  } finally {
    client?.release();
  }
};

// Obtener categorías únicas de proveedores
export const getSupplierCategories = async (_req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    const query = `
      SELECT DISTINCT categoria
      FROM proveedores
      WHERE categoria IS NOT NULL
      ORDER BY categoria
    `;

    const result = await client.query(query);
    const categories = result.rows.map(row => row.categoria);

    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error al obtener categorías de proveedores:', error);
    return res.status(500).json({ message: 'Error al obtener categorías de proveedores' });
  } finally {
    client?.release();
  }
};
