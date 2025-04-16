import { callApi } from './api';

// Interfaces para órdenes de compra
export interface PurchaseOrder {
  id: number;
  descripcion: string;
  monto: number;
  proveedor: string | null;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  codigo_presupuestal?: string; // Nombre del código presupuestal
  cp_id: number; // ID del código presupuestal
}

export interface PurchaseOrderFilters {
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  searchTerm?: string;
}

// Función para obtener las órdenes de compra del usuario actual
export async function getUserPurchaseOrders(filters: PurchaseOrderFilters = {}): Promise<PurchaseOrder[]> {
  // Construir parámetros de consulta basados en los filtros
  const queryParams = new URLSearchParams();
  
  if (filters.estado) {
    queryParams.append('estado', filters.estado);
  }
  
  if (filters.fechaDesde) {
    queryParams.append('fechaDesde', filters.fechaDesde);
  }
  
  if (filters.fechaHasta) {
    queryParams.append('fechaHasta', filters.fechaHasta);
  }
  
  if (filters.searchTerm) {
    queryParams.append('search', filters.searchTerm);
  }
  
  const queryString = queryParams.toString();
  const endpoint = `/orders/me${queryString ? `?${queryString}` : ''}`;
  
  return await callApi(endpoint);
}

// Función para obtener estadísticas de órdenes de compra del usuario
export async function getUserOrderStats(): Promise<{
  total: number;
  aprobadas: number;
  pendientes: number;
  recientes: number;
}> {
  return await callApi('/orders/me/stats');
}
