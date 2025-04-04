import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Definir la forma del objeto de usuario (simplificado por ahora)
interface User {
  id: number;
  nombre: string;
  email: string;
  estado: string;
  rol: string;
  permisos: string[]; // Añadido campo permisos
}

// Definir la forma del contexto
interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Para manejar la carga inicial del token
  permisos: string[]; // Añadido permisos al contexto
  login: (token: string, userData: User) => void;
  logout: () => void;
}

// Crear el contexto con un valor inicial undefined para chequear si se usa fuera del provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para el Provider
interface AuthProviderProps {
  children: ReactNode;
}
// Crear el Provider del contexto
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  // Inicializar user con permisos vacíos si es null
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Inicia cargando

  // Efecto para cargar el token desde localStorage al iniciar
  useEffect(() => { // Eliminado useEffect duplicado
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    console.log('[AuthContext] Loading from localStorage:', { storedToken, storedUser }); // <-- Añadir log

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        // TODO: Podríamos añadir una verificación del token aquí llamando a una ruta /api/auth/me
      } catch (error) {
        console.error("Error al parsear datos de usuario desde localStorage", error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    setIsLoading(false); // Termina la carga inicial
  }, []);

  // Función de Login: guarda token y usuario (incluyendo rol y permisos) en estado y localStorage
  const login = (newToken: string, userData: User) => {
    // Log de depuración para ver qué datos de usuario se reciben
    console.log('[AuthContext] login() - userData recibido:', userData);
    console.log('[AuthContext] login() - permisos recibidos:', userData.permisos);

    // Asegurarse que userData incluya 'rol' y 'permisos' que vienen de la API
    // Si permisos no viene, inicializar como array vacío por seguridad
    const completeUserData = { ...userData, permisos: userData.permisos || [] };

    console.log('[AuthContext] login() - completeUserData:', completeUserData);

    setToken(newToken);
    setUser(completeUserData);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(completeUserData)); // Guardar usuario completo
  };

  // Función de Logout: limpia estado y localStorage
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // TODO: Podríamos añadir una llamada a /api/auth/logout si existiera en el backend
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token, // Es autenticado si hay un token
    isLoading,
    permisos: user?.permisos || [], // Añadir permisos al contexto (o array vacío si no hay usuario)
    login,
    logout,
  };

  // No renderizar children hasta que termine la carga inicial del token
  if (isLoading) {
    // Puedes mostrar un spinner de carga aquí si lo deseas
    return <div>Cargando...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto fácilmente
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};