import { useState, useEffect } from 'react';
import { PurchaseOrder, PurchaseOrderFilters, getUserPurchaseOrders, getUserOrderStats } from '@/services/orders.service';
import { useToast } from '@/hooks/use-toast';

export interface OrderStats {
  total: number;
  aprobadas: number;
  pendientes: number;
  recientes: number;
}

export function useOrders() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    aprobadas: 0,
    pendientes: 0,
    recientes: 0
  });
  const [filters, setFilters] = useState<PurchaseOrderFilters>({
    estado: undefined,
    searchTerm: ''
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [filters, orders]);

  // Cargar órdenes de compra y estadísticas
  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar datos en paralelo
      const [ordersData, statsData] = await Promise.all([
        getUserPurchaseOrders(),
        getUserOrderStats()
      ]);

      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast({
        title: "Error al cargar datos",
        description: "No se pudieron cargar los datos de órdenes de compra.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para aplicar filtros
  const applyFilters = () => {
    let filtered = [...orders];

    // Filtrar por estado
    if (filters.estado) {
      filtered = filtered.filter(order => order.estado === filters.estado);
    }

    // Filtrar por término de búsqueda
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.descripcion.toLowerCase().includes(searchTerm) ||
        (order.proveedor && order.proveedor.toLowerCase().includes(searchTerm)) ||
        (order.codigo_presupuestal && order.codigo_presupuestal.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredOrders(filtered);
  };

  // Manejar cambios en los filtros
  const handleFilterChange = (key: keyof PurchaseOrderFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value // Usar undefined para el valor 'all'
    }));
  };

  return {
    loading,
    orders,
    filteredOrders,
    stats,
    filters,
    loadData,
    handleFilterChange
  };
}
