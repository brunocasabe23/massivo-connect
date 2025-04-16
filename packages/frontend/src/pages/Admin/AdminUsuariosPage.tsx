// Eliminado "use client"
import { useState, useEffect, useMemo } from "react"; // Añadir useMemo
import { useToast } from "@/hooks/use-toast"; // Importar hook para notificaciones
import { formatDate } from "@/utils/date-utils"; // Importar utilidad para formatear fechas
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
  Phone, // Mantener por si se usa en el futuro
  Lock,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Skeleton } from "@/components/ui/skeleton";
import { callApi } from "@/services/api";

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Viene de r.nombre
  rol_id?: number; // Añadido desde la API (ur.rol_id)
  status: string; // Viene de u.estado
  createdAt: string; // Viene de u.fecha_creacion
  avatar?: string; // Viene de u.avatar_url
  initials?: string; // Generado en frontend
  area_id?: number | null; // Añadido desde la API (u.area_id)
  area_nombre?: string | null; // Añadido desde la API (a.nombre)
}

interface Role {
  id: string;
  name: string;
  permissions: number;
}

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

interface Area {
  id: number;
  nombre: string;
}

export default function AdminUsuariosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Para Crear/Editar Usuario
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false); // Para Gestionar Permisos
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // Para Permisos/Eliminar
  const [editingUser, setEditingUser] = useState<User | null>(null); // Para Crear/Editar
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<Permission[]>([]);
  const [allPermissionsGrouped, setAllPermissionsGrouped] = useState<PermissionCategory[]>([]);
  const [directPermissionsSelection, setDirectPermissionsSelection] = useState<Record<string, boolean>>({});
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [loadingAllPermissions, setLoadingAllPermissions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("todos");
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [rolesApi, setRolesApi] = useState<Role[]>([]);
  const [areasApi, setAreasApi] = useState<Area[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User & { password?: string; area_id?: number | null; selectedRoleIdForm?: string }>>({});

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setLoadingAllPermissions(true);
      setError(null);
      try {
        const [usersResponse, rolesResponse, allPermissionsResponse, areasResponse] = await Promise.all([
          callApi('/admin/users'),
          callApi('/admin/roles'),
          callApi('/admin/permissions'),
          callApi('/areas')
        ]);

        setUsuarios(Array.isArray(usersResponse) ? usersResponse : []);
        setRolesApi(Array.isArray(rolesResponse) ? rolesResponse : []);
        setAreasApi(Array.isArray(areasResponse) ? areasResponse : []);

        const allPermissions: Permission[] = Array.isArray(allPermissionsResponse) ? allPermissionsResponse : [];
        const grouped = allPermissions.reduce((acc: Record<string, PermissionCategory>, permission: Permission) => {
            const category = permission.category || 'General';
            if (!acc[category]) {
              acc[category] = { name: category, permissions: [] };
            }
            acc[category].permissions.push(permission);
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

  // --- Filtering Logic ---
  const filteredUsers = useMemo(() => {
    return usuarios
      .filter((user) => {
        if (activeTab === "activos" && user.status.toLowerCase() !== "activo") return false;
        if (activeTab === "inactivos" && user.status.toLowerCase() !== "inactivo") return false;
        if (activeTab === "administradores" && user.role !== "Administrador") return false; // Ajustar si el nombre del rol es diferente
        if (filterRole && filterRole !== 'all' && user.role !== filterRole) return false;
        if (filterStatus && filterStatus !== 'all' && user.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
        return true;
      })
      .filter(
        (user) =>
          (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [usuarios, activeTab, searchTerm, filterRole, filterStatus]);

  // --- Permission Handling ---
  const fetchRolePermissions = async (roleId: string | undefined) => {
    if (!roleId) {
      setSelectedRolePermissions([]);
      return;
    }
    setLoadingPermissions(true);
    try {
      const permissionsData: Permission[] = await callApi(`/admin/roles/${roleId}/permissions`);
      setSelectedRolePermissions(Array.isArray(permissionsData) ? permissionsData : []);
    } catch (err) {
      console.error(`Error fetching permissions for role ${roleId}:`, err);
      setSelectedRolePermissions([]);
      toast({ title: "Error", description: `Error al cargar permisos para el rol: ${err instanceof Error ? err.message : 'Error desconocido'}`, variant: "destructive" });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleOpenRoleDialog = async (user: User) => {
    setSelectedUser(user);
    // Preseleccionar el rol actual del usuario en el diálogo
    const currentRole = rolesApi.find(r => r.name === user.role); // Buscar por nombre ya que la lista inicial tiene nombre
    setSelectedRoleId(currentRole?.id); // Guardar el ID
    if (currentRole) {
      await fetchRolePermissions(currentRole.id); // Cargar permisos del rol actual por ID
    } else {
      setSelectedRolePermissions([]);
    }
    // Cargar permisos directos del usuario
    setLoadingPermissions(true); // Reutilizar estado de carga
    try {
        const directPermissions: Permission[] = await callApi(`/admin/users/${user.id}/direct-permissions`);
        const directSelection: Record<string, boolean> = {};
        directPermissions.forEach(p => { directSelection[p.id] = true; });
        setDirectPermissionsSelection(directSelection);
    } catch (err) {
        console.error(`Error fetching direct permissions for user ${user.id}:`, err);
        setDirectPermissionsSelection({});
        toast({ title: "Error", description: "No se pudieron cargar los permisos directos del usuario.", variant: "destructive" });
    } finally {
        setLoadingPermissions(false);
    }

    setIsRoleDialogOpen(true);
  };

  const handleDirectPermissionChange = (permissionId: string, checked: boolean | string) => {
    setDirectPermissionsSelection(prev => ({
        ...prev,
        [permissionId]: checked === true
    }));
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !selectedRoleId) {
      toast({ title: "Error", description: "Selecciona un usuario y un rol.", variant: "destructive" });
      return;
    }
    try {
      await callApi(`/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        data: { roleId: selectedRoleId },
      });
      // Actualizar localmente después de guardar rol y permisos
    } catch (err) {
      toast({ title: "Error", description: `Error al actualizar rol: ${err instanceof Error ? err.message : 'Error desconocido'}`, variant: "destructive" });
      console.error("Error updating user role:", err);
      throw err; // Relanzar para que handleSaveRoleAndPermissions lo capture
    }
  };

  const handleSaveDirectPermissions = async () => {
    if (!selectedUser) return;
    const directPermissionIdsToSave = Object.entries(directPermissionsSelection)
      .filter(([id, isSelected]) => isSelected && !selectedRolePermissions.some(rp => rp.id === id))
      .map(([id]) => id);
    try {
      await callApi(`/admin/users/${selectedUser.id}/direct-permissions`, {
        method: 'PUT',
        data: { permissionIds: directPermissionIdsToSave },
      });
      // Actualizar localmente después de guardar rol y permisos
    } catch (err) {
      toast({ title: "Error", description: `Error al actualizar permisos directos: ${err instanceof Error ? err.message : 'Error desconocido'}`, variant: "destructive" });
      console.error(`Error updating direct permissions for user ${selectedUser.id}:`, err);
      throw err; // Relanzar para que handleSaveRoleAndPermissions lo capture
    }
  };

  const handleSaveRoleAndPermissions = async () => {
      // TODO: Añadir indicador de carga
      try {
          await handleSaveRole(); // Guardar rol primero
          await handleSaveDirectPermissions(); // Luego guardar permisos directos

          // Si ambos tuvieron éxito, actualizar estado local y cerrar
          const roleName = rolesApi.find(r => r.id === selectedRoleId)?.name || selectedUser?.role || 'Desconocido';
          setUsuarios(prevUsuarios =>
            prevUsuarios.map(user =>
              user.id === selectedUser?.id ? { ...user, role: roleName } : user
            )
          );
          toast({ title: "Éxito", description: `Rol y permisos para ${selectedUser?.name} actualizados.` });
          setIsRoleDialogOpen(false);

      } catch (err) {
          // Los errores específicos ya se mostraron con toast en las funciones hijas
          console.error("Error guardando rol y/o permisos:", err);
      } finally {
          // TODO: Ocultar indicador de carga
      }
  };


  // --- User Actions (Activate, Deactivate, Delete) ---
  const handleActivateUser = async (userId: string) => {
    try {
      await callApi(`/admin/users/${userId}/status`, { method: 'PUT', data: { status: 'activo' } });
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, status: 'activo' } : u));
      toast({ title: "Usuario activado", description: "El usuario ha sido activado correctamente." });
    } catch (error) {
      console.error("Error activando usuario:", error);
      toast({ title: "Error al activar usuario", description: error instanceof Error ? error.message : "Error desconocido", variant: "destructive" });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await callApi(`/admin/users/${userId}/status`, { method: 'PUT', data: { status: 'inactivo' } });
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, status: 'inactivo' } : u));
      toast({ title: "Usuario desactivado", description: "El usuario ha sido desactivado correctamente." });
    } catch (error) {
      console.error("Error desactivando usuario:", error);
      toast({ title: "Error al desactivar usuario", description: error instanceof Error ? error.message : "Error desconocido", variant: "destructive" });
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const response = await callApi(`/admin/users/${selectedUser.id}`, { method: 'DELETE' });
      setUsuarios(prevUsuarios => prevUsuarios.filter(user => user.id !== selectedUser.id));
      toast({ title: "Usuario eliminado", description: response.message || `El usuario ${selectedUser.name} ha sido eliminado exitosamente.` });
      setIsDeleteDialogOpen(false);
    } catch (error: unknown) {
      console.error('Error al eliminar usuario:', error);
      let errorMessage = "Ha ocurrido un error al intentar eliminar el usuario.";
      let errorTitle = "Error al eliminar usuario";
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error as { response?: { data?: { error?: string; message?: string } } };
        if (responseError.response?.data?.error === 'user_has_orders') {
          errorTitle = "No se puede eliminar el usuario";
          errorMessage = responseError.response.data.message || "El usuario tiene órdenes de compra asociadas y no puede ser eliminado.";
        } else if (responseError.response?.data?.error === 'foreign_key_violation') {
           errorTitle = "No se puede eliminar el usuario";
           errorMessage = responseError.response.data.message || "El usuario tiene registros asociados que no se pueden eliminar automáticamente.";
        } else if (responseError.response?.data?.message) {
           errorMessage = responseError.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({ title: errorTitle, description: errorMessage, variant: "destructive" });
    }
  };

  // --- Create/Edit User Dialog ---
  const openNewUserDialog = () => {
    setEditingUser(null);
    setFormData({}); // Limpiar formulario
    setIsDialogOpen(true);
  };

  const openEditUserDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      ...user, // Precargar datos existentes
      selectedRoleIdForm: user.rol_id?.toString() || '', // Usar rol_id del usuario
      area_id: user.area_id, // Usar area_id del usuario
      password: '', // No precargar contraseña
    });
    setIsDialogOpen(true);
  };

  const handleSaveUser = async () => {
    // Validación
    if (!formData.name || !formData.email || (!editingUser && !formData.password) || !formData.selectedRoleIdForm) {
      toast({
        title: "Campos requeridos",
        description: `Por favor, completa Nombre, Email, Rol y ${editingUser ? '' : 'Contraseña'}.`,
        variant: "destructive",
      });
      return;
    }

    // TODO: Añadir indicador de carga
    try {
      let savedUser;
      const dataToSend: any = { // Usar 'any' temporalmente o crear interfaz específica
        nombre: formData.name,
        email: formData.email,
        rol_id: parseInt(formData.selectedRoleIdForm),
        area_id: formData.area_id || null,
        estado: formData.status || 'activo',
      };
      // Solo enviar contraseña si se está creando o si se ingresó una nueva al editar
      if (!editingUser || (editingUser && formData.password)) {
         if (!formData.password && !editingUser) { // Requerir contraseña solo al crear
             toast({ title: "Error", description: "La contraseña es requerida para crear un nuevo usuario.", variant: "destructive" });
             return;
         }
         if (formData.password) { // Solo incluir si no está vacía
            dataToSend.password = formData.password;
         }
      }


      if (editingUser) {
        savedUser = await callApi(`/admin/users/${editingUser.id}`, { method: 'PUT', data: dataToSend });
        toast({ title: "Usuario Actualizado", description: `El usuario ${savedUser.nombre} ha sido actualizado.` });
      } else {
        savedUser = await callApi('/admin/users', { method: 'POST', data: dataToSend });
        toast({ title: "Usuario Creado", description: `El usuario ${savedUser.nombre} ha sido creado exitosamente.` });
      }

      // Actualizar lista local
      const roleName = rolesApi.find(r => r.id === formData.selectedRoleIdForm)?.name || 'Desconocido';
      const areaNombre = areasApi.find(a => a.id === dataToSend.area_id)?.nombre || null; // Obtener nombre del área
      const updatedUser: User = {
          id: savedUser.id,
          name: savedUser.nombre,
          email: savedUser.email,
          role: roleName,
          rol_id: dataToSend.rol_id, // Guardar rol_id
          status: savedUser.estado,
          createdAt: editingUser ? editingUser.createdAt : savedUser.fecha_creacion,
          avatar: savedUser.avatar_url,
          area_id: dataToSend.area_id, // Guardar area_id
          area_nombre: areaNombre, // Guardar area_nombre
      };

      if (editingUser) {
          setUsuarios(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
      } else {
          setUsuarios(prev => [updatedUser, ...prev]);
      }

      setIsDialogOpen(false);
      setFormData({});
      setEditingUser(null);

    } catch (err) {
      console.error(`Error ${editingUser ? 'actualizando' : 'creando'} usuario:`, err);
      toast({
        title: `Error al ${editingUser ? 'actualizar' : 'crear'} usuario`,
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      // TODO: Ocultar indicador de carga
    }
  };

  // --- Badge Color Helpers ---
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Administrador": return "bg-red-100 text-red-800 border-red-300";
      // Añadir más colores si es necesario
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };
  const getStatusBadgeColor = (status: string) => {
    return status.toLowerCase() === "activo" ? "bg-green-100 text-green-800 border-green-300" : "bg-slate-100 text-slate-800 border-slate-300";
  };

  // --- Render ---
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
        <p className="text-slate-500">Administra los usuarios del sistema y sus roles</p>
      </div>

      {/* Botón Nuevo Usuario */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex-1"></div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingUser(null); }}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0 bg-[#005291] hover:bg-[#004277] transition-colors" onClick={openNewUserDialog}>
              <UserPlus className="mr-2 h-4 w-4" />Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
              <DialogDescription>
                {editingUser ? `Modifica los datos del usuario ${editingUser.name}.` : "Completa el formulario para crear un nuevo usuario."}
              </DialogDescription>
            </DialogHeader>
            {/* Formulario Crear/Editar Usuario */}
            <div className="grid gap-4 py-4">
              {/* Nombre */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="col-span-4">Nombre completo *</Label>
                <Input id="name" placeholder="Nombre y apellidos" className="col-span-4" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              {/* Email */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="col-span-4">Correo electrónico *</Label>
                <div className="relative col-span-4">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input id="email" type="email" placeholder="correo@empresa.com" className="pl-10" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
              </div>
              {/* Área */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="area" className="col-span-4">Área</Label>
                <Select value={formData.area_id?.toString() || ''} onValueChange={(value) => setFormData({...formData, area_id: value ? parseInt(value) : null })}>
                  <SelectTrigger className="col-span-4"><SelectValue placeholder="Seleccionar área" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin área</SelectItem>
                    {areasApi.map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>{area.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Rol y Estado */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="col-span-2">Rol *</Label>
                <Label htmlFor="status" className="col-span-2">Estado</Label>
                <Select value={formData.selectedRoleIdForm || ''} onValueChange={(value) => setFormData({...formData, selectedRoleIdForm: value})}>
                  <SelectTrigger className="col-span-2"><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                  <SelectContent>
                    {rolesApi.map((role: Role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={formData.status || 'activo'} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger className="col-span-2"><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Contraseña */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="col-span-4">{editingUser ? "Nueva Contraseña (opcional)" : "Contraseña *"}</Label>
                <div className="relative col-span-4">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder={editingUser ? "Dejar vacío para no cambiar" : "••••••••"} className="pl-10" value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})} required={!editingUser} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingUser(null); }}>Cancelar</Button>
              <Button className="bg-[#005291]" onClick={handleSaveUser}>{editingUser ? "Guardar Cambios" : "Crear Usuario"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs y Tabla */}
      <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* ... (TabsList y Filtros sin cambios) ... */}
         <TabsList className="mb-4 border">
           <TabsTrigger value="todos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Todos</TabsTrigger>
           <TabsTrigger value="activos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Activos</TabsTrigger>
           <TabsTrigger value="inactivos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Inactivos</TabsTrigger>
           <TabsTrigger value="administradores" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Administradores</TabsTrigger>
         </TabsList>

        <div className="bg-card rounded-lg border shadow-sm">
          {/* ... (Barra de búsqueda y filtros sin cambios) ... */}
           <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
             <div className="relative w-full md:w-80 mb-4 md:mb-0">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
               <Input placeholder="Buscar usuarios..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             <div className="flex items-center gap-2">
               {/* Popover para Filtros */}
               <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
                 <PopoverTrigger asChild>
                   <Button variant="outline" size="sm">
                     <Filter className="mr-2 h-4 w-4" />Filtrar
                     {(filterRole && filterRole !== 'all' || filterStatus && filterStatus !== 'all') && <span className="ml-1.5 h-2 w-2 rounded-full bg-blue-500"></span>} {/* Indicador de filtro activo */}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-60 p-4" align="end">
                   <div className="grid gap-4">
                     <div className="space-y-2">
                       <h4 className="font-medium leading-none">Filtros</h4>
                       <p className="text-sm text-muted-foreground">
                         Aplica filtros adicionales a la tabla.
                       </p>
                     </div>
                     <div className="grid gap-2">
                       {/* Filtro por Rol */}
                       <Label htmlFor="filter-role">Rol</Label>
                       <Select value={filterRole} onValueChange={setFilterRole}>
                         <SelectTrigger id="filter-role" className="h-8">
                           <SelectValue placeholder="Todos los roles" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todos los roles</SelectItem>
                           {rolesApi.map((role) => (
                             <SelectItem key={role.id} value={role.name}> {/* Usar nombre del rol como valor */}
                               {role.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       {/* Filtro por Estado */}
                       <Label htmlFor="filter-status">Estado</Label>
                       <Select value={filterStatus} onValueChange={setFilterStatus}>
                         <SelectTrigger id="filter-status" className="h-8">
                           <SelectValue placeholder="Todos los estados" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">Todos los estados</SelectItem>
                           <SelectItem value="activo">Activo</SelectItem>
                           <SelectItem value="inactivo">Inactivo</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="flex justify-end gap-2 mt-2">
                        <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => {
                           setFilterRole("all");
                           setFilterStatus("all");
                         }}
                         disabled={filterRole === "all" && filterStatus === "all"} // Deshabilitar si no hay filtros aplicados
                       >
                         Limpiar
                       </Button>
                       <Button size="sm" onClick={() => setIsFilterPopoverOpen(false)}>
                         Aplicar
                       </Button>
                     </div>
                   </div>
                 </PopoverContent>
               </Popover>
               {/* Fin Popover para Filtros */}
             </div>
           </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12"><Checkbox /></TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Área</TableHead> {/* Añadida columna Área */}
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell> {/* Skeleton para Área */}
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-red-500">Error: {error}</TableCell></TableRow> // Ajustar colSpan
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const initials = !user.avatar && user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                    return (
                      <TableRow key={user.id}>
                        <TableCell><Checkbox /></TableCell>
                        <TableCell><div className="flex items-center gap-3"><Avatar>{user.avatar ? <AvatarImage src={user.avatar} /> : <AvatarFallback className="bg-gradient-to-br from-blue-500 to-[#005291] text-white">{initials}</AvatarFallback>}</Avatar><div className="font-medium">{user.name}</div></div></TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell><Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge></TableCell>
                        <TableCell>{user.area_nombre || '-'}</TableCell> {/* Mostrar nombre del área */}
                        <TableCell><Badge className={getStatusBadgeColor(user.status)}>{user.status}</Badge></TableCell>
                        <TableCell>{formatDate(user.createdAt, false)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditUserDialog(user)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenRoleDialog(user)}><ShieldCheck className="mr-2 h-4 w-4" />Gestionar permisos</DropdownMenuItem>
                              {user.status === "Activo" ? (<DropdownMenuItem onClick={() => handleDeactivateUser(user.id)}><UserX className="mr-2 h-4 w-4" />Desactivar</DropdownMenuItem>) : (<DropdownMenuItem onClick={() => handleActivateUser(user.id)}><UserCheck className="mr-2 h-4 w-4" />Activar</DropdownMenuItem>)}
                              <DropdownMenuItem className="text-red-500" onClick={() => handleOpenDeleteDialog(user)}><Trash className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center">No se encontraron usuarios.</TableCell></TableRow> // Ajustar colSpan
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Tabs>

      {/* Diálogo Gestionar Permisos */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        {/* ... (Contenido del diálogo sin cambios) ... */}
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
             <Button className="bg-[#005291]" onClick={handleSaveRoleAndPermissions}><Save className="mr-2 h-4 w-4" />Guardar Cambios</Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Diálogo Eliminar Usuario */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        {/* ... (Contenido del diálogo sin cambios) ... */}
         <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>Eliminar Usuario</DialogTitle>
             <DialogDescription>
               {selectedUser && (
                 <>
                   ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser.name}</strong>?
                   <br /><br />
                   <div className="text-amber-600 bg-amber-50 p-3 rounded-md text-sm mb-2">
                     <strong>Advertencia:</strong> No se podrá eliminar el usuario si tiene órdenes de compra asociadas.
                   </div>
                   <div className="text-red-600 font-semibold">
                     Esta acción no se puede deshacer.
                   </div>
                 </>
               )}
             </DialogDescription>
           </DialogHeader>
           <DialogFooter className="mt-4">
             <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
             <Button variant="destructive" onClick={handleDeleteUser}>
               Eliminar Usuario
             </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
