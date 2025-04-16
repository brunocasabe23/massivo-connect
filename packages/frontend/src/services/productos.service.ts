import axios from 'axios';
import { API_URL } from '../config';

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria: string;
  subcategoria?: string;
  proveedor_id: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface CreateProductoDTO {
  nombre: string;
  descripcion?: string;
  categoria: string;
  subcategoria?: string;
  proveedor_id: number;
}

export const ProductosService = {
  async getAll() {
    const response = await axios.get<Producto[]>(`${API_URL}/productos`);
    return response.data;
  },

  async getById(id: number) {
    const response = await axios.get<Producto>(`${API_URL}/productos/${id}`);
    return response.data;
  },

  async getByProveedor(proveedorId: number) {
    const response = await axios.get<Producto[]>(`${API_URL}/productos/proveedor/${proveedorId}`);
    return response.data;
  },

  async create(producto: CreateProductoDTO) {
    const response = await axios.post<Producto>(`${API_URL}/productos`, producto);
    return response.data;
  },

  async update(id: number, producto: Partial<CreateProductoDTO>) {
    const response = await axios.put<Producto>(`${API_URL}/productos/${id}`, producto);
    return response.data;
  },

  async delete(id: number) {
    await axios.delete(`${API_URL}/productos/${id}`);
  },

  async getCategorias() {
    const response = await axios.get(`${API_URL}/productos/categorias`);
    return response.data;
  }
}; 