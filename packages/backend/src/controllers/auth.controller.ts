// import { Request, Response } from 'express';

// Usar any para evitar problemas de tipos
type Response = any;
type Request = any;
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db'; // Pool de conexiones a la BD
import { PoolClient, QueryResult } from 'pg';
import { registerActivity } from '../services/activity.service';

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
    if ((checkUser.rowCount ?? 0) > 0) {
      return res.status(409).json({ message: 'El email ya está registrado.' }); // 409 Conflict
    }

    // 2. Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Insertar el nuevo usuario
    const newUserQuery = `
      INSERT INTO usuarios (nombre, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, nombre, email, estado, fecha_creacion
    `;

    await client.query('BEGIN');

    try {
      const newUserResult: QueryResult = await client.query(newUserQuery, [nombre, email, passwordHash]);
      const newUser = newUserResult.rows[0];

      // Asignar automáticamente el rol "Usuario" (ID 3) al nuevo usuario
      const assignRoleQuery = `
        INSERT INTO usuario_roles (usuario_id, rol_id)
        VALUES ($1, $2)
      `;
      await client.query(assignRoleQuery, [newUser.id, 3]); // 3 es el ID del rol "Usuario"

      await client.query('COMMIT');

      // Registrar actividades
      await registerActivity({
        usuario_id: newUser.id,
        tipo_accion: 'registro_usuario',
        descripcion: 'Se registró un nuevo usuario',
        entidad_tipo: 'usuario',
        entidad_id: newUser.id,
        entidad_nombre: nombre
      });
      await registerActivity({
        usuario_id: newUser.id,
        tipo_accion: 'asignar_rol',
        descripcion: 'Se asignó el rol Usuario al nuevo usuario',
        entidad_tipo: 'usuario',
        entidad_id: newUser.id,
        entidad_nombre: nombre,
        datos_adicionales: { rol_id: 3, rol_nombre: 'Usuario' }
      });

      // 4. Devolver el usuario creado (sin contraseña)
      return res.status(201).json(newUser); // 201 Created
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
  } finally {
    client?.release();
  }
};

// --- Controlador de Login ---
export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();

    // 1. Buscar usuario por email y obtener datos necesarios (incluyendo avatar_url)
    const userQuery = `
      SELECT
        u.id, u.nombre, u.email, u.password_hash, u.estado, u.avatar_url, u.area_id, r.nombre as rol -- Añadir u.area_id
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      WHERE u.email = $1
      LIMIT 1;
    `;
    const userResult: QueryResult = await client.query(userQuery, [email]);

    if (userResult.rowCount === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const user = userResult.rows[0];
    console.log('[AuthController Login] User data from DB:', user); // Log 1: Datos de DB

    if (user.estado !== 'activo') {
       return res.status(403).json({ message: 'La cuenta de usuario no está activa.' });
    }

    // 2. Obtener TODOS los permisos efectivos del usuario
    let userPermissions: string[] = [];
    const effectivePermissionsQuery = `
      SELECT p.clave FROM permisos p JOIN rol_permisos rp ON p.id = rp.permiso_id JOIN usuario_roles ur ON rp.rol_id = ur.rol_id WHERE ur.usuario_id = $1
      UNION
      SELECT p.clave FROM permisos p JOIN usuario_permisos_directos upd ON p.id = upd.permiso_id WHERE upd.usuario_id = $1;
    `;
    try {
        // console.log(`[Auth Controller] Obteniendo permisos para usuario ID ${user.id}`); // Log eliminado
        const permissionsResult: QueryResult = await client.query(effectivePermissionsQuery, [user.id]);
        userPermissions = permissionsResult.rows.map(row => row.clave);
        // console.log(`[Auth Controller] Permisos obtenidos: ${userPermissions.join(', ')}`); // Log eliminado
    } catch (permError) {
         console.error('Error al obtener permisos efectivos:', permError);
    }

    // Añadir permisos efectivos al objeto user
    user.permisos = userPermissions;

    // 3. Comparar contraseña hasheada
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // 4. Generar JWT
    const payload = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      permisos: user.permisos,
      area_id: user.area_id, // Añadir area_id al payload
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    // Registrar actividad de inicio de sesión
    await registerActivity({
      usuario_id: user.id,
      tipo_accion: 'inicio_sesion',
      descripcion: 'El usuario inició sesión',
      entidad_tipo: 'usuario',
      entidad_id: user.id,
      entidad_nombre: user.nombre
    }).catch(err => console.error('Error al registrar actividad de login:', err));

    // 5. Devolver el token y datos del usuario (sin hash)
    const { password_hash, ...userWithoutPassword } = user;
    // Asegurarse de que avatarUrl (puede ser null) esté en el objeto devuelto
    // Incluir area_id en los datos finales del usuario
    const finalUserData = { ...userWithoutPassword, avatarUrl: user.avatar_url || null, area_id: user.area_id };
    console.log('[AuthController Login] Final user data being sent:', finalUserData); // Log 2: Datos finales
    return res.status(200).json({ token, user: finalUserData });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
  } finally {
    client?.release();
  }
};