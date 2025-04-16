import React from 'react';
import { useOrders } from '../hooks/useOrders';
import { StatsCards } from '../components/StatsCards';
import { OrderFilters } from '../components/OrderFilters';
import { OrdersTable } from '../components/OrdersTable';

const UserDashboardPage: React.FC = () => {
  const { 
    loading, 
    filteredOrders, 
    stats, 
    filters, 
    loadData, 
    handleFilterChange 
  } = useOrders();

  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold text-slate-800">Mi Panel</h1>
        <p className="text-slate-500">Resumen de tus actividades de compra.</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <StatsCards stats={stats} />

      {/* Tabla de órdenes de compra */}
      <div className="bg-white rounded-lg border shadow-sm">
        <OrderFilters 
          loading={loading} 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          onRefresh={loadData} 
        />
        <OrdersTable loading={loading} orders={filteredOrders} />
      </div>
    </div>
  );
};

export default UserDashboardPage;
