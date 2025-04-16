import { callApi } from './api';

export interface Area {
  id: number;
  nombre: string;
  descripcion: string;
  departamento: string;
  responsable: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  empleados?: number;
  presupuesto_inicial?: string | number;
}

export async function getAreas(): Promise<Area[]> {
  return await callApi('/areas');
}

export async function createArea(data: Partial<Area>): Promise<Area> {
  return await callApi('/areas', {
    method: 'POST',
    data,
  });
}

export async function updateArea(id: number, data: Partial<Area>): Promise<Area> {
  return await callApi(`/areas/${id}`, {
    method: 'PUT',
    data,
  });
}

export async function deleteArea(id: number): Promise<void> {
  return await callApi(`/areas/${id}`, {
    method: 'DELETE',
  });
}

// Asociar un Código Presupuestal a un Área
export async function associateCodeToArea(areaId: number, cpId: number): Promise<void> {
  // Llama a POST /api/areas/:areaId/budget-codes
  return await callApi(`/areas/${areaId}/budget-codes`, {
    method: 'POST',
    data: { cp_id: cpId }, // Enviar cp_id en el cuerpo
  });
}

// Desasociar un Código Presupuestal de un Área
export async function dissociateCodeFromArea(areaId: number, cpId: number): Promise<void> {
  // Llama a DELETE /api/areas/:areaId/budget-codes/:cpId
  return await callApi(`/areas/${areaId}/budget-codes/${cpId}`, {
    method: 'DELETE',
  });
}