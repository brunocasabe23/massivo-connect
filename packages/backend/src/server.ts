import express, { Request, Response, Application } from 'express';
import dotenv from 'dotenv'; // Asegurarse de que dotenv se cargue primero
import { testDbConnection } from './config/db'; // Importar la función de prueba
import authRoutes from './routes/auth.routes'; // Importar rutas de autenticación
import budgetRoutes from './routes/budget.routes'; // Importar rutas de códigos presupuestales

// Cargar variables de entorno (importante hacerlo antes de usar process.env)
dotenv.config();

const app: Application = express();
// Usar process.env DESPUÉS de dotenv.config()
const PORT: number = parseInt(process.env.PORT || '5000', 10); 

// Middleware básico
app.use(express.json()); // Para parsear JSON bodies

// Rutas de API
app.use('/api/auth', authRoutes); 
app.use('/api/budget-codes', budgetRoutes); // Montar rutas de códigos presupuestales

// Ruta de prueba raíz (opcional)
app.get('/', (req: Request, res: Response) => {
  res.send('¡API de Gestión de Compras funcionando!');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Backend server corriendo en http://localhost:${PORT}`);
  
  // Probar la conexión a la base de datos al iniciar
  testDbConnection(); 
});