// packages/backend/src/types/request.ts
import { Request } from 'express';

// Interfaz para extender Request con información del usuario autenticado
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email?: string;
    nombre?: string;
    area_id?: number | null;
    permisos?: string[];
  };
  body?: any; // Añadir propiedad body
}
