import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Trash,
  Edit,
  Eye,
  Download, // Mantener por si se usa en el futuro
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom"; // Usar Link de react-router-dom
import { callApi } from "@/services/api";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { OrderDetailDialog } from "@/components/orders/OrderDetailDialog";

// Interfaz para Orden de Compra (adaptada del backend)
interface OrdenCompra {
  id: number;
  numero?: string; // Usaremos ID como número por ahora
  fecha_creacion: string;
  fecha_entrega?: string; // Añadido
  estado: string;
  proveedor?: string;
  monto: number;
  moneda?: string;
  // items: number; // No disponible directamente, se podría calcular
  // departamento: string; // No disponible directamente, se podría obtener del usuario/CP
  solicitante?: string; // Viene del JOIN
  // aprobador?: string; // No disponible directamente
  prioridad?: "Alta" | "Media" | "Baja" | string; // Añadido
  producto?: string; // Añadido
  codigo_presupuestal?: string; // Viene del JOIN
  descripcion?: string; // Añadido para detalles
  cantidad?: number; // Añadido para detalles
  precio_unitario?: number; // Añadido para detalles
  laboratorio?: string; // Añadido para detalles
  observaciones?: string; // Añadido para detalles
}

// Interfaz para el resumen del dashboard
interface PurchaseCenterSummary {
  totalOrdenes: number;
  ordenesCompletadas: number;
  ordenesPendientes: number;
  ordenesEnProceso: number;
  montoTotal: number;
  tasaAprobacion: number;
  tendenciaMensual: number; // Placeholder
}

// Interfaz para próximas entregas
interface UpcomingDelivery extends OrdenCompra {
  // Hereda campos de OrdenCompra
}

export default function CentroComprasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todas");
  const [isDetalleDialogOpen, setIsDetalleDialogOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null);
  const [orders, setOrders] = useState<OrdenCompra[]>([]);
  const [summary, setSummary] = useState<PurchaseCenterSummary | null>(null);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<UpcomingDelivery[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      // Usar el endpoint getAllOrders que ya tenemos
      const data = await callApi('/orders');
      setOrders(data);
    } catch (error) {
      console.error("Error al obtener órdenes de compra:", error);
      toast({ title: "Error", description: "No se pudieron cargar las órdenes.", variant: "destructive" });
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const data = await callApi('/dashboard/purchase-center/summary');
      setSummary(data);
    } catch (error) {
      console.error("Error al obtener resumen del centro de compras:", error);
      toast({ title: "Error", description: "No se pudo cargar el resumen.", variant: "destructive" });
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchUpcomingDeliveries = async () => {
    setLoadingUpcoming(true);
    try {
      const data = await callApi('/dashboard/purchase-center/upcoming?limit=3'); // Limitar a 3
      setUpcomingDeliveries(data);
    } catch (error) {
      console.error("Error al obtener próximas entregas:", error);
      toast({ title: "Error", description: "No se pudieron cargar las próximas entregas.", variant: "destructive" });
      setUpcomingDeliveries([]);
    } finally {
      setLoadingUpcoming(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSummary();
    fetchUpcomingDeliveries();
  }, []);

  // Filtrar órdenes según la pestaña activa y el término de búsqueda
  const filteredOrdenes = useMemo(() => {
    return orders
      .filter((orden) => {
        if (activeTab === "todas") return true;
        const estadoLower = orden.estado.toLowerCase();
        if (activeTab === "pendientes") return ['nueva', 'enrevision', 'pendiente de aprobación'].includes(estadoLower); // Ajustar estados
        if (activeTab === "proceso") return ['en proceso'].includes(estadoLower);
        if (activeTab === "completadas") return ['completada', 'aprobada'].includes(estadoLower); // Considerar Aprobada como Completada aquí?
        if (activeTab === "rechazadas") return ['rechazada'].includes(estadoLower);
        return true;
      })
      .filter(
        (orden) =>
          orden.id.toString().includes(searchTerm) ||
          (orden.proveedor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (orden.solicitante || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (orden.codigo_presupuestal || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (orden.producto || "").toLowerCase().includes(searchTerm.toLowerCase()) // Añadir búsqueda por producto si existe
      );
  }, [orders, activeTab, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completada": case "aprobada": return "bg-green-100 text-green-800";
      case "en proceso": return "bg-blue-100 text-blue-800";
      case "pendiente de aprobación": case "nueva": case "enrevision": return "bg-amber-100 text-amber-800";
      case "rechazada": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "alta": return "bg-red-100 text-red-800";
      case "media": return "bg-amber-100 text-amber-800";
      case "baja": return "bg-green-100 text-green-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completada": case "aprobada": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "en proceso": return <Clock className="h-4 w-4 text-blue-600" />;
      case "pendiente de aprobación": case "nueva": case "enrevision": return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "rechazada": return <XCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const handleVerDetalle = (orden: OrdenCompra) => {
    // Obtener detalles completos si es necesario (o usar los datos ya cargados)
    callApi(`/orders/${orden.id}`)
      .then(detailedOrder => {
        setSelectedOrden(detailedOrder);
        setIsDetalleDialogOpen(true);
      })
      .catch(error => {
        console.error("Error fetching order details:", error);
        toast({ title: "Error", description: "No se pudieron cargar los detalles.", variant: "destructive" });
        // Mostrar detalles básicos si falla la carga completa
        setSelectedOrden(orden);
        setIsDetalleDialogOpen(true);
      });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return 'Fecha inválida';
    }
  }
  const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      try {
          // Asumir que la fecha viene como YYYY-MM-DD
          const [year, month, day] = dateString.split('-');
          if (!year || !month || !day) throw new Error("Invalid date format");
          return `${day}/${month}/${year}`;
      } catch {
          // Intentar formato completo si falla el simple
          try {
              return format(new Date(dateString), 'dd/MM/yyyy');
          } catch {
              return 'Fecha inválida';
          }
      }
  }


  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold text-slate-800">Centro de Unidad de Compras</h1>
        <p className="text-slate-500">Gestión centralizada de órdenes de compra</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="dashboard-card animate-pulse"><CardHeader className="pb-2"><div className="h-4 bg-slate-200 rounded w-3/4"></div></CardHeader><CardContent><div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div><div className="h-3 bg-slate-200 rounded w-full"></div></CardContent></Card>
          ))
        ) : summary ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="dashboard-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-sm font-medium text-slate-500">
                    <ShoppingCart className="mr-2 h-4 w-4 text-blue-500" />
                    Total de Órdenes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalOrdenes}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge className="bg-green-100 text-green-800">{summary.ordenesCompletadas} completadas</Badge>
                    <Badge className="bg-amber-100 text-amber-800">{summary.ordenesPendientes} pendientes</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card className="dashboard-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-sm font-medium text-slate-500">
                    <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                    Monto Total (USD) {/* Asumir USD o mostrar moneda */}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${summary.montoTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Valor total de órdenes</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <Card className="dashboard-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-sm font-medium text-slate-500">
                    <TrendingUp className="mr-2 h-4 w-4 text-amber-500" />
                    Tasa de Aprobación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.tasaAprobacion}%</div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${summary.tasaAprobacion}%` }}></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
              <Card className="dashboard-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-sm font-medium text-slate-500">
                    <Calendar className="mr-2 h-4 w-4 text-purple-500" />
                    Próximas Entregas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.ordenesEnProceso}</div>
                  <p className="text-xs text-slate-500 mt-1">Órdenes en proceso</p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : (
          <p className="col-span-4 text-center text-slate-500">No se pudo cargar el resumen.</p>
        )}
      </div>

      {/* Próximas entregas */}
      {loadingUpcoming ? (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="dashboard-card animate-pulse"><CardHeader className="pb-2"><div className="h-4 bg-slate-200 rounded w-3/4"></div></CardHeader><CardContent><div className="h-6 bg-slate-200 rounded w-1/2 mb-2"></div><div className="h-4 bg-slate-200 rounded w-full mb-4"></div><div className="flex justify-between"><div className="h-4 bg-slate-200 rounded w-1/4"></div><div className="h-4 bg-slate-200 rounded w-1/4"></div></div></CardContent></Card>
            ))}
         </div>
      ) : upcomingDeliveries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {upcomingDeliveries.map((orden, index) => (
            <motion.div
              key={orden.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="dashboard-card">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium">Próxima Entrega</CardTitle>
                    <Badge className={getStatusColor(orden.estado)}>{orden.estado}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-lg font-bold">#{orden.id}</p> {/* Usar ID */}
                      <p className="text-sm text-slate-500">{orden.proveedor || '-'}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Fecha de entrega</p>
                        <p className="text-sm">{formatDate(orden.fecha_entrega)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Monto</p>
                        <p className="text-sm font-bold">
                          {orden.moneda || '$'}
                          {orden.monto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className={getPriorityColor(orden.prioridad)}>{orden.prioridad || 'Media'}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#005291]"
                        onClick={() => handleVerDetalle(orden)}
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex-1"></div>
        {/* TODO: Crear la ruta /compras/nueva o similar */}
        <Button className="mt-4 md:mt-0 bg-[#005291]" asChild>
          <Link to="/compras"> {/* Temporalmente enlaza a la página de gestión */}
            <Plus className="mr-2 h-4 w-4" />
            Nueva Orden de Compra
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="todas" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="proceso">En Proceso</TabsTrigger>
          <TabsTrigger value="completadas">Completadas</TabsTrigger>
          <TabsTrigger value="rechazadas">Rechazadas</TabsTrigger>
        </TabsList>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
            <div className="relative w-full md:w-80 mb-4 md:mb-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Buscar órdenes..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loadingOrders ? <div className="p-10 text-center text-slate-500">Cargando órdenes...</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrdenes.map((orden) => (
                    <TableRow key={orden.id}>
                      <TableCell className="font-medium">#{orden.id}</TableCell>
                      <TableCell>{formatDateTime(orden.fecha_creacion)}</TableCell>
                      <TableCell>{orden.proveedor || '-'}</TableCell>
                      <TableCell>{orden.solicitante || '-'}</TableCell>
                      <TableCell>
                        {orden.moneda || '$'}
                        {orden.monto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(orden.prioridad)}>{orden.prioridad || 'Media'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(orden.estado)}
                          <Badge className={getStatusColor(orden.estado)}>{orden.estado}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleVerDetalle(orden)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            {/* TODO: Enlazar a página de edición si existe */}
                            {/* <DropdownMenuItem asChild>
                              <Link href={`/dashboard/centro-compras/${orden.id}/editar`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem> */}
                            {/* TODO: Implementar acciones de aprobar/rechazar si se manejan aquí */}
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Descargar PDF
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem className="text-red-500">
                              <Trash className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem> */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
             { !loadingOrders && filteredOrdenes.length === 0 && (
                <div className="p-10 text-center text-slate-500">No se encontraron órdenes de compra.</div>
            )}
          </div>
        </div>
      </Tabs>

      {/* Componente de detalle de orden */}
      <OrderDetailDialog
        order={selectedOrden}
        open={isDetalleDialogOpen}
        onOpenChange={setIsDetalleDialogOpen}
        onOrderUpdated={fetchOrders}
      />
    </div>
  );
}