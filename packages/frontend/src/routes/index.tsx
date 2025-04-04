import { createBrowserRouter, RouterProvider } from 'react-router-dom'; // Eliminado Outlet

// Importar Layout y Páginas
// import MainLayout from '../components/layout/MainLayout'; // Eliminado
import AdminLayout from '../components/layout/AdminLayout'; // Importar AdminLayout
// import UserLayout from '../components/layout/UserLayout'; // Eliminado ya que no se usa
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
// import DashboardPage from '../pages/Dashboard/DashboardPage'; // Eliminado
import BudgetCodesPage from '../pages/BudgetCodes/BudgetCodesPage';
import AdminUsuariosPage from '../pages/Admin/AdminUsuariosPage'; // Importar página real
import AdminRolesPage from '../pages/Admin/AdminRolesPage'; // Importar página real
import AdminDashboardPage from '../pages/Admin/AdminDashboardPage'; // Importar página real
import UserDashboardPage from '../pages/Dashboard/UserDashboardPage'; // Importar dashboard de usuario
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';
import RootRedirect from './RootRedirect'; // Importar el nuevo componente

// Placeholder ya no es necesario
// const AdminPlaceholder: React.FC<{ title: string }> = ({ title }) => (
//   <div><h2 className="text-xl font-semibold">{title}</h2><p>Contenido de {title}...</p></div>
// );

// Componente wrapper para el layout principal protegido solo por autenticación
const ProtectedMainLayout = () => ( // Renombrar para claridad
  // Solo requiere que el usuario esté autenticado
  <ProtectedRoute>
    <AdminLayout /> {/* Usar el layout común para todos */}
  </ProtectedRoute>
);

// Definición de rutas anidadas
const router = createBrowserRouter([
  {
    path: '/', // Ruta raíz
    element: <RootRedirect />, // Usa el componente de redirección
  },
  // Rutas públicas (fuera del MainLayout)
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  // Rutas Protegidas (Administración y otras secciones)
  {
    element: <ProtectedMainLayout />, // Usar el layout principal protegido
    children: [
      // Eliminar ruta raíz '/' de aquí. Se manejará la redirección post-login.
      {
        path: '/admin', // Dashboard de admin explícito
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
        path: '/budget-codes',
        element: <ProtectedRoute requiredPermission="ver_codigos_presupuestales"><BudgetCodesPage /></ProtectedRoute>,
      },
      // Ruta para compras protegida por permiso 'ver_compras'
      {
        path: '/compras',
        // element: <ProtectedRoute requiredPermission="ver_compras"><ComprasPage /></ProtectedRoute>, // Descomentar cuando ComprasPage exista
        element: <ProtectedRoute requiredPermission="ver_compras"><div>Página de Compras (Placeholder)</div></ProtectedRoute>,
      },
      {
        path: '/dashboard', // Dashboard de usuario normal (accesible a todos los autenticados)
        element: <UserDashboardPage />, // No requiere permiso específico, solo autenticación del layout
      },
       // TODO: Añadir otras rutas protegidas por permiso aquí (ej: /viaticos con 'ver_viaticos')
    ]
  },
  // Eliminar el grupo de rutas de usuario normal, ya que se integran en el layout principal
  // Ruta Catch-all para 404 (fuera de los layouts)
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