import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, UserCheck, UserX } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { UserFilters } from '../components/UserFilters';
import { UsersTable } from '../components/UsersTable';
import { CreateUserDialog } from '../components/CreateUserDialog';
import { DeleteUserDialog } from '../components/DeleteUserDialog';
import { UserPermissionsDialog } from '../components/UserPermissionsDialog';
import { ToggleUserStatusDialog } from '../components/ToggleUserStatusDialog';
import { User } from '../types';

export default function AdminUsuariosPage() {
  const {
    loading,
    error,
    usuarios,
    filteredUsers,
    rolesApi,
    searchTerm,
    filterRole,
    filterStatus,
    isFilterPopoverOpen,
    activeTab,
    allPermissionsGrouped,
    loadingAllPermissions,
    setSearchTerm,
    setFilterRole,
    setFilterStatus,
    setIsFilterPopoverOpen,
    setActiveTab,
    deleteUser,
    updateUserRole,
    fetchRolePermissions,
    fetchUserDirectPermissions,
    updateUserDirectPermissions,
    toggleUserStatus
  } = useUsers();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isToggleStatusDialogOpen, setIsToggleStatusDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Manejadores de eventos
  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenPermissionsDialog = (user: User) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  };

  const handleOpenToggleStatusDialog = (user: User) => {
    setSelectedUser(user);
    setIsToggleStatusDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const success = await deleteUser(selectedUser.id);
    if (success) {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSavePermissions = async (roleId: string, directPermissions: string[]) => {
    if (!selectedUser) return;

    // Actualizar rol
    const roleSuccess = await updateUserRole(selectedUser.id, roleId);

    // Actualizar permisos directos
    const permissionsSuccess = await updateUserDirectPermissions(selectedUser.id, directPermissions);

    if (roleSuccess && permissionsSuccess) {
      setIsPermissionsDialogOpen(false);
    }
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;

    const success = await toggleUserStatus(selectedUser.id);
    if (success) {
      setIsToggleStatusDialogOpen(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    // Implementar la lógica para crear un usuario
    console.log('Crear usuario:', userData);
    // TODO: Implementar la llamada a la API
  };

  const handleClearFilters = () => {
    setFilterRole("all");
    setFilterStatus("all");
  };

  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
        <p className="text-slate-500">Administra los usuarios del sistema y sus roles</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex-1"></div>
        <Button
          className="mt-4 md:mt-0 bg-[#005291] hover:bg-[#004277] transition-colors"
          onClick={handleOpenCreateDialog}
        >
          <UserPlus className="mr-2 h-4 w-4" />Nuevo Usuario
        </Button>
      </div>

      <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 border">
          <TabsTrigger value="todos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Todos</TabsTrigger>
          <TabsTrigger value="activos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Activos</TabsTrigger>
          <TabsTrigger value="inactivos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Inactivos</TabsTrigger>
          <TabsTrigger value="administradores" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Administradores</TabsTrigger>
        </TabsList>

        <div className="bg-card rounded-lg border shadow-sm">
          <UserFilters
            searchTerm={searchTerm}
            filterRole={filterRole}
            filterStatus={filterStatus}
            isFilterPopoverOpen={isFilterPopoverOpen}
            rolesApi={rolesApi}
            onSearchChange={setSearchTerm}
            onFilterRoleChange={setFilterRole}
            onFilterStatusChange={setFilterStatus}
            onFilterPopoverOpenChange={setIsFilterPopoverOpen}
            onClearFilters={handleClearFilters}
          />

          <UsersTable
            loading={loading}
            error={error}
            users={filteredUsers}
            onEditUser={(user) => console.log('Editar usuario:', user)}
            onManagePermissions={handleOpenPermissionsDialog}
            onToggleUserStatus={handleOpenToggleStatusDialog}
            onDeleteUser={handleOpenDeleteDialog}
          />
        </div>
      </Tabs>

      {/* Diálogos */}
      <CreateUserDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        roles={rolesApi}
        onCreateUser={handleCreateUser}
      />

      <DeleteUserDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedUser={selectedUser}
        onConfirmDelete={handleDeleteUser}
      />

      <UserPermissionsDialog
        isOpen={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
        selectedUser={selectedUser}
        roles={rolesApi}
        allPermissionsGrouped={allPermissionsGrouped}
        loadingPermissions={loadingAllPermissions}
        onSaveChanges={handleSavePermissions}
        fetchRolePermissions={fetchRolePermissions}
        fetchUserDirectPermissions={fetchUserDirectPermissions}
      />

      <ToggleUserStatusDialog
        isOpen={isToggleStatusDialogOpen}
        onOpenChange={setIsToggleStatusDialogOpen}
        selectedUser={selectedUser}
        onConfirmToggle={handleToggleUserStatus}
      />
    </div>
  );
}
