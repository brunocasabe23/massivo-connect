// packages/frontend/src/services/suppliers.service.ts
import { callApi } from './api';

// Interfaces para proveedores
export interface Supplier {
  id: number;
  nombre: string;
  rfc: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  contacto_email: string | null;
  categoria: string | null;
  estado: string;
  notas: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface SupplierFilters {
  estado?: string;
  categoria?: string;
  searchTerm?: string;
}

// Función para obtener todos los proveedores
export const getAllSuppliers = async (filters?: SupplierFilters): Promise<Supplier[]> => {
  const queryParams = new URLSearchParams();
  
  if (filters?.estado) {
    queryParams.append('estado', filters.estado);
  }
  
  if (filters?.categoria) {
    queryParams.append('categoria', filters.categoria);
  }
  
  if (filters?.searchTerm) {
    queryParams.append('searchTerm', filters.searchTerm);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return callApi(`/suppliers${queryString}`);
};

// Función para obtener un proveedor por ID
export const getSupplierById = async (id: number): Promise<Supplier> => {
  return callApi(`/suppliers/${id}`);
};

// Función para crear un nuevo proveedor
export const createSupplier = async (supplierData: Partial<Supplier>): Promise<Supplier> => {
  return callApi('/suppliers', { method: 'POST', data: supplierData });
};

// Función para actualizar un proveedor existente
export const updateSupplier = async (id: number, supplierData: Partial<Supplier>): Promise<Supplier> => {
  return callApi(`/suppliers/${id}`, { method: 'PUT', data: supplierData });
};

// Función para eliminar un proveedor
export const deleteSupplier = async (id: number): Promise<void> => {
  return callApi(`/suppliers/${id}`, { method: 'DELETE' });
};

// Función para obtener categorías de proveedores
export const getSupplierCategories = async (): Promise<string[]> => {
  return callApi('/suppliers/categories');
};
