import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Importar Layout y Páginas
import AdminLayout from '../components/layout/AdminLayout';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import BudgetCodesPage from '../pages/BudgetCodes/BudgetCodesPage';
import AdminUsuariosPage from '../features/users/pages/AdminUsuariosPage';
import AdminRolesPage from '../pages/Admin/AdminRolesPage';
import AdminDashboardPage from '../pages/Admin/AdminDashboardPage';
import ActivityLogPage from '../pages/Admin/ActivityLogPage';
import UserDashboardPage from '../features/orders/pages/UserDashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';
import RootRedirect from './RootRedirect';
import UserProfilePage from '../pages/Profile/UserProfilePage'; // Corregida la importación
import AreasPage from '../pages/Areas/AreasPage';
import BudgetDashboardPage from '../pages/BudgetDashboard/BudgetDashboardPage';
import CentroComprasPage from '../pages/Compras/CentroCompras/CentroComprasPage'; // Actualizado: Importar Centro de Compras desde Compras
// import ComprasPage from '../pages/Compras/ComprasPage'; // Ya no se usa como página principal
import ComprasLayout from '../pages/Compras/ComprasLayout'; // Importar el nuevo Layout
import SolicitudesPage from '../pages/Compras/SolicitudesPage'; // Importar la página de Solicitudes
import ProveedoresPage from '../pages/Compras/Proveedores/ProveedoresPage'; // Actualizado: Importar página de Proveedores desde Compras
import ProductosPage from '../pages/Productos/ProductosPage'; // Importar página de Productos

// Componente wrapper para el layout principal protegido solo por autenticación
const ProtectedMainLayout = () => (
  <ProtectedRoute>
    <AdminLayout />
  </ProtectedRoute>
);

// Definición de rutas anidadas
const router = createBrowserRouter([
  {
    path: '/', // Ruta raíz
    element: <RootRedirect />,
  },
  // Rutas públicas
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  // Rutas Protegidas
  {
    element: <ProtectedMainLayout />,
    children: [
      {
        path: '/admin',
        element: <AdminDashboardPage />,
      },
      {
        path: '/admin/usuarios',
        element: <ProtectedRoute requiredPermission="ver_administracion"><AdminUsuariosPage /></ProtectedRoute>,
      },
      {
        path: '/admin/roles',
        element: <ProtectedRoute requiredPermission="ver_administracion"><AdminRolesPage /></ProtectedRoute>,
      },
      {
        path: '/admin/actividades',
        element: <ProtectedRoute requiredPermission="ver_administracion"><ActivityLogPage /></ProtectedRoute>,
      },
      {
        path: '/budget-codes',
        element: <ProtectedRoute requiredPermission="ver_codigos_presupuestales"><BudgetCodesPage /></ProtectedRoute>,
      },
      {
        path: '/dashboard/presupuestos', // Nueva ruta para el dashboard
        element: <ProtectedRoute requiredPermission="ver_dashboard_presupuestos"><BudgetDashboardPage /></ProtectedRoute>, // Añadir permiso si es necesario
      },
      {
        path: '/compras', // Ruta base para compras
        element: <ComprasLayout />, // Layout sin protección, las subrutas sí están protegidas
        children: [
          {
            index: true, // Esta es la ruta por defecto para /compras
            element: <ProtectedRoute requiredPermission="crear_orden_compra"><SolicitudesPage /></ProtectedRoute>, // Permiso para crear/ver solicitudes
          },
          {
            path: 'solicitudes', // Ruta explícita también por si se necesita enlace directo
            element: <ProtectedRoute requiredPermission="crear_orden_compra"><SolicitudesPage /></ProtectedRoute>, // Permiso para crear/ver solicitudes
          },
          {
            path: 'proveedores', // Ruta anidada -> /compras/proveedores
            element: <ProtectedRoute requiredPermission="ver_proveedores"><ProveedoresPage /></ProtectedRoute>,
          },
          {
            path: 'centro-compras', // Ruta anidada -> /compras/centro-compras
            element: <ProtectedRoute requiredPermission="ver_centro_compras"><CentroComprasPage /></ProtectedRoute>,
          },
        ]
      },
      // Las rutas originales /centro-compras y /proveedores se eliminan ya que ahora están anidadas
      {
        path: '/dashboard',
        element: <UserDashboardPage />,
      },
      {
        path: '/perfil', // Ruta para perfil/configuración
        element: <UserProfilePage />, // Usar componente correcto
      },
       // TODO: Añadir otras rutas protegidas
      {
        path: '/codigos-presupuestales/areas',
        element: <ProtectedRoute requiredPermission="ver_areas"><AreasPage /></ProtectedRoute>,
      },
      {
        path: '/productos', // Nueva ruta para gestión de productos
        element: <ProtectedRoute requiredPermission="ver_productos"><ProductosPage /></ProtectedRoute>,
      },
    ]
  },
  // Ruta Catch-all para 404
   {
     path: '*',
     element: <NotFoundPage />,
   }
]);

// Componente que provee el enrutador
const AppRouterProvider: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouterProvider;