import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Building, ArrowDownRight, Wallet, Search, Filter } from "lucide-react"; // Añadir Search, Filter
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { callApi } from "@/services/api";
import { Tabs, /* TabsContent, */ TabsList, TabsTrigger } from "@/components/ui/tabs"; // TabsContent no se usa aquí
import { Input } from "@/components/ui/input"; // Añadir Input
import { Button } from "@/components/ui/button"; // Añadir Button
import CodigoCard from "@/components/dashboard/presupuesto/CodigoCard"; // Importar CodigoCard
import { Area } from "@/services/areas.service"; // Importar Area

// Interfaces
interface BudgetSummary {
  totalPresupuestado: number;
  totalDisponible: number;
  codigosActivos: number;
  areasAsociadasCount: number;
  tendenciaMensual: number;
}

interface BudgetByDepartment {
  departamento: string;
  total: number;
  disponible: number;
}

// Usar la interfaz existente de BudgetCodesPage
interface CodigoPresupuestal {
  id: number;
  nombre: string;
  descripcion: string;
  monto_presupuesto: number;
  fecha_inicio_vigencia: string | null;
  fecha_fin_vigencia: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  monto_disponible?: number;
  estado?: 'Activo' | 'Agotado' | 'Suspendido';
  areas_asociadas?: Area[];
}


