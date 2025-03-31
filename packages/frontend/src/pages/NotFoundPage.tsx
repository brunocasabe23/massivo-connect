import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Oops! Página no encontrada.</p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Volver al Inicio
      </Link>
    </div>
  );
};

export default NotFoundPage;