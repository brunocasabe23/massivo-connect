import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Save } from 'lucide-react';
import { User, Role, Permission, PermissionCategory } from '../types';

interface UserPermissionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
  roles: Role[];
  allPermissionsGrouped: PermissionCategory[];
  loadingPermissions: boolean;
  onSaveChanges: (roleId: string, directPermissions: string[]) => Promise<void>;
  fetchRolePermissions: (roleId: string) => Promise<Permission[]>;
  fetchUserDirectPermissions: (userId: string) => Promise<Permission[]>;
}

export const UserPermissionsDialog: React.FC<UserPermissionsDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedUser,
  roles,
  allPermissionsGrouped,
  loadingPermissions,
  onSaveChanges,
  fetchRolePermissions,
  fetchUserDirectPermissions
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<Permission[]>([]);
  const [directPermissionsSelection, setDirectPermissionsSelection] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Cargar permisos del rol y permisos directos cuando cambia el usuario seleccionado o el rol
  useEffect(() => {
    if (selectedUser && roles.length > 0) {
      // Encontrar el ID del rol actual del usuario
      const userRole = roles.find(role => role.name === selectedUser.role);
      if (userRole) {
        setSelectedRoleId(userRole.id);
        loadRolePermissions(userRole.id);
        loadUserDirectPermissions(selectedUser.id);
      }
    }
  }, [selectedUser, roles]);

  // Cargar permisos directos del usuario
  const loadUserDirectPermissions = async (userId: string) => {
    setLoading(true);
    try {
      const directPermissions = await fetchUserDirectPermissions(userId);

      // Crear un objeto con los permisos directos marcados como true
      const directPermissionsObj: Record<string, boolean> = {};
      directPermissions.forEach(permission => {
        directPermissionsObj[permission.id] = true;
      });

      setDirectPermissionsSelection(directPermissionsObj);
    } finally {
      setLoading(false);
    }
  };

  // Cargar permisos cuando cambia el rol seleccionado
  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    loadRolePermissions(roleId);
  };

  // Cargar permisos del rol
  const loadRolePermissions = async (roleId: string) => {
    setLoading(true);
    try {
      const permissions = await fetchRolePermissions(roleId);
      setSelectedRolePermissions(permissions);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio en permisos directos
  const handleDirectPermissionChange = (permissionId: string, checked: boolean | string) => {
    setDirectPermissionsSelection(prev => ({
      ...prev,
      [permissionId]: checked === true
    }));
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!selectedUser || !selectedRoleId) return;

    // Obtener solo los IDs de los permisos que están marcados Y NO son heredados del rol
    const directPermissionIdsToSave = Object.entries(directPermissionsSelection)
      .filter(([id, isSelected]) => isSelected && !selectedRolePermissions.some(rp => rp.id === id))
      .map(([id]) => id);

    await onSaveChanges(selectedRoleId, directPermissionIdsToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <Select
              value={selectedRoleId}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="w-60"><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name} ({role.permissions} permisos)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Permisos (Heredados y Directos)</h3>
            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
              {loading || loadingPermissions ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
              ) : allPermissionsGrouped.length > 0 ? (
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
                              disabled={isInherited}
                              onCheckedChange={(checked) => handleDirectPermissionChange(permission.id, checked)}
                            />
                            <div>
                              <Label htmlFor={`direct-${permission.id}`} className={`font-medium text-sm ${isInherited ? 'text-slate-500 italic' : ''}`}>
                                {permission.name} {isInherited && `(Heredado de rol: ${selectedUser?.role})`}
                              </Label>
                              <p className={`text-xs ${isInherited ? 'text-slate-400' : 'text-slate-500'}`}>
                                {permission.description}
                              </p>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-[#005291]" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
