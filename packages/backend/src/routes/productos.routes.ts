// Usar require para Express y Router
const express = require('express');
const Router = express.Router;
import pool from '../config/db'; // Corregir path a config/db
import { PoolClient } from 'pg'; // Añadir importación faltante
import { authenticateToken } from '../middleware/auth.middleware'; // Usar authenticateToken

// Tipos básicos si la importación directa falla
type Request = any;
type Response = any;

const router = Router();

// Obtener todos los productos con sus proveedores asociados
router.get('/', authenticateToken, async (req: Request, res: Response) => { // Usar authenticateToken
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // 1. Obtener todos los productos
    const productosResult = await client.query(
      'SELECT * FROM productos ORDER BY nombre'
    );

    // 2. Para cada producto, obtener sus proveedores asociados
    const productosConProveedores = await Promise.all(
      productosResult.rows.map(async (producto) => {
        // Aseguramos que client no sea nulo
        if (client) {
          const proveedoresResult = await client.query(
            `SELECT p.id, p.nombre
             FROM proveedores p
             JOIN proveedor_productos pp ON p.id = pp.proveedor_id
             WHERE pp.producto_id = $1
             ORDER BY p.nombre`,
            [producto.id]
          );

          return {
            ...producto,
            proveedores: proveedoresResult.rows
          };
        }
        // Si client es nulo, devolvemos el producto sin proveedores
        return {
          ...producto,
          proveedores: []
        };
      })
    );

    res.json(productosConProveedores);
  } catch (error) {
    console.error('Error al obtener productos con proveedores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client?.release();
  }
});

// Ruta GET /proveedor/:id eliminada ya que productos ya no tienen proveedor_id directo

// Obtener categorías
router.get('/categorias', authenticateToken, async (req: Request, res: Response) => { // Usar authenticateToken
  try {
    const result = await pool.query(
      'SELECT * FROM categorias_productos ORDER BY nombre'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear producto y asociar proveedores opcionalmente
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const {
      nombre, descripcion, categoria, subcategoria, sku, unidad_medida,
      precio_base, stock, activo, proveedor_ids,
      // Campos adicionales
      codigo_barras, ubicacion_almacen, notas_adicionales, icono
    } = req.body;

    if (!nombre || !sku || !categoria || !unidad_medida) {
      client.release();
      return res.status(400).json({ message: 'Faltan campos requeridos (nombre, sku, categoria, unidad_medida)' });
    }

    await client.query('BEGIN');
    // 1. Insertar el producto
    const insertQuery = `
      INSERT INTO productos
        (nombre, descripcion, categoria, subcategoria, sku, unidad_medida,
         precio_base, stock, activo, codigo_barras, ubicacion_almacen, notas_adicionales, icono)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const insertParams = [
      nombre, descripcion, categoria, subcategoria, sku, unidad_medida,
      precio_base || 0, stock || 0, activo === undefined ? true : activo,
      codigo_barras || null, ubicacion_almacen || null, notas_adicionales || null, icono || 'box'
    ];
    const result = await client.query(insertQuery, insertParams);
    const newProducto = result.rows[0];

    // 2. Asociar proveedores si se proporcionaron IDs
    if (proveedor_ids && Array.isArray(proveedor_ids) && proveedor_ids.length > 0) {
      const associateQuery = `
        INSERT INTO proveedor_productos (proveedor_id, producto_id)
        SELECT proveedor_id, $1 FROM unnest($2::int[]) AS proveedor_id
        ON CONFLICT (proveedor_id, producto_id) DO NOTHING;
      `;
      const validProveedorIds = proveedor_ids.filter(id => id && Number.isInteger(id) && id > 0);
      if (validProveedorIds.length > 0) {
        await client.query(associateQuery, [newProducto.id, validProveedorIds]);
      }
    }

    await client.query('COMMIT');
    client.release();
    res.status(201).json(newProducto);

  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar producto y sus asociaciones de proveedores
router.put('/:id', authenticateToken, async (req: Request, res: Response) => { // Usar authenticateToken
  const client = await pool.connect(); // Necesitamos cliente para transacción
  try {
    const { id } = req.params;
    const productoId = parseInt(id); // Asegurar que es número
    // Incluir nuevas columnas y proveedor_ids
    const {
      nombre, descripcion, categoria, subcategoria, sku, unidad_medida,
      precio_base, stock, activo, proveedor_ids,
      // Campos adicionales
      codigo_barras, ubicacion_almacen, notas_adicionales, icono
    } = req.body;
    console.log(`[PUT /productos/${id}] Received proveedor_ids:`, proveedor_ids); // Log IDs recibidos

     // Validación básica adicional
    if (!nombre || !sku || !categoria || !unidad_medida) {
        client.release();
        return res.status(400).json({ message: 'Faltan campos requeridos (nombre, sku, categoria, unidad_medida)' });
    }

    await client.query('BEGIN'); // Iniciar transacción

    // 1. Actualizar datos del producto
    const updateProductoQuery = `
      UPDATE productos
       SET nombre = $1, descripcion = $2, categoria = $3, subcategoria = $4,
           sku = $5, unidad_medida = $6, precio_base = $7, stock = $8, activo = $9,
           codigo_barras = $10, ubicacion_almacen = $11, notas_adicionales = $12, icono = $13,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`;
    const updateProductoParams = [
      nombre, descripcion, categoria, subcategoria, sku, unidad_medida,
      precio_base || 0, stock || 0, activo === undefined ? true : activo,
      codigo_barras || null, ubicacion_almacen || null, notas_adicionales || null, icono || 'box',
      productoId
    ];
    const result = await client.query(updateProductoQuery, updateProductoParams);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    const updatedProducto = result.rows[0];

    // 2. Actualizar asociaciones en proveedor_productos (si se enviaron proveedor_ids)
    if (proveedor_ids && Array.isArray(proveedor_ids)) {
        // Eliminar asociaciones antiguas para este producto
        await client.query('DELETE FROM proveedor_productos WHERE producto_id = $1', [productoId]);

        // Insertar nuevas asociaciones (si hay alguna)
        const validProveedorIds = proveedor_ids.filter(id => id && Number.isInteger(id) && id > 0);
        if (validProveedorIds.length > 0) {
            const associateQuery = `
              INSERT INTO proveedor_productos (proveedor_id, producto_id)
              SELECT proveedor_id, $1 FROM unnest($2::int[]) AS proveedor_id
              ON CONFLICT (proveedor_id, producto_id) DO NOTHING;
            `;
            await client.query(associateQuery, [productoId, validProveedorIds]);
        }
    }

    await client.query('COMMIT'); // Confirmar transacción
    client.release();
    res.json(updatedProducto);

  } catch (error) {
    await client.query('ROLLBACK'); // Revertir en caso de error
    client.release();
    console.error('Error al actualizar producto:', error);
     if ((error as any).code === '23503') { // foreign_key_violation (ej. proveedor_id inválido)
         return res.status(400).json({ message: 'Error: Uno o más IDs de proveedor son inválidos.' });
     }
    res.status(500).json({ error: 'Error interno del servidor al actualizar producto' });
  }
});

// Eliminar producto
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => { // Usar authenticateToken
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM productos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// Obtener un producto por ID con sus proveedores asociados
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  let client: PoolClient | null = null;
  try {
    const { id } = req.params;
    client = await pool.connect();

    // 1. Obtener datos del producto
    const productoResult = await client.query(
      'SELECT * FROM productos WHERE id = $1',
      [id]
    );

    if (productoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const producto = productoResult.rows[0];

    // 2. Obtener proveedores asociados
    const proveedoresResult = await client.query(
      `SELECT p.id, p.nombre, p.rfc
       FROM proveedores p
       JOIN proveedor_productos pp ON p.id = pp.proveedor_id
       WHERE pp.producto_id = $1
       ORDER BY p.nombre`,
      [id]
    );

    // 3. Combinar datos
    const productoConProveedores = {
      ...producto,
      proveedores: proveedoresResult.rows
    };

    return res.json(productoConProveedores);
  } catch (error) {
    console.error(`Error al obtener producto ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client?.release();
  }
});

/**
 * Obtener los IDs de proveedores asociados a un producto
 */
router.get('/:id/proveedores', authenticateToken, async (req: Request, res: Response) => {
  let client: PoolClient | null = null;
  try {
    const { id } = req.params;
    client = await pool.connect();
    const result = await client.query(
      'SELECT proveedor_id FROM proveedor_productos WHERE producto_id = $1',
      [id]
    );
    const proveedorIds = result.rows.map((row: { proveedor_id: number }) => row.proveedor_id);
    return res.status(200).json(proveedorIds);
  } catch (error) {
    console.error('Error al obtener proveedores asociados al producto:', error);
    return res.status(500).json({ message: 'Error al obtener proveedores asociados al producto' });
  } finally {
    client?.release();
  }
});


/**
 * Obtener el historial de compras de un producto
 */
router.get('/:id/historial', authenticateToken, async (req: Request, res: Response) => {
  let client: PoolClient | null = null;
  try {
    const { id } = req.params;
    client = await pool.connect();

    // Consultar órdenes de compra que incluyen este producto
    const query = `
      SELECT
        oc.id,
        oc.fecha_creacion,
        p.nombre as proveedor_nombre,
        oc.cantidad,
        oc.precio_unitario,
        oc.monto,
        oc.estado
      FROM ordenes_compra oc
      LEFT JOIN proveedores p ON oc.proveedor_id = p.id
      WHERE oc.producto LIKE $1 OR oc.producto::text = $1
      ORDER BY oc.fecha_creacion DESC
    `;

    const result = await client.query(query, [id]);

    // Obtener estadísticas
    const statsQuery = `
      SELECT
        COUNT(*) as total_compras,
        SUM(cantidad) as cantidad_total,
        MAX(fecha_creacion) as ultima_compra
      FROM ordenes_compra
      WHERE producto LIKE $1 OR producto::text = $1
    `;

    const statsResult = await client.query(statsQuery, [id]);
    const stats = statsResult.rows[0] || { total_compras: 0, cantidad_total: 0, ultima_compra: null };

    return res.status(200).json({
      historial: result.rows,
      estadisticas: stats
    });
  } catch (error) {
    console.error(`Error al obtener historial de compras del producto ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Error al obtener historial de compras del producto' });
  } finally {
    client?.release();
  }
});

export default router;