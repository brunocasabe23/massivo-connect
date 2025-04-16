// Eliminado "use client"
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, ShieldCheck, UserPlus, Activity, Settings, Search, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // Asegurarse que esté importado
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChartPlaceholder from "@/components/dashboard/chart-placeholder"; // Ajustar ruta
import ChartCard from "@/components/dashboard/chart-card"; // Ajustar ruta
import ActivityFeed from "@/components/dashboard/activity-feed"; // Importar componente de actividad
import { Link } from "react-router-dom"; // Importar Link de React Router
import PermissionsDebug from "@/components/debug/PermissionsDebug"; // Importar componente de depuración
import { useToast } from "@/hooks/use-toast"; // Importar hook para mostrar notificaciones

// Importar tipos y servicios del dashboard
import {
  DashboardStats,
  User,
  Role,
  RecentActivity,
  loadAllDashboardData
} from "@/services/dashboard.service";

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Estados para almacenar los datos de la API
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsersThisMonth: 0,
    totalRoles: 0,
    totalPermissions: 0,
    loginActivity: 0,
  });

  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Función para cargar los datos del dashboard
  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Usar el servicio para cargar todos los datos en paralelo
      const { stats: statsData, users, roles: rolesData, activities } = await loadAllDashboardData();

      // Actualizar los estados con los datos recibidos
      setStats(statsData);
      setRecentUsers(users);
      setFilteredUsers(users); // Inicializar usuarios filtrados
      setRoles(rolesData);
      setRecentActivity(activities);

      if (isRefresh) {
        toast({
          title: "Datos actualizados",
          description: "Los datos del dashboard se han actualizado correctamente.",
        });
      }
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      toast({
        title: "Error al cargar datos",
        description: "No se pudieron cargar algunos datos del dashboard.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Efecto para cargar los datos al montar el componente
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Efecto para filtrar usuarios cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(recentUsers);
      return;
    }

    const filtered = recentUsers.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredUsers(filtered);
  }, [searchTerm, recentUsers]);

  // Renderizar un indicador de carga mientras se cargan los datos
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-slate-500">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="dashboard-header flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de Administración</h1>
          <p className="text-slate-500">Gestiona usuarios, roles y permisos del sistema</p>
        </div>
        <Button
          onClick={() => fetchDashboardData(true)}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Actualizando...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar datos</span>
            </>
          )}
        </Button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-slate-500">
                <Users className="mr-2 h-4 w-4 text-blue-500" />Total de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="flex items-center mt-1">
                <Badge className="bg-green-100 text-green-800 mr-2">{stats.activeUsers} activos</Badge>
                <Badge className="bg-slate-100 text-slate-800">{stats.inactiveUsers} inactivos</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-slate-500">
                <ShieldCheck className="mr-2 h-4 w-4 text-purple-500" />Roles y Permisos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRoles} roles</div>
              <p className="text-xs text-slate-500 mt-1">{stats.totalPermissions} permisos configurados</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-slate-500">
                <UserPlus className="mr-2 h-4 w-4 text-green-500" />Nuevos Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newUsersThisMonth}</div>
              <p className="text-xs text-slate-500 mt-1">Este mes</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-slate-500">
                <Activity className="mr-2 h-4 w-4 text-amber-500" />Actividad de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.loginActivity}%</div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                <Progress value={stats.loginActivity} className="h-2 [&>div]:bg-amber-500" /> {/* Usar Progress */}
              </div>
              <p className="text-xs text-slate-500 mt-1">Activos en la última semana</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de distribución de usuarios por rol */}
        <div className="lg:col-span-2">
          <ChartCard title="Distribución de Usuarios por Rol">
            <ChartPlaceholder height={300} color="#005291" />
          </ChartCard>
        </div>
        {/* Actividad reciente */}
        <div>
          <ActivityFeed activities={recentActivity} loading={refreshing} />
        </div>
      </div>

      {/* Secciones de Usuarios y Roles */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4 border">
          <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Usuarios Recientes</TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Roles del Sistema</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-0">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Usuarios Recientes</CardTitle>
              <div className="flex items-center">
                <div className="relative w-60">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuarios..."
                    className="pl-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* TODO: Abrir diálogo de nuevo usuario */}
                <Button className="ml-2" size="sm"><span><UserPlus className="mr-2 h-4 w-4" />Nuevo Usuario</span></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user, index) => (
                  <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {user.avatar ? <AvatarImage src={user.avatar} /> : <AvatarFallback className="bg-gradient-to-br from-blue-500 to-[#005291] text-white">{user.initials}</AvatarFallback>}
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={ user.role === "Administrador" ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100" : user.role === "Gerente" ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100" : user.role === "Supervisor" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100" }>{user.role}</Badge>
                      <Badge className={ user.status === "Activo" ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100" }>{user.status}</Badge>
                      <div className="text-xs text-muted-foreground w-24 text-right">{user.lastLogin}</div>
                      {/* TODO: Añadir botón/link para editar */}
                      <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link to="/admin/usuarios">
                  <Button variant="outline" size="sm">Ver todos los usuarios</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="roles" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Roles del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {roles.map((role, index) => (
                  <motion.div key={role.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${role.color}`}></div>
                        <span className="font-medium">{role.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{role.users} usuarios</span>
                        <span className="text-sm text-muted-foreground">{role.permissions} permisos</span>
                         {/* TODO: Añadir botón/link para editar */}
                        <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <Progress value={(role.permissions / stats.totalPermissions) * 100} className={`h-2 [&>div]:${role.color}`} /> {/* Usar Progress */}
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link to="/admin/roles">
                  <Button variant="outline" size="sm">Gestionar roles y permisos</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Componente de depuración - Solo para desarrollo */}
      <PermissionsDebug />
    </div>
  );
}