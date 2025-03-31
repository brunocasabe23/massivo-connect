import { createBrowserRouter, RouterProvider } from 'react-router-dom'; // Eliminado Outlet

// Importar Layout y Páginas
// import MainLayout from '../components/layout/MainLayout'; // Eliminado
import AdminLayout from '../components/layout/AdminLayout'; // Importar AdminLayout
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
// import DashboardPage from '../pages/Dashboard/DashboardPage'; // Eliminado
import BudgetCodesPage from '../pages/BudgetCodes/BudgetCodesPage';
import AdminUsuariosPage from '../pages/Admin/AdminUsuariosPage'; // Importar página real
import AdminRolesPage from '../pages/Admin/AdminRolesPage'; // Importar página real
import AdminDashboardPage from '../pages/Admin/AdminDashboardPage'; // Importar página real
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';

// Placeholder ya no es necesario
// const AdminPlaceholder: React.FC<{ title: string }> = ({ title }) => (
//   <div><h2 className="text-xl font-semibold">{title}</h2><p>Contenido de {title}...</p></div>
// );

// Componente wrapper para el layout de admin protegido por rol
const ProtectedAdminLayout = () => (
  // Asegúrate que 'Administrador' sea el nombre exacto del rol en tu sistema
  <ProtectedRoute allowedRoles={['Administrador']}>
    <AdminLayout />
  </ProtectedRoute>
);

// Definición de rutas anidadas
const router = createBrowserRouter([
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
    element: <ProtectedAdminLayout />, // Layout protegido por rol 'Administrador'
    children: [
       {
        // La ruta raíz ahora apunta al dashboard de admin
        path: '/',
        element: <AdminDashboardPage />,
      },
       {
        path: '/admin', // Panel principal de admin (ruta explícita)
        element: <AdminDashboardPage />, // Usar componente real
      },
      {
        path: '/admin/usuarios',
        element: <AdminUsuariosPage />, // Usar componente real
      },
      {
        path: '/admin/roles',
        element: <AdminRolesPage />, // Usar componente real
      },
      {
        // Mover budget-codes aquí
        path: '/budget-codes',
        element: <BudgetCodesPage />,
      },
       // TODO: Añadir rutas /perfil, /configuracion, /compras, /viaticos aquí si son protegidas
    ]
  },
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