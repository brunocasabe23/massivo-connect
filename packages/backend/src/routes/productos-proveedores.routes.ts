// packages/backend/src/routes/productos-proveedores.routes.ts
const express = require('express');
const Router = express.Router;
import pool from '../config/db';
import { PoolClient } from 'pg';
import { authenticateToken } from '../middleware/auth.middleware';

// Usar any para evitar problemas de tipos
type Request = any;
type Response = any;

const router = Router();

/**
 * Obtener los detalles de proveedores asociados a un producto
 */
router.get('/:id/proveedores-detalle', authenticateToken, async (req: Request, res: Response) => {
  let client: PoolClient | null = null;
  try {
    const { id } = req.params;
    client = await pool.connect();

    // Verificar si existe la tabla producto_proveedor_detalles
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'producto_proveedor_detalles'
      );
    `;
    if (!client) throw new Error('No se pudo conectar a la base de datos');
    const tableExists = await client.query(tableExistsQuery);

    // Si la tabla no existe, devolver un array vacío
    if (!tableExists.rows[0].exists) {
      console.log('La tabla producto_proveedor_detalles no existe. Creándola...');

      // Crear la tabla
      const createTableQuery = `
        CREATE TABLE producto_proveedor_detalles (
          id SERIAL PRIMARY KEY,
          producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
          proveedor_id INTEGER NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
          rfc VARCHAR(20),
          precio DECIMAL(12, 2),
          tiempo_entrega VARCHAR(50),
          calificacion INTEGER,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(producto_id, proveedor_id)
        );
      `;
      if (!client) throw new Error('No se pudo conectar a la base de datos');
      await client.query(createTableQuery);
      console.log('Tabla producto_proveedor_detalles creada exitosamente');

      // Devolver array vacío ya que la tabla recién se creó
      return res.status(200).json([]);
    }

    // Consultar los detalles de proveedores para este producto
    const query = `
      SELECT
        ppd.proveedor_id,
        p.nombre,
        ppd.rfc,
        ppd.precio,
        ppd.tiempo_entrega,
        ppd.calificacion
      FROM producto_proveedor_detalles ppd
      JOIN proveedores p ON ppd.proveedor_id = p.id
      WHERE ppd.producto_id = $1
    `;

    if (!client) throw new Error('No se pudo conectar a la base de datos');
    const result = await client.query(query, [id]);

    // Si no hay resultados, obtener los proveedores asociados y crear registros básicos
    if (result.rows.length === 0) {
      // Obtener proveedores asociados al producto
      const proveedoresQuery = `
        SELECT pp.proveedor_id, p.nombre, p.rfc
        FROM proveedor_productos pp
        JOIN proveedores p ON pp.proveedor_id = p.id
        WHERE pp.producto_id = $1
      `;

      if (!client) throw new Error('No se pudo conectar a la base de datos');
      const proveedoresResult = await client.query(proveedoresQuery, [id]);

      // Si hay proveedores asociados, crear registros básicos en la tabla de detalles
      if (proveedoresResult.rows.length > 0) {
        if (!client) throw new Error('No se pudo conectar a la base de datos');
        await client.query('BEGIN');

        const detallesBasicos = [];

        for (const prov of proveedoresResult.rows) {
          // Insertar registro básico
          const insertQuery = `
            INSERT INTO producto_proveedor_detalles
              (producto_id, proveedor_id, rfc, precio, tiempo_entrega, calificacion)
            VALUES
              ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (producto_id, proveedor_id) DO NOTHING
            RETURNING *
          `;

          if (!client) throw new Error('No se pudo conectar a la base de datos');
          const insertResult = await client.query(insertQuery, [
            id,
            prov.proveedor_id,
            prov.rfc || '',
            0, // precio por defecto
            '', // tiempo_entrega por defecto
            0  // calificacion por defecto
          ]);

          if (insertResult.rows.length > 0) {
            detallesBasicos.push({
              proveedor_id: prov.proveedor_id,
              nombre: prov.nombre,
              rfc: prov.rfc || '',
              precio: 0,
              tiempo_entrega: '',
              calificacion: 0
            });
          }
        }

        if (!client) throw new Error('No se pudo conectar a la base de datos');
        await client.query('COMMIT');
        return res.status(200).json(detallesBasicos);
      }

      // Si no hay proveedores asociados, devolver array vacío
      return res.status(200).json([]);
    }

    // Devolver los detalles encontrados
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener detalles de proveedores para el producto:', error);
    return res.status(500).json({ message: 'Error al obtener detalles de proveedores' });
  } finally {
    client?.release();
  }
});

/**
 * Actualizar o crear detalles de proveedores para un producto
 */
router.post('/:id/proveedores-detalle', authenticateToken, async (req: Request, res: Response) => {
  let client: PoolClient | null = null;
  try {
    const { id } = req.params;
    const { proveedores_detalle } = req.body;

    if (!proveedores_detalle || !Array.isArray(proveedores_detalle)) {
      return res.status(400).json({ message: 'Se requiere un array de detalles de proveedores' });
    }

    client = await pool.connect();
    if (!client) throw new Error('No se pudo conectar a la base de datos');
    await client.query('BEGIN');

    // Verificar si existe la tabla producto_proveedor_detalles
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'producto_proveedor_detalles'
      );
    `;
    if (!client) throw new Error('No se pudo conectar a la base de datos');
    const tableExists = await client.query(tableExistsQuery);

    // Si la tabla no existe, crearla
    if (!tableExists.rows[0].exists) {
      const createTableQuery = `
        CREATE TABLE producto_proveedor_detalles (
          id SERIAL PRIMARY KEY,
          producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
          proveedor_id INTEGER NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
          rfc VARCHAR(20),
          precio DECIMAL(12, 2),
          tiempo_entrega VARCHAR(50),
          calificacion INTEGER,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(producto_id, proveedor_id)
        );
      `;
      if (!client) throw new Error('No se pudo conectar a la base de datos');
      await client.query(createTableQuery);
    }

    // Eliminar detalles existentes que no estén en el nuevo array
    const proveedorIds = proveedores_detalle.map(p => p.proveedor_id);
    if (proveedorIds.length > 0) {
      const deleteQuery = `
        DELETE FROM producto_proveedor_detalles
        WHERE producto_id = $1 AND proveedor_id NOT IN (${proveedorIds.map((_, i) => `$${i + 2}`).join(',')})
      `;
      if (!client) throw new Error('No se pudo conectar a la base de datos');
      await client.query(deleteQuery, [id, ...proveedorIds]);
    }

    // Actualizar o insertar cada detalle de proveedor
    const resultados = [];

    for (const detalle of proveedores_detalle) {
      const { proveedor_id, rfc, precio, tiempo_entrega, calificacion } = detalle;

      // Verificar que el proveedor existe y está asociado al producto
      const checkQuery = `
        SELECT 1 FROM proveedor_productos
        WHERE producto_id = $1 AND proveedor_id = $2
      `;
      if (!client) throw new Error('No se pudo conectar a la base de datos');
      const checkResult = await client.query(checkQuery, [id, proveedor_id]);

      // Si no existe la asociación, crearla
      if (checkResult.rows.length === 0) {
        const associateQuery = `
          INSERT INTO proveedor_productos (producto_id, proveedor_id)
          VALUES ($1, $2)
          ON CONFLICT (producto_id, proveedor_id) DO NOTHING
        `;
        if (!client) throw new Error('No se pudo conectar a la base de datos');
        await client.query(associateQuery, [id, proveedor_id]);
      }

      // Actualizar o insertar los detalles
      const upsertQuery = `
        INSERT INTO producto_proveedor_detalles
          (producto_id, proveedor_id, rfc, precio, tiempo_entrega, calificacion)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (producto_id, proveedor_id)
        DO UPDATE SET
          rfc = $3,
          precio = $4,
          tiempo_entrega = $5,
          calificacion = $6,
          fecha_actualizacion = CURRENT_TIMESTAMP
        RETURNING *
      `;

      if (!client) throw new Error('No se pudo conectar a la base de datos');
      const result = await client.query(upsertQuery, [
        id,
        proveedor_id,
        rfc || '',
        precio || 0,
        tiempo_entrega || '',
        calificacion || 0
      ]);

      resultados.push(result.rows[0]);
    }

    if (!client) throw new Error('No se pudo conectar a la base de datos');
    await client.query('COMMIT');
    return res.status(200).json(resultados);
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error al actualizar detalles de proveedores:', error);
    return res.status(500).json({ message: 'Error al actualizar detalles de proveedores' });
  } finally {
    client?.release();
  }
});

export default router;
