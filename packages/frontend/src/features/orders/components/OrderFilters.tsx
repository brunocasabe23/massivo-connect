import React from 'react';
import { Search, RefreshCw, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PurchaseOrderFilters } from '@/services/orders.service';

interface OrderFiltersProps {
  loading: boolean;
  filters: PurchaseOrderFilters;
  onFilterChange: (key: keyof PurchaseOrderFilters, value: string) => void;
  onRefresh: () => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({ 
  loading, 
  filters, 
  onFilterChange, 
  onRefresh 
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
      <div className="relative w-full md:w-80 mb-4 md:mb-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar órdenes..."
          className="pl-10 w-full"
          value={filters.searchTerm || ''}
          onChange={(e) => onFilterChange('searchTerm', e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Select
          value={filters.estado || 'all'}
          onValueChange={(value) => onFilterChange('estado', value)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Nueva">Nueva</SelectItem>
            <SelectItem value="EnRevision">En Revisión</SelectItem>
            <SelectItem value="Aprobada">Aprobada</SelectItem>
            <SelectItem value="Rechazada">Rechazada</SelectItem>
            <SelectItem value="CierreSolicitado">Cierre Solicitado</SelectItem>
            <SelectItem value="Cerrada">Cerrada</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Actualizar
        </Button>
      </div>
    </div>
  );
};
