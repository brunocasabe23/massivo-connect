// packages/frontend/src/types/admin.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Viene de r.nombre
  rol_id?: number; // Añadido desde la API (ur.rol_id)
  status: string; // Viene de u.estado
  createdAt: string; // Viene de u.fecha_creacion
  avatar?: string; // Viene de u.avatar_url
  initials?: string; // Generado en frontend
  area_id?: number | null; // Añadido desde la API (u.area_id)
  area_nombre?: string | null; // Añadido desde la API (a.nombre)
}

export interface Role {
  id: string;
  name: string;
  permissions: number; // Asumiendo que esto viene de la API (COUNT en getAllRoles)
  description?: string; // Añadido desde getAllRoles
  createdAt?: string; // Añadido desde getAllRoles
  users?: number; // Añadido desde getAllRoles
}

export interface Permission {
  id: string;
  name: string; // Corresponde a 'clave' en la BD
  category: string; // Inferido en el frontend/backend
  description: string;
}

export interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

export interface Area {
  id: number;
  nombre: string;
}