import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, ListChecks, Clock } from 'lucide-react'; // Example icons

const UserDashboardPage: React.FC = () => {
  // TODO: Fetch user-specific data (e.g., recent purchases, pending approvals)

  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold text-slate-800">Mi Panel</h1>
        <p className="text-slate-500">Resumen de tus actividades de compra.</p>
      </div>

      {/* Placeholder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-slate-500">
              <ShoppingCart className="mr-2 h-4 w-4 text-blue-500" /> Mis Compras Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div> {/* Placeholder */}
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
            <div className="text-2xl font-bold">12</div> {/* Placeholder */}
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
            <div className="text-2xl font-bold">2</div> {/* Placeholder */}
             <p className="text-xs text-slate-500 mt-1">Esperando aprobación</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder Table/List */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <h3 className="text-lg font-semibold mb-4">Últimas Órdenes</h3>
        <p className="text-slate-600">Aquí se mostrará una tabla o lista de las últimas órdenes de compra del usuario...</p>
        {/* TODO: Implementar tabla/lista con datos reales */}
      </div>
    </div>
  );
};

export default UserDashboardPage;