import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, ListChecks, Clock, Search, Filter, FileText, Loader2, RefreshCw } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PurchaseOrder, PurchaseOrderFilters, getUserPurchaseOrders, getUserOrderStats } from '@/services/orders.service';
import { useToast } from "@/hooks/use-toast";

const UserDashboardPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    aprobadas: 0,
    pendientes: 0,
    recientes: 0
  });

  // Estados para los filtros
  const [filters, setFilters] = useState<PurchaseOrderFilters>({
    estado: undefined,
    searchTerm: ''
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

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

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyFilters();
  }, [filters, orders]);

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

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  // Función para obtener el color de la insignia según el estado
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Nueva':
        return 'bg-blue-100 text-blue-800';
      case 'EnRevision':
        return 'bg-amber-100 text-amber-800';
      case 'Aprobada':
        return 'bg-green-100 text-green-800';
      case 'Rechazada':
        return 'bg-red-100 text-red-800';
      case 'Cerrada':
        return 'bg-slate-100 text-slate-800';
      case 'CierreSolicitado':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Función para formatear el estado para mostrar
  const formatStatus = (status: string) => {
    switch (status) {
      case 'EnRevision':
        return 'En Revisión';
      case 'CierreSolicitado':
        return 'Cierre Solicitado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold text-slate-800">Mi Panel</h1>
        <p className="text-slate-500">Resumen de tus actividades de compra.</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-slate-500">
              <ShoppingCart className="mr-2 h-4 w-4 text-blue-500" /> Mis Compras Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recientes}</div>
            <p className="text-xs text-slate-500 mt-1">Órdenes en los últimos 30 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-slate-500">
               <ListChecks className="mr-2 h-4 w-4 text-green-500" /> Compras Aprobadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aprobadas}</div>
             <p className="text-xs text-slate-500 mt-1">Total histórico</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-slate-500">
               <Clock className="mr-2 h-4 w-4 text-orange-500" /> Compras Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
             <p className="text-xs text-slate-500 mt-1">Esperando aprobación</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de órdenes de compra */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
          <div className="relative w-full md:w-80 mb-4 md:mb-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar órdenes..."
              className="pl-10 w-full"
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={filters.estado || 'all'}
              onValueChange={(value) => handleFilterChange('estado', value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Nueva">Nueva</SelectItem>
                <SelectItem value="EnRevision">En Revisión</SelectItem>
                <SelectItem value="Aprobada">Aprobada</SelectItem>
                <SelectItem value="Rechazada">Rechazada</SelectItem>
                <SelectItem value="CierreSolicitado">Cierre Solicitado</SelectItem>
                <SelectItem value="Cerrada">Cerrada</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => loadData()}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Actualizar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando órdenes...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">No se encontraron órdenes de compra.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Código Presupuestal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.descripcion}</TableCell>
                    <TableCell>${order.monto.toLocaleString('es-MX')}</TableCell>
                    <TableCell>{order.proveedor || '-'}</TableCell>
                    <TableCell>{order.codigo_presupuestal || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(order.estado)}>
                        {formatStatus(order.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(order.fecha_creacion)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboardPage;