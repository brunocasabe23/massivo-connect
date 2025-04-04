import React from 'react';
import { Outlet } from 'react-router-dom';

// TODO: Añadir aquí la estructura real del layout (Navbar, Sidebar si aplica, etc.)
const UserLayout: React.FC = () => {
  return (
    <div className="user-layout p-4"> {/* Añadir clases de estilo según sea necesario */}
      {/* <h1>Layout de Usuario</h1> */}
      <main>
        <Outlet /> {/* Aquí se renderizarán las páginas hijas como UserDashboardPage */}
      </main>
    </div>
  );
};

export default UserLayout;