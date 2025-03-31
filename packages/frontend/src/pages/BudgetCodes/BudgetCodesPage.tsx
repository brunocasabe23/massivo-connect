// Eliminado "use client"
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  FileText,
  Trash,
  Edit,
  Building,
  DollarSign,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

// Tipos de datos (Adaptados o a definir globalmente)
interface Area {
  id: string;
  nombre: string;
  departamento: string;
}

interface CodigoPresupuestal {
  id: string;
  codigo: string;
  descripcion: string;
  monto: string; // Mantener como string por ahora, parsear al usar
  disponible: string; // Mantener como string por ahora, parsear al usar
  estado: string;
  areas: Area[];
}

export default function BudgetCodesPage() { // Cambiado nombre de componente
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
  const [selectedCodigo, setSelectedCodigo] = useState<CodigoPresupuestal | null>(null);
  const [activeTab, setActiveTab] = useState("todos");

  // TODO: Reemplazar con llamada a API real usando callApi y useEffect/useCallback
  // Datos de ejemplo
  const areas: Area[] = [
    { id: "AREA-001", nombre: "Desarrollo de Software", departamento: "IT" },
    { id: "AREA-002", nombre: "Infraestructura", departamento: "IT" },
    { id: "AREA-003", nombre: "Recursos Humanos", departamento: "Administración" },
    { id: "AREA-004", nombre: "Contabilidad", departamento: "Finanzas" },
    { id: "AREA-005", nombre: "Marketing", departamento: "Comercial" },
    { id: "AREA-006", nombre: "Ventas", departamento: "Comercial" },
    { id: "AREA-007", nombre: "Logística", departamento: "Operaciones" },
    { id: "AREA-008", nombre: "Compras", departamento: "Operaciones" },
  ];

  const codigos: CodigoPresupuestal[] = [
    {
      id: "PRES-001",
      codigo: "IT-2023-001",
      descripcion: "Presupuesto para equipos de cómputo",
      monto: "$120,000.00",
      disponible: "$45,200.00",
      estado: "Activo",
      areas: [areas[0], areas[1]],
    },
    {
      id: "PRES-002",
      codigo: "RH-2023-001",
      descripcion: "Presupuesto para capacitación",
      monto: "$50,000.00",
      disponible: "$22,500.00",
      estado: "Activo",
      areas: [areas[2]],
    },
    {
      id: "PRES-003",
      codigo: "FIN-2023-001",
      descripcion: "Presupuesto para auditorías",
      monto: "$80,000.00",
      disponible: "$15,000.00",
      estado: "Activo",
      areas: [areas[3]],
    },
    {
      id: "PRES-004",
      codigo: "MKT-2023-001",
      descripcion: "Presupuesto para campañas publicitarias",
      monto: "$200,000.00",
      disponible: "$120,000.00",
      estado: "Activo",
      areas: [areas[4], areas[5]],
    },
    {
      id: "PRES-005",
      codigo: "OPS-2023-001",
      descripcion: "Presupuesto para logística y distribución",
      monto: "$150,000.00",
      disponible: "$0.00",
      estado: "Agotado",
      areas: [areas[6], areas[7]],
    },
    {
      id: "PRES-006",
      codigo: "IT-2023-002",
      descripcion: "Presupuesto para licencias de software",
      monto: "$75,000.00",
      disponible: "$25,000.00",
      estado: "Activo",
      areas: [areas[0]],
    },
    {
      id: "PRES-007",
      codigo: "COM-2023-001",
      descripcion: "Presupuesto para eventos corporativos",
      monto: "$100,000.00",
      disponible: "$0.00",
      estado: "Suspendido",
      areas: [areas[4], areas[5]],
    },
  ];

  // Filtrar códigos según la pestaña activa y término de búsqueda
  // TODO: Adaptar si la API maneja el filtrado/búsqueda
  const filteredCodigos = codigos
    .filter((codigo) => {
      if (activeTab === "todos") return true;
      if (activeTab === "activos") return codigo.estado === "Activo";
      if (activeTab === "agotados") return codigo.estado === "Agotado";
      if (activeTab === "suspendidos") return codigo.estado === "Suspendido";
      return true;
    })
    .filter(
      (codigo) =>
        codigo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        codigo.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Activo":
        return "bg-green-100 text-green-800 border-green-300"; // Añadir borde
      case "Agotado":
        return "bg-amber-100 text-amber-800 border-amber-300"; // Añadir borde
      case "Suspendido":
        return "bg-red-100 text-red-800 border-red-300"; // Añadir borde
      default:
        return "bg-slate-100 text-slate-800 border-slate-300"; // Añadir borde
    }
  };

  const handleOpenAreaDialog = (codigo: CodigoPresupuestal) => {
    setSelectedCodigo(codigo);
    setIsAreaDialogOpen(true);
  };

  // TODO: Implementar lógica para Crear/Editar/Eliminar código usando callApi
  // TODO: Implementar lógica para Asociar/Desasociar áreas usando callApi

  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold text-slate-800">Códigos Presupuestales</h1>
        <p className="text-slate-500">Gestiona los códigos presupuestales y sus áreas asociadas</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex-1"></div> {/* Espaciador */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0 bg-[#005291] hover:bg-[#004277] transition-colors">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Código
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Nuevo Código Presupuestal</DialogTitle>
              <DialogDescription>Completa el formulario para crear un nuevo código presupuestal.</DialogDescription>
            </DialogHeader>

            {/* TODO: Reemplazar con BudgetCodeForm adaptado o crear nuevo formulario */}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="codigo" className="col-span-4">Código</Label>
                <Input id="codigo" placeholder="Ej: IT-2023-001" className="col-span-4" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="descripcion" className="col-span-4">Descripción</Label>
                <Input id="descripcion" placeholder="Descripción del código presupuestal" className="col-span-4" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="monto" className="col-span-2">Monto Total</Label>
                <Label htmlFor="disponible" className="col-span-2">Monto Disponible</Label>
                <Input id="monto" placeholder="$0.00" className="col-span-2" />
                <Input id="disponible" placeholder="$0.00" className="col-span-2" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notas" className="col-span-4">Notas adicionales</Label>
                <Textarea id="notas" placeholder="Información adicional sobre este código presupuestal" className="col-span-4" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-[#005291]" onClick={() => { setIsDialogOpen(false); /* TODO: Add create logic */ }}>Crear Código</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen de códigos presupuestales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* ... (Código de las Cards sin cambios) ... */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-slate-500">
                <DollarSign className="mr-2 h-4 w-4 text-[#005291]" />
                Total Presupuestado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$775,000.00</div>
              <p className="text-xs text-slate-500 mt-1">7 códigos presupuestales activos</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-slate-500">
                <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                Total Disponible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$227,700.00</div>
              <p className="text-xs text-slate-500 mt-1">29.4% del presupuesto total</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-slate-500">
                <Building className="mr-2 h-4 w-4 text-purple-500" />
                Áreas Asociadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-slate-500 mt-1">En 4 departamentos diferentes</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
                {filteredCodigos.map((codigo) => (
                  <TableRow key={codigo.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-medium">{codigo.id}</TableCell>
                    <TableCell>{codigo.codigo}</TableCell>
                    <TableCell>{codigo.descripcion}</TableCell>
                    <TableCell>{codigo.monto}</TableCell>
                    <TableCell>{codigo.disponible}</TableCell>
                    <TableCell><Badge className={getStatusColor(codigo.estado)}>{codigo.estado}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {codigo.areas.map((area) => ( // Corregido map
                          <Badge key={area.id} variant="outline" className="bg-slate-100">
                            {area.nombre.length > 10 ? `${area.nombre.substring(0, 10)}...` : area.nombre}
                          </Badge>
                        ))}
                        {codigo.areas.length > 0 && (
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-[#005291] hover:text-[#004277]" onClick={() => handleOpenAreaDialog(codigo)}>
                            <Link2 className="h-3 w-3 mr-1" />Gestionar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem> {/* TODO: Add edit logic */} <Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenAreaDialog(codigo)}><Building className="mr-2 h-4 w-4" />Gestionar áreas</DropdownMenuItem>
                          <DropdownMenuItem> {/* TODO: Add adjust logic */} <DollarSign className="mr-2 h-4 w-4" />Ajustar montos</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500"> {/* TODO: Add delete logic */} <Trash className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
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
      <Dialog open={isAreaDialogOpen} onOpenChange={setIsAreaDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestionar Áreas Asociadas</DialogTitle>
            <DialogDescription>
              {selectedCodigo && <>Asocia o desasocia áreas al código presupuestal <strong>{selectedCodigo.codigo}</strong></>}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Áreas disponibles</h3>
              <Input placeholder="Buscar áreas..." className="w-60" /> {/* TODO: Add search logic */}
            </div>
            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
              {areas.map((area) => {
                const isAssociated = selectedCodigo?.areas.some((a) => a.id === area.id);
                return (
                  <div key={area.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-2">
                      <Checkbox id={`area-${area.id}`} checked={isAssociated} /> {/* TODO: Add check logic */}
                      <div>
                        <Label htmlFor={`area-${area.id}`} className="font-medium">{area.nombre}</Label>
                        <p className="text-xs text-slate-500">Departamento: {area.departamento}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className={isAssociated ? "text-red-500" : "text-green-500"}> {/* TODO: Add associate/disassociate logic */}
                      {isAssociated ? <><Link2Off className="mr-1 h-4 w-4" />Desasociar</> : <><Link2 className="mr-1 h-4 w-4" />Asociar</>}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAreaDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-[#005291]" onClick={() => { setIsAreaDialogOpen(false); /* TODO: Add save logic */ }}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}