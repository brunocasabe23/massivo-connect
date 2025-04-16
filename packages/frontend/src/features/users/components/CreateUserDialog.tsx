import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { Role } from '../types';

interface CreateUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onCreateUser: (userData: any) => Promise<void>;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  isOpen,
  onOpenChange,
  roles,
  onCreateUser
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'it',
    role: '',
    status: 'activo',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setUserData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onCreateUser(userData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>Completa el formulario para crear un nuevo usuario en el sistema.</DialogDescription>
        </DialogHeader>
        {/* Formulario Crear Usuario */}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="col-span-4">Nombre completo</Label>
            <Input 
              id="name" 
              placeholder="Nombre y apellidos" 
              className="col-span-4" 
              value={userData.name}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="col-span-4">Correo electrónico</Label>
            <div className="relative col-span-4">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input 
                id="email" 
                type="email" 
                placeholder="correo@empresa.com" 
                className="pl-10" 
                value={userData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="col-span-2">Teléfono</Label>
            <Label htmlFor="department" className="col-span-2">Departamento</Label>
            <div className="relative col-span-2">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input 
                id="phone" 
                placeholder="+52 55 1234 5678" 
                className="pl-10" 
                value={userData.phone}
                onChange={handleInputChange}
              />
            </div>
            <Select 
              value={userData.department} 
              onValueChange={(value) => handleSelectChange('department', value)}
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Seleccionar departamento" />
              </SelectTrigger>
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
            <Select 
              value={userData.role} 
              onValueChange={(value) => handleSelectChange('role', value)}
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={userData.status} 
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
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
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="pl-10" 
                value={userData.password}
                onChange={handleInputChange}
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-[#005291]" onClick={handleSubmit}>Crear Usuario</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
