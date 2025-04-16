// Interfaces para la gestión de usuarios

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  avatar?: string;
  initials?: string;
  rol_id?: number; // Añadir rol_id
  area_id?: number | null; // Añadir area_id
  area_nombre?: string | null; // Añadir area_nombre (opcional, si se usa)
}

export interface Role {
  id: string;
  name: string;
  permissions: number;
}

export interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

export interface UserFilters {
  role: string;
  status: string;
  searchTerm: string;
  activeTab: string;
}

// Añadir la interfaz Area si no existe en otro lugar
export interface Area {
  id: number;
  nombre: string;
}
