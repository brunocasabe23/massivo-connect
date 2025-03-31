import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db'; // Pool de conexiones a la BD
import { PoolClient, QueryResult } from 'pg';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_secreto'; // ¡Debería estar en .env!
const SALT_ROUNDS = 10; // Costo de hashing para bcrypt

// --- Controlador de Registro ---
export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  const { nombre, email, password } = req.body;

  // Validación básica de entrada
  if (!nombre || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
  }

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // 1. Verificar si el email ya existe
    const checkUser: QueryResult = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    // Corrección: Usar '?? 0' para manejar posible null/undefined en rowCount
    if ((checkUser.rowCount ?? 0) > 0) { 
      return res.status(409).json({ message: 'El email ya está registrado.' }); // 409 Conflict
    }

    // 2. Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Insertar el nuevo usuario
    // Por defecto, el estado es 'activo' según la definición de la tabla
    const newUserQuery = `
      INSERT INTO usuarios (nombre, email, password_hash) 
      VALUES ($1, $2, $3) 
      RETURNING id, nombre, email, estado, fecha_creacion
    `;
    const newUserResult: QueryResult = await client.query(newUserQuery, [nombre, email, passwordHash]);
    const newUser = newUserResult.rows[0];

    // 4. Devolver el usuario creado (sin contraseña)
    return res.status(201).json(newUser); // 201 Created

  } catch (error) {
    console.error('Error en registro:', error);
    // Considerar un logging más robusto en producción
    return res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
  } finally {
    client?.release(); // Liberar cliente del pool
  }
};

// --- Controlador de Login ---
export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  // Validación básica
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // 1. Buscar usuario por email y obtener su rol
    const userQuery = `
      SELECT
        u.id, u.nombre, u.email, u.password_hash, u.estado, r.nombre as rol
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      WHERE u.email = $1
      LIMIT 1; -- Asegurar que solo traiga un usuario si hay múltiples roles (tomará el primero)
    `;
    // Nota: Si un usuario puede tener múltiples roles, necesitarías ajustar esta lógica.
    // Por ahora, asumimos un rol por usuario según el AuthContext del frontend.
    const userResult: QueryResult = await client.query(userQuery, [email]);

    // Verificar si se encontró el usuario
    if (userResult.rowCount === 0) { // No es necesario '?? 0' aquí, rowCount es 0 si no hay filas
      return res.status(401).json({ message: 'Credenciales inválidas.' }); // 401 Unauthorized
    }

    const user = userResult.rows[0];

    // Verificar estado del usuario (opcional, ej: si hay aprobación pendiente)
    if (user.estado !== 'activo') {
       return res.status(403).json({ message: 'La cuenta de usuario no está activa.' }); // 403 Forbidden
    }

    // 2. Obtener Permisos del Usuario basados en su Rol(es)
    // Asumiendo que user.rol contiene el nombre del rol principal o que la consulta anterior ya lo trajo.
    // Si un usuario pudiera tener múltiples roles, esta lógica necesitaría ajustarse.
    let userPermissions: string[] = [];
    if (user.rol) { // Solo buscar permisos si el usuario tiene un rol
        const permissionsQuery = `
            SELECT p.clave
            FROM permisos p
            JOIN rol_permisos rp ON p.id = rp.permiso_id
            JOIN roles r ON rp.rol_id = r.id
            WHERE r.nombre = $1;
        `;
        // Nota: Si usas IDs de rol, la consulta sería WHERE r.id = (SELECT id FROM roles WHERE nombre = $1) o similar
        try {
            const permissionsResult: QueryResult = await client.query(permissionsQuery, [user.rol]);
            userPermissions = permissionsResult.rows.map(row => row.clave);
        } catch (permError) {
             console.error('Error al obtener permisos:', permError);
             // Decidir si fallar el login o continuar sin permisos
             // return res.status(500).json({ message: 'Error interno al obtener permisos.' });
        }
    }
    
    // Añadir permisos al objeto user (antes de quitar el hash de password)
    user.permisos = userPermissions;

    // 3. Comparar contraseña hasheada
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' }); // 401 Unauthorized
    }

    // 4. Generar JWT (El comentario anterior era incorrecto, este es el paso 4)
    const payload = {
      userId: user.id,
      email: user.email,
      rol: user.rol,
      permisos: user.permisos, // Incluir permisos en el payload
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expira en 1 hora

    // 4. Devolver el token
    // Excluir password_hash de la respuesta
    const { password_hash, ...userWithoutPassword } = user;
    return res.status(200).json({ token, user: userWithoutPassword });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
  } finally {
    client?.release();
  }
};