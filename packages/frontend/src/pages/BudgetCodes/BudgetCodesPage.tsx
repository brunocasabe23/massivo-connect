import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Trash,
  Edit,
  DollarSign,
  Building,
  Link2,
  Link2Off,
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
  // DialogTrigger, // No se usa directamente si el botón abre el diálogo
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { callApi } from "@/services/api";
import { getAreas, associateCodeToArea, dissociateCodeFromArea, Area } from "@/services/areas.service"; // Usar nombres actualizados

interface CodigoPresupuestal {
  id: number;
  nombre: string;
  descripcion: string;
  monto_presupuesto: number;
  fecha_inicio_vigencia: string | null;
  fecha_fin_vigencia: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  // Campos que vienen del backend
  monto_disponible?: number;
  estado?: 'Activo' | 'Agotado' | 'Suspendido';
  areas_asociadas?: Area[];
}

export default function BudgetCodesPage() {
  const [budgetCodes, setBudgetCodes] = useState<CodigoPresupuestal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<CodigoPresupuestal | null>(null);
  const [formData, setFormData] = useState<Partial<CodigoPresupuestal>>({});
  const [activeTab, setActiveTab] = useState("todos");

  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedCP, setSelectedCP] = useState<CodigoPresupuestal | null>(null);
  const [associatedAreaIds, setAssociatedAreaIds] = useState<number[]>([]);
  const [isAreasModalOpen, setIsAreasModalOpen] = useState(false);
  const [areasSearchTerm, setAreasSearchTerm] = useState("");

  const fetchBudgetCodes = async () => {
    try {
      // Obtener códigos con monto_disponible y estado calculados desde el backend
      const data = await callApi('/budget-codes');
      // Obtener áreas asociadas para cada código
      const codesWithData = await Promise.all(data.map(async (code: CodigoPresupuestal) => {
        let associatedAreas: Area[] = [];
        try {
          associatedAreas = await callApi(`/budget-codes/${code.id}/areas`);
        } catch (areaError) {
          if (!(areaError as any)?.message?.includes('404')) {
            console.error(`Error fetching areas for code ${code.id}:`, areaError);
          }
        }
        return {
          ...code,
          // monto_disponible y estado ya vienen del backend
          areas_asociadas: associatedAreas,
        };
      }));
      setBudgetCodes(codesWithData);
    } catch (error) {
      console.error("Error al obtener códigos presupuestales:", error);
    }
  };

  const fetchAreas = async () => {
    try {
      const data = await getAreas();
      setAreas(data);
    } catch (error) {
      console.error("Error al obtener áreas:", error);
    }
  };

  useEffect(() => {
    fetchBudgetCodes();
    fetchAreas();
  }, []);

  const handleSave = async () => {
    try {
      const dataToSave = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        monto_presupuesto: formData.monto_presupuesto,
        fecha_inicio_vigencia: formData.fecha_inicio_vigencia,
        fecha_fin_vigencia: formData.fecha_fin_vigencia,
      };

      if (editingCode) {
        await callApi(`/budget-codes/${editingCode.id}`, {
          method: 'PUT',
          data: dataToSave,
        });
      } else {
        await callApi('/budget-codes', {
          method: 'POST',
          data: dataToSave,
        });
      }
      setIsFormDialogOpen(false);
      setEditingCode(null);
      setFormData({});
      fetchBudgetCodes();
    } catch (error) {
      console.error(`Error al ${editingCode ? 'editar' : 'crear'} código presupuestal:`, error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este código presupuestal?")) return;
    try {
      await callApi(`/budget-codes/${id}`, { method: 'DELETE' });
      fetchBudgetCodes();
    } catch (error) {
      console.error("Error al eliminar código presupuestal:", error);
    }
  };

  const openNewDialog = () => {
    setEditingCode(null);
    setFormData({});
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (code: CodigoPresupuestal) => {
    setEditingCode(code);
    const formattedStartDate = code.fecha_inicio_vigencia ? code.fecha_inicio_vigencia.split('T')[0] : '';
    const formattedEndDate = code.fecha_fin_vigencia ? code.fecha_fin_vigencia.split('T')[0] : '';
    setFormData({
        ...code,
        fecha_inicio_vigencia: formattedStartDate,
        fecha_fin_vigencia: formattedEndDate
    });
    setIsFormDialogOpen(true);
  };


  const openAreasModal = async (cp: CodigoPresupuestal) => {
    setSelectedCP(cp);
    setAreasSearchTerm("");
    try {
      const associated = await callApi(`/budget-codes/${cp.id}/areas`);
      setAssociatedAreaIds(associated.map((a: Area) => a.id));
    } catch (error) {
       if ((error as any)?.message?.includes('404')) {
         setAssociatedAreaIds([]);
       } else {
         console.error("Error al obtener áreas asociadas:", error);
         setAssociatedAreaIds([]);
       }
    }
    setIsAreasModalOpen(true);
  };

  const toggleAreaAssociation = async (areaId: number) => {
    if (!selectedCP) return;
    const isCurrentlyAssociated = associatedAreaIds.includes(areaId);
    try {
      if (isCurrentlyAssociated) {
        await dissociateCodeFromArea(areaId, selectedCP.id); // Usar función actualizada
        setAssociatedAreaIds(prev => prev.filter((id) => id !== areaId));
      } else {
        await associateCodeToArea(areaId, selectedCP.id); // Usar función actualizada
        setAssociatedAreaIds(prev => [...prev, areaId]);
      }
      // Refrescar solo los datos de áreas asociadas para el código actual
      const updatedCodes = budgetCodes.map(code => {
          if (code.id === selectedCP.id) {
              // Actualizar la lista de areas_asociadas localmente
              const newAssociatedAreas = isCurrentlyAssociated
                  ? code.areas_asociadas?.filter(a => a.id !== areaId)
                  : [...(code.areas_asociadas || []), areas.find(a => a.id === areaId)!];
              return { ...code, areas_asociadas: newAssociatedAreas };
          }
          return code;
      });
      setBudgetCodes(updatedCodes);

    } catch (error) {
      console.error("Error al asociar/desasociar área:", error);
    }
  };

  const filteredCodes = useMemo(() => {
    return budgetCodes
      .filter((c) => {
        if (activeTab === "todos") return true;
        if (activeTab === "activos") return c.estado === "Activo";
        if (activeTab === "agotados") return c.estado === "Agotado";
        if (activeTab === "suspendidos") return c.estado === "Suspendido";
        return true;
      })
      .filter((c) =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [budgetCodes, activeTab, searchTerm]);

  const summary = useMemo(() => {
    const totalPresupuestado = budgetCodes.reduce((sum, c) => sum + Number(c.monto_presupuesto || 0), 0);
    const totalDisponible = budgetCodes.reduce((sum, c) => sum + Number(c.monto_disponible || 0), 0);
    const codigosActivos = budgetCodes.filter(c => c.estado === 'Activo').length;
    const areasAsociadasCount = new Set(budgetCodes.flatMap(c => c.areas_asociadas?.map(a => a.id) || [])).size;

    return {
      totalPresupuestado,
      totalDisponible,
      codigosActivos,
      areasAsociadasCount,
    };
  }, [budgetCodes]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Activo": return "bg-green-100 text-green-800";
      case "Agotado": return "bg-amber-100 text-amber-800";
      case "Suspendido": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const filteredAreasForModal = useMemo(() => {
    return areas.filter(area =>
      area.nombre.toLowerCase().includes(areasSearchTerm.toLowerCase()) ||
      (area.departamento || "").toLowerCase().includes(areasSearchTerm.toLowerCase())
    );
  }, [areas, areasSearchTerm]);

  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold text-slate-800">Códigos Presupuestales</h1>
        <p className="text-slate-500">Gestiona los códigos presupuestales y sus áreas asociadas</p>
      </div>

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
         <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-slate-500">
              <DollarSign className="mr-2 h-4 w-4 text-[#005291]" />
              Total Presupuestado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalPresupuestado.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">{summary.codigosActivos} códigos presupuestales activos</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-slate-500">
              <DollarSign className="mr-2 h-4 w-4 text-green-500" />
              Total Disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalDisponible.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-1">
              {summary.totalPresupuestado > 0 ? ((summary.totalDisponible / summary.totalPresupuestado) * 100).toFixed(1) : 0}% del presupuesto total
            </p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-slate-500">
              <Building className="mr-2 h-4 w-4 text-purple-500" />
              Áreas Asociadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.areasAsociadasCount}</div>
            <p className="text-xs text-slate-500 mt-1">En X departamentos diferentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex-1"></div>
        <Button className="mt-4 md:mt-0 bg-[#005291] hover:bg-[#004277] transition-colors" onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Código
        </Button>
      </div>

      {/* Diálogo Crear/Editar Código */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingCode ? "Editar Código Presupuestal" : "Nuevo Código Presupuestal"}</DialogTitle>
            <DialogDescription>
              Completa el formulario para {editingCode ? "editar" : "crear"} un código presupuestal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="col-span-4">Nombre</Label>
              <Input id="nombre" placeholder="Ej: IT-2023-001" className="col-span-4"
                value={formData.nombre || ""}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descripcion" className="col-span-4">Descripción</Label>
              <Input id="descripcion" placeholder="Descripción del código presupuestal" className="col-span-4"
                value={formData.descripcion || ""}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="monto" className="col-span-4">Monto Total</Label>
              <Input id="monto" placeholder="0.00" className="col-span-4" type="number"
                value={formData.monto_presupuesto ?? ""}
                onChange={(e) => setFormData({ ...formData, monto_presupuesto: parseFloat(e.target.value) })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fecha_inicio" className="col-span-4">Fecha Inicio Vigencia</Label>
              <Input id="fecha_inicio" type="date" className="col-span-4"
                value={formData.fecha_inicio_vigencia || ""}
                onChange={(e) => setFormData({ ...formData, fecha_inicio_vigencia: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fecha_fin" className="col-span-4">Fecha Fin Vigencia</Label>
              <Input id="fecha_fin" type="date" className="col-span-4"
                value={formData.fecha_fin_vigencia || ""}
                onChange={(e) => setFormData({ ...formData, fecha_fin_vigencia: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-[#005291]" onClick={handleSave}>
              {editingCode ? "Guardar Cambios" : "Crear Código"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 bg-white border border-slate-200">
          <TabsTrigger value="todos" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Todos</TabsTrigger>
          <TabsTrigger value="activos" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Activos</TabsTrigger>
          <TabsTrigger value="agotados" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Agotados</TabsTrigger>
          <TabsTrigger value="suspendidos" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Suspendidos</TabsTrigger>
        </TabsList>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
            <div className="relative w-full md:w-80 mb-4 md:mb-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input placeholder="Buscar códigos..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filtrar</Button>
              <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" />Exportar</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>ID</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Áreas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((codigo) => (
                  <TableRow key={codigo.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell>{codigo.id}</TableCell>
                    <TableCell>{codigo.nombre}</TableCell>
                    <TableCell>{codigo.descripcion}</TableCell>
                    <TableCell>${Number(codigo.monto_presupuesto).toFixed(2)}</TableCell>
                    <TableCell>${Number(codigo.monto_disponible || 0).toFixed(2)}</TableCell>
                    <TableCell><Badge className={getStatusColor(codigo.estado)}>{codigo.estado || 'N/A'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 items-center">
                        {codigo.areas_asociadas?.slice(0, 2).map((area) => (
                          <Badge key={area.id} variant="secondary" className="truncate max-w-[100px] bg-slate-100">
                            {area.nombre}
                          </Badge>
                        ))}
                        {codigo.areas_asociadas && codigo.areas_asociadas.length > 2 && (
                          <Badge variant="secondary" className="bg-slate-100">+{codigo.areas_asociadas.length - 2}</Badge>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 px-1 text-xs text-[#005291] hover:text-[#004277]" onClick={() => openAreasModal(codigo)}>
                          <Link2 className="h-3 w-3 mr-1" />Gestionar
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
                          <DropdownMenuItem onClick={() => openEditDialog(codigo)}>
                             <Edit className="mr-2 h-4 w-4" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openAreasModal(codigo)}><Building className="mr-2 h-4 w-4" />Gestionar áreas</DropdownMenuItem>
                          <DropdownMenuItem> <DollarSign className="mr-2 h-4 w-4" />Ajustar montos</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(codigo.id)} className="text-red-500"> <Trash className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
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

      {/* Diálogo para gestionar áreas */}
      <Dialog open={isAreasModalOpen} onOpenChange={setIsAreasModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestionar Áreas Asociadas</DialogTitle>
            <DialogDescription>
              Asocia o desasocia áreas al código presupuestal <strong>{selectedCP?.nombre}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar áreas..."
              className="pl-10 w-full"
              value={areasSearchTerm}
              onChange={(e) => setAreasSearchTerm(e.target.value)}
            />
          </div>
          <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
            {filteredAreasForModal.map((area) => {
              const isAssociated = associatedAreaIds.includes(area.id);
              return (
                <div key={area.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`area-${area.id}`}
                      checked={isAssociated}
                      onCheckedChange={() => toggleAreaAssociation(area.id)}
                    />
                    <div>
                      <Label htmlFor={`area-${area.id}`} className="font-medium">{area.nombre}</Label>
                      <p className="text-xs text-muted-foreground">Departamento: {area.departamento}</p>
                    </div>
                  </div>
                  {isAssociated ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-100"
                      onClick={() => toggleAreaAssociation(area.id)}
                    >
                      <Link2Off className="mr-1 h-4 w-4" />
                      Desasociar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:bg-green-100"
                      onClick={() => toggleAreaAssociation(area.id)}
                    >
                      <Link2 className="mr-1 h-4 w-4" />
                      Asociar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAreasModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}