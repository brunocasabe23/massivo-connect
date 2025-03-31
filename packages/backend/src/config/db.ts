import { Pool } from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres', // Usuario por defecto de postgres
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gestion_compras_db', // Nombre sugerido para la BD
  password: process.env.DB_PASSWORD || 'password', // ¡Cambiar en producción!
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

pool.on('connect', () => {
  console.log('Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de la base de datos', err);
  process.exit(-1);
});

export default pool;

// Función para probar la conexión (opcional)
export const testDbConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexión a la base de datos exitosa!');
    client.release();
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
};