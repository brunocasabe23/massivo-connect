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
  if (user?.rol === 'Administrador') {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

export default RootRedirect;