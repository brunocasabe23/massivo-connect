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

  // Si se especificaron roles permitidos y el usuario no tiene uno de ellos
  if (allowedRoles && (!user?.rol || !allowedRoles.includes(user.rol))) {
    // Redirigir a una página no autorizada o al dashboard principal
    // TODO: Considerar crear una página /unauthorized específica
    console.warn(`Acceso no autorizado a ${location.pathname} para el rol: ${user?.rol}`);
    return <Navigate to="/dashboard" replace />; // Redirige a dashboard por ahora
  }

  // Si se especificó un permiso requerido y el usuario no lo tiene
  if (requiredPermission && !permisos.includes(requiredPermission)) {
    // Redirigir a una página no autorizada o al dashboard principal
    console.warn(`Acceso no autorizado a ${location.pathname}. Permiso requerido: ${requiredPermission}`);
    return <Navigate to="/dashboard" replace />; // Redirige a dashboard por ahora
  }

  // Si está autenticado y tiene el rol/permiso permitido (o no se requieren)
  return children;
};

export default ProtectedRoute;