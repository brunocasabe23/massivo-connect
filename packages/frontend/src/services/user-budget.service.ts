// packages/frontend/src/services/user-budget.service.ts
import { callApi } from './api';

export interface UserBudgetCode {
  id: number;
  nombre: string;
  descripcion: string;
  monto_presupuesto: number;
  monto_disponible: number;
  fecha_inicio_vigencia: string;
  fecha_fin_vigencia: string;
  estado: 'Activo' | 'Agotado' | 'Vencido';
}

export interface UserArea {
  id: number;
  nombre: string;
  descripcion: string;
  departamento: string;
}

/**
 * Obtiene los códigos presupuestales disponibles para el usuario actual
 * @param areaId ID del área para filtrar los códigos presupuestales (opcional)
 * @returns Lista de códigos presupuestales
 */
export async function getUserBudgetCodes(areaId?: number): Promise<UserBudgetCode[]> {
  const url = areaId ? `/me/budget-codes?areaId=${areaId}` : '/me/budget-codes';
  return await callApi(url);
}

/**
 * Obtiene las áreas disponibles para el usuario actual
 * @returns Lista de áreas
 */
export async function getUserAreas(): Promise<UserArea[]> {
  return await callApi('/me/areas');
}
