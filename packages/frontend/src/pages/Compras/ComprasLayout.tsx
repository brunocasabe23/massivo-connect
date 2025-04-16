import React from 'react';
import { Outlet } from 'react-router-dom';

const ComprasLayout: React.FC = () => {
  return <Outlet />; // Renderiza las rutas hijas (Solicitudes, Proveedores, CentroCompras)
};

export default ComprasLayout;