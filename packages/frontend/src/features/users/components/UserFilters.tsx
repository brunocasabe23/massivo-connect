import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Role } from '../types';

interface Area {
  id: number;
  nombre: string;
}

interface UserFiltersProps {
  searchTerm: string;
  filterRole: string;
  filterStatus: string;
  filterArea: string;
  isFilterPopoverOpen: boolean;
  rolesApi: Role[];
  areasApi: Area[];
  onSearchChange: (value: string) => void;
  onFilterRoleChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onFilterAreaChange: (value: string) => void;
  onFilterPopoverOpenChange: (open: boolean) => void;
  onClearFilters: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  filterRole,
  filterStatus,
  filterArea,
  isFilterPopoverOpen,
  rolesApi,
  areasApi,
  onSearchChange,
  onFilterRoleChange,
  onFilterStatusChange,
  onFilterAreaChange,
  onFilterPopoverOpenChange,
  onClearFilters
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
      <div className="relative w-full md:w-80 mb-4 md:mb-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar usuarios..."
          className="pl-10 w-full"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        {/* Popover para Filtros */}
        <Popover open={isFilterPopoverOpen} onOpenChange={onFilterPopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />Filtrar
              {(filterRole && filterRole !== 'all' || filterStatus && filterStatus !== 'all' || filterArea && filterArea !== 'all') &&
                <span className="ml-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
              }
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
                <Select value={filterRole} onValueChange={onFilterRoleChange}>
                  <SelectTrigger id="filter-role" className="h-8">
                    <SelectValue placeholder="Todos los roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {rolesApi.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Filtro por Estado */}
                <Label htmlFor="filter-status">Estado</Label>
                <Select value={filterStatus} onValueChange={onFilterStatusChange}>
                  <SelectTrigger id="filter-status" className="h-8">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                {/* Filtro por Área */}
                <Label htmlFor="filter-area">Área</Label>
                <Select value={filterArea} onValueChange={onFilterAreaChange}>
                  <SelectTrigger id="filter-area" className="h-8">
                    <SelectValue placeholder="Todas las áreas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las áreas</SelectItem>
                    <SelectItem value="none">Sin área</SelectItem>
                    {(areasApi || []).map((area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  disabled={filterRole === "all" && filterStatus === "all" && filterArea === "all"}
                >
                  Limpiar
                </Button>
                <Button size="sm" onClick={() => onFilterPopoverOpenChange(false)}>
                  Aplicar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
