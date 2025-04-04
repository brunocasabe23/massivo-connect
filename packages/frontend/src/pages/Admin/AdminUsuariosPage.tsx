// Eliminado "use client"
import { useState, useEffect } from "react"; // Añadido useEffect
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
import { Skeleton } from "@/components/ui/skeleton"; // Importar Skeleton
import { callApi } from "@/services/api"; // Importar callApi

// TODO: Definir estas interfaces globalmente o importarlas
interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Viene de r.nombre
  // department: string; // Columna no existe en la consulta SQL
  status: string; // Viene de u.estado
  // lastLogin: string; // Columna no existe en la consulta SQL
  createdAt: string; // Viene de u.fecha_creacion
  avatar?: string; // Viene de u.avatar_url
  initials?: string; // Se generará en el frontend si avatar no existe
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

// Interfaz para agrupar permisos por categoría
interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

export default function AdminUsuariosPage() { // Nombre de componente cambiado
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined); // Estado para el rol seleccionado en el diálogo
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<Permission[]>([]); // Permisos heredados del ROL seleccionado
  const [allPermissionsGrouped, setAllPermissionsGrouped] = useState<PermissionCategory[]>([]); // Todos los permisos disponibles, agrupados
  const [directPermissionsSelection, setDirectPermissionsSelection] = useState<Record<string, boolean>>({}); // Estado para edición de permisos directos
  const [loadingPermissions, setLoadingPermissions] = useState(false); // Estado de carga para permisos (rol y directos)
  const [loadingAllPermissions, setLoadingAllPermissions] = useState(false); // Estado de carga para todos los permisos
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("todos");
  const [usuarios, setUsuarios] = useState<User[]>([]); // Estado para usuarios de la API
  const [rolesApi, setRolesApi] = useState<Role[]>([]); // Estado para roles de la API
  const [loading, setLoading] = useState(true); // Estado de carga general (usuarios/roles iniciales)
  const [error, setError] = useState<string | null>(null); // Estado de error general

  useEffect(() => {
    const fetchInitialData = async () => { // Renombrado
      setLoading(true); // Carga general
      setLoadingAllPermissions(true); // Carga de todos los permisos
      setError(null);
      try {
        // Obtener usuarios, roles y TODOS los permisos en paralelo
        const [usersResponse, rolesResponse, allPermissionsResponse] = await Promise.all([
          callApi('/admin/users'),
          callApi('/admin/roles'),
          callApi('/admin/permissions') // Endpoint para obtener todos los permisos
        ]);

        // Procesar usuarios y roles
        setUsuarios(Array.isArray(usersResponse) ? usersResponse : (usersResponse?.users && Array.isArray(usersResponse.users)) ? usersResponse.users : []);
        setRolesApi(Array.isArray(rolesResponse) ? rolesResponse : (rolesResponse?.roles && Array.isArray(rolesResponse.roles)) ? rolesResponse.roles : []);

        // Procesar y agrupar todos los permisos
        const allPermissions: Permission[] = Array.isArray(allPermissionsResponse) ? allPermissionsResponse : [];
        const grouped = allPermissions.reduce((acc: Record<string, PermissionCategory>, permission: Permission) => {
            const category = permission.category || 'General'; // Usar categoría inferida o 'General'
            if (!acc[category]) {
              acc[category] = { name: category, permissions: [] };
            }
            acc[category].permissions.push(permission); // Guardar permiso completo
            return acc;
          }, {} as Record<string, PermissionCategory>);
        setAllPermissionsGrouped(Object.values(grouped));

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos iniciales';
        setError(errorMessage);
        console.error("Error fetching initial data:", err);
      } finally {
        setLoading(false);
        setLoadingAllPermissions(false);
      }
    };

    fetchInitialData();
  }, []);

  // Datos de ejemplo eliminados
  /*
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
  ]; */ // Fin de datos de ejemplo eliminados

  // Eliminada la lista hardcodeada de roles

  // Eliminada la lista hardcodeada de permisos

  // Filtrar usuarios según la pestaña activa y el término de búsqueda
  const filteredUsers = usuarios // Cambiado de 'users' a 'usuarios' (estado)
    .filter((user) => {
      if (activeTab === "todos") return true;
      if (activeTab === "activos") return user.status === "Activo";
      if (activeTab === "inactivos") return user.status === "Inactivo";
      // TODO: Ajustar el filtro si el rol viene con otro nombre/ID desde la API
      if (activeTab === "administradores") return user.role === "Administrador";
      return true;
    })
    .filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) // Eliminada la condición de department
        // user.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const fetchRolePermissions = async (roleId: string | undefined) => {
    if (!roleId) {
      setSelectedRolePermissions([]); // Limpiar permisos si no hay rol
      return;
    }
    setLoadingPermissions(true);
    try {
      // Asegurarse que la API devuelve un array de Permisos
      const permissionsData: Permission[] = await callApi(`/admin/roles/${roleId}/permissions`);
      setSelectedRolePermissions(Array.isArray(permissionsData) ? permissionsData : []);
    } catch (err) {
      console.error(`Error fetching permissions for role ${roleId}:`, err);
      setSelectedRolePermissions([]); // Limpiar en caso de error
      // TODO: Mostrar error al usuario (ej: toast)
      alert(`Error al cargar permisos para el rol: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleOpenRoleDialog = async (user: User) => { // Hacerla async
    setSelectedUser(user);
    setIsRoleDialogOpen(true); // Abrir diálogo
    setLoadingPermissions(true); // Iniciar carga de permisos
    setDirectPermissionsSelection({}); // Limpiar selección anterior
    setSelectedRolePermissions([]); // Limpiar permisos de rol anteriores

    // Encontrar el ID del rol actual del usuario
    const currentRoleId = rolesApi.find(r => r.name === user.role)?.id;
    setSelectedRoleId(currentRoleId); // Establecer rol inicial

    try {
      // Cargar permisos del rol Y permisos directos en paralelo
      const [rolePerms, directPerms] = await Promise.all([
        currentRoleId ? callApi(`/admin/roles/${currentRoleId}/permissions`) : Promise.resolve([]), // Permisos del rol (si tiene rol)
        callApi(`/admin/users/${user.id}/direct-permissions`) // Permisos directos del usuario
      ]);

      const safeRolePerms: Permission[] = Array.isArray(rolePerms) ? rolePerms : [];
      const safeDirectPerms: Permission[] = Array.isArray(directPerms) ? directPerms : [];

      setSelectedRolePermissions(safeRolePerms); // Guardar permisos del rol

      // Inicializar el estado de selección de checkboxes
      // Marcar los que vienen del rol Y los que son directos
      const initialSelection: Record<string, boolean> = {};
      safeRolePerms.forEach(p => initialSelection[p.id] = true);
      safeDirectPerms.forEach(p => initialSelection[p.id] = true);
      setDirectPermissionsSelection(initialSelection);

    } catch (err) {
      console.error(`Error fetching permissions for user ${user.id}:`, err);
      alert(`Error al cargar permisos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      // Limpiar estados en caso de error
      setSelectedRolePermissions([]);
      setDirectPermissionsSelection({});
    } finally {
      setLoadingPermissions(false); // Terminar carga de permisos
    }
  };

  const getRoleBadgeColor = (role: string) => {
    // TODO: Ajustar los nombres de roles si son diferentes en la API
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
    // TODO: Ajustar los nombres de estados si son diferentes en la API
    return status === "Activo" ? "bg-green-100 text-green-800 border-green-300" : "bg-slate-100 text-slate-800 border-slate-300";
  };

  // TODO: Implementar lógica para Crear/Editar/Eliminar usuario usando callApi
  // TODO: Implementar lógica para Activar/Desactivar usuario usando callApi
  // TODO: Implementar lógica para Guardar cambios de rol/permisos usando callApi

  const handleSaveRole = async () => {
    if (!selectedUser || !selectedRoleId) {
      // TODO: Mostrar un mensaje de error más amigable (ej: usando toast)
      alert("Por favor, selecciona un usuario y un rol.");
      return;
    }

    // TODO: Añadir un indicador de carga mientras se guarda
    try {
      await callApi(`/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        data: { roleId: selectedRoleId }, // Enviar el ID del rol seleccionado
      });

      // Actualizar el rol del usuario en el estado local para reflejar el cambio inmediatamente
      setUsuarios(prevUsuarios =>
        prevUsuarios.map(user =>
          user.id === selectedUser.id
            ? { ...user, role: rolesApi.find(r => r.id === selectedRoleId)?.name || user.role } // Actualizar nombre del rol
            : user
        )
      );

      // TODO: Mostrar mensaje de éxito (ej: usando toast)
      alert("Rol actualizado exitosamente.");
      setIsRoleDialogOpen(false); // Cerrar el diálogo

    } catch (err) {
      // TODO: Mostrar mensaje de error (ej: usando toast)
      alert(`Error al actualizar rol: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      console.error("Error updating user role:", err);
    } finally {
      // TODO: Ocultar indicador de carga
    }
  };

  const handleDirectPermissionChange = (permissionId: string, checked: boolean | string) => {
    setDirectPermissionsSelection(prev => ({
        ...prev,
        [permissionId]: checked === true
    }));
  };

  const handleSaveDirectPermissions = async () => {
    if (!selectedUser) return;

    // Obtener solo los IDs de los permisos que están marcados Y NO son heredados del rol
    const directPermissionIdsToSave = Object.entries(directPermissionsSelection)
      .filter(([id, isSelected]) => isSelected && !selectedRolePermissions.some(rp => rp.id === id))
      .map(([id]) => id);

    // TODO: Añadir indicador de carga
    try {
      await callApi(`/admin/users/${selectedUser.id}/direct-permissions`, {
        method: 'PUT',
        data: { permissionIds: directPermissionIdsToSave },
      });

      // TODO: Actualizar permisos en el contexto de autenticación si es necesario
      // para que los cambios se reflejen inmediatamente en la UI protegida.
      // Esto podría requerir una función en AuthContext para recargar datos del usuario.

      alert(`Permisos directos para "${selectedUser.name}" actualizados.`);
      setIsRoleDialogOpen(false); // Cerrar diálogo

    } catch (err) {
      alert(`Error al actualizar permisos directos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      console.error(`Error updating direct permissions for user ${selectedUser.id}:`, err);
    } finally {
      // TODO: Ocultar indicador de carga
    }
  };

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
                    {/* Usar rolesApi del estado */}
                    {rolesApi.map((role: Role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
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
                  <TableHead className="w-12"><Checkbox /></TableHead><TableHead>Usuario</TableHead><TableHead>Correo</TableHead><TableHead>Rol</TableHead>{/* <TableHead>Departamento</TableHead> */}<TableHead>Estado</TableHead>{/* <TableHead>Último acceso</TableHead> */}<TableHead>Creado</TableHead><TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Mostrar Skeletons mientras carga
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  // Mostrar mensaje de error
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-red-500">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length > 0 ? (
                  // Mostrar usuarios filtrados
                  filteredUsers.map((user) => {
                    // Generar iniciales si no hay avatar y el nombre existe
                    const initials = !user.avatar && user.name
                      ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                      : '??';
                    return (
                      <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">{/* Ensure no whitespace between TableCells */}
                        <TableCell><Checkbox /></TableCell><TableCell><div className="flex items-center gap-3"><Avatar>{user.avatar ? <AvatarImage src={user.avatar} /> : <AvatarFallback className="bg-gradient-to-br from-blue-500 to-[#005291] text-white">{initials}</AvatarFallback>}</Avatar><div className="font-medium">{user.name}</div></div></TableCell><TableCell>{user.email}</TableCell><TableCell><Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge></TableCell>{/* <TableCell>{user.department}</TableCell> */}<TableCell><Badge className={getStatusBadgeColor(user.status)}>{user.status}</Badge></TableCell>{/* <TableCell>{user.lastLogin}</TableCell> */}<TableCell>{user.createdAt}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleOpenRoleDialog(user)}><ShieldCheck className="mr-2 h-4 w-4" />Gestionar permisos</DropdownMenuItem><DropdownMenuItem>{user.status === "Activo" ? (<span><UserX className="mr-2 h-4 w-4" />Desactivar</span>) : (<span><UserCheck className="mr-2 h-4 w-4" />Activar</span>)}</DropdownMenuItem><DropdownMenuItem className="text-red-500"><Trash className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  // Mostrar mensaje si no hay usuarios y no hay error/carga
                  <TableRow>
                    {/* Ajustar colSpan a 7 (9 - 2 columnas eliminadas) */}
                    <TableCell colSpan={7} className="h-24 text-center">
                      No se encontraron usuarios que coincidan con los filtros.
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
              <h3 className="text-sm font-medium">Rol actual: {selectedUser?.role || 'Ninguno'}</h3>
              {/* Conectar Select al estado selectedRoleId */}
              <Select
                value={selectedRoleId} // Usar el estado para el valor
                onValueChange={(value) => {
                  setSelectedRoleId(value); // Actualizar estado del ID seleccionado
                  fetchRolePermissions(value); // Cargar permisos para el nuevo rol
                }}
              >
                <SelectTrigger className="w-60"><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                <SelectContent>
                  {/* Usar rolesApi del estado */}
                  {rolesApi.map((role: Role) => <SelectItem key={role.id} value={role.id}>{role.name} ({role.permissions} permisos)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Permisos (Heredados y Directos)</h3>
              <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                {loadingAllPermissions || loadingPermissions ? ( // Mostrar skeleton si carga todos o los específicos
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                ) : allPermissionsGrouped.length > 0 ? (
                  // Iterar sobre TODOS los permisos disponibles, agrupados por categoría
                  allPermissionsGrouped.map((category) => (
                    <div key={category.name} className="p-3">
                      <h4 className="font-medium text-sm mb-2">{category.name}</h4>
                      <div className="pl-2 space-y-2">
                        {category.permissions.map((permission) => {
                          const isInherited = selectedRolePermissions.some(rp => rp.id === permission.id);
                          const isChecked = directPermissionsSelection[permission.id] || false;
                          return (
                            <div key={permission.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`direct-${permission.id}`}
                                checked={isChecked}
                                disabled={isInherited} // Deshabilitar si es heredado del rol
                                onCheckedChange={(checked) => handleDirectPermissionChange(permission.id, checked)}
                              />
                              <div>
                                <Label htmlFor={`direct-${permission.id}`} className={`font-medium text-sm ${isInherited ? 'text-slate-500 italic' : ''}`}>
                                  {permission.name} {isInherited && `(Heredado de rol: ${selectedUser?.role})`}
                                </Label>
                                <p className={`text-xs ${isInherited ? 'text-slate-400' : 'text-slate-500'}`}>{permission.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No hay permisos definidos en el sistema.
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancelar</Button>
            {/* Este botón ahora guarda tanto el rol seleccionado como los permisos directos */}
            <Button className="bg-[#005291]" onClick={async () => {
                await handleSaveRole();
                await handleSaveDirectPermissions();
              }}><Save className="mr-2 h-4 w-4" />Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}