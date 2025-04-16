import { callApi } from './api';
import { formatRelativeTime, generateInitials, formatDate } from '@/utils/date-utils';

// Interfaces para los datos del dashboard
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  totalRoles: number;
  totalPermissions: number;
  loginActivity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  avatar?: string;
  initials: string;
}

export interface Role {
  id: number;
  name: string;
  users: number;
  permissions: number;
  color: string;
}

export interface RecentActivity {
  id: number;
  user: string;
  action: string;
  target: string;
  description?: string;
  time: string;
  exactDate?: string; // Fecha exacta para mostrar en tooltip
  timestamp?: string; // Timestamp original para ordenar
  initials: string;
  entityType?: string;
  actionType?: string;
}

// Función para obtener las estadísticas del dashboard
export async function getAdminDashboardStats(): Promise<DashboardStats> {
  return await callApi('/dashboard/admin/stats');
}

// Función para obtener los usuarios recientes
export async function getRecentUsers(): Promise<User[]> {
  const users = await callApi('/dashboard/admin/recent-users');

  // Procesar los datos para asegurar que tengan el formato correcto
  return users.map((user: any) => ({
    id: user.id.toString(),
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'Usuario',
    status: user.status || 'Activo',
    lastLogin: user.lastLogin ? formatRelativeTime(user.lastLogin) : 'Desconocido',
    avatar: user.avatar || '',
    initials: user.initials || generateInitials(user.name)
  }));
}

// Función para obtener los roles con estadísticas
export async function getRolesWithStats(): Promise<Role[]> {
  const roles = await callApi('/dashboard/admin/roles-stats');

  // Asignar colores a los roles si no vienen del backend
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-purple-500",
    "bg-amber-500", "bg-slate-500", "bg-pink-500", "bg-indigo-500"
  ];

  return roles.map((role: any, index: number) => ({
    id: role.id,
    name: role.name || '',
    users: role.users || 0,
    permissions: role.permissions || 0,
    color: role.color || colors[index % colors.length]
  }));
}

// Función para obtener la actividad reciente
export async function getRecentActivity(): Promise<RecentActivity[]> {
  const activities = await callApi('/dashboard/admin/recent-activity');

  return activities.map((activity: any) => ({
    id: activity.id,
    user: activity.user || 'Sistema',
    action: activity.action || '',
    target: activity.target || '',
    time: activity.time || formatRelativeTime(activity.timestamp), // Usar timestamp del backend
    exactDate: activity.timestamp ? formatDate(activity.timestamp) : 'Desconocido', // Formatear fecha exacta
    initials: activity.initials || generateInitials(activity.user)
  }));
}

// Función para cargar todos los datos del dashboard en paralelo
export async function loadAllDashboardData() {
  const [stats, users, roles, activities] = await Promise.all([
    getAdminDashboardStats(),
    getRecentUsers(),
    getRolesWithStats(),
    getRecentActivity()
  ]);

  return { stats, users, roles, activities };
}
