const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde .env en el directorio padre (packages/backend)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

// Validar que las variables necesarias estén presentes
if (!DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT || !DB_NAME) {
  console.error('Error: Faltan variables de entorno para la base de datos en .env');
  process.exit(1);
}

// Construir la URL de conexión
const encodedPassword = encodeURIComponent(DB_PASSWORD);
const databaseUrl = `postgres://${DB_USER}:${encodedPassword}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

// Obtener la acción de migración (up, down, create) y argumentos adicionales
const action = process.argv[2]; // 'up', 'down', 'create'
const migrationName = process.argv[3]; // Nombre para 'create'

if (!action) {
  console.error('Error: Se requiere una acción (up, down, create).');
  process.exit(1);
}

// Construir el comando base para node-pg-migrate
// Usamos npx para asegurar que se encuentre el ejecutable
// Quitamos --db-connection-string, usaremos la variable de entorno DATABASE_URL
let command = `npx node-pg-migrate -j ts -m ./migrations ${action}`;

// Añadir el nombre de la migración si la acción es 'create'
if (action === 'create') {
  if (!migrationName) {
    console.error('Error: Se requiere un nombre para la migración al usar "create".');
    process.exit(1);
  }
  command += ` ${migrationName}`;
}

// Preparar el entorno para el proceso hijo
const executionEnv = {
  ...process.env, // Heredar entorno actual
  DATABASE_URL: databaseUrl, // Establecer DATABASE_URL explícitamente
};

console.log(`Ejecutando: ${command}`); // Ya no mostramos la URL aquí

try {
  // Ejecutar el comando sincronamente con el entorno modificado y mostrar salida
  execSync(command, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'), // Ejecutar desde packages/backend
    env: executionEnv, // Pasar el entorno modificado
  });
  console.log(`Migración "${action}" completada exitosamente.`);
} catch (error) {
  console.error(`Error durante la migración "${action}":`, error.message);
  process.exit(1);
}