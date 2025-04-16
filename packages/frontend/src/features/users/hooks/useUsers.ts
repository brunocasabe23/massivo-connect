import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { callApi } from "@/services/api";
import { User, Role, Permission, PermissionCategory, UserFilters, Area } from "../types"; // Añadir Area
export function useUsers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("todos");
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [rolesApi, setRolesApi] = useState<Role[]>([]);
  const [areasApi, setAreasApi] = useState<Area[]>([]); // Añadir estado para áreas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPermissionsGrouped, setAllPermissionsGrouped] = useState<PermissionCategory[]>([]);
  const [loadingAllPermissions, setLoadingAllPermissions] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Función para cargar datos iniciales
  const fetchInitialData = async () => {
    setLoading(true);
    setLoadingAllPermissions(true);
    setError(null);
    try {
      // Obtener usuarios, roles, TODOS los permisos y áreas en paralelo
      const [usersResponse, rolesResponse, allPermissionsResponse, areasResponse] = await Promise.all([
        callApi('/admin/users'),
        callApi('/admin/roles'),
        callApi('/admin/permissions'),
        callApi('/areas') // Añadir llamada para obtener áreas
      ]);

      // Procesar usuarios y roles
      setUsuarios(Array.isArray(usersResponse) ? usersResponse : (usersResponse?.users && Array.isArray(usersResponse.users)) ? usersResponse.users : []);
      setRolesApi(Array.isArray(rolesResponse) ? rolesResponse : (rolesResponse?.roles && Array.isArray(rolesResponse.roles)) ? rolesResponse.roles : []);
      setAreasApi(Array.isArray(areasResponse) ? areasResponse : []); // Guardar áreas en el estado

      // Procesar y agrupar todos los permisos
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
      toast({
        title: "Error al cargar datos",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingAllPermissions(false);
    }
  };

  // Filtrar usuarios según la pestaña activa y los filtros
  const filteredUsers = usuarios
    .filter((user) => {
      // Filtro por pestaña activa
      if (activeTab === "activos" && user.status !== "Activo") return false;
      if (activeTab === "inactivos" && user.status !== "Inactivo") return false;
      if (activeTab === "administradores" && user.role !== "Administrador") return false;

      // Filtro por Rol (del Popover)
      if (filterRole && filterRole !== 'all' && user.role !== filterRole) return false;

      // Filtro por Estado (del Popover)
      if (filterStatus && filterStatus !== 'all' && user.status !== filterStatus) return false;

      return true; // Pasa todos los filtros de selección
    })
    .filter(
      (user) =>
        // Filtro por término de búsqueda
        !searchTerm || (
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

  // Función para eliminar un usuario
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const response = await callApi(`/admin/users/${userId}`, {
        method: 'DELETE'
      });

      // Actualizar la lista de usuarios eliminando el usuario borrado
      setUsuarios(prevUsuarios => prevUsuarios.filter(user => user.id !== userId));

      // Mostrar mensaje de éxito
      toast({
        title: "Usuario eliminado",
        description: response.message || "El usuario ha sido eliminado exitosamente.",
      });

      return true;
    } catch (error: unknown) {
      console.error('Error al eliminar usuario:', error);

      let errorMessage = "Ha ocurrido un error al intentar eliminar el usuario.";
      let errorTitle = "Error al eliminar usuario";

      // Comprobar si el error tiene una estructura esperada
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

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });

      return false;
    }
  };

  // Función para actualizar el rol de un usuario
  const updateUserRole = async (userId: string, roleId: string): Promise<boolean> => {
    try {
      await callApi(`/admin/users/${userId}/role`, {
        method: 'PUT',
        data: { roleId },
      });

      // Actualizar el rol del usuario en el estado local
      setUsuarios(prevUsuarios =>
        prevUsuarios.map(user =>
          user.id === userId
            ? { ...user, role: rolesApi.find(r => r.id === roleId)?.name || user.role }
            : user
        )
      );

      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado exitosamente.",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al actualizar rol",
        description: errorMessage,
        variant: "destructive"
      });
      console.error("Error updating user role:", err);
      return false;
    }
  };

  // Función para obtener los permisos de un rol
  const fetchRolePermissions = async (roleId: string | undefined): Promise<Permission[]> => {
    if (!roleId) {
      return [];
    }

    try {
      const permissionsData: Permission[] = await callApi(`/admin/roles/${roleId}/permissions`);
      return Array.isArray(permissionsData) ? permissionsData : [];
    } catch (err) {
      console.error(`Error fetching permissions for role ${roleId}:`, err);
      toast({
        title: "Error al cargar permisos",
        description: `No se pudieron cargar los permisos para el rol seleccionado: ${err instanceof Error ? err.message : 'Error desconocido'}`,
        variant: "destructive"
      });
      return [];
    }
  };

  // Función para obtener los permisos directos de un usuario
  const fetchUserDirectPermissions = async (userId: string): Promise<Permission[]> => {
    if (!userId) {
      return [];
    }

    try {
      const permissionsData: Permission[] = await callApi(`/admin/users/${userId}/direct-permissions`);
      return Array.isArray(permissionsData) ? permissionsData : [];
    } catch (err) {
      console.error(`Error fetching direct permissions for user ${userId}:`, err);
      toast({
        title: "Error al cargar permisos directos",
        description: `No se pudieron cargar los permisos directos del usuario: ${err instanceof Error ? err.message : 'Error desconocido'}`,
        variant: "destructive"
      });
      return [];
    }
  };

  // Función para actualizar los permisos directos de un usuario
  const updateUserDirectPermissions = async (userId: string, permissionIds: string[]): Promise<boolean> => {
    try {
      await callApi(`/admin/users/${userId}/direct-permissions`, {
        method: 'PUT',
        data: { permissionIds },
      });

      toast({
        title: "Permisos actualizados",
        description: "Los permisos directos del usuario han sido actualizados exitosamente.",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al actualizar permisos",
        description: errorMessage,
        variant: "destructive"
      });
      console.error(`Error updating direct permissions for user ${userId}:`, err);
      return false;
    }
  };

  // Función para activar/desactivar un usuario
  const toggleUserStatus = async (userId: string): Promise<boolean> => {
    try {
      // Encontrar el usuario para determinar el nuevo estado
      const user = usuarios.find(u => u.id === userId);
      if (!user) {
        toast({
          title: "Error",
          description: "Usuario no encontrado.",
          variant: "destructive"
        });
        return false;
      }

      // Determinar el nuevo estado (inverso al actual), ignorando mayúsculas/minúsculas
      const newStatus = user.status.toLowerCase() === 'activo' ? 'Inactivo' : 'Activo';

      // Llamar al endpoint para cambiar el estado
      const response = await callApi(`/admin/users/${userId}/status`, {
        method: 'PUT',
        data: { status: newStatus },
      });

      // Actualizar el estado del usuario en el estado local
      setUsuarios(prevUsuarios =>
        prevUsuarios.map(u =>
          u.id === userId
            ? { ...u, status: newStatus }
            : u
        )
      );

      toast({
        title: newStatus === 'Activo' ? "Usuario activado" : "Usuario desactivado",
        description: response.message || `El usuario ha sido ${newStatus === 'Activo' ? 'activado' : 'desactivado'} exitosamente.`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: "Error al cambiar estado del usuario",
        description: errorMessage,
        variant: "destructive"
      });
      console.error(`Error toggling user status for user ${userId}:`, err);
      return false;
    }
  };

  // Función para actualizar los datos de un usuario
  const updateUser = async (userId: string, userData: any): Promise<boolean> => {
    try {
      const savedUser = await callApi(`/admin/users/${userId}`, {
        method: 'PUT',
        data: userData,
      });

      // Actualizar la lista de usuarios localmente
      setUsuarios(prevUsuarios =>
        prevUsuarios.map(user =>
          user.id === userId
            ? {
                ...user, // Mantener datos existentes que no se actualizan (como createdAt)
                name: savedUser.name, // Usar datos devueltos por la API
                email: savedUser.email,
                role: savedUser.role,
                rol_id: savedUser.rol_id,
                status: savedUser.status,
                area_id: savedUser.area_id,
                area_nombre: savedUser.area_nombre,
                avatar: savedUser.avatar, // Actualizar avatar si la API lo devuelve
              }
            : user
        )
      );

      // El toast de éxito se mostrará desde el diálogo
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al actualizar usuario';
      toast({
        title: "Error al actualizar usuario",
        description: errorMessage,
        variant: "destructive"
      });
      console.error(`Error updating user ${userId}:`, err);
      return false;
    }
  };

  return {
    // Estado
    loading,
    error,
    usuarios,
    filteredUsers,
    rolesApi,
    areasApi, // Exponer áreas
    searchTerm,
    filterRole,
    filterStatus,
    isFilterPopoverOpen,
    activeTab,
    allPermissionsGrouped,
    loadingAllPermissions,

    // Setters
    setSearchTerm,
    setFilterRole,
    setFilterStatus,
    setIsFilterPopoverOpen,
    setActiveTab,

    // Acciones
    fetchInitialData,
    deleteUser,
    updateUserRole,
    fetchRolePermissions,
    fetchUserDirectPermissions,
    updateUserDirectPermissions,
    toggleUserStatus,
    updateUser // Exponer nueva función
  };
}
