import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { callApi } from '@/services/api'; // Importar callApi

// Definir UserSettings aquí o importarla de un archivo de tipos común
interface UserSettings {
    theme: 'light' | 'dark';
    app_notifications_enabled: boolean;
    email_order_status_enabled: boolean;
}

// Definir la forma del objeto de usuario (simplificado por ahora)
interface User {
  id: number;
  nombre: string;
  email: string;
  estado: string;
  rol: string;
  permisos: string[];
  avatarUrl?: string; // Añadir avatarUrl opcional
}

// Definir la forma del contexto
interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Para manejar la carga inicial del token
  permisos: string[]; // Añadido permisos al contexto
  theme: 'light' | 'dark'; // Añadir theme
  login: (token: string, userData: User) => Promise<void>; // Hacerla async
  logout: () => void;
  updateTheme: (newTheme: 'light' | 'dark') => void; // Añadir función para actualizar tema
  updateUserContext: (updatedUserData: Partial<User>) => void; // Añadir función para actualizar datos del usuario en contexto
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Estado para el tema, default 'light'
  const [isLoading, setIsLoading] = useState(true); // Inicia cargando

  // Función para aplicar el tema al DOM y guardarlo en localStorage
   const applyTheme = useCallback((selectedTheme: 'light' | 'dark') => {
    // console.log('[AuthContext] Applying theme:', selectedTheme); // Log eliminado
    const themeToApply = selectedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeToApply);
    localStorage.setItem('theme', themeToApply);
    sessionStorage.setItem('theme', themeToApply);
    // console.log('[AuthContext] Theme applied:', themeToApply, 'DOM updated, localStorage and sessionStorage set'); // Log eliminado
  }, []);


  // Cargar token, usuario y tema al iniciar
  useEffect(() => {
    const initializeAuth = async () => {
      let initialTheme: 'light' | 'dark' = 'light'; // Default theme
      try {
          const storedToken = localStorage.getItem('authToken');
          const storedUser = localStorage.getItem('authUser');
          const localStorageTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
          const sessionStorageTheme = sessionStorage.getItem('theme') as 'light' | 'dark' | null;
          const htmlClassTheme = document.documentElement.classList.contains('dark') ? 'dark' :
                               document.documentElement.classList.contains('light') ? 'light' : null;

          // Determinar tema inicial... (código sin cambios)
          if (localStorageTheme === 'dark' || localStorageTheme === 'light') {
              initialTheme = localStorageTheme;
          } else if (sessionStorageTheme === 'dark' || sessionStorageTheme === 'light') {
              initialTheme = sessionStorageTheme;
          } else if (htmlClassTheme === 'dark' || htmlClassTheme === 'light') {
              initialTheme = htmlClassTheme;
          } else {
              const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              initialTheme = prefersDark ? 'dark' : 'light';
          }


          if (storedToken && storedUser) {
              const parsedUser = JSON.parse(storedUser);
              console.log('[AuthContext Init] Parsed user from localStorage:', parsedUser); // <-- Log para ver qué se lee
              setToken(storedToken);
              setUser(parsedUser); // Establecer usuario desde localStorage

              // Verificar token y obtener settings (el tema podría actualizarse aquí)
              try {
                  const settings = await callApi('/users/me/settings') as UserSettings;
                  if (settings && settings.theme) {
                      initialTheme = settings.theme;
                  }
              } catch (verifyError) {
                  console.error("[AuthContext] Token verification/settings fetch failed, logging out:", verifyError);
                  setToken(null);
                  setUser(null);
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('authUser');
                  localStorage.removeItem('theme');
                  initialTheme = 'light';
              }
          }
      } catch (error) {
          console.error("Error during auth initialization:", error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          localStorage.removeItem('theme');
          initialTheme = 'light';
      } finally {
          setTheme(initialTheme);
          applyTheme(initialTheme);
          localStorage.setItem('theme', initialTheme);
          sessionStorage.setItem('theme', initialTheme);
          setIsLoading(false);
      }
    };

    initializeAuth();
  }, [applyTheme]); // No incluir 'user' aquí para evitar bucles si se actualiza

  // Login: guarda token/usuario y obtiene/guarda tema
  const login = useCallback(async (newToken: string, userData: User) => {
    console.log('[AuthContext] login() - userData received from API:', userData); // Log para depurar
    const completeUserData = { ...userData, permisos: userData.permisos || [] };
    console.log('[AuthContext] login() - Storing completeUserData:', completeUserData); // Log para depurar

    setToken(newToken);
    setUser(completeUserData);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(completeUserData)); // Guardar usuario completo (con avatarUrl si viene)

    let themeToSet: 'light' | 'dark' = 'light';
    try {
        const settings = await callApi('/users/me/settings') as UserSettings;
        if (settings && settings.theme) {
            themeToSet = settings.theme;
        }
    } catch (error) {
        console.error("[AuthContext] Failed to fetch settings after login:", error);
    } finally {
        setTheme(themeToSet);
        applyTheme(themeToSet);
    }
  }, [applyTheme]);

  // Logout: limpia todo
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setTheme('light');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('theme');
    applyTheme('light');
  }, [applyTheme]);

  // Función para actualizar el tema desde fuera
  const updateTheme = useCallback((newTheme: 'light' | 'dark') => {
      const validTheme = newTheme === 'dark' ? 'dark' : 'light';
      setTheme(validTheme);
      applyTheme(validTheme);

      if (token && user) {
        fetch('/api/users/me/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ theme: validTheme })
        })
        .then(response => {
          if (!response.ok) { throw new Error(`API responded with status: ${response.status}`); }
          return response.json();
        })
        .catch(err => {
          console.error('[AuthContext] Error saving theme to API:', err);
        });
      }
  }, [applyTheme, token, user]);

  // Función para actualizar datos del usuario en el contexto y localStorage
  const updateUserContext = useCallback((updatedUserData: Partial<User>) => {
      setUser(prevUser => {
          if (!prevUser) return null;
          const newUser = { ...prevUser, ...updatedUserData };
          localStorage.setItem('authUser', JSON.stringify(newUser));
          console.log('[AuthContext] Saving updated user to localStorage (updateUserContext):', newUser); // Log para depurar
          return newUser;
      });
  }, []);


  const value = {
    token,
    user,
    isAuthenticated: !!token,
    isLoading,
    permisos: user?.permisos || [],
    theme,
    login,
    logout,
    updateTheme,
    updateUserContext,
  };

  if (isLoading) {
    return <div>Cargando sesión...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};