export default function BudgetDashboardPage() {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [budgetByDept, setBudgetByDept] = useState<BudgetByDepartment[]>([]);
  const [budgetCodes, setBudgetCodes] = useState<CodigoPresupuestal[]>([]); // Estado para códigos
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingChartData, setLoadingChartData] = useState(true);
  const [loadingCodes, setLoadingCodes] = useState(true); // Estado de carga para códigos
  const [searchTerm, setSearchTerm] = useState(""); // Para buscador de códigos
  const [activeTab, setActiveTab] = useState("todos"); // Para tabs de códigos

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const data = await callApi('/dashboard/budget/summary');
        setSummary(data);
      } catch (error) {
        console.error("Error fetching budget summary:", error);
        setSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    };

    const fetchChartData = async () => {
      setLoadingChartData(true);
      try {
        const data = await callApi('/dashboard/budget/by-department');
        setBudgetByDept(data);
      } catch (error) {
        console.error("Error fetching budget by department:", error);
        setBudgetByDept([]);
      } finally {
        setLoadingChartData(false);
      }
    };

    const fetchAllBudgetCodes = async () => {
        setLoadingCodes(true);
        try {
          const data = await callApi('/budget-codes');
          const codesWithData = await Promise.all(data.map(async (code: CodigoPresupuestal) => {
            let associatedAreas: Area[] = [];
            try {
              associatedAreas = await callApi(`/budget-codes/${code.id}/areas`);
            } catch (areaError) {
              if (!(areaError as any)?.message?.includes('404')) {
                console.error(`Error fetching areas for code ${code.id}:`, areaError);
              }
            }
            return {
              ...code,
              // monto_disponible y estado ya vienen del backend
              areas_asociadas: associatedAreas,
            };
          }));
          setBudgetCodes(codesWithData);
        } catch (error) {
          console.error("Error al obtener códigos presupuestales:", error);
          setBudgetCodes([]);
        } finally {
            setLoadingCodes(false);
        }
      };

    fetchSummary();
    fetchChartData();
    fetchAllBudgetCodes(); // Cargar códigos para las tarjetas
  }, []);

  const formatCurrency = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const COLORS = ['#005291', '#0077cc', '#5ba3e0', '#8ec9f5', '#c1e4ff'];

  // Filtrar códigos para las tarjetas
  const filteredCodes = useMemo(() => {
    return budgetCodes
      .filter((c) => {
        if (activeTab === "todos") return true;
        if (activeTab === "activos") return c.estado === "Activo";
        if (activeTab === "agotados") return c.estado === "Agotado";
        if (activeTab === "suspendidos") return c.estado === "Suspendido";
        return true;
      })
      .filter((c) =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [budgetCodes, activeTab, searchTerm]);


  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard de Presupuestos</h1>
        <p className="text-slate-500">Visualiza y analiza los códigos presupuestales por área</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* ... tarjetas ... */}
         <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Presupuestado</CardTitle>
            <div className="p-2 rounded-full bg-blue-100 text-blue-800">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingSummary ? 'Cargando...' : summary ? formatCurrency(summary.totalPresupuestado) : 'N/A'}</div>
            <p className="text-xs text-slate-500 mt-1">{summary?.codigosActivos ?? '-'} códigos activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Disponible</CardTitle>
            <div className="p-2 rounded-full bg-green-100 text-green-800">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingSummary ? 'Cargando...' : summary ? formatCurrency(summary.totalDisponible) : 'N/A'}</div>
            <p className="text-xs text-slate-500 mt-1">
              {summary && summary.totalPresupuestado > 0
                ? `${((summary.totalDisponible / summary.totalPresupuestado) * 100).toFixed(1)}% del total`
                : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Áreas Asociadas</CardTitle>
            <div className="p-2 rounded-full bg-purple-100 text-purple-800">
              <Building className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingSummary ? 'Cargando...' : summary ? summary.areasAsociadasCount : 'N/A'}</div>
            {/* <p className="text-xs text-slate-500 mt-1">En X departamentos</p> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tendencia Mensual</CardTitle>
            <div className={`p-2 rounded-full ${summary && summary.tendenciaMensual < 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary && summary.tendenciaMensual < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {loadingSummary ? 'Cargando...' : summary ? `${summary.tendenciaMensual.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Comparado con mes anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Presupuesto por Departamento</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loadingChartData ? <div className="h-[300px] flex items-center justify-center text-slate-500">Cargando gráfico...</div> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetByDept}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="departamento" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="total" fill="#005291" name="Presupuestado" />
                  <Bar dataKey="disponible" fill="#8ec9f5" name="Disponible" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
             {loadingChartData ? <div className="h-[300px] flex items-center justify-center text-slate-500">Cargando datos...</div> : (
               <div className="space-y-4">
                  {budgetByDept.length > 0 ? budgetByDept.map((item, index) => {
                    const percentage = summary && summary.totalPresupuestado > 0 ? (item.total / summary.totalPresupuestado) * 100 : 0;
                    return (
                      <div key={item.departamento} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.departamento}</span>
                          <span className="font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Disponible: {formatCurrency(item.disponible)}</span>
                          <span>Total: {formatCurrency(item.total)}</span>
                        </div>
                      </div>
                    );
                  }) : <p className="text-sm text-slate-500">No hay datos de presupuesto por departamento.</p>}
                </div>
             )}
          </CardContent>
        </Card>
      </div>

       {/* Sección Códigos Presupuestales */}
       <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Códigos Presupuestales</h2>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <div className="relative w-full md:w-60">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Buscar códigos..."
                  className="pl-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 bg-white border border-slate-200">
              <TabsTrigger value="todos" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Todos</TabsTrigger>
              <TabsTrigger value="activos" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Activos</TabsTrigger>
              <TabsTrigger value="agotados" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Agotados</TabsTrigger>
              <TabsTrigger value="suspendidos" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Suspendidos</TabsTrigger>
            </TabsList>

            {loadingCodes ? <div className="text-center p-10 text-slate-500">Cargando códigos...</div> : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCodes.map((codigo) => (
                      <CodigoCard
                        key={codigo.id}
                        id={codigo.id}
                        codigo={codigo.nombre} // Usar nombre como código
                        descripcion={codigo.descripcion}
                        monto={codigo.monto_presupuesto}
                        disponible={codigo.monto_disponible || 0}
                        estado={codigo.estado || 'N/A'}
                        areas={codigo.areas_asociadas || []}
                      />
                    ))}
                 </div>
            )}
          </Tabs>
        </div>

    </div>
  );
}