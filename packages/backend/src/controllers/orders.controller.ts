// import { Request, Response } from 'express'; // Importar Request y Response
import pool from '../config/db';
import { PoolClient } from 'pg';
// import { AuthenticatedRequest } from '../request'; // Importar interfaz extendida
import { createNotification } from './notifications.controller'; // Importar función para crear notificaciones

// Usar any para evitar problemas de tipos
type Response = any;
type AuthenticatedRequest = any;
type Request = any;

// Controlador getUserOrders eliminado ya que getAllOrders con RLS lo reemplaza.

// Controlador para obtener estadísticas de órdenes de compra del usuario
export const getUserOrderStats = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest
  let client: PoolClient | null = null;
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const userId = req.user.id;
    client = await pool.connect();

    // Consulta para obtener estadísticas
    const query = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(CASE WHEN estado = 'Aprobada' THEN 1 END)::int AS aprobadas,
        COUNT(CASE WHEN estado IN ('Nueva', 'EnRevision') THEN 1 END)::int AS pendientes,
        COUNT(CASE WHEN fecha_creacion >= NOW() - INTERVAL '30 days' THEN 1 END)::int AS recientes
      FROM
        ordenes_compra
      WHERE
        usuario_id = $1
    `;

    if (!client) {
      return res.status(500).json({ message: 'Error de conexión a la base de datos' });
    }
    const result = await client.query(query, [userId]);
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener estadísticas de órdenes de compra:', error);
    return res.status(500).json({ message: 'Error al obtener estadísticas de órdenes de compra' });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Controlador para obtener órdenes de compra (filtradas por RLS)
export const getAllOrders = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest
  let client: PoolClient | null = null;
  try {
    // Verificar que el usuario esté autenticado (necesario para RLS)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    client = await pool.connect();

    // Iniciar transacción para asegurar el contexto RLS
    await client.query('BEGIN');
    try {
      // Establecer contexto RLS dentro de la transacción
      await client.query('SET LOCAL app.current_user_id = $1', [req.user.id]);
      await client.query('SET LOCAL app.current_user_role = $1', [req.user.rolNombre || '']); // Usar rolNombre añadido en auth.middleware

      const { estado, fechaDesde, fechaHasta, search } = req.query;

      // Consulta base - Incluye nombre de usuario y código presupuestal
      let query = `
        SELECT
          oc.id,
          oc.descripcion,
          oc.monto,
          oc.proveedor,
          oc.estado,
          oc.fecha_creacion,
          oc.fecha_actualizacion,
          oc.cp_id,
          cp.nombre as codigo_presupuestal,
          u.nombre as solicitante -- Nombre del usuario que creó la orden
        FROM
          ordenes_compra oc
        JOIN
          codigos_presupuestales cp ON oc.cp_id = cp.id
        JOIN
          usuarios u ON oc.usuario_id = u.id -- Unir con usuarios para obtener el nombre
        -- WHERE clause eliminado, RLS se encargará del filtrado por usuario/rol
      `;

      const queryParams: any[] = [];
      let paramIndex = 1;
      let conditions = []; // Array para almacenar condiciones WHERE

      if (estado) {
        conditions.push(`oc.estado = $${paramIndex}`);
        queryParams.push(estado);
        paramIndex++;
      }
      if (fechaDesde) {
        conditions.push(`oc.fecha_creacion >= $${paramIndex}`);
        queryParams.push(fechaDesde);
        paramIndex++;
      }
      if (fechaHasta) {
        conditions.push(`oc.fecha_creacion <= $${paramIndex}`);
        queryParams.push(fechaHasta);
        paramIndex++;
      }
      if (search) {
        conditions.push(`(
          oc.descripcion ILIKE $${paramIndex} OR
          oc.proveedor ILIKE $${paramIndex} OR
          cp.nombre ILIKE $${paramIndex} OR
          u.nombre ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Añadir condiciones WHERE si existen
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY oc.fecha_creacion DESC`;

      if (!client) {
        // Este check es redundante si ya estamos dentro del try/catch con cliente
        throw new Error('Error de conexión a la base de datos (cliente no disponible)');
      }

      const result = await client.query(query, queryParams);
      await client.query('COMMIT'); // Confirmar transacción si todo va bien
      return res.status(200).json(result.rows);

    } catch (transactionError) {
      await client.query('ROLLBACK'); // Revertir transacción en caso de error
      // Registrar el error específico de la transacción
      console.error('Error dentro de la transacción getAllOrders:', transactionError);
      throw transactionError; // Re-lanzar para que sea manejado por el catch exterior
    }
  } catch (error) {
    // Registrar el error general (puede ser el re-lanzado o uno antes de la transacción)
    console.error('Error en getAllOrders (fuera de la transacción o re-lanzado):', error);
    return res.status(500).json({ message: 'Error al obtener todas las órdenes de compra' });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Controlador para crear una nueva orden de compra
export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest
  let client: PoolClient | null = null;
  try {
    if (!req.user || !req.user.id ) {
      return res.status(401).json({ message: 'Usuario no autenticado o sin área asignada' });
    }
    const userId = req.user.id;
    const userAreaId = req.user.area_id; // Obtener area_id del usuario

    // Extraer datos del cuerpo de la solicitud
    const {
      cp_id,
      descripcion,
      monto, // Este es el total, se calculará o se recibe? Asumamos que se recibe por ahora.
      proveedor,
      estado,
      laboratorio, // Nuevo
      producto,    // Nuevo
      cantidad,    // Nuevo
      moneda,      // Nuevo
      precio_unitario, // Nuevo
      fecha_entrega, // Nuevo
      prioridad      // Nuevo
    } = req.body;

    // Validación básica (añadir validación para nuevos campos si es necesario)
    if (!cp_id || !descripcion || monto === undefined || monto === null || !producto || !cantidad || !precio_unitario) {
      return res.status(400).json({ message: 'Faltan campos requeridos (cp_id, descripcion, monto, producto, cantidad, precio_unitario)' });
    }
    // Opcional: Calcular monto total si no se recibe: const montoCalculado = cantidad * precio_unitario;

    client = await pool.connect();

    // --- Verificación de acceso al Código Presupuestal por Área ---
    if (userAreaId && cp_id) {
        const checkAccessQuery = `
            SELECT 1 FROM area_codigos_presupuestales
            WHERE area_id = $1 AND cp_id = $2;
        `;
        const accessResult = await client.query(checkAccessQuery, [userAreaId, cp_id]);
        if (accessResult.rowCount === 0) {
            // No liberamos el cliente aquí, lo haremos en el bloque finally
            return res.status(403).json({ message: 'Acceso denegado: El código presupuestal no pertenece a tu área.' });
        }
    } else if (!userAreaId) {
         // Si el usuario no tiene área, ¿debería poder crear órdenes? Decidimos que no por ahora.
         // No liberamos el cliente aquí, lo haremos en el bloque finally
         return res.status(403).json({ message: 'Acceso denegado: No tienes un área asignada.' });
    }

    // --- Verificación de presupuesto disponible ---
    const checkBudgetQuery = `
        SELECT monto_disponible FROM codigos_presupuestales
        WHERE id = $1;
    `;
    const budgetResult = await client.query(checkBudgetQuery, [cp_id]);

    if (budgetResult.rowCount === 0) {
        // No liberamos el cliente aquí, lo haremos en el bloque finally
        return res.status(404).json({ message: 'Código presupuestal no encontrado.' });
    }

    const montoDisponible = parseFloat(budgetResult.rows[0].monto_disponible || 0);
    const montoSolicitado = parseFloat(monto);

    if (montoSolicitado > montoDisponible) {
        // No liberamos el cliente aquí, lo haremos en el bloque finally
        return res.status(400).json({
            message: 'Presupuesto excedido',
            details: `El monto solicitado (${montoSolicitado}) excede el presupuesto disponible (${montoDisponible}).`
        });
    }
    // --- Fin Verificación ---
    const query = `
      INSERT INTO ordenes_compra
        (usuario_id, cp_id, descripcion, monto, proveedor, estado, laboratorio, producto, cantidad, moneda, precio_unitario, fecha_entrega, prioridad, usuario_actualizacion_id)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $1)
      RETURNING *;
    `;
    const initialState = estado || 'Nueva'; // Estado inicial por defecto
    const params = [userId, cp_id, descripcion, monto, proveedor, initialState, laboratorio, producto, cantidad, moneda || 'USD', precio_unitario, fecha_entrega, prioridad || 'Media'];

    // Iniciar una transacción para asegurar la integridad de los datos
    await client.query('BEGIN');

    try {
        // Insertar la orden de compra
        const result = await client.query(query, params);
        const newOrder = result.rows[0];

        // Actualizar el monto disponible en el código presupuestal
        // Solo si el estado es 'Aprobada', de lo contrario no afecta al presupuesto todavía
        if (initialState === 'Aprobada') {
            const updateBudgetQuery = `
                UPDATE codigos_presupuestales
                SET monto_disponible = monto_disponible - $1
                WHERE id = $2;
            `;
            await client.query(updateBudgetQuery, [montoSolicitado, cp_id]);
        }

        // Crear notificación para administradores (usuarios con permiso de aprobar órdenes)
        const getAdminsQuery = `
            SELECT DISTINCT u.id
            FROM usuarios u
            JOIN usuario_roles ur ON u.id = ur.usuario_id
            JOIN rol_permisos rp ON ur.rol_id = rp.rol_id
            JOIN permisos p ON rp.permiso_id = p.id
            WHERE p.clave = 'aprobar_orden_compra' AND u.estado = 'activo';
        `;

        const adminsResult = await client.query(getAdminsQuery);

        // Notificar a cada administrador sobre la nueva orden
        for (const admin of adminsResult.rows) {
            await createNotification(
                admin.id,
                'NUEVA_ORDEN_COMPRA',
                `Nueva solicitud de compra #${newOrder.id} para ${newOrder.producto} por ${moneda || 'USD'} ${montoSolicitado}`,
                `/compras/${newOrder.id}`
            );
        }

        // Confirmar la transacción
        await client.query('COMMIT');

        return res.status(201).json(newOrder);
    } catch (error) {
        // Revertir la transacción en caso de error
        await client.query('ROLLBACK');
        throw error; // Re-lanzar el error para que sea manejado por el bloque catch exterior
    }

  } catch (error) {
    console.error('Error al crear orden de compra:', error);
    // Manejar errores específicos, como FK inválida para cp_id
    if ((error as any).code === '23503') { // foreign_key_violation
        return res.status(400).json({ message: 'Código presupuestal inválido.' });
    }
    return res.status(500).json({ message: 'Error al crear orden de compra' });
  } finally {
    client?.release();
  }
};

// Controlador para obtener una orden de compra por ID
export const getOrderById = async (req: Request, res: Response): Promise<Response> => { // Usar Request estándar
    let client: PoolClient | null = null;
    const { id } = req.params;
    try {
        client = await pool.connect();
        const query = `
            SELECT
                oc.*,
                cp.nombre as codigo_presupuestal,
                u.nombre as solicitante,
                ua.nombre as usuario_actualizacion_nombre
            FROM ordenes_compra oc
            JOIN codigos_presupuestales cp ON oc.cp_id = cp.id
            JOIN usuarios u ON oc.usuario_id = u.id
            LEFT JOIN usuarios ua ON oc.usuario_actualizacion_id = ua.id
            WHERE oc.id = $1;
        `;
        const result = await client.query(query, [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Orden de compra no encontrada' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(`Error al obtener orden de compra ${id}:`, error);
        return res.status(500).json({ message: 'Error al obtener orden de compra' });
    } finally {
        client?.release();
    }
};


// Controlador para actualizar una orden de compra
export const updateOrder = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest
    let client: PoolClient | null = null;
    const { id } = req.params;
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const userIdUpdater = req.user.id;
        const userAreaId = req.user.area_id; // Obtener area_id del usuario que actualiza

        // Extraer datos actualizables del cuerpo
        const { cp_id, descripcion, monto, proveedor, estado, laboratorio, producto, cantidad, moneda, precio_unitario, fecha_entrega, prioridad } = req.body;

        // Validación (similar a create) - añadir nuevos campos
        if (!cp_id || !descripcion || monto === undefined || monto === null || !producto || !cantidad || !precio_unitario) {
            return res.status(400).json({ message: 'Faltan campos requeridos (cp_id, descripcion, monto, producto, cantidad, precio_unitario)' });
        }

        client = await pool.connect();

        // --- Verificación de acceso al Código Presupuestal por Área ---
        if (userAreaId && cp_id) {
            const checkAccessQuery = `
                SELECT 1 FROM area_codigos_presupuestales
                WHERE area_id = $1 AND cp_id = $2;
            `;
            const accessResult = await client.query(checkAccessQuery, [userAreaId, cp_id]);
            if (accessResult.rowCount === 0) {
                // No liberamos el cliente aquí, lo haremos en el bloque finally
                return res.status(403).json({ message: 'Acceso denegado: El código presupuestal no pertenece a tu área.' });
            }
        } else if (!userAreaId) {
             // No liberamos el cliente aquí, lo haremos en el bloque finally
             return res.status(403).json({ message: 'Acceso denegado: No tienes un área asignada.' });
        }
        // --- Fin Verificación ---
        const query = `
            UPDATE ordenes_compra
            SET
                cp_id = $1,
                descripcion = $2,
                monto = $3,
                proveedor = $4,
                estado = $5,
                laboratorio = $6,
                producto = $7,
                cantidad = $8,
                moneda = $9,
                precio_unitario = $10,
                fecha_entrega = $11,
                prioridad = $12,
                fecha_actualizacion = NOW(),
                usuario_actualizacion_id = $13
            WHERE id = $14
            RETURNING *;
        `;
        const params = [cp_id, descripcion, monto, proveedor, estado, laboratorio, producto, cantidad, moneda || 'USD', precio_unitario, fecha_entrega, prioridad || 'Media', userIdUpdater, id];

        const result = await client.query(query, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Orden de compra no encontrada' });
        }
        return res.status(200).json(result.rows[0]);

    } catch (error) {
        console.error(`Error al actualizar orden de compra ${id}:`, error);
         if ((error as any).code === '23503') {
            return res.status(400).json({ message: 'Código presupuestal inválido.' });
        }
        return res.status(500).json({ message: 'Error al actualizar orden de compra' });
    } finally {
        client?.release();
    }
};

// Controlador para eliminar una orden de compra
export const deleteOrder = async (req: Request, res: Response): Promise<Response> => { // Usar Request estándar
    let client: PoolClient | null = null;
    const { id } = req.params;
    try {
        client = await pool.connect();
        const result = await client.query('DELETE FROM ordenes_compra WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Orden de compra no encontrada' });
        }
        return res.status(204).send(); // No Content
    } catch (error) {
        console.error(`Error al eliminar orden de compra ${id}:`, error);
        return res.status(500).json({ message: 'Error al eliminar orden de compra' });
    } finally {
        client?.release();
    }
};

// Controlador para actualizar el estado de una orden de compra
export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response> => { // Usar AuthenticatedRequest
    let client: PoolClient | null = null;
    const { id } = req.params;
    const { estado, comentario } = req.body;
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const userIdUpdater = req.user.id;

        if (!estado) {
            return res.status(400).json({ message: 'El campo estado es requerido' });
        }

        // Validar que el estado sea uno de los permitidos
        const estadosValidos = ['Nueva', 'Pendiente', 'En Revisión', 'Aprobada', 'Rechazada', 'Cancelada', 'Completada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                message: 'Estado no válido',
                estadosValidos
            });
        }

        client = await pool.connect();

        // Obtener la orden actual para comparar estados y obtener información
        const getOrderQuery = `
            SELECT o.*, u.nombre as solicitante_nombre, u.id as solicitante_id
            FROM ordenes_compra o
            JOIN usuarios u ON o.usuario_id = u.id
            WHERE o.id = $1;
        `;
        const orderResult = await client.query(getOrderQuery, [id]);

        if (orderResult.rowCount === 0) {
            return res.status(404).json({ message: 'Orden de compra no encontrada' });
        }

        const currentOrder = orderResult.rows[0];
        const oldEstado = currentOrder.estado;

        // Iniciar transacción
        await client.query('BEGIN');

        try {
            // Actualizar el estado de la orden
            const updateQuery = `
                UPDATE ordenes_compra
                SET
                    estado = $1,
                    fecha_actualizacion = NOW(),
                    usuario_actualizacion_id = $2
                WHERE id = $3
                RETURNING *;
            `;
            const params = [estado, userIdUpdater, id];

            const result = await client.query(updateQuery, params);
            const updatedOrder = result.rows[0];

            // Si el estado cambia a 'Aprobada', actualizar el presupuesto disponible
            if (estado === 'Aprobada' && oldEstado !== 'Aprobada') {
                const updateBudgetQuery = `
                    UPDATE codigos_presupuestales
                    SET monto_disponible = monto_disponible - $1
                    WHERE id = $2
                    RETURNING monto_disponible;
                `;
                await client.query(updateBudgetQuery, [updatedOrder.monto, updatedOrder.cp_id]);
            }

            // Si el estado cambia de 'Aprobada' a otro estado, devolver el monto al presupuesto
            if (oldEstado === 'Aprobada' && estado !== 'Aprobada') {
                const restoreBudgetQuery = `
                    UPDATE codigos_presupuestales
                    SET monto_disponible = monto_disponible + $1
                    WHERE id = $2
                    RETURNING monto_disponible;
                `;
                await client.query(restoreBudgetQuery, [updatedOrder.monto, updatedOrder.cp_id]);
            }

            // Crear notificación para el solicitante
            let mensaje = `Tu solicitud de compra #${id} ha sido ${estado.toLowerCase()}`;
            if (comentario) {
                mensaje += `. Comentario: ${comentario}`;
            }

            await createNotification(
                currentOrder.solicitante_id,
                `ORDEN_${estado.toUpperCase()}`,
                mensaje,
                `/compras/${id}`
            );

            // Confirmar transacción
            await client.query('COMMIT');

            return res.status(200).json(updatedOrder);
        } catch (error) {
            // Revertir transacción en caso de error
            await client.query('ROLLBACK');
            throw error; // Re-lanzar para que sea manejado por el catch exterior
        }

    } catch (error) {
        console.error(`Error al actualizar estado de orden ${id}:`, error);
        return res.status(500).json({ message: 'Error al actualizar estado de la orden' });
    } finally {
        client?.release();
    }
};
