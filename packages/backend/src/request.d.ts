import { Request } from 'express';

// Exportar la interfaz extendida en lugar de usar declare global
export interface AuthenticatedRequest extends Request {
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

// No es necesario exportar un tipo vacío ahora