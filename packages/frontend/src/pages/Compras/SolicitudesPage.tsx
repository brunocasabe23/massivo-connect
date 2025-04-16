import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Filter, MoreHorizontal, FileText, Trash, Edit, Eye, Download } from "lucide-react"; // Added Download
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { callApi } from "@/services/api";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { OrderDetailDialog } from "@/components/orders/OrderDetailDialog";
import { getUserBudgetCodes, getUserAreas, UserBudgetCode, UserArea } from "@/services/user-budget.service";

// Interfaz para Orden de Compra
interface OrdenCompra {
  id: number;
  fecha_creacion: string;
  estado: string;
  laboratorio?: string;
  cp_id: number;
  codigo_presupuestal?: string;
  proveedor?: string;
  producto?: string;
  descripcion: string;
  cantidad?: number;
  moneda?: string;
  precio_unitario?: number;
  monto: number;
  observaciones?: string;
  solicitante?: string;
}

type OrdenCompraForm = Partial<Omit<OrdenCompra, 'id' | 'fecha_creacion' | 'codigo_presupuestal' | 'solicitante'>> & { estado?: string }; // Add estado here

// Renombrado de ComprasPage a SolicitudesPage
export default function SolicitudesPage() {
  const [orders, setOrders] = useState<OrdenCompra[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrdenCompra | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrdenCompra | null>(null);
  const [formData, setFormData] = useState<OrdenCompraForm>({ estado: 'Solicitado', moneda: 'USD' }); // Add default estado and moneda
  const [activeTab, setActiveTab] = useState("todas");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Datos para Selects (ejemplo, obtener de API si es necesario)
  const [codigosPresupuestales, setCodigosPresupuestales] = useState<UserBudgetCode[]>([]);
  const [proveedores, /* setProveedores */] = useState<string[]>(["TechSupplies Inc.", "Office Depot", "Microsoft", "Muebles Modernos", "Catering Deluxe"]);
  const [productos, /* setProductos */] = useState<string[]>(["Equipos de cómputo", "Material de oficina", "Licencias de software", "Mobiliario de oficina", "Servicios de catering"]);
  const [areas, setAreas] = useState<UserArea[]>([]); // State for areas from DB

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Siempre llamar a /orders, RLS se encarga de filtrar
      const data = await callApi('/orders');
      setOrders(data);
    } catch (error) {
      console.error("Error al obtener órdenes de compra:", error);
      toast({ title: "Error", description: "No se pudieron cargar las órdenes.", variant: "destructive" });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

   const fetchCodigosPresupuestales = async () => {
    try {
      const data = await getUserBudgetCodes();
      console.log("Códigos presupuestales obtenidos:", data);
      setCodigosPresupuestales(data);
    } catch (error) {
      console.error("Error fetching budget codes:", error);
      toast({ title: "Error", description: "No se pudieron cargar los códigos presupuestales.", variant: "destructive" });
    }
  };

  // Fetch areas from the backend
  const fetchAreas = async () => {
    try {
      const data = await getUserAreas();
      console.log("Áreas obtenidas:", data);
      setAreas(data);
    } catch (error) {
      console.error("Error fetching areas:", error);
      toast({ title: "Error", description: "No se pudieron cargar las áreas/unidades.", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCodigosPresupuestales();
    fetchAreas(); // Fetch areas on component mount
  }, []);

  const handleSave = async () => {
    try {
       const montoTotal = (formData.cantidad ?? 0) * (formData.precio_unitario ?? 0);
       const dataToSave = { ...formData, monto: montoTotal };

      if (editingOrder) {
        await callApi(`/orders/${editingOrder.id}`, { method: 'PUT', data: dataToSave });
        toast({ title: "Éxito", description: "Orden de compra actualizada." });
      } else {
        await callApi('/orders', { method: 'POST', data: dataToSave });
        toast({ title: "Éxito", description: "Solicitud de compra creada." });
      }
      setIsFormDialogOpen(false);
      setEditingOrder(null);
      setFormData({ estado: 'Solicitado', moneda: 'USD' }); // Reset with default estado and moneda
      fetchOrders();
    } catch (error) {
      console.error(`Error al ${editingOrder ? 'editar' : 'crear'} orden:`, error);
      toast({ title: "Error", description: `No se pudo ${editingOrder ? 'editar' : 'crear'} la orden.`, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar esta orden de compra?")) return;
    try {
      await callApi(`/orders/${id}`, { method: 'DELETE' });
      toast({ title: "Éxito", description: "Orden de compra eliminada." });
      fetchOrders();
    } catch (error) {
      console.error("Error al eliminar orden:", error);
      toast({ title: "Error", description: "No se pudo eliminar la orden.", variant: "destructive" });
    }
  };

   // Unified handleChange for all input types - Moved outside handleUpdateStatus
   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
     const { name, value, type } = e.target;
     const target = e.target as HTMLInputElement; // Type assertion for files property

     if (type === 'file') {
       setFormData(prev => ({
         ...prev,
         [name]: target.files ? Array.from(target.files) : [] // Handle files, ensure it's an array
       }));
     } else if (type === 'number') {
        // Handle number inputs, ensuring conversion or default value
        const numValue = name === 'cantidad' ? parseInt(value) || 1 : parseFloat(value) || 0;
        setFormData(prev => ({ ...prev, [name]: numValue }));
     }
      else {
       // Handle text and textarea inputs
       setFormData(prev => ({ ...prev, [name]: value }));
     }
   };

   // Eliminada función handleUpdateStatus ya que la lógica de actualización de estado
   // probablemente se maneja dentro de OrderDetailDialog o no es necesaria aquí.
   /*
   const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await callApi(`/orders/${id}/status`, { method: 'PUT', data: { estado: newStatus } });
      toast({ title: "Éxito", description: `Estado actualizado a ${newStatus}.` });
      setIsDetailDialogOpen(false);
      fetchOrders();
    } catch (error) {
      console.error(`Error al actualizar estado a ${newStatus}:`, error);
      toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
    }
  };
   */
  const openNewDialog = () => {
    setEditingOrder(null);
    setFormData({ estado: 'Solicitado', moneda: 'USD', cantidad: 1 }); // Default estado should be Solicitado
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (order: OrdenCompra) => {
    setEditingOrder(order);
    setFormData({
        ...order,
        cantidad: Number(order.cantidad || 1),
        precio_unitario: Number(order.precio_unitario || 0),
        monto: Number(order.monto || 0),
    });
    setIsFormDialogOpen(true);
  };

  const openDetailDialog = (order: OrdenCompra) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (activeTab === "todas") return true;
        const estadoLower = order.estado.toLowerCase();
        if (activeTab === "pendientes") return ['nueva', 'enrevision', 'pendiente'].includes(estadoLower);
        if (activeTab === "aprobadas") return ['aprobada', 'aprobado'].includes(estadoLower);
        if (activeTab === "rechazadas") return ['rechazada', 'rechazado'].includes(estadoLower);
        return true;
      })
      .filter(
        (order) =>
          order.id.toString().includes(searchTerm) ||
          (order.producto || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.proveedor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.solicitante || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.codigo_presupuestal || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [orders, activeTab, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "aprobada": case "aprobado": return "bg-green-100 text-green-800";
      case "pendiente": case "nueva": case "enrevision": return "bg-amber-100 text-amber-800";
      case "rechazada": case "rechazado": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const formatDateTime = (dateString: string) => {
      try {
          return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
      } catch {
          return 'Fecha inválida';
      }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          {/* Título actualizado a Solicitudes */}
          <h1 className="text-2xl font-bold text-slate-800">Solicitudes de Compra</h1>
          <p className="text-slate-500">Gestiona tus solicitudes de compra</p>
        </div>
        <Button className="mt-4 md:mt-0 bg-[#005291]" onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Solicitud {/* Botón actualizado */}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="aprobadas">Aprobadas</TabsTrigger>
          <TabsTrigger value="rechazadas">Rechazadas</TabsTrigger>
        </TabsList>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
            <div className="relative w-full md:w-80 mb-4 md:mb-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Buscar por ID, producto, proveedor..."
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
            {loading ? <div className="p-10 text-center text-slate-500">Cargando solicitudes...</div> : ( // Mensaje actualizado
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>{formatDateTime(order.fecha_creacion)}</TableCell>
                      <TableCell>{order.producto || '-'}</TableCell>
                      <TableCell>{order.solicitante || '-'}</TableCell>
                      <TableCell>
                        {order.moneda || '$'}
                        {Number(order.monto || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.estado)}>{order.estado}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailDialog(order)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(order)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-red-500">
                              <Trash className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
             { !loading && filteredOrders.length === 0 && (
                <div className="p-10 text-center text-slate-500">No se encontraron solicitudes de compra.</div> // Mensaje actualizado
            )}
          </div>
        </div>
      </Tabs>

      {/* Diálogo Crear/Editar Compra */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Editar Solicitud de Compra" : "Nueva Solicitud de Compra"}</DialogTitle>
            <DialogDescription>Completa el formulario.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Datos de Solicitud */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">DATOS DE SOLICITUD</h3>
              {/* Grid for Numero, Fecha, Estado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="numero" className="block text-xs font-medium text-slate-600 mb-1">Número</Label>
                  <Input id="numero" placeholder="Autogenerado" disabled className="rounded-md bg-slate-50 border border-slate-300 text-sm h-9 px-3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha" className="block text-xs font-medium text-slate-600 mb-1">Fecha</Label>
                  <Input id="fecha" type="text" value={new Date().toLocaleDateString()} disabled className="rounded-md bg-slate-50 border border-slate-300 text-sm h-9 px-3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado" className="block text-xs font-medium text-slate-600 mb-1">Estado</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData({...formData, estado: value})}>
                    <SelectTrigger className="rounded-md bg-white border border-slate-300 text-sm h-9 px-3">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Solicitado">Solicitado</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Aprobado">Aprobado</SelectItem>
                      <SelectItem value="Rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Grid for Laboratorio and Codigo Presupuestal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    {/* Changed Label and using areas state */}
                    <Label htmlFor="laboratorio" className="block text-xs font-medium text-slate-600 mb-1">Laboratorios/Unidades <span className="text-red-500">*</span></Label>
                    <Select value={formData.laboratorio} onValueChange={(value) => {
                      console.log("Laboratorio/Unidad seleccionada:", value);
                      // Buscar el área seleccionada para obtener su ID
                      const selectedArea = areas.find(area => area.nombre === value);
                      console.log("ID del área seleccionada:", selectedArea?.id);

                      // Actualizar el formulario con el laboratorio seleccionado
                      setFormData({...formData, laboratorio: value, cp_id: undefined});

                      // Si se encontró el área, volver a cargar los códigos presupuestales filtrados por área
                      if (selectedArea) {
                        // Crear una función para cargar los códigos presupuestales filtrados por área
                        const fetchFilteredCodes = async () => {
                          try {
                            const data = await getUserBudgetCodes(selectedArea.id);
                            console.log("Códigos presupuestales filtrados por área:", data);
                            setCodigosPresupuestales(data);
                          } catch (error) {
                            console.error("Error fetching filtered budget codes:", error);
                            toast({ title: "Error", description: "No se pudieron cargar los códigos presupuestales para esta área.", variant: "destructive" });
                          }
                        };
                        fetchFilteredCodes();
                      }
                    }}>
                      <SelectTrigger className="rounded-md bg-white border border-slate-300 text-sm h-9 px-3">
                        <SelectValue placeholder="Seleccione Laboratorio/Unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map(area => (
                          <SelectItem key={area.id} value={area.nombre}>{area.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                 <div className="space-y-2">
                     {/* Added asterisk and adjusted styles */}
                    <Label htmlFor="cp_id" className="block text-xs font-medium text-slate-600 mb-1">Código Presupuestal <span className="text-red-500">*</span></Label>
                    <Select value={formData.cp_id?.toString()} onValueChange={(value) => setFormData({...formData, cp_id: parseInt(value)})}>
                      <SelectTrigger className="rounded-md bg-white border border-slate-300 text-sm h-9 px-3">
                        <SelectValue placeholder="Busque el Código Presupuestal" />
                      </SelectTrigger>
                      <SelectContent>
                        {codigosPresupuestales.map(cp => (
                          <SelectItem key={cp.id} value={cp.id.toString()}>
                            {/* Eliminada referencia a cp.moneda ya que no existe en el tipo UserBudgetCode */}
                            {cp.nombre} - {cp.monto_disponible ? `Disponible: $${cp.monto_disponible.toLocaleString()}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
              </div>
            </div>
            {/* Datos de Producto */}
            <div className="space-y-4 pt-2">
              <h3 className="font-medium text-sm">DATOS DE PRODUCTO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proveedor">Proveedor</Label>
                   <Select value={formData.proveedor} onValueChange={(value) => setFormData({...formData, proveedor: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione Proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {proveedores.map(prov => (
                          <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="producto" className="after:content-['*'] after:ml-0.5 after:text-red-500">Producto</Label>
                   <Select value={formData.producto} onValueChange={(value) => setFormData({...formData, producto: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione Producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map(prod => (
                          <SelectItem key={prod} value={prod}>{prod}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción de Producto</Label>
                <Textarea id="descripcion" name="descripcion" placeholder="Ingrese una descripción detallada" value={formData.descripcion || ""} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cantidad" className="after:content-['*'] after:ml-0.5 after:text-red-500">Cantidad</Label>
                  <Input id="cantidad" name="cantidad" type="number" placeholder="1" min="1" value={formData.cantidad ?? 1} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moneda">Moneda</Label>
                  <Select value={formData.moneda || 'USD'} onValueChange={(value) => setFormData({...formData, moneda: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">$ (USD)</SelectItem>
                      <SelectItem value="UYU">$ (UYU)</SelectItem>
                      <SelectItem value="EUR">€ (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precioUnitario">Precio Unitario</Label>
                  <Input id="precioUnitario" name="precio_unitario" type="number" placeholder="0.00" min="0" step="0.01" value={formData.precio_unitario ?? ""} onChange={handleChange} />
                </div>
              </div>
            </div>
             {/* ADJUNTOS Y OBSERVACIONES */}
             <div className="space-y-4 pt-2">
                <h3 className="font-semibold text-xs text-slate-600 mb-3">ADJUNTOS</h3>
                {/* Botones de Formulario */}
                <div className="flex flex-row gap-3 mb-4">
                   <Button variant="secondary" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md px-4 py-2 h-9 flex-1 flex items-center justify-center gap-2 text-xs" type="button">
                     <Download className="h-4 w-4" />
                     FORMULARIO IDT
                   </Button>
                   <Button variant="secondary" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md px-4 py-2 h-9 flex-1 flex items-center justify-center gap-2 text-xs" type="button">
                     <Download className="h-4 w-4" />
                     FORMULARIO MACROGEN
                   </Button>
                 </div>
                 {/* Input de Archivos */}
                 <div className="space-y-2">
                   <Label htmlFor="adjuntos" className="block text-xs font-medium text-slate-600 mb-1">Seleccionar archivos</Label>
                   <div className="relative rounded-md border border-slate-300 h-9 px-3 py-2 text-sm text-slate-500 flex items-center">
                     <span className="mr-2 bg-slate-100 px-3 py-1 rounded-sm border border-slate-300 text-slate-700 text-xs font-medium">Elegir archivos</span>
                     {/* TODO: Mostrar nombre de archivos seleccionados */}
                     {"Sin archivos seleccionados"}
                     {/* Correctly call handleChange */}
                     <Input id="adjuntos" name="adjuntos" type="file" multiple onChange={handleChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   </div>
                 </div>
                 {/* Observaciones */}
                 <div className="space-y-2 pt-2">
                   <Label htmlFor="observaciones" className="block text-xs font-medium text-slate-600 mb-1">Observaciones</Label>
                   <Textarea id="observaciones" name="observaciones" placeholder="Ingrese observaciones o comentarios adicionales" value={formData.observaciones || ""} onChange={handleChange} className="rounded-md border border-slate-300 text-sm min-h-[70px] px-3 py-2" />
                 </div>
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-[#005291]" onClick={handleSave}>
              {editingOrder ? "Guardar Cambios" : "Crear Solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Componente de detalle de orden */}
      <OrderDetailDialog
        order={selectedOrder}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onOrderUpdated={fetchOrders}
      />

    </div>
  );
}