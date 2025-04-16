import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from 'lucide-react';
import { PurchaseOrder } from '@/services/orders.service';
import { formatDate, getStatusBadgeColor, formatStatus } from '../utils/format-utils';

interface OrdersTableProps {
  loading: boolean;
  orders: PurchaseOrder[];
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ loading, orders }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando órdenes...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">No se encontraron órdenes de compra.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Código Presupuestal</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>{order.descripcion}</TableCell>
              <TableCell>${order.monto.toLocaleString('es-MX')}</TableCell>
              <TableCell>{order.proveedor || '-'}</TableCell>
              <TableCell>{order.codigo_presupuestal || '-'}</TableCell>
              <TableCell>
                <Badge className={getStatusBadgeColor(order.estado)}>
                  {formatStatus(order.estado)}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(order.fecha_creacion)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
