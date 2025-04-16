import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, ListChecks, Clock } from 'lucide-react';
import { OrderStats } from '../hooks/useOrders';

interface StatsCardsProps {
  stats: OrderStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium text-slate-500">
            <ShoppingCart className="mr-2 h-4 w-4 text-blue-500" /> Mis Compras Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recientes}</div>
          <p className="text-xs text-slate-500 mt-1">Órdenes en los últimos 30 días</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium text-slate-500">
            <ListChecks className="mr-2 h-4 w-4 text-green-500" /> Compras Aprobadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.aprobadas}</div>
          <p className="text-xs text-slate-500 mt-1">Total histórico</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium text-slate-500">
            <Clock className="mr-2 h-4 w-4 text-orange-500" /> Compras Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendientes}</div>
          <p className="text-xs text-slate-500 mt-1">Esperando aprobación</p>
        </CardContent>
      </Card>
    </div>
  );
};
