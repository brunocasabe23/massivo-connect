// Configuración básica para llamadas a la API

const API_BASE_URL = '/api'; // Usamos la ruta relativa gracias al proxy de Vite

interface ApiCallOptions extends RequestInit {
  data?: unknown; // Para enviar datos en el body
}

/**
 * Obtiene el token de autenticación desde localStorage.
 * @returns El token o null si no existe.
 */
const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Realiza una llamada a la API backend.
 * Maneja la serialización JSON y errores básicos de red/HTTP.
 * Incluye automáticamente el token de autenticación si existe.
 * @param endpoint - La ruta del endpoint (ej: '/auth/login')
 * @param options - Opciones de Fetch API (method, headers, data, etc.)
 * @returns Promise<any> - La respuesta JSON parseada
 * @throws Error - Si la respuesta no es OK o hay error de red
 */
export const callApi = async (endpoint: string, options: ApiCallOptions = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken(); 

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>, 
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`; 
  }
  
  // Crear config base sin data ni headers de options, ya que los manejamos explícitamente
  const { data, headers: optionHeaders, ...restOptions } = options;

  const config: RequestInit = {
    method: options.method || (data ? 'POST' : 'GET'), 
    headers: headers, 
    ...restOptions, // Usar el resto de las opciones pasadas
  };

  // Añadir body si se proporciona data
  if (data) {
    if (config.method && !['GET', 'HEAD'].includes(config.method.toUpperCase())) {
       config.body = JSON.stringify(data);
    } else if (!config.method) { // Si el método es implícito (POST por tener data)
       config.body = JSON.stringify(data);
    }
  }
  // No es necesario 'delete config.data' porque ya no está en restOptions

  try {
    const response = await fetch(url, config);

    const responseData = await response.json().catch(() => ({})); 

    if (!response.ok) {
      const errorMessage = responseData.message || response.statusText || `Error HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return responseData; 

  } catch (error) {
    console.error(`Error llamando a API ${endpoint}:`, error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Error desconocido en la llamada API');
    }
  }
};