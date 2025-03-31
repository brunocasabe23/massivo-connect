// Eliminado "use client"
import { useState } from "react";
import {
  Search,
  Filter,
  UserPlus,
  MoreHorizontal,
  Edit,
  Trash,
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// TODO: Definir estas interfaces globalmente o importarlas
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  lastLogin: string;
  createdAt: string;
  avatar?: string;
  initials: string;
}

interface Role { // Añadida interfaz Role
  id: string;
  name: string;
  permissions: number;
}

interface Permission { // Añadida interfaz Permission
  id: string;
  name: string;
  category: string;
  description: string;
}


export default function AdminUsuariosPage() { // Nombre de componente cambiado
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("todos");

  // TODO: Reemplazar con llamada a API real usando callApi y useEffect/useCallback
  // Datos de ejemplo
  const users: User[] = [
    {
      id: "USR-001",
      name: "Ana García",
      email: "ana.garcia@empresa.com",
      role: "Administrador",
      department: "IT",
      status: "Activo",
      lastLogin: "Hace 2 horas",
      createdAt: "15/01/2023",
      avatar: "/placeholder-user.jpg",
      initials: "AG",
    },
    {
      id: "USR-002",
      name: "Carlos Méndez",
      email: "carlos.mendez@empresa.com",
      role: "Gerente",
      department: "IT",
      status: "Activo",
      lastLogin: "Hace 5 horas",
      createdAt: "10/02/2023",
      avatar: "",
      initials: "CM",
    },
    {
      id: "USR-003",
      name: "Laura Martínez",
      email: "laura.martinez@empresa.com",
      role: "Usuario",
      department: "Recursos Humanos",
      status: "Inactivo",
      lastLogin: "Hace 3 días",
      createdAt: "05/03/2023",
      avatar: "",
      initials: "LM",
    },
     {
      id: "USR-004",
      name: "Roberto Sánchez",
      email: "roberto.sanchez@empresa.com",
      role: "Supervisor",
      department: "Operaciones",
      status: "Activo",
      lastLogin: "Hace 1 día",
      createdAt: "20/03/2023",
      avatar: "",
      initials: "RS",
    },
    {
      id: "USR-005",
      name: "María López",
      email: "maria.lopez@empresa.com",
      role: "Contador",
      department: "Finanzas",
      status: "Activo",
      lastLogin: "Hace 4 horas",
      createdAt: "12/04/2023",
      avatar: "",
      initials: "ML",
    },
    {
      id: "USR-006",
      name: "Javier Rodríguez",
      email: "javier.rodriguez@empresa.com",
      role: "Analista",
      department: "Comercial",
      status: "Activo",
      lastLogin: "Hace 2 días",
      createdAt: "08/05/2023",
      avatar: "",
      initials: "JR",
    },
    {
      id: "USR-007",
      name: "Sofía Ramírez",
      email: "sofia.ramirez@empresa.com",
      role: "Usuario",
      department: "Operaciones",
      status: "Inactivo",
      lastLogin: "Hace 10 días",
      createdAt: "15/06/2023",
      avatar: "",
      initials: "SR",
    },
    {
      id: "USR-008",
      name: "Pedro Hernández",
      email: "pedro.hernandez@empresa.com",
      role: "Gerente",
      department: "Recursos Humanos",
      status: "Activo",
      lastLogin: "Hace 6 horas",
      createdAt: "22/07/2023",
      avatar: "",
      initials: "PH",
    },
  ];

  const roles: Role[] = [ // Usar interfaz Role
    { id: "ROL-001", name: "Administrador", permissions: 24 },
    { id: "ROL-002", name: "Gerente", permissions: 18 },
    { id: "ROL-003", name: "Supervisor", permissions: 12 },
    { id: "ROL-004", name: "Contador", permissions: 10 },
    { id: "ROL-005", name: "Analista", permissions: 8 },
    { id: "ROL-006", name: "Usuario", permissions: 5 },
  ];

  const permissions: Permission[] = [ // Usar interfaz Permission
    { id: "PERM-001", name: "Ver usuarios", category: "Usuarios", description: "Permite ver la lista de usuarios" },
    { id: "PERM-002", name: "Crear usuarios", category: "Usuarios", description: "Permite crear nuevos usuarios" },
    { id: "PERM-003", name: "Editar usuarios", category: "Usuarios", description: "Permite editar usuarios existentes" },
    { id: "PERM-004", name: "Eliminar usuarios", category: "Usuarios", description: "Permite eliminar usuarios" },
    { id: "PERM-005", name: "Ver roles", category: "Roles", description: "Permite ver la lista de roles" },
    { id: "PERM-006", name: "Crear roles", category: "Roles", description: "Permite crear nuevos roles" },
    { id: "PERM-007", name: "Editar roles", category: "Roles", description: "Permite editar roles existentes" },
    { id: "PERM-008", name: "Eliminar roles", category: "Roles", description: "Permite eliminar roles" },
    { id: "PERM-009", name: "Ver compras", category: "Compras", description: "Permite ver la lista de compras" },
    { id: "PERM-010", name: "Crear compras", category: "Compras", description: "Permite crear nuevas compras" },
    { id: "PERM-011", name: "Aprobar compras", category: "Compras", description: "Permite aprobar compras" },
    { id: "PERM-012", name: "Ver viáticos", category: "Viáticos", description: "Permite ver la lista de viáticos" },
  ];

  // Filtrar usuarios según la pestaña activa y el término de búsqueda
  const filteredUsers = users
    .filter((user) => {
      if (activeTab === "todos") return true;
      if (activeTab === "activos") return user.status === "Activo";
      if (activeTab === "inactivos") return user.status === "Inactivo";
      if (activeTab === "administradores") return user.role === "Administrador";
      return true;
    })
    .filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleOpenRoleDialog = (user: User) => {
    setSelectedUser(user);
    setIsRoleDialogOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Administrador": return "bg-red-100 text-red-800 border-red-300";
      case "Gerente": return "bg-blue-100 text-blue-800 border-blue-300";
      case "Supervisor": return "bg-green-100 text-green-800 border-green-300";
      case "Contador": return "bg-purple-100 text-purple-800 border-purple-300";
      case "Analista": return "bg-amber-100 text-amber-800 border-amber-300";
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === "Activo" ? "bg-green-100 text-green-800 border-green-300" : "bg-slate-100 text-slate-800 border-slate-300";
  };

  // TODO: Implementar lógica para Crear/Editar/Eliminar usuario usando callApi
  // TODO: Implementar lógica para Activar/Desactivar usuario usando callApi
  // TODO: Implementar lógica para Guardar cambios de rol/permisos usando callApi

  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
        <p className="text-slate-500">Administra los usuarios del sistema y sus roles</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex-1"></div> {/* Espaciador */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0 bg-[#005291] hover:bg-[#004277] transition-colors">
              <UserPlus className="mr-2 h-4 w-4" />Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>Completa el formulario para crear un nuevo usuario en el sistema.</DialogDescription>
            </DialogHeader>
            {/* Formulario Crear Usuario */}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="col-span-4">Nombre completo</Label>
                <Input id="name" placeholder="Nombre y apellidos" className="col-span-4" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="col-span-4">Correo electrónico</Label>
                <div className="relative col-span-4">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input id="email" type="email" placeholder="correo@empresa.com" className="pl-10" />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="col-span-2">Teléfono</Label>
                <Label htmlFor="department" className="col-span-2">Departamento</Label>
                <div className="relative col-span-2">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input id="phone" placeholder="+52 55 1234 5678" className="pl-10" />
                </div>
                <Select defaultValue="it"> {/* TODO: Conectar estado */}
                  <SelectTrigger className="col-span-2"><SelectValue placeholder="Seleccionar departamento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it">IT</SelectItem>
                    <SelectItem value="rrhh">Recursos Humanos</SelectItem>
                    <SelectItem value="finanzas">Finanzas</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="operaciones">Operaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="col-span-2">Rol</Label>
                <Label htmlFor="status" className="col-span-2">Estado</Label>
                <Select defaultValue="usuario"> {/* TODO: Conectar estado */}
                  <SelectTrigger className="col-span-2"><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                  <SelectContent>
                    {roles.map(role => <SelectItem key={role.id} value={role.name.toLowerCase()}>{role.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select defaultValue="activo"> {/* TODO: Conectar estado */}
                  <SelectTrigger className="col-span-2"><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="col-span-4">Contraseña</Label>
                <div className="relative col-span-4">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-[#005291]" onClick={() => { setIsDialogOpen(false); /* TODO: Add create logic */ }}>Crear Usuario</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 bg-white border border-slate-200">
          <TabsTrigger value="todos" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Todos</TabsTrigger>
          <TabsTrigger value="activos" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Activos</TabsTrigger>
          <TabsTrigger value="inactivos" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Inactivos</TabsTrigger>
          <TabsTrigger value="administradores" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Administradores</TabsTrigger>
        </TabsList>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
            <div className="relative w-full md:w-80 mb-4 md:mb-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input placeholder="Buscar usuarios..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filtrar</Button>
              <Button variant="outline" size="sm"> {/* TODO: Add activate logic */} <UserCheck className="mr-2 h-4 w-4" />Activar</Button>
              <Button variant="outline" size="sm"> {/* TODO: Add deactivate logic */} <UserX className="mr-2 h-4 w-4" />Desactivar</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-12"><Checkbox /></TableHead><TableHead>Usuario</TableHead><TableHead>Correo</TableHead><TableHead>Rol</TableHead><TableHead>Departamento</TableHead><TableHead>Estado</TableHead><TableHead>Último acceso</TableHead><TableHead>Creado</TableHead><TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">{/* Ensure no whitespace between TableCells */}
                      <TableCell><Checkbox /></TableCell><TableCell><div className="flex items-center gap-3"><Avatar>{user.avatar ? <AvatarImage src={user.avatar} /> : <AvatarFallback className="bg-gradient-to-br from-blue-500 to-[#005291] text-white">{user.initials}</AvatarFallback>}</Avatar><div className="font-medium">{user.name}</div></div></TableCell><TableCell>{user.email}</TableCell><TableCell><Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge></TableCell><TableCell>{user.department}</TableCell><TableCell><Badge className={getStatusBadgeColor(user.status)}>{user.status}</Badge></TableCell><TableCell>{user.lastLogin}</TableCell><TableCell>{user.createdAt}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleOpenRoleDialog(user)}><ShieldCheck className="mr-2 h-4 w-4" />Gestionar permisos</DropdownMenuItem><DropdownMenuItem>{user.status === "Activo" ? (<span><UserX className="mr-2 h-4 w-4" />Desactivar</span>) : (<span><UserCheck className="mr-2 h-4 w-4" />Activar</span>)}</DropdownMenuItem><DropdownMenuItem className="text-red-500"><Trash className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center"> {/* ColSpan debe coincidir con número de columnas (9) */}
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Tabs>

      {/* Diálogo para gestionar roles y permisos */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gestionar Permisos de Usuario</DialogTitle>
            <DialogDescription>
              {selectedUser && <>Configura los permisos para <strong>{selectedUser.name}</strong></>}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Rol actual: {selectedUser?.role}</h3>
              <Select defaultValue={selectedUser?.role.toLowerCase()}> {/* TODO: Connect state/logic */}
                <SelectTrigger className="w-60"><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                <SelectContent>
                  {roles.map((role) => <SelectItem key={role.id} value={role.name.toLowerCase()}>{role.name} ({role.permissions} permisos)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Permisos del rol</h3>
              <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                {permissions.map((permission) => {
                  // TODO: Determine actual checked state based on selected role/user permissions
                  const isChecked = permission.category === "Usuarios"; // Example logic
                  return (
                    <div key={permission.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Checkbox id={permission.id} checked={isChecked} disabled /> {/* Disabled for now */}
                        <div>
                          <Label htmlFor={permission.id} className="font-medium">{permission.name}</Label>
                          <p className="text-xs text-slate-500">{permission.description}</p>
                        </div>
                      </div>
                      <Badge className="bg-slate-100 text-slate-800">{permission.category}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-[#005291]" onClick={() => { setIsRoleDialogOpen(false); /* TODO: Add save logic */ }}><Save className="mr-2 h-4 w-4" />Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}