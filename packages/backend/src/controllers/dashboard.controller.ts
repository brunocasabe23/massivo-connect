// import { Request, Response } from 'express';

// Usar any para evitar problemas de tipos
type Response = any;
type Request = any;
import pool from '../config/db';
import { PoolClient, QueryResult } from 'pg';
import { getRecentActivities } from '../services/activity.service';

// --- Controlador para obtener estadísticas del dashboard de administración ---
export const getAdminDashboardStats = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // Consulta para obtener estadísticas de usuarios
    const userStatsQuery = `
      SELECT
        COUNT(*)::int AS total_users,
        COUNT(CASE WHEN estado = 'activo' THEN 1 END)::int AS active_users,
        COUNT(CASE WHEN estado != 'activo' THEN 1 END)::int AS inactive_users,
        COUNT(CASE WHEN fecha_creacion >= NOW() - INTERVAL '30 days' THEN 1 END)::int AS new_users_this_month
      FROM usuarios;
    `;

    // Consulta para obtener estadísticas de roles y permisos
    const roleStatsQuery = `
      SELECT
        COUNT(DISTINCT r.id)::int AS total_roles,
        COUNT(DISTINCT p.id)::int AS total_permissions
      FROM roles r
      CROSS JOIN permisos p;
    `;

    // Consulta para obtener estadísticas de actividad de usuarios (login)
    // Como no tenemos una columna de último login, usaremos una aproximación
    const loginActivityQuery = `
      SELECT
        ROUND((COUNT(CASE WHEN u.fecha_actualizacion >= NOW() - INTERVAL '7 days' THEN 1 END)::float /
        NULLIF(COUNT(*)::float, 0)) * 100)::int AS login_activity_percentage
      FROM usuarios u
      WHERE u.estado = 'activo';
    `;

    // Ejecutar todas las consultas en paralelo
    const [userStatsResult, roleStatsResult, loginActivityResult] = await Promise.all([
      client.query(userStatsQuery),
      client.query(roleStatsQuery),
      client.query(loginActivityQuery)
    ]);

    // Combinar los resultados
    const stats = {
      totalUsers: userStatsResult.rows[0].total_users,
      activeUsers: userStatsResult.rows[0].active_users,
      inactiveUsers: userStatsResult.rows[0].inactive_users,
      newUsersThisMonth: userStatsResult.rows[0].new_users_this_month,
      totalRoles: roleStatsResult.rows[0].total_roles,
      totalPermissions: roleStatsResult.rows[0].total_permissions,
      loginActivity: loginActivityResult.rows[0].login_activity_percentage || 0
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener estadísticas del dashboard.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para obtener usuarios recientes ---
export const getRecentUsers = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // Consulta para obtener usuarios recientes (limitado a 5)
    const recentUsersQuery = `
      SELECT
        u.id,
        u.nombre AS name,
        u.email,
        r.nombre AS role,
        u.estado AS status,
        u.fecha_actualizacion AS last_login,
        u.avatar_url AS avatar
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      ORDER BY u.fecha_creacion DESC
      LIMIT 5;
    `;

    const recentUsersResult: QueryResult = await client.query(recentUsersQuery);

    // Procesar los resultados para añadir iniciales y formatear fechas
    const recentUsers = recentUsersResult.rows.map(user => {
      // Generar iniciales a partir del nombre
      const nameParts = user.name.split(' ');
      const initials = nameParts.length > 1
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
        : (nameParts[0][0] || 'U').toUpperCase();

      // Formatear la fecha de último login como "Hace X tiempo"
      const lastLoginDate = new Date(user.last_login);
      const now = new Date();
      const diffMs = now.getTime() - lastLoginDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      let lastLoginFormatted;
      if (diffDays > 0) {
        lastLoginFormatted = `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        lastLoginFormatted = `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
      } else {
        lastLoginFormatted = 'Hace unos minutos';
      }

      return {
        ...user,
        initials,
        lastLogin: lastLoginFormatted
      };
    });

    return res.status(200).json(recentUsers);
  } catch (error) {
    console.error('Error al obtener usuarios recientes:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener usuarios recientes.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para obtener roles con estadísticas ---
export const getRolesWithStats = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // Consulta para obtener roles con estadísticas
    const rolesQuery = `
      SELECT
        r.id,
        r.nombre AS name,
        COUNT(DISTINCT ur.usuario_id)::int AS users,
        COUNT(DISTINCT rp.permiso_id)::int AS permissions
      FROM roles r
      LEFT JOIN usuario_roles ur ON r.id = ur.rol_id
      LEFT JOIN rol_permisos rp ON r.id = rp.rol_id
      GROUP BY r.id, r.nombre
      ORDER BY r.nombre ASC;
    `;

    const rolesResult: QueryResult = await client.query(rolesQuery);

    // Asignar colores a los roles
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-purple-500",
      "bg-amber-500", "bg-slate-500", "bg-pink-500", "bg-indigo-500"
    ];

    const roles = rolesResult.rows.map((role, index) => ({
      ...role,
      color: colors[index % colors.length]
    }));

    return res.status(200).json(roles);
  } catch (error) {
    console.error('Error al obtener roles con estadísticas:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener roles con estadísticas.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para obtener actividad reciente ---
export const getRecentActivity = async (req: Request, res: Response): Promise<Response> => {
  // Obtener el límite de actividades a devolver (por defecto 10)
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  let client: PoolClient | null = null;

  try {
    client = await pool.connect();

    // Obtener actividades reales de la base de datos con el límite especificado
    const activities = await getRecentActivities(limit);

    // Obtener todos los IDs de usuarios mencionados en las actividades
    const userIds = activities
      .filter(activity => activity.entidad_tipo === 'usuario' && activity.entidad_id)
      .map(activity => activity.entidad_id);

    // Si hay IDs de usuarios, obtener sus nombres en una sola consulta
    let userNamesMap: Record<number, string> = {};
    if (userIds.length > 0) {
      const uniqueUserIds = [...new Set(userIds)];
      const userQuery = `SELECT id, nombre FROM usuarios WHERE id = ANY($1)`;
      const userResult = await client.query(userQuery, [uniqueUserIds]);

      // Crear un mapa de ID -> nombre para acceso rápido
      userNamesMap = userResult.rows.reduce((map, user) => {
        map[user.id] = user.nombre;
        return map;
      }, {} as Record<number, string>);
    }

    // Formatear los datos para el frontend
    const formattedActivities = activities.map(activity => {
      // Generar iniciales a partir del nombre del usuario
      const nameParts = activity.usuario_nombre.split(' ');
      const initials = nameParts.length > 1
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
        : (nameParts[0][0] || 'S').toUpperCase();

      // Formatear la fecha de manera más detallada
      const activityDate = new Date(activity.fecha_creacion);
      const now = new Date();

      // Verificar si la fecha es futura y corregirla
      if (activityDate > now) {
        console.warn(`Fecha futura detectada en actividad ${activity.id}: ${activityDate.toISOString()}. Usando fecha actual.`);
        activity.fecha_creacion = now.toISOString(); // Corregir la fecha en el objeto
        activityDate.setTime(now.getTime()); // Actualizar la fecha para los cálculos
      }

      const diffMs = now.getTime() - activityDate.getTime();

      // Calcular las diferentes unidades de tiempo
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffMonths = Math.floor(diffDays / 30);

      // Calcular los restos para el formato detallado
      const remainingDays = diffDays % 30;
      const remainingHours = diffHours % 24;
      const remainingMinutes = diffMinutes % 60;

      // Formatear la fecha con más detalle
      let timeFormatted;
      if (diffMonths > 0) {
        if (remainingDays > 0) {
          timeFormatted = `Hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'} y ${remainingDays} ${remainingDays === 1 ? 'día' : 'días'}`;
        } else {
          timeFormatted = `Hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
        }
      } else if (diffDays > 0) {
        if (remainingHours > 0) {
          timeFormatted = `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'} y ${remainingHours} ${remainingHours === 1 ? 'hora' : 'horas'}`;
        } else {
          timeFormatted = `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
        }
      } else if (diffHours > 0) {
        if (remainingMinutes > 0) {
          timeFormatted = `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'} y ${remainingMinutes} ${remainingMinutes === 1 ? 'minuto' : 'minutos'}`;
        } else {
          timeFormatted = `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
        }
      } else if (diffMinutes > 0) {
        timeFormatted = `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
      } else {
        timeFormatted = `Hace ${diffSeconds} ${diffSeconds === 1 ? 'segundo' : 'segundos'}`;
      }

      // Añadir la fecha exacta como tooltip/title
      const exactDate = activityDate.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Formatear la acción para que sea más legible
      let formattedAction = '';
      let formattedTarget = '';

      // Mapear los tipos de acción a textos más amigables
      switch (activity.tipo_accion) {
        case 'inicio_sesion':
          formattedAction = 'inició sesión en el sistema';
          formattedTarget = '';
          break;
        case 'registro_usuario':
          formattedAction = 'se registró en el sistema';
          formattedTarget = '';
          break;
        case 'crear_rol':
          formattedAction = 'creó el rol';
          formattedTarget = activity.entidad_nombre || 'Nuevo rol';
          break;
        case 'eliminar_rol':
          formattedAction = 'eliminó el rol';
          formattedTarget = activity.entidad_nombre || `ID ${activity.entidad_id}`;
          break;
        case 'actualizar_permisos_rol':
          formattedAction = 'actualizó los permisos del rol';
          formattedTarget = activity.entidad_nombre || `ID ${activity.entidad_id}`;
          break;
        case 'actualizar_permisos_usuario':
          // Usar el mapa de nombres de usuario si está disponible
          if (activity.entidad_id && userNamesMap[activity.entidad_id]) {
            formattedAction = 'actualizó los permisos de';
            formattedTarget = userNamesMap[activity.entidad_id];
          } else {
            formattedAction = 'actualizó los permisos de';
            formattedTarget = activity.entidad_nombre || `Usuario ID ${activity.entidad_id}`;
          }
          break;
        case 'crear_usuario':
          // Usar el mapa de nombres de usuario si está disponible
          if (activity.entidad_id && userNamesMap[activity.entidad_id]) {
            formattedAction = 'creó el usuario';
            formattedTarget = userNamesMap[activity.entidad_id];
          } else {
            formattedAction = 'creó el usuario';
            formattedTarget = activity.entidad_nombre || `ID ${activity.entidad_id}`;
          }
          break;
        case 'actualizar_codigo_presupuestal':
          formattedAction = 'actualizó el código presupuestal';
          formattedTarget = activity.entidad_nombre || `ID ${activity.entidad_id}`;
          break;
        default:
          // Para cualquier otro tipo de acción, usar la descripción directamente
          formattedAction = activity.tipo_accion.replace(/_/g, ' ');
          formattedTarget = activity.entidad_nombre || activity.descripcion;
      }

      // Devolver objeto formateado para el frontend
      return {
        id: activity.id,
        user: activity.usuario_nombre,
        action: formattedAction,
        target: formattedTarget,
        description: activity.descripcion, // Incluir la descripción completa por si se necesita
        time: timeFormatted,
        exactDate: exactDate, // Fecha exacta para mostrar en tooltip
        timestamp: activity.fecha_creacion, // Timestamp original para ordenar
        initials: initials,
        entityType: activity.entidad_tipo, // Incluir el tipo de entidad para posible filtrado
        actionType: activity.tipo_accion   // Incluir el tipo de acción original para posible filtrado
      };
    });

    // Si no hay actividades, devolver algunos datos de ejemplo
    if (formattedActivities.length === 0) {
      const defaultActivities = [
        {
          id: 1,
          user: "Administrador",
          action: "creó el usuario",
          target: "Laura Martínez",
          time: "Hace 2 horas y 15 minutos",
          exactDate: "15 de junio de 2023, 14:30:22",
          timestamp: new Date(Date.now() - 2*60*60*1000 - 15*60*1000).toISOString(),
          initials: "A",
          entityType: "usuario",
          actionType: "crear_usuario",
          description: "Se creó un nuevo usuario"
        },
        {
          id: 2,
          user: "Administrador",
          action: "actualizó los permisos del rol",
          target: "Supervisor",
          time: "Hace 5 horas y 30 minutos",
          exactDate: "15 de junio de 2023, 11:15:45",
          timestamp: new Date(Date.now() - 5*60*60*1000 - 30*60*1000).toISOString(),
          initials: "A",
          entityType: "rol",
          actionType: "actualizar_permisos_rol",
          description: "Se actualizaron los permisos del rol"
        },
        {
          id: 3,
          user: "Carlos Rodríguez",
          action: "actualizó el código presupuestal",
          target: "CP-2023",
          time: "Hace 1 día y 3 horas",
          exactDate: "14 de junio de 2023, 13:45:10",
          timestamp: new Date(Date.now() - 27*60*60*1000).toISOString(),
          initials: "CR",
          entityType: "codigo_presupuestal",
          actionType: "actualizar_codigo_presupuestal",
          description: "Se actualizó un código presupuestal"
        },
        {
          id: 4,
          user: "Laura Martínez",
          action: "inició sesión en el sistema",
          target: "",
          time: "Hace 2 días y 5 horas",
          exactDate: "13 de junio de 2023, 11:20:33",
          timestamp: new Date(Date.now() - 53*60*60*1000).toISOString(),
          initials: "LM",
          entityType: "usuario",
          actionType: "inicio_sesion",
          description: "El usuario inició sesión"
        },
      ];
      return res.status(200).json(defaultActivities);
    }

    return res.status(200).json(formattedActivities);
  } catch (error) {
    console.error('Error al obtener actividad reciente:', error);
    return res.status(500).json({
      message: 'Error al obtener actividad reciente',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// --- Controlador para obtener resumen del dashboard de presupuestos ---
export const getBudgetSummary = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // Consulta para totales y conteos
    const summaryQuery = `
      SELECT
        COALESCE(SUM(cp.monto_presupuesto), 0) AS total_presupuestado,
        COALESCE(SUM(cp.monto_presupuesto - COALESCE(oc_sum.gastado, 0)), 0) AS total_disponible,
        COUNT(DISTINCT CASE WHEN (cp.monto_presupuesto - COALESCE(oc_sum.gastado, 0)) > 0 THEN cp.id END)::int AS codigos_activos,
        COUNT(DISTINCT acp.area_id)::int AS areas_asociadas_count
      FROM codigos_presupuestales cp
      LEFT JOIN (
        SELECT cp_id, SUM(monto) AS gastado
        FROM ordenes_compra
        WHERE estado = 'finalizada' -- Asegúrate que este sea el estado correcto
        GROUP BY cp_id
      ) oc_sum ON cp.id = oc_sum.cp_id
      LEFT JOIN area_codigos_presupuestales acp ON cp.id = acp.cp_id;
    `;

    // TODO: Calcular tendencia mensual real
    const tendenciaMensual = -12.5; // Placeholder

    const summaryResult = await client.query(summaryQuery);
    const summaryData = summaryResult.rows[0];

    const responseData = {
      totalPresupuestado: parseFloat(summaryData.total_presupuestado) || 0,
      totalDisponible: parseFloat(summaryData.total_disponible) || 0,
      codigosActivos: summaryData.codigos_activos || 0,
      areasAsociadasCount: summaryData.areas_asociadas_count || 0,
      tendenciaMensual: tendenciaMensual, // Placeholder
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Error al obtener resumen de presupuesto:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener resumen de presupuesto.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para obtener resumen del Centro de Compras ---
export const getPurchaseCenterSummary = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // Consulta para estadísticas generales de órdenes
    const summaryQuery = `
      SELECT
        COUNT(*)::int AS total_ordenes,
        COUNT(CASE WHEN estado = 'Completada' THEN 1 END)::int AS ordenes_completadas,
        COUNT(CASE WHEN estado = 'Pendiente de aprobación' THEN 1 END)::int AS ordenes_pendientes,
        COUNT(CASE WHEN estado = 'En proceso' THEN 1 END)::int AS ordenes_en_proceso,
        COALESCE(SUM(monto), 0) AS monto_total
      FROM ordenes_compra;
    `;

    // TODO: Calcular tasa de aprobación real si es necesario
    // TODO: Calcular tendencia mensual real

    const summaryResult = await client.query(summaryQuery);
    const summaryData = summaryResult.rows[0];

    // Calcular tasa de aprobación (excluyendo 'En proceso' del total para el cálculo)
    const totalRelevant = summaryData.total_ordenes - summaryData.ordenes_en_proceso;
    const approvalRate = totalRelevant > 0 ? (summaryData.ordenes_completadas / totalRelevant) * 100 : 0;

    const responseData = {
      totalOrdenes: summaryData.total_ordenes || 0,
      ordenesCompletadas: summaryData.ordenes_completadas || 0,
      ordenesPendientes: summaryData.ordenes_pendientes || 0,
      ordenesEnProceso: summaryData.ordenes_en_proceso || 0,
      montoTotal: parseFloat(summaryData.monto_total) || 0,
      tasaAprobacion: parseFloat(approvalRate.toFixed(1)) || 0, // Tasa de aprobación calculada
      tendenciaMensual: -12.5, // Placeholder
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Error al obtener resumen del centro de compras:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener resumen del centro de compras.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para obtener próximas entregas ---
export const getUpcomingDeliveries = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 3; // Límite por defecto 3

  try {
    client = await pool.connect();

    const query = `
      SELECT
        oc.id,
        oc.id AS numero, -- Usar ID como número por ahora
        oc.fecha_creacion,
        oc.fecha_entrega,
        oc.estado,
        oc.proveedor,
        oc.monto,
        oc.moneda,
        oc.prioridad,
        u.nombre as solicitante
      FROM ordenes_compra oc
      JOIN usuarios u ON oc.usuario_id = u.id
      WHERE oc.estado = 'En proceso' AND oc.fecha_entrega IS NOT NULL
      ORDER BY oc.fecha_entrega ASC
      LIMIT $1;
    `;

    const result = await client.query(query, [limit]);
    return res.status(200).json(result.rows);

  } catch (error) {
    console.error('Error al obtener próximas entregas:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener próximas entregas.' });
  } finally {
    client?.release();
  }
};

// --- Controlador para obtener presupuesto por departamento ---
export const getBudgetByDepartment = async (req: Request, res: Response): Promise<Response> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    const query = `
      SELECT
        a.departamento,
        COALESCE(SUM(cp.monto_presupuesto), 0) AS total,
        COALESCE(SUM(cp.monto_presupuesto - COALESCE(oc_sum.gastado, 0)), 0) AS disponible
      FROM areas a
      LEFT JOIN area_codigos_presupuestales acp ON a.id = acp.area_id
      LEFT JOIN codigos_presupuestales cp ON acp.cp_id = cp.id
      LEFT JOIN (
        SELECT cp_id, SUM(monto) AS gastado
        FROM ordenes_compra
        WHERE estado = 'finalizada' -- Asegúrate que este sea el estado correcto
        GROUP BY cp_id
      ) oc_sum ON cp.id = oc_sum.cp_id
      WHERE a.departamento IS NOT NULL AND a.departamento <> ''
      GROUP BY a.departamento
      ORDER BY a.departamento;
    `;

    const result = await client.query(query);

    const responseData = result.rows.map(row => ({
      departamento: row.departamento,
      total: parseFloat(row.total) || 0,
      disponible: parseFloat(row.disponible) || 0,
    }));

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Error al obtener presupuesto por departamento:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener presupuesto por departamento.' });
  } finally {
    client?.release();
  }
};
