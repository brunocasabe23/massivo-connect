import { callApi } from './api';

export interface Proveedor {
  id: number;
  nombre: string;
  rfc: string;
  direccion: string;
  contacto_nombre: string;
  telefono: string;
  email: string;
  sitio_web?: string;
  categorias?: string[];
  categoria?: string; // Campo original en la base de datos
  estado: string;
  logo_url?: string;
  calificacion?: string;
  notas_adicionales?: string;
  notas?: string; // Campo original en la base de datos
  fecha_creacion: string;
  fecha_actualizacion: string;
  ultima_compra?: string; // Para mostrar la fecha de la última compra
  producto_ids?: number[]; // Para manejar asociaciones
}

export const getProveedores = async (): Promise<Proveedor[]> => {
  const response = await callApi('/suppliers');
  return Array.isArray(response) ? response : [];
};

export const getProveedorById = async (id: number): Promise<Proveedor> => {
  const response = await callApi(`/suppliers/${id}`);
  return response.data;
};

export const createProveedor = async (data: FormData | Partial<Proveedor>): Promise<Proveedor> => {
  const isFormData = data instanceof FormData;

  const response = await callApi('/suppliers', {
    method: 'POST',
    ...(isFormData
      ? {
          body: data,
          headers: {} // Permitir que el navegador establezca el Content-Type correcto para FormData
        }
      : {
          data, // Para datos JSON regulares
          headers: { 'Content-Type': 'application/json' }
        }
    )
  });
  return response;
};

export const updateProveedor = async (id: number, data: Partial<Proveedor>): Promise<Proveedor> => {
  const response = await callApi(`/suppliers/${id}`, {
    method: 'PUT',
    data
  });
  return response;
};

export const deleteProveedor = async (id: number): Promise<void> => {
  await callApi(`/suppliers/${id}`, {
    method: 'DELETE',
  });
};