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

// Crear un nuevo proveedor
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
      estado,
      notas
    } = req.body;

    // Validación básica
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del proveedor es requerido' });
    }

    client = await pool.connect();

    const query = `
      INSERT INTO proveedores (
        nombre, rfc, direccion, telefono, email,
        contacto_nombre, contacto_telefono, contacto_email,
        categoria, estado, notas
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      nombre,
      rfc || null,
      direccion || null,
      telefono || null,
      email || null,
      contacto_nombre || null,
      contacto_telefono || null,
      contacto_email || null,
      categoria || null,
      estado || 'activo',
      notas || null
    ];

    const result = await client.query(query, values);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    return res.status(500).json({ message: 'Error al crear proveedor' });
  } finally {
    client?.release();
  }
};

// Actualizar un proveedor existente
export const updateSupplier = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    const { id } = req.params;
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
      estado,
      notas
    } = req.body;

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
        fecha_actualizacion = NOW()
      WHERE id = $12
      RETURNING *
    `;

    const values = [
      nombre,
      rfc || null,
      direccion || null,
      telefono || null,
      email || null,
      contacto_nombre || null,
      contacto_telefono || null,
      contacto_email || null,
      categoria || null,
      estado || 'activo',
      notas || null,
      id
    ];

    const result = await client.query(query, values);
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Error al actualizar proveedor ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Error al actualizar proveedor' });
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

    // Verificar si el proveedor está siendo utilizado en órdenes de compra
    const usageCheck = await client.query('SELECT id FROM ordenes_compra WHERE proveedor = (SELECT nombre FROM proveedores WHERE id = $1) LIMIT 1', [id]);
    if (usageCheck && usageCheck.rowCount && usageCheck.rowCount > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar el proveedor porque está siendo utilizado en órdenes de compra',
        orderId: usageCheck.rows[0].id
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

// Obtener categorías únicas de proveedores
export const getSupplierCategories = async (req: Request, res: Response): Promise<Response> => {
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
