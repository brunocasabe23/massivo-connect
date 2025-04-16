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
