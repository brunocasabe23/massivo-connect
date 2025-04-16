"use client"

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Trash,
  Edit,
  Eye,
  Download,
  Upload,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
// Importar los componentes de diálogo que se usan directamente en este archivo
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Importar solo los componentes de diálogo que se usan directamente
// Los componentes de Dialog se usan en componentes hijos, no directamente aquí
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getProveedores, deleteProveedor, Proveedor } from "@/services/proveedores.service";
import { ProveedorDetailsDialog } from "@/components/proveedores/ProveedorDetailsDialog";
import NuevoProveedorForm from "@/components/proveedores/NuevoProveedorForm";

export default function ProveedoresPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDetalleDialogOpen, setIsDetalleDialogOpen] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [activeTab, setActiveTab] = useState("todos");
  const [isEditMode, setIsEditMode] = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const data = await getProveedores();
      if (Array.isArray(data)) {
        setProveedores(data);
      } else {
        setProveedores([]);
        console.error("Los datos recibidos no son un array:", data);
      }
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los proveedores",
        variant: "destructive",
      });
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsDetalleDialogOpen(true);
    setIsEditMode(false);
  };

  const handleEditarProveedor = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsDetalleDialogOpen(true);
    setIsEditMode(true);
  };

  // handleGuardarProveedor eliminado porque no se usa directamente

  const handleEliminarProveedor = async (id: number) => {
    try {
      await deleteProveedor(id);
      setNotification({
        show: true,
        message: "Proveedor eliminado correctamente",
        type: "success",
      });
      fetchProveedores();
    } catch (error) {
      setNotification({
        show: true,
        message: "Error al eliminar el proveedor",
        type: "error",
      });
    }
  };

  const filteredProveedores = proveedores.filter((proveedor) => {
    if (activeTab === "todos") return true;
    if (activeTab === "activos") return proveedor.estado === "Activo";
    if (activeTab === "inactivos") return proveedor.estado === "Inactivo";
    return true;
  }).filter((proveedor) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      proveedor.nombre.toLowerCase().includes(searchLower) ||
      proveedor.rfc.toLowerCase().includes(searchLower) ||
      proveedor.contacto_nombre.toLowerCase().includes(searchLower) ||
      proveedor.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {notification.show && (
        <Alert
          className={`fixed top-4 right-4 z-50 w-96 shadow-lg ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : notification.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          {notification.type === "success" && <CheckCircle className="h-4 w-4" />}
          {notification.type === "error" && <XCircle className="h-4 w-4" />}
          {notification.type === "warning" && <AlertCircle className="h-4 w-4" />}
          <AlertTitle>
            {notification.type === "success" ? "Éxito" : notification.type === "error" ? "Error" : "Advertencia"}
          </AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proveedores</h1>
          <p className="text-slate-500">Gestiona los proveedores y sus productos asociados</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <Button className="bg-[#005291]" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Buscar proveedores..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="activos">Activos</TabsTrigger>
              <TabsTrigger value="inactivos">Inactivos</TabsTrigger>
            </TabsList>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Cargando proveedores...
                      </TableCell>
                    </TableRow>
                  ) : filteredProveedores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No se encontraron proveedores
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProveedores.map((proveedor) => (
                      <TableRow key={proveedor.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                <Building2 className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{proveedor.nombre}</div>
                              <div className="text-sm text-slate-500">{proveedor.rfc}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{proveedor.contacto_nombre}</div>
                            <div className="text-sm text-slate-500">{proveedor.telefono}</div>
                          </div>
                        </TableCell>
                        <TableCell>{proveedor.email}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              proveedor.estado === "Activo"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {proveedor.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleVerDetalle(proveedor)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditarProveedor(proveedor)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleEliminarProveedor(proveedor.id)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <ProveedorDetailsDialog
        isOpen={isDetalleDialogOpen}
        onClose={() => setIsDetalleDialogOpen(false)}
        proveedor={selectedProveedor}
        onEdit={() => {
          setIsDialogOpen(true);
          setIsEditMode(true);
        }}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
            <DialogDescription>Completa el formulario para registrar un nuevo proveedor.</DialogDescription>
          </DialogHeader>
          <NuevoProveedorForm
            onSuccess={() => {
              setIsDialogOpen(false);
              fetchProveedores();
            }}
            proveedor={isEditMode && selectedProveedor ? selectedProveedor : undefined}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Importar Proveedores</DialogTitle>
            <DialogDescription>
              Sube un archivo Excel con los datos de los proveedores a importar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file">Archivo Excel</Label>
              <Input id="file" type="file" accept=".xlsx,.xls" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms" className="text-sm">
                Sobrescribir proveedores existentes
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
