import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>; // O un spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirigir según el rol si está autenticado
  console.log('[RootRedirect] User Role:', user?.rol); // Log para depurar el rol
  if (user?.rol === 'Administrador') {
    return <Navigate to="/admin" replace />;
  } else if (user?.rol === 'Usuario') { // Añadir condición para rol Usuario
    return <Navigate to="/compras" replace />; // Redirigir a /compras (Solicitudes)
  } else {
    // Otros roles (ej. Compras, Supervisor) van al dashboard general
    return <Navigate to="/dashboard" replace />;
  }
};

export default RootRedirect;