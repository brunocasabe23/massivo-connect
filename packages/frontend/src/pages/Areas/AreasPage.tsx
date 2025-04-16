import { useEffect, useState, useMemo } from "react";
import { Plus, Search, MoreHorizontal, Trash, Edit, Users, DollarSign, Link2, Building, Link2Off } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAreas, createArea, updateArea, deleteArea, Area, associateCodeToArea, dissociateCodeFromArea } from "@/services/areas.service"; // Usar nombres actualizados
import { callApi } from "@/services/api"; // Importar callApi
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importar Select

// Interfaz para Código Presupuestal (simplificada)
interface CodigoPresupuestal {
  id: number;
  nombre: string;
  descripcion: string;
  monto_presupuesto: number;
  monto_disponible?: number; // NECESITA LÓGICA REAL
  estado?: 'Activo' | 'Agotado' | 'Suspendido'; // NECESITA LÓGICA REAL
}

// Extender interfaz Area para incluir datos calculados y asociados
interface AreaExtended extends Area {
  presupuesto_asignado?: number; // Calculado en backend
  disponible?: number; // NECESITA LÓGICA REAL
  codigos_count?: number; // Calculado en backend
  codigos?: CodigoPresupuestal[]; // Lista de códigos asociados
}

export default function AreasPage() {
  const [areas, setAreas] = useState<AreaExtended[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaExtended | null>(null);
  const [formData, setFormData] = useState<Partial<AreaExtended>>({});
  const [activeTab, setActiveTab] = useState("todos");

  // Estados para el modal de códigos
  const [isCodesModalOpen, setIsCodesModalOpen] = useState(false);
  const [selectedAreaForCodes, setSelectedAreaForCodes] = useState<AreaExtended | null>(null);
  const [allBudgetCodes, setAllBudgetCodes] = useState<CodigoPresupuestal[]>([]);
  const [associatedCodes, setAssociatedCodes] = useState<CodigoPresupuestal[]>([]);
  const [codesSearchTerm, setCodesSearchTerm] = useState("");

  const fetchAreas = async () => {
    try {
      const data: AreaExtended[] = await getAreas(); // Obtener datos con presupuesto_asignado y codigos_count
      // TODO: Calcular 'disponible' real en backend o frontend
      const areasWithData = data.map(area => ({
        ...area,
        disponible: (area.presupuesto_asignado || 0) * 0.7, // Placeholder
      }));
      setAreas(areasWithData);
    } catch (error) {
      console.error("Error al obtener áreas:", error);
    }
  };

  const fetchAllBudgetCodes = async () => {
    try {
      const data = await callApi('/budget-codes');
      const codesWithStatus = data.map((code: any) => ({
        ...code,
        // TODO: Calcular monto_disponible y estado real
        monto_disponible: parseFloat(code.monto_presupuesto) * 0.7, // Placeholder
        estado: parseFloat(code.monto_presupuesto) > 5000 ? 'Activo' : 'Agotado', // Placeholder
      }));
      setAllBudgetCodes(codesWithStatus);
    } catch (error) {
      console.error("Error al obtener todos los códigos presupuestales:", error);
    }
  };

  const fetchAssociatedCodes = async (areaId: number) => {
    try {
      const data = await callApi(`/areas/${areaId}/budget-codes`);
      const codesWithDetails = data.map((code: any) => ({
        ...code,
        // TODO: Calcular monto_disponible y estado real
        monto_disponible: parseFloat(code.monto_presupuesto) * 0.7, // Placeholder
        estado: parseFloat(code.monto_presupuesto) > 5000 ? 'Activo' : 'Agotado', // Placeholder
      }));
      setAssociatedCodes(codesWithDetails);
    } catch (error) {
      if (!(error as any)?.message?.includes('404')) {
        console.error(`Error al obtener códigos asociados para área ${areaId}:`, error);
      }
      setAssociatedCodes([]);
    }
  };

  useEffect(() => {
    fetchAreas();
    fetchAllBudgetCodes();
  }, []);

  const handleSaveArea = async () => {
    try {
      // Asegurarse de enviar números para empleados y presupuesto
      const dataToSave = {
        ...formData,
        empleados: parseInt(formData.empleados?.toString() || '0', 10),
        presupuesto_inicial: parseFloat(formData.presupuesto_inicial?.toString() || '0'),
      };

      if (editingArea) {
        await updateArea(editingArea.id, dataToSave);
      } else {
        await createArea(dataToSave);
      }
      setIsAreaDialogOpen(false);
      setEditingArea(null);
      setFormData({});
      fetchAreas(); // Refrescar lista
    } catch (error) {
      console.error("Error al guardar área:", error);
    }
  };

  const handleDeleteArea = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar esta área?")) return;
    try {
      await deleteArea(id);
      fetchAreas(); // Refrescar lista
    } catch (error) {
      console.error("Error al eliminar área:", error);
    }
  };

  const openNewAreaDialog = () => {
    setEditingArea(null);
    setFormData({});
    setIsAreaDialogOpen(true);
  };

  const openEditAreaDialog = (area: AreaExtended) => {
    setEditingArea(area);
    setFormData(area);
    setIsAreaDialogOpen(true);
  };

  const openCodesModal = (area: AreaExtended) => {
    setSelectedAreaForCodes(area);
    fetchAssociatedCodes(area.id);
    setIsCodesModalOpen(true);
  };

  const handleAssociateCode = async (cpId: number) => {
    if (!selectedAreaForCodes) return;
    try {
      await associateCodeToArea(selectedAreaForCodes.id, cpId); // Usar función actualizada
      fetchAssociatedCodes(selectedAreaForCodes.id); // Refrescar lista de asociados
      fetchAreas(); // Refrescar lista de áreas para actualizar codigos_count
    } catch (error) {
      console.error("Error al asociar código:", error);
    }
  };

  const handleDissociateCode = async (cpId: number) => {
    if (!selectedAreaForCodes) return;
    try {
      await dissociateCodeFromArea(selectedAreaForCodes.id, cpId); // Usar función actualizada
      fetchAssociatedCodes(selectedAreaForCodes.id); // Refrescar lista de asociados
      fetchAreas(); // Refrescar lista de áreas para actualizar codigos_count
    } catch (error) {
      console.error("Error al desasociar código:", error);
    }
  };

  const departments = useMemo(() => {
    const uniqueDepartments = new Set(areas.map(a => a.departamento).filter(Boolean));
    return ["todos", ...Array.from(uniqueDepartments)];
  }, [areas]);

  const filteredAreas = useMemo(() => {
    return areas
      .filter((a) => activeTab === "todos" || a.departamento === activeTab)
      .filter((a) =>
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.descripcion || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.departamento || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.responsable || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [areas, activeTab, searchTerm]);

  const summary = useMemo(() => {
    const totalAreas = areas.length;
    const totalEmpleados = areas.reduce((sum, a) => sum + Number(a.empleados || 0), 0); // Asegurar número
    const presupuestoTotal = areas.reduce((sum, a) => sum + Number(a.presupuesto_asignado || 0), 0); // Asegurar número
    const codigosAsociados = areas.reduce((sum, a) => sum + Number(a.codigos_count || 0), 0); // Asegurar número

    return {
      totalAreas,
      totalEmpleados,
      presupuestoTotal,
      codigosAsociados,
      promedioEmpleados: totalAreas > 0 ? (totalEmpleados / totalAreas).toFixed(1) : 0,
    };
  }, [areas]);

  const getDepartmentColor = (department?: string) => {
    let hash = 0;
    if (!department) return 'bg-gray-200 text-gray-800';
    for (let i = 0; i < department.length; i++) {
      hash = department.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 85%)`;
  };

  const associatedCodesFiltered = useMemo(() => {
    return associatedCodes.filter(c =>
      c.nombre.toLowerCase().includes(codesSearchTerm.toLowerCase()) ||
      c.descripcion.toLowerCase().includes(codesSearchTerm.toLowerCase())
    );
  }, [associatedCodes, codesSearchTerm]);

  const availableCodesFiltered = useMemo(() => {
    const associatedIds = new Set(associatedCodes.map(c => c.id));
    return allBudgetCodes.filter(c =>
      !associatedIds.has(c.id) &&
      (c.nombre.toLowerCase().includes(codesSearchTerm.toLowerCase()) ||
       c.descripcion.toLowerCase().includes(codesSearchTerm.toLowerCase()))
    );
  }, [allBudgetCodes, associatedCodes, codesSearchTerm]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Activo": return "bg-green-100 text-green-800";
      case "Agotado": return "bg-amber-100 text-amber-800";
      case "Suspendido": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold">Áreas</h1>
        <p className="text-muted-foreground">Gestiona las áreas, departamentos y sus presupuestos</p>
      </div>

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
         <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <Building className="mr-2 h-4 w-4 text-blue-500" />
              Total de Áreas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAreas}</div>
            <p className="text-xs text-muted-foreground mt-1">En {departments.length - 1} departamentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <Users className="mr-2 h-4 w-4 text-purple-500" />
              Total de Empleados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalEmpleados}</div>
            <p className="text-xs text-muted-foreground mt-1">Promedio de {summary.promedioEmpleados} por área</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <DollarSign className="mr-2 h-4 w-4 text-green-500" />
              Presupuesto Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.presupuestoTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Asignado a todas las áreas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
              <Link2 className="mr-2 h-4 w-4 text-orange-500" />
              Códigos Asociados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.codigosAsociados}</div>
            <p className="text-xs text-muted-foreground mt-1">{areas.filter(a => a.codigos_count && a.codigos_count > 0).length} áreas con códigos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 border flex flex-wrap h-auto">
          {departments.map((dep) => (
            <TabsTrigger key={dep} value={dep} className="capitalize">
              {dep === "todos" ? "Todos" : dep}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="bg-card rounded-lg border shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
            <div className="relative w-full md:w-80 mb-4 md:mb-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar áreas..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openNewAreaDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Área
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Empleados</TableHead>
                  <TableHead>Presupuesto Asignado</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Códigos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.id}</TableCell>
                    <TableCell>{area.nombre}</TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: getDepartmentColor(area.departamento) }} className="text-black">
                        {area.departamento || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{area.responsable || '-'}</TableCell>
                    <TableCell>{area.empleados || 0}</TableCell>
                    <TableCell>${Number(area.presupuesto_asignado || 0).toFixed(2)}</TableCell>
                    <TableCell>${(area.disponible || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{area.codigos_count || 0}</span>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs text-blue-500 hover:underline" onClick={() => openCodesModal(area)}>
                          <Link2 className="mr-1 h-3 w-3" /> Ver
                        </Button>
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
                          <DropdownMenuItem onClick={() => openEditAreaDialog(area)}>
                            <Edit className="mr-2 h-4 w-4" />Editar
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => openCodesModal(area)}>
                            <Link2 className="mr-2 h-4 w-4" />Gestionar códigos
                          </DropdownMenuItem>
                           <DropdownMenuItem> {/* TODO: Implementar Ver Empleados */}
                            <Users className="mr-2 h-4 w-4" />Ver empleados
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteArea(area.id)} className="text-red-500">
                            <Trash className="mr-2 h-4 w-4" />Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Tabs>

      {/* Diálogo Crear/Editar Área */}
      <Dialog open={isAreaDialogOpen} onOpenChange={setIsAreaDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingArea ? "Editar Área" : "Nueva Área"}</DialogTitle>
            <DialogDescription>
              Completa el formulario para {editingArea ? "editar" : "crear"} una nueva área.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4"> {/* Simplificado a 1 columna */}
              <div>
                <Label htmlFor="nombre">Nombre del Área</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Desarrollo de Software"
                  value={formData.nombre || ""}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="departamento">Departamento</Label>
                <Select
                  value={formData.departamento || ""}
                  onValueChange={(value) => setFormData({ ...formData, departamento: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Administración">Administración</SelectItem>
                    <SelectItem value="Finanzas">Finanzas</SelectItem>
                    <SelectItem value="Comercial">Comercial</SelectItem>
                    <SelectItem value="Operaciones">Operaciones</SelectItem>
                    <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                    <SelectItem value="Compras">Compras</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="responsable">Responsable</Label>
                <Input
                  id="responsable"
                  placeholder="Nombre del responsable"
                  value={formData.responsable || ""}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <Label htmlFor="empleados">Número de Empleados</Label>
                  <Input
                    id="empleados"
                    type="number"
                    placeholder="0"
                    value={formData.empleados ?? ""}
                    onChange={(e) => setFormData({ ...formData, empleados: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="presupuesto_inicial">Presupuesto Inicial</Label>
                  <Input
                    id="presupuesto_inicial"
                    type="number"
                    placeholder="$0.00"
                    step="0.01"
                    value={formData.presupuesto_inicial ?? ""}
                    onChange={(e) => setFormData({ ...formData, presupuesto_inicial: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAreaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveArea} className="bg-[#005291] hover:bg-[#004277]">
              {editingArea ? "Guardar Cambios" : "Crear Área"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Gestionar Códigos Presupuestales */}
      <Dialog open={isCodesModalOpen} onOpenChange={setIsCodesModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Códigos Presupuestales Asociados</DialogTitle>
            <DialogDescription>
              Gestiona los códigos asociados al área <strong>{selectedAreaForCodes?.nombre}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="relative my-4">
             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
             <Input placeholder="Buscar códigos..." className="pl-10 w-full" value={codesSearchTerm} onChange={(e) => setCodesSearchTerm(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-6 max-h-[50vh] overflow-y-auto pr-2">
            {/* Códigos Asociados */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Códigos asociados</h3>
              <div className="space-y-3">
                {associatedCodesFiltered.length > 0 ? associatedCodesFiltered.map((code) => (
                  <div key={code.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                    <div>
                      <div className="font-medium">{code.nombre}</div>
                      <div className="text-sm text-muted-foreground">{code.descripcion}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getStatusColor(code.estado)}>{code.estado || 'N/A'}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Disponible: ${Number(code.monto_disponible || 0).toFixed(2)} de ${Number(code.monto_presupuesto).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-100" onClick={() => handleDissociateCode(code.id)}>
                      <Link2Off className="mr-1 h-4 w-4" /> Desasociar
                    </Button>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No hay códigos asociados.</p>}
              </div>
            </div>

            {/* Asociar Nuevos Códigos */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Asociar nuevos códigos</h3>
              <div className="space-y-3">
                {availableCodesFiltered.length > 0 ? availableCodesFiltered.map((code) => (
                  <div key={code.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{code.nombre}</div>
                      <div className="text-sm text-muted-foreground">{code.descripcion}</div>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs text-muted-foreground">
                          Disponible: ${Number(code.monto_disponible || 0).toFixed(2)} de ${Number(code.monto_presupuesto).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-100" onClick={() => handleAssociateCode(code.id)}>
                      <Link2 className="mr-1 h-4 w-4" /> Asociar
                    </Button>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No hay más códigos disponibles para asociar.</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCodesModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}