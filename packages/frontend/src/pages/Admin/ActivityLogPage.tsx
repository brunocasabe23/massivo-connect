import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { callApi } from "@/services/api";
import { RecentActivity } from "@/services/dashboard.service";

// Definir tipos para los filtros
interface ActivityFilters {
  searchTerm: string;
  entityType: string;
  actionType: string;
  dateRange: string;
}

export default function ActivityLogPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<RecentActivity[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Estados para los filtros
  const [filters, setFilters] = useState<ActivityFilters>({
    searchTerm: "",
    entityType: "all",
    actionType: "all",
    dateRange: "all"
  });

  // Opciones para los filtros
  const entityTypes = [
    { value: "all", label: "Todos los tipos" },
    { value: "usuario", label: "Usuario" },
    { value: "rol", label: "Rol" },
    { value: "permiso", label: "Permiso" },
    { value: "codigo_presupuestal", label: "Código Presupuestal" }
  ];

  const actionTypes = [
    { value: "all", label: "Todas las acciones" },
    { value: "crear", label: "Crear" },
    { value: "actualizar", label: "Actualizar" },
    { value: "eliminar", label: "Eliminar" },
    { value: "inicio_sesion", label: "Inicio de sesión" }
  ];

  const dateRanges = [
    { value: "all", label: "Todo el tiempo" },
    { value: "today", label: "Hoy" },
    { value: "week", label: "Esta semana" },
    { value: "month", label: "Este mes" }
  ];

  // Función para cargar las actividades
  const fetchActivities = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // En una implementación real, podríamos pasar los filtros como parámetros a la API
      const response = await callApi('/dashboard/admin/recent-activity?limit=50');
      setActivities(response);
      applyFilters(response, filters);

      if (isRefresh) {
        toast({
          title: "Datos actualizados",
          description: "El registro de actividades se ha actualizado correctamente.",
        });
      }
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      toast({
        title: "Error al cargar datos",
        description: "No se pudieron cargar las actividades.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar actividades al montar el componente
  useEffect(() => {
    fetchActivities();
  }, []);

  // Función para aplicar filtros
  const applyFilters = (data: RecentActivity[], currentFilters: ActivityFilters) => {
    let filtered = [...data];

    // Filtrar por término de búsqueda
    if (currentFilters.searchTerm) {
      const searchTerm = currentFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.user.toLowerCase().includes(searchTerm) ||
        activity.action.toLowerCase().includes(searchTerm) ||
        activity.target.toLowerCase().includes(searchTerm) ||
        (activity.description && activity.description.toLowerCase().includes(searchTerm))
      );
    }

    // Filtrar por tipo de entidad
    if (currentFilters.entityType !== 'all') {
      filtered = filtered.filter(activity =>
        activity.entityType === currentFilters.entityType
      );
    }

    // Filtrar por tipo de acción
    if (currentFilters.actionType !== 'all') {
      filtered = filtered.filter(activity =>
        activity.actionType && activity.actionType.includes(currentFilters.actionType)
      );
    }

    // Filtrar por rango de fecha
    if (currentFilters.dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (currentFilters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Aquí asumimos que tenemos una fecha real en cada actividad
      // En una implementación real, necesitaríamos convertir el string "Hace X tiempo" a una fecha real
      // Por ahora, este filtro no funcionará correctamente con los datos de ejemplo
      filtered = filtered;
    }

    setFilteredActivities(filtered);
    setCurrentPage(1); // Resetear a la primera página cuando se aplican filtros
  };

  // Efecto para aplicar filtros cuando cambian
  useEffect(() => {
    applyFilters(activities, filters);
  }, [filters, activities]);

  // Función para manejar cambios en los filtros
  const handleFilterChange = (key: keyof ActivityFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Calcular paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredActivities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  // Función para cambiar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Renderizar indicador de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-slate-500">Cargando registro de actividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Registro de Actividades</h1>
          <p className="text-slate-500">Historial de acciones realizadas en el sistema</p>
        </div>
        <Button
          onClick={() => fetchActivities(true)}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Actualizando...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar datos</span>
            </>
          )}
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <Filter className="mr-2 h-5 w-5 text-[#005291]" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Buscar actividades..."
                  className="pl-10"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Entidad</label>
              <Select
                value={filters.entityType}
                onValueChange={(value) => handleFilterChange('entityType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Acción</label>
              <Select
                value={filters.actionType}
                onValueChange={(value) => handleFilterChange('actionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar acción" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => handleFilterChange('dateRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de actividades */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <Activity className="mr-2 h-5 w-5 text-[#005291]" />
            Historial de Actividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No se encontraron actividades que coincidan con los filtros aplicados
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="w-[180px]">Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead className="w-[180px]">Fecha</TableHead>
                      <TableHead className="w-[120px]">Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-[#005291] text-white text-xs">
                              {activity.initials}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                          {activity.user}
                        </TableCell>
                        <TableCell>
                          <span>{activity.action}</span>
                          {activity.target && (
                            <span className="font-medium"> {activity.target}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 flex items-center" title={activity.exactDate}>
                          <Clock className="mr-1 h-3 w-3" />
                          {activity.time}
                        </TableCell>
                        <TableCell>
                          {activity.entityType && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5 rounded-full bg-slate-50 text-slate-600 border-slate-200">
                              {activity.entityType.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-slate-500">
                  Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredActivities.length)} de {filteredActivities.length} actividades
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                    // Mostrar máximo 5 páginas
                    let pageNumber = currentPage;
                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }

                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => paginate(pageNumber)}
                        className={currentPage === pageNumber ? "bg-[#005291]" : ""}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
