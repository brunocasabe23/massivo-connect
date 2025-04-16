import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'; // Asumiendo ruta correcta para componentes UI base
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast'; // Asumiendo ruta correcta
import { User, Role, Area } from '../../types/admin'; // Usar ruta relativa como alternativa
import { Mail, Lock, Eye, EyeOff, Save } from 'lucide-react';

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit: User | null;
  roles: Role[];
  areas: Area[]; // Añadir áreas
  onUpdateUser: (userId: string, userData: any) => Promise<boolean>; // Función para guardar cambios
}

export function EditUserDialog({
  isOpen,
  onOpenChange,
  userToEdit,
  roles,
  areas,
  onUpdateUser,
}: EditUserDialogProps) {
  const [formData, setFormData] = useState<Partial<User & { password?: string; selectedRoleIdForm?: string }>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userToEdit) {
      // Precargar formulario cuando el usuario a editar cambia
      setFormData({
        ...userToEdit,
        selectedRoleIdForm: userToEdit.rol_id?.toString() || '',
        area_id: userToEdit.area_id,
        password: '', // No precargar contraseña
      });
    } else {
      // Limpiar formulario si no hay usuario para editar (aunque este diálogo es solo para editar)
      setFormData({});
    }
  }, [userToEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev: Partial<User & { password?: string; selectedRoleIdForm?: string }>) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof typeof formData, value: string | number | null) => {
    setFormData((prev: Partial<User & { password?: string; selectedRoleIdForm?: string }>) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (!userToEdit) return;

    // Validación básica
    if (!formData.name || !formData.email || !formData.selectedRoleIdForm || !formData.status) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa Nombre, Email, Rol y Estado.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const dataToSend: any = {
      nombre: formData.name,
      email: formData.email,
      rol_id: parseInt(formData.selectedRoleIdForm),
      area_id: formData.area_id || null,
      estado: formData.status,
    };

    // Solo enviar contraseña si se ingresó una nueva
    if (formData.password) {
      dataToSend.password = formData.password;
    }

    try {
      const success = await onUpdateUser(userToEdit.id, dataToSend);
      if (success) {
        toast({ title: "Usuario Actualizado", description: `El usuario ${formData.name} ha sido actualizado.` });
        onOpenChange(false); // Cerrar diálogo si la actualización fue exitosa
      }
      // El hook useUsers se encargará de mostrar errores si success es false
    } catch (error) {
      // Este catch es por si onUpdateUser lanza una excepción inesperada
      console.error("Error inesperado al actualizar usuario:", error);
      toast({ title: "Error", description: "Ocurrió un error inesperado.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Resetear formulario y estado al cerrar
  const handleOpenChangeWithReset = (open: boolean) => {
    if (!open) {
      setFormData({});
      setShowPassword(false);
      setIsSaving(false);
    }
    onOpenChange(open);
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeWithReset}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            {userToEdit ? `Modifica los datos del usuario ${userToEdit.name}.` : ""}
          </DialogDescription>
        </DialogHeader>
        {userToEdit && (
          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="col-span-4">Nombre completo *</Label>
              <Input id="name" placeholder="Nombre y apellidos" className="col-span-4" value={formData.name || ''} onChange={handleInputChange} required />
            </div>
            {/* Email */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="col-span-4">Correo electrónico *</Label>
              <div className="relative col-span-4">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input id="email" type="email" placeholder="correo@empresa.com" className="pl-10" value={formData.email || ''} onChange={handleInputChange} required />
              </div>
            </div>
            {/* Área */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="area_id" className="col-span-4">Área</Label>
              <Select value={formData.area_id?.toString() || ''} onValueChange={(value) => handleSelectChange('area_id', value ? parseInt(value) : null)}>
                <SelectTrigger className="col-span-4"><SelectValue placeholder="Seleccionar área" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin área</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id.toString()}>{area.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Rol y Estado */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="selectedRoleIdForm" className="col-span-2">Rol *</Label>
              <Label htmlFor="status" className="col-span-2">Estado</Label>
              <Select value={formData.selectedRoleIdForm || ''} onValueChange={(value) => handleSelectChange('selectedRoleIdForm', value)}>
                <SelectTrigger className="col-span-2"><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                <SelectContent>
                  {roles.map((role: Role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={formData.status || 'activo'} onValueChange={(value) => handleSelectChange('status', value)}>
                <SelectTrigger className="col-span-2"><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  {/* Podríamos añadir 'pendiente' si es relevante */}
                </SelectContent>
              </Select>
            </div>
            {/* Contraseña */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="col-span-4">Nueva Contraseña (opcional)</Label>
              <div className="relative col-span-4">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Dejar vacío para no cambiar" className="pl-10" value={formData.password || ''} onChange={handleInputChange} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChangeWithReset(false)} disabled={isSaving}>Cancelar</Button>
          <Button className="bg-[#005291]" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Guardando..." : <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}