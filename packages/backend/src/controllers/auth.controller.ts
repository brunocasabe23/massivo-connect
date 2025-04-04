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

    // 1. Buscar usuario por email y obtener su rol principal (si tiene)
    // Nota: Esta consulta asume que un usuario tiene como máximo un rol en usuario_roles.
    // Si un usuario puede tener múltiples roles, la lógica para determinar el 'rol' principal
    // y cómo se manejan los permisos combinados necesitaría ajustes.
    const userQuery = `
      SELECT
        u.id, u.nombre, u.email, u.password_hash, u.estado, r.nombre as rol
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      WHERE u.email = $1
      LIMIT 1;
    `;
    const userResult: QueryResult = await client.query(userQuery, [email]);

    // Verificar si se encontró el usuario
    if (userResult.rowCount === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' }); // 401 Unauthorized
    }

    const user = userResult.rows[0];

    // Verificar estado del usuario
    if (user.estado !== 'activo') {
       return res.status(403).json({ message: 'La cuenta de usuario no está activa.' }); // 403 Forbidden
    }

    // 2. Obtener TODOS los permisos efectivos del usuario (rol + directos)
    let userPermissions: string[] = [];
    const effectivePermissionsQuery = `
      SELECT p.clave
      FROM permisos p
      JOIN rol_permisos rp ON p.id = rp.permiso_id
      JOIN usuario_roles ur ON rp.rol_id = ur.rol_id
      WHERE ur.usuario_id = $1
      UNION
      SELECT p.clave
      FROM permisos p
      JOIN usuario_permisos_directos upd ON p.id = upd.permiso_id
      WHERE upd.usuario_id = $1;
    `;
    try {
        console.log(`[Auth Controller] Obteniendo permisos para usuario ID ${user.id}`);
        const permissionsResult: QueryResult = await client.query(effectivePermissionsQuery, [user.id]); // Usar user.id
        userPermissions = permissionsResult.rows.map(row => row.clave);
        console.log(`[Auth Controller] Permisos obtenidos: ${userPermissions.join(', ')}`);
    } catch (permError) {
         console.error('Error al obtener permisos efectivos:', permError);
         // Decidir si fallar el login o continuar sin permisos (continuaremos sin permisos por ahora)
         // return res.status(500).json({ message: 'Error interno al obtener permisos.' });
    }

    // Añadir permisos efectivos al objeto user (antes de quitar el hash de password)
    user.permisos = userPermissions;

    // 3. Comparar contraseña hasheada
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' }); // 401 Unauthorized
    }

    // 4. Generar JWT
    const payload = {
      userId: user.id,
      email: user.email,
      rol: user.rol, // Rol principal (si tiene)
      permisos: user.permisos, // Permisos efectivos (rol + directos)
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expira en 1 hora

    // 5. Devolver el token y datos del usuario (sin hash)
    const { password_hash, ...userWithoutPassword } = user;
    return res.status(200).json({ token, user: userWithoutPassword });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
  } finally {
    client?.release();
  }
};