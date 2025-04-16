// Usar require en lugar de import para evitar problemas de tipos
const express = require('express');
import dotenv from 'dotenv'; // Asegurarse de que dotenv se cargue primero
import path from 'path'; // Importar path para manejar rutas de archivos
import fs from 'fs'; // Importar fs para operaciones de sistema de archivos
import { testDbConnection } from './config/db'; // Importar la función de prueba
import authRoutes from './routes/auth.routes'; // Importar rutas de autenticación
import budgetRoutes from './routes/budget.routes'; // Importar rutas de códigos presupuestales
import adminRoutes from './routes/admin.routes'; // Importar rutas de administración
import areasRoutes from './routes/areas.routes'; // Importar rutas de áreas
import dashboardRoutes from './routes/dashboard.routes'; // Importar rutas de dashboard
import userRoutes from './routes/user.routes'; // Importar rutas de usuario
import ordersRoutes from './routes/orders.routes'; // Importar rutas de órdenes de compra
import notificationsRoutes from './routes/notifications.routes'; // Importar rutas de notificaciones
import userBudgetRoutes from './routes/user-budget.routes'; // Importar rutas de presupuesto del usuario
import suppliersRoutes from './routes/suppliers.routes'; // Importar rutas de proveedores
import productosRoutes from './routes/productos.routes'; // Importar rutas de productos
import productosProveedoresRoutes from './routes/productos-proveedores.routes'; // Importar rutas de productos-proveedores

// Cargar variables de entorno (importante hacerlo antes de usar process.env)
dotenv.config();

const app = express();
// Usar process.env DESPUÉS de dotenv.config()
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Middleware básico
app.use(express.json()); // Para parsear JSON bodies

// Servir archivos estáticos desde la carpeta 'uploads'
// __dirname apunta a packages/backend/dist, así que subimos dos niveles
const uploadsPath = path.resolve(__dirname, '../../uploads');
console.log(`[Server] Serving static files from: ${uploadsPath}`);

// Asegurarse de que el directorio de uploads exista
if (!fs.existsSync(uploadsPath)) {
    try {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log(`[Server] Created uploads directory: ${uploadsPath}`);
    } catch (error) {
        console.error(`[Server] Error creating uploads directory: ${uploadsPath}`, error);
    }
}

// Configurar el middleware para servir archivos estáticos
app.use('/uploads', express.static(uploadsPath));
console.log(`[Server] Static file middleware configured for /uploads path`);

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/budget-codes', budgetRoutes); // Montar rutas de códigos presupuestales
app.use('/api/admin', adminRoutes); // Montar rutas de administración
app.use('/api/areas', areasRoutes); // Montar rutas de áreas
app.use('/api/dashboard', dashboardRoutes); // Montar rutas de dashboard
app.use('/api/users', userRoutes); // Montar rutas de usuario (para /me/settings)
app.use('/api/orders', ordersRoutes); // Montar rutas de órdenes de compra
app.use('/api/notifications', notificationsRoutes); // Montar rutas de notificaciones
app.use('/api/me', userBudgetRoutes); // Montar rutas de presupuesto del usuario
app.use('/api/suppliers', suppliersRoutes); // Montar rutas de proveedores
app.use('/api/productos', productosRoutes); // Montar rutas de productos
app.use('/api/productos', productosProveedoresRoutes); // Montar rutas de productos-proveedores

// Ruta de prueba raíz (opcional)
app.get('/', (_req: any, res: any) => {
  res.send('¡API de Gestión de Compras funcionando!');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Backend server corriendo en http://localhost:${PORT}`);

  // Probar la conexión a la base de datos al iniciar
  testDbConnection();
});