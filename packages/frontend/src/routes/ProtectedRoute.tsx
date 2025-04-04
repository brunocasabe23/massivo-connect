import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Mantener por si se usa en otro lugar
  requiredPermission?: string; // Prop opcional para permiso requerido
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requiredPermission }) => {
  const { user, isAuthenticated, isLoading, permisos } = useAuth(); // Obtener permisos
  const location = useLocation();

  // console.log("ProtectedRoute - User:", user, "Permisos:", permisos); // Log opcional

  // Si aún está cargando el estado de autenticación inicial
  if (isLoading) {
    // Podrías mostrar un spinner global aquí si prefieres
    return <div>Verificando autenticación...</div>; 
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    // Guardamos la ubicación actual para que el login pueda redirigir de vuelta
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- Verificaciones de Autorización (Solo si se especifican) ---

  // Verificar Rol (SOLO si se pasa allowedRoles)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user?.rol || !allowedRoles.includes(user.rol)) {
      console.warn(`Acceso no autorizado a ${location.pathname} para el rol: ${user?.rol}. Roles permitidos: ${allowedRoles.join(', ')}`);
      // Redirigir a una página 'no autorizado' o a un dashboard seguro
      return <Navigate to="/unauthorized" state={{ from: location }} replace />; // TODO: Crear ruta /unauthorized
    }
  }

  // Verificar Permiso (SOLO si se pasa requiredPermission)
  if (requiredPermission) {
    if (!permisos.includes(requiredPermission)) {
      console.warn(`Acceso no autorizado a ${location.pathname}. Permiso requerido: ${requiredPermission}. Permisos del usuario: ${permisos.join(', ')}`);
      // Redirigir a una página 'no autorizado' o a un dashboard seguro
      return <Navigate to="/unauthorized" state={{ from: location }} replace />; // TODO: Crear ruta /unauthorized
    }
  }

  // Si pasó la autenticación y las verificaciones de autorización (o no se aplicaron), renderizar contenido
  return children;
};

export default ProtectedRoute;