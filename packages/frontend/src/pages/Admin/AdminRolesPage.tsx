// Eliminado "use client"
import { useState } from "react";
import { motion } from "framer-motion"; // Asegúrate que framer-motion esté instalado
import { ShieldCheck, Search, Plus, MoreHorizontal, Edit, Trash, Users, Save, Check } from "lucide-react"; // Eliminado X
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// TODO: Definir estas interfaces globalmente o importarlas
interface Role {
  id: string;
  name: string;
  description: string;
  users: number;
  permissions: number;
  createdAt: string;
  updatedAt: string;
}

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface PermissionCategory { // Añadida interfaz para categorías
    name: string;
    permissions: Permission[];
}

export default function AdminRolesPage() { // Nombre de componente cambiado
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  // const [editingPermission, setEditingPermission] = useState<Permission | null>(null); // Eliminado estado no utilizado

  // TODO: Reemplazar con llamada a API real usando callApi y useEffect/useCallback
  // Datos de ejemplo
  const roles: Role[] = [
    {
      id: "ROL-001",
      name: "Administrador",
      description: "Acceso completo a todas las funcionalidades del sistema",
      users: 3,
      permissions: 24,
      createdAt: "10/01/2023",
      updatedAt: "15/03/2023",
    },
    {
      id: "ROL-002",
      name: "Gerente",
      description: "Acceso a la mayoría de las funcionalidades, excepto configuración del sistema",
      users: 8,
      permissions: 18,
      createdAt: "12/01/2023",
      updatedAt: "20/03/2023",
    },
    {
      id: "ROL-003",
      name: "Supervisor",
      description: "Acceso a funcionalidades de supervisión y aprobación",
      users: 15,
      permissions: 12,
      createdAt: "15/01/2023",
      updatedAt: "25/03/2023",
    },
    {
      id: "ROL-004",
      name: "Contador",
      description: "Acceso a funcionalidades financieras y contables",
      users: 6,
      permissions: 10,
      createdAt: "20/01/2023",
      updatedAt: "30/03/2023",
    },
    {
      id: "ROL-005",
      name: "Analista",
      description: "Acceso a funcionalidades de análisis y reportes",
      users: 22,
      permissions: 8,
      createdAt: "25/01/2023",
      updatedAt: "05/04/2023",
    },
    {
      id: "ROL-006",
      name: "Usuario",
      description: "Acceso básico a funcionalidades del sistema",
      users: 70,
      permissions: 5,
      createdAt: "30/01/2023",
      updatedAt: "10/04/2023",
    },
  ];

  const permissionCategories: PermissionCategory[] = [ // Usar interfaz PermissionCategory
    {
      name: "Usuarios",
      permissions: [
        { id: "PERM-001", name: "Ver usuarios", category: "Usuarios", description: "Permite ver la lista de usuarios" },
        { id: "PERM-002", name: "Crear usuarios", category: "Usuarios", description: "Permite crear nuevos usuarios" },
        { id: "PERM-003", name: "Editar usuarios", category: "Usuarios", description: "Permite editar usuarios existentes" },
        { id: "PERM-004", name: "Eliminar usuarios", category: "Usuarios", description: "Permite eliminar usuarios" },
      ],
    },
    {
      name: "Roles",
      permissions: [
        { id: "PERM-005", name: "Ver roles", category: "Roles", description: "Permite ver la lista de roles" },
        { id: "PERM-006", name: "Crear roles", category: "Roles", description: "Permite crear nuevos roles" },
        { id: "PERM-007", name: "Editar roles", category: "Roles", description: "Permite editar roles existentes" },
        { id: "PERM-008", name: "Eliminar roles", category: "Roles", description: "Permite eliminar roles" },
      ],
    },
    {
      name: "Compras",
      permissions: [
        { id: "PERM-009", name: "Ver compras", category: "Compras", description: "Permite ver la lista de compras" },
        { id: "PERM-010", name: "Crear compras", category: "Compras", description: "Permite crear nuevas compras" },
        { id: "PERM-011", name: "Aprobar compras", category: "Compras", description: "Permite aprobar compras" },
        { id: "PERM-012", name: "Rechazar compras", category: "Compras", description: "Permite rechazar compras" },
      ],
    },
    {
      name: "Viáticos",
      permissions: [
        { id: "PERM-013", name: "Ver viáticos", category: "Viáticos", description: "Permite ver la lista de viáticos" },
        { id: "PERM-014", name: "Crear viáticos", category: "Viáticos", description: "Permite crear nuevos viáticos" },
        { id: "PERM-015", name: "Aprobar viáticos", category: "Viáticos", description: "Permite aprobar viáticos" },
        { id: "PERM-016", name: "Rechazar viáticos", category: "Viáticos", description: "Permite rechazar viáticos" },
      ],
    },
    {
      name: "Códigos Presupuestales",
      permissions: [
        { id: "PERM-017", name: "Ver códigos", category: "Códigos Presupuestales", description: "Permite ver la lista de códigos presupuestales" },
        { id: "PERM-018", name: "Crear códigos", category: "Códigos Presupuestales", description: "Permite crear nuevos códigos presupuestales" },
        { id: "PERM-019", name: "Editar códigos", category: "Códigos Presupuestales", description: "Permite editar códigos presupuestales existentes" },
        { id: "PERM-020", name: "Eliminar códigos", category: "Códigos Presupuestales", description: "Permite eliminar códigos presupuestales" },
      ],
    },
    {
      name: "Áreas",
      permissions: [
        { id: "PERM-021", name: "Ver áreas", category: "Áreas", description: "Permite ver la lista de áreas" },
        { id: "PERM-022", name: "Crear áreas", category: "Áreas", description: "Permite crear nuevas áreas" },
        { id: "PERM-023", name: "Editar áreas", category: "Áreas", description: "Permite editar áreas existentes" },
        { id: "PERM-024", name: "Eliminar áreas", category: "Áreas", description: "Permite eliminar áreas" },
      ],
    },
  ];

  // Filtrar roles según el término de búsqueda
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenPermissionDialog = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionDialogOpen(true);
  };

  // TODO: Implementar lógica para Crear/Editar/Eliminar rol usando callApi
  // TODO: Implementar lógica para Guardar cambios de permisos usando callApi

  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold text-slate-800">Roles y Permisos</h1>
        <p className="text-slate-500">Administra los roles del sistema y sus permisos asociados</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex-1"></div> {/* Espaciador */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0 bg-[#005291] hover:bg-[#004277] transition-colors">
              <Plus className="mr-2 h-4 w-4" />Nuevo Rol
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Rol</DialogTitle>
              <DialogDescription>Completa el formulario para crear un nuevo rol en el sistema.</DialogDescription>
            </DialogHeader>
            {/* Formulario Crear Rol */}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="col-span-4">Nombre del rol</Label>
                <Input id="name" placeholder="Ej: Supervisor de Ventas" className="col-span-4" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="col-span-4">Descripción</Label>
                <Textarea id="description" placeholder="Describe las funciones y responsabilidades de este rol" className="col-span-4" />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Permisos iniciales</h3>
                <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                  <Accordion type="multiple" className="w-full">
                    {permissionCategories.map((category) => (
                      <AccordionItem key={category.name} value={category.name}>
                        <AccordionTrigger className="py-2">
                          <div className="flex items-center">
                            <Checkbox id={`category-${category.name}`} className="mr-2" /> {/* TODO: Add select all logic */}
                            <span>{category.name}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-6 space-y-2">
                            {category.permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center gap-2">
                                <Checkbox id={permission.id} /> {/* TODO: Add check logic */}
                                <div>
                                  <Label htmlFor={permission.id} className="font-medium text-sm">{permission.name}</Label>
                                  <p className="text-xs text-slate-500">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-[#005291]" onClick={() => { setIsDialogOpen(false); /* TODO: Add create logic */ }}>Crear Rol</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
         {/* ... (Código de las Cards sin cambios) ... */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-slate-500">
                <ShieldCheck className="mr-2 h-4 w-4 text-[#005291]" />Total de Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
              <p className="text-xs text-slate-500 mt-1">Roles configurados en el sistema</p>
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
                <Check className="mr-2 h-4 w-4 text-green-500" />Total de Permisos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{permissionCategories.reduce((total, category) => total + category.permissions.length, 0)}</div>
              <p className="text-xs text-slate-500 mt-1">Permisos disponibles para asignar</p>
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
                <Users className="mr-2 h-4 w-4 text-blue-500" />Usuarios Asignados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.reduce((total, role) => total + role.users, 0)}</div>
              <p className="text-xs text-slate-500 mt-1">Usuarios con roles asignados</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
          <div className="relative w-full md:w-80 mb-4 md:mb-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input placeholder="Buscar roles..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          {/* Podrían ir botones de filtro aquí si fueran necesarios */}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>ID</TableHead><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead>Usuarios</TableHead><TableHead>Permisos</TableHead><TableHead>Creado</TableHead><TableHead>Actualizado</TableHead><TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium">{role.id}</TableCell><TableCell><Badge className={ role.name === "Administrador" ? "bg-red-100 text-red-800" : role.name === "Gerente" ? "bg-blue-100 text-blue-800" : role.name === "Supervisor" ? "bg-green-100 text-green-800" : role.name === "Contador" ? "bg-purple-100 text-purple-800" : role.name === "Analista" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800" }>{role.name}</Badge></TableCell><TableCell>{role.description}</TableCell><TableCell><div className="flex items-center"><Users className="h-4 w-4 mr-2 text-slate-500" /><span>{role.users}</span></div></TableCell><TableCell><div className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-slate-500" /><span>{role.permissions}</span></div></TableCell><TableCell>{role.createdAt}</TableCell><TableCell>{role.updatedAt}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem> <Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleOpenPermissionDialog(role)}><ShieldCheck className="mr-2 h-4 w-4" />Gestionar permisos</DropdownMenuItem><DropdownMenuItem> <Users className="mr-2 h-4 w-4" />Ver usuarios</DropdownMenuItem><DropdownMenuItem className="text-red-500"> <Trash className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Diálogo para gestionar permisos */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestionar Permisos del Rol</DialogTitle>
            <DialogDescription>
              {selectedRole && <>Configura los permisos para el rol <strong>{selectedRole.name}</strong></>}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
              <Accordion type="multiple" className="w-full">
                {permissionCategories.map((category) => (
                  <AccordionItem key={category.name} value={category.name}>
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center">
                        <Checkbox id={`category-${category.name}`} className="mr-2" defaultChecked={selectedRole?.name === "Administrador"} /> {/* TODO: Add select all logic */}
                        <span>{category.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-6 space-y-2">
                        {category.permissions.map((permission) => {
                          // TODO: Determine actual checked state based on selected role permissions
                          const isChecked = selectedRole?.name === "Administrador" || (selectedRole?.name === "Gerente" && permission.name.includes("Ver")); // Example logic
                          return (
                            <div key={permission.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Checkbox id={permission.id} checked={isChecked} /> {/* TODO: Add check logic */}
                                <div>
                                  <Label htmlFor={permission.id} className="font-medium text-sm">{permission.name}</Label>
                                  <p className="text-xs text-slate-500">{permission.description}</p>
                                </div>
                              </div>
                              {/* Editing permissions inline might be complex, consider a separate view/edit page */}
                              {/* {editingPermission?.id === permission.id ? (...) : (...)} */}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-[#005291]" onClick={() => { setIsPermissionDialogOpen(false); /* TODO: Add save logic */ }}><Save className="mr-2 h-4 w-4" />Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}