// Eliminado "use client"
import { useState, useEffect } from "react";
import { formatDate } from '@/utils/date-utils';
import { motion } from "framer-motion";
import { ShieldCheck, Search, Plus, MoreHorizontal, Edit, Trash, Users, Save, Check } from "lucide-react"; // Quitar ChevronDown
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
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Usar lista simple
import { Skeleton } from "@/components/ui/skeleton";
import { callApi } from "@/services/api";
// import { useToast } from "@/hooks/use-toast";

interface Role {
  id: string;
  name: string;
  description?: string;
  users: number;
  permissions: number;
  createdAt: string;
  updatedAt?: string;
}

interface Permission {
  id: string;
  name: string;
  category?: string;
  description: string;
  clave?: string;
}

interface PermissionCategory {
    name: string;
    permissions: Permission[];
}

export default function AdminRolesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolesData, setRolesData] = useState<Role[]>([]);
  const [permissionsData, setPermissionsData] = useState<PermissionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({});
  // const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rolesResponse, permissionsResponse] = await Promise.all([
          callApi('/admin/roles'),
          callApi('/admin/permissions')
        ]);

        setRolesData(Array.isArray(rolesResponse) ? rolesResponse : (rolesResponse?.roles && Array.isArray(rolesResponse.roles)) ? rolesResponse.roles : []);

        const allPermissions = Array.isArray(permissionsResponse) ? permissionsResponse : (permissionsResponse?.permissions && Array.isArray(permissionsResponse.permissions)) ? permissionsResponse.permissions : [];

        const groupedPermissions = (allPermissions as Permission[]).reduce((acc: Record<string, PermissionCategory>, permission: Permission) => {
          const category = permission.category || 'Sin categoría';
          if (!acc[category]) {
            acc[category] = { name: category, permissions: [] };
          }
          acc[category].permissions.push({ ...permission, id: permission.id, name: permission.name });
          return acc;
        }, {} as Record<string, PermissionCategory>);

        setPermissionsData(Object.values(groupedPermissions));

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos';
        setError(errorMessage);
        console.error("Error fetching roles/permissions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRoles = rolesData.filter(
    (role) =>
      (role.name && role.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenPermissionDialog = async (role: Role) => { // Hacerla async
    setSelectedRole(role);
    setIsPermissionDialogOpen(true); // Abrir diálogo primero
    setSelectedPermissions({}); // Limpiar estado mientras carga
    // TODO: Añadir indicador de carga específico para permisos del rol
    try {
      // Llamar a la API para obtener los permisos específicos de este rol
      const currentPermissions: Permission[] = await callApi(`/admin/roles/${role.id}/permissions`);
      // Crear el estado inicial de selectedPermissions basado en los permisos actuales
      const initialSelected: Record<string, boolean> = {};
      if (Array.isArray(currentPermissions)) {
        currentPermissions.forEach(perm => {
          initialSelected[perm.id] = true; // Marcar como seleccionados los permisos que ya tiene
        });
      }
      setSelectedPermissions(initialSelected); // Establecer estado inicial
    } catch (err) {
      console.error(`Error fetching permissions for role ${role.id}:`, err);
      // TODO: Mostrar error al usuario
      alert(`Error al cargar los permisos del rol: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      setSelectedPermissions({}); // Dejar vacío en caso de error
    } finally {
       // TODO: Ocultar indicador de carga
    }
  };

  const handleNewRolePermissionChange = (permissionId: string, checked: boolean | string) => {
      setSelectedPermissions(prev => ({
          ...prev,
          [permissionId]: checked === true
      }));
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      alert("El nombre del rol es obligatorio.");
      return;
    }

    const permissionIds = Object.entries(selectedPermissions)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);

    try {
      const newRoleResponse = await callApi('/admin/roles', {
        method: 'POST',
        data: {
          name: newRoleName,
          description: newRoleDescription,
          permissionIds: permissionIds,
        }
      });

      if (newRoleResponse && newRoleResponse.id) {
         const roleToAdd = {
             ...newRoleResponse,
             users: 0,
             permissions: permissionIds.length
         };
         setRolesData(prevRoles => [...prevRoles, roleToAdd]);
      } else {
         console.warn("La API no devolvió el rol creado, se recomienda recargar la lista.");
      }

      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedPermissions({});
      setIsDialogOpen(false);

      alert("Rol creado exitosamente");

    } catch (err) {
      console.error("Error creating role:", err);
      alert(`Error al crear rol: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
       // TODO: Ocultar indicador de carga
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el rol "${roleName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    // TODO: Añadir indicador de carga
    try {
      await callApi(`/admin/roles/${roleId}`, {
        method: 'DELETE',
      });

      // Eliminar el rol del estado local
      setRolesData(prevRoles => prevRoles.filter(role => role.id !== roleId));

      // TODO: Mostrar mensaje de éxito (ej: toast)
      alert(`Rol "${roleName}" eliminado exitosamente.`);

    } catch (err) {
      // TODO: Mostrar mensaje de error (ej: toast)
      alert(`Error al eliminar rol: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      console.error(`Error deleting role ${roleId}:`, err);
    } finally {
      // TODO: Ocultar indicador de carga
    }
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return; // No debería pasar si el diálogo está abierto

    const permissionIdsToSave = Object.entries(selectedPermissions)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id); // Obtener los IDs de los permisos marcados

    // TODO: Añadir indicador de carga
    try {
      await callApi(`/admin/roles/${selectedRole.id}/permissions`, {
        method: 'PUT',
        data: { permissionIds: permissionIdsToSave },
      });

      // Actualizar el conteo de permisos en el estado local (opcional pero bueno para UI)
      setRolesData(prevRoles =>
        prevRoles.map(role =>
          role.id === selectedRole.id
            ? { ...role, permissions: permissionIdsToSave.length }
            : role
        )
      );

      // TODO: Mostrar mensaje de éxito (ej: toast)
      alert(`Permisos para el rol "${selectedRole.name}" actualizados exitosamente.`);
      setIsPermissionDialogOpen(false); // Cerrar diálogo

    } catch (err) {
      // TODO: Mostrar mensaje de error (ej: toast)
      alert(`Error al actualizar permisos: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      console.error(`Error updating permissions for role ${selectedRole.id}:`, err);
    } finally {
      // TODO: Ocultar indicador de carga
    }
  };

  // TODO: Implementar handleEditRolePermissions

  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold">Roles y Permisos</h1>
        <p className="text-muted-foreground">Administra los roles del sistema y sus permisos asociados</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex-1"></div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
                setNewRoleName("");
                setNewRoleDescription("");
                setSelectedPermissions({});
            }
        }}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0">
              <span><Plus className="mr-2 h-4 w-4" />Nuevo Rol</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Rol</DialogTitle>
              <DialogDescription>Completa el formulario para crear un nuevo rol en el sistema.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-role-name" className="col-span-4">Nombre del rol</Label>
                <Input
                  id="new-role-name"
                  placeholder="Ej: Supervisor de Ventas"
                  className="col-span-4"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-role-description" className="col-span-4">Descripción</Label>
                <Textarea
                  id="new-role-description"
                  placeholder="Describe las funciones y responsabilidades de este rol"
                  className="col-span-4"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Permisos iniciales</h3>
                <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                  {loading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : error ? (
                    <p className="text-red-500 text-sm text-center py-4">Error al cargar permisos: {error}</p>
                  ) : permissionsData.length > 0 ? (
                    // Usar lista simple en lugar de Accordion
                    <div className="space-y-4">
                      {permissionsData.map((category) => (
                        <div key={category.name}>
                          <h4 className="font-medium mb-2">{category.name}</h4>
                          <div className="pl-4 space-y-2">
                            {category.permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`create-${permission.id}`} // Prefijo para evitar colisión
                                  checked={selectedPermissions[permission.id] || false}
                                  onCheckedChange={(checked) => handleNewRolePermissionChange(permission.id, checked)}
                                />
                                <div>
                                  <Label htmlFor={`create-${permission.id}`} className="font-medium text-sm">{permission.name}</Label>
                                  <p className="text-xs text-muted-foreground">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                     <p className="text-slate-500 text-sm text-center py-4">No hay permisos disponibles.</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-[#005291]" onClick={handleCreateRole}>Crear Rol</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
                <ShieldCheck className="mr-2 h-4 w-4 text-primary" />Total de Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12 inline-block"/> : error ? '-' : rolesData.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Roles configurados en el sistema</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
                <Check className="mr-2 h-4 w-4 text-green-500" />Total de Permisos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12 inline-block"/> : error ? '-' : permissionsData.reduce((total, category) => total + category.permissions.length, 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Permisos disponibles para asignar</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-muted-foreground">
                <Users className="mr-2 h-4 w-4 text-blue-500" />Usuarios Asignados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: La API de roles debería devolver el conteo de usuarios por rol */}
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12 inline-block"/> : error ? '-' : rolesData.reduce((total, role) => total + (role.users || 0), 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Usuarios con roles asignados</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
          <div className="relative w-full md:w-80 mb-4 md:mb-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar roles..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>ID</TableHead><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead>Usuarios</TableHead><TableHead>Permisos</TableHead><TableHead>Creado</TableHead><TableHead>Actualizado</TableHead><TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                 <TableRow>
                   <TableCell colSpan={8} className="h-24 text-center text-red-500">
                     Error: {error}
                   </TableCell>
                 </TableRow>
              ) : filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.id}</TableCell>
                    <TableCell><Badge variant="secondary">{role.name}</Badge></TableCell>
                    <TableCell>{role.description || '-'}</TableCell>
                    <TableCell><div className="flex items-center"><Users className="h-4 w-4 mr-2 text-muted-foreground" /><span>{role.users || 0}</span></div></TableCell>
                    <TableCell><div className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground" /><span>{role.permissions || 0}</span></div></TableCell>
                    <TableCell>{formatDate(role.createdAt)}</TableCell>
                    <TableCell>{role.updatedAt ? formatDate(role.updatedAt) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><span><Edit className="mr-2 h-4 w-4" />Editar</span></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenPermissionDialog(role)}><span><ShieldCheck className="mr-2 h-4 w-4" />Gestionar permisos</span></DropdownMenuItem>
                          <DropdownMenuItem><span><Users className="mr-2 h-4 w-4" />Ver usuarios</span></DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteRole(role.id, role.name)}><span><Trash className="mr-2 h-4 w-4" />Eliminar</span></DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                   <TableCell colSpan={8} className="h-24 text-center">
                     No se encontraron roles.
                   </TableCell>
                 </TableRow>
              )}
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
              Configura los permisos para el rol <strong>{selectedRole?.name || ''}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : error ? (
                <p className="text-red-500 text-sm text-center py-4">Error al cargar permisos: {error}</p>
              ) : permissionsData.length > 0 ? (
                 // Reemplazar Accordion con lista simple para evitar error
                 <div className="space-y-4">
                   {permissionsData.map((category) => (
                     <div key={category.name}>
                       <h4 className="font-medium mb-2">{category.name}</h4>
                       <div className="pl-4 space-y-2">
                         {category.permissions.map((permission) => {
                           // Usar el estado selectedPermissions para determinar si está chequeado
                           const isChecked = selectedPermissions[permission.id] || false;
                           return (
                             <div key={permission.id} className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <Checkbox
                                   id={`perm-${permission.id}`}
                                   checked={isChecked}
                                   onCheckedChange={(checked) => handleNewRolePermissionChange(permission.id, checked)} // Usar la función existente
                                   // Ya no está deshabilitado
                                 />
                                 <div>
                                   <Label htmlFor={`perm-${permission.id}`} className="font-medium text-sm">{permission.name}</Label>
                                   <p className="text-xs text-slate-500">{permission.description}</p>
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   ))}
                 </div>
              ) : (
                 <p className="text-slate-500 text-sm text-center py-4">No hay permisos disponibles.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-[#005291]" onClick={handleSaveRolePermissions}><Save className="mr-2 h-4 w-4" />Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}