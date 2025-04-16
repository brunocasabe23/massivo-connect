// Declaración de módulo para extender tipos globales de Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        // Añadir otros campos del payload del token si existen (ej. email, nombre)
        // email?: string;
        // nombre?: string;
        area_id?: number | null; // area_id puede ser null si no está asignado
        // Podríamos añadir permisos aquí también si los cargamos en el middleware
        // permisos?: string[];
      };
    }
  }
}

// Exportar un tipo vacío para asegurar que el archivo sea tratado como un módulo
export {};