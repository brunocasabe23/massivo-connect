// Eliminado "use client"
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, ShieldCheck, UserPlus, Activity, Settings, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // Asegurarse que esté importado
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChartPlaceholder from "@/components/dashboard/chart-placeholder"; // Ajustar ruta
import ChartCard from "@/components/dashboard/chart-card"; // Ajustar ruta
import { Link } from "react-router-dom"; // Importar Link de React Router

// TODO: Definir estas interfaces globalmente o importarlas
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  avatar?: string;
  initials: string;
}

interface Role {
  name: string;
  users: number;
  permissions: number;
  color: string;
}

interface RecentActivity {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  initials: string;
}

export default function AdminDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // TODO: Reemplazar con datos reales de la API
  // Datos de ejemplo
  const stats = {
    totalUsers: 124,
    activeUsers: 98,
    inactiveUsers: 26,
    newUsersThisMonth: 12,
    totalRoles: 6,
    totalPermissions: 24,
    loginActivity: 78, // porcentaje de usuarios activos en la última semana
  };

  const recentUsers: User[] = [
     { id: "USR-001", name: "Ana García", email: "ana.garcia@empresa.com", role: "Administrador", status: "Activo", lastLogin: "Hace 2 horas", avatar: "/placeholder-user.jpg", initials: "AG" },
     { id: "USR-002", name: "Carlos Méndez", email: "carlos.mendez@empresa.com", role: "Gerente", status: "Activo", lastLogin: "Hace 5 horas", avatar: "", initials: "CM" },
     { id: "USR-003", name: "Laura Martínez", email: "laura.martinez@empresa.com", role: "Usuario", status: "Inactivo", lastLogin: "Hace 3 días", avatar: "", initials: "LM" },
     { id: "USR-004", name: "Roberto Sánchez", email: "roberto.sanchez@empresa.com", role: "Supervisor", status: "Activo", lastLogin: "Hace 1 día", avatar: "", initials: "RS" },
  ];

  const roles: Role[] = [
    { name: "Administrador", users: 3, permissions: 24, color: "bg-red-500" },
    { name: "Gerente", users: 8, permissions: 18, color: "bg-blue-500" },
    { name: "Supervisor", users: 15, permissions: 12, color: "bg-green-500" },
    { name: "Contador", users: 6, permissions: 10, color: "bg-purple-500" },
    { name: "Analista", users: 22, permissions: 8, color: "bg-amber-500" },
    { name: "Usuario", users: 70, permissions: 5, color: "bg-slate-500" },
  ];

  const recentActivity: RecentActivity[] = [
    { id: 1, user: "Ana García", action: "creó un nuevo usuario", target: "Laura Martínez", time: "Hace 2 horas", initials: "AG" },
    { id: 2, user: "Carlos Méndez", action: "modificó permisos del rol", target: "Supervisor", time: "Hace 5 horas", initials: "CM" },
    { id: 3, user: "Sistema", action: "bloqueó al usuario", target: "Pedro Hernández", time: "Hace 1 día", initials: "S" },
    { id: 4, user: "Ana García", action: "asignó el rol de Gerente a", target: "Roberto Sánchez", time: "Hace 2 días", initials: "AG" },
  ];

  return (
    <div className="space-y-8">
      <div className="dashboard-header">
        <h1 className="text-2xl font-bold text-slate-800">Panel de Administración</h1>
        <p className="text-slate-500">Gestiona usuarios, roles y permisos del sistema</p>
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
          <Card className="h-full dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg font-medium">
                <Activity className="mr-2 h-5 w-5 text-[#005291]" />Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div key={activity.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }} className="flex items-start gap-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-[#005291] text-white text-xs">{activity.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm leading-none"><span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-medium">{activity.target}</span></p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Secciones de Usuarios y Roles */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4 bg-white border border-slate-200">
          <TabsTrigger value="users" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Usuarios Recientes</TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-[#005291] data-[state=active]:text-white">Roles del Sistema</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-0">
          <Card className="dashboard-card">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-medium">Usuarios Recientes</CardTitle>
              <div className="flex items-center">
                <div className="relative w-60">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input placeholder="Buscar usuarios..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                {/* TODO: Abrir diálogo de nuevo usuario */}
                <Button className="ml-2 bg-[#005291]" size="sm"><span><UserPlus className="mr-2 h-4 w-4" />Nuevo Usuario</span></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentUsers.map((user, index) => (
                  <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {user.avatar ? <AvatarImage src={user.avatar} /> : <AvatarFallback className="bg-gradient-to-br from-blue-500 to-[#005291] text-white">{user.initials}</AvatarFallback>}
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={ user.role === "Administrador" ? "bg-red-100 text-red-800" : user.role === "Gerente" ? "bg-blue-100 text-blue-800" : user.role === "Supervisor" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800" }>{user.role}</Badge>
                      <Badge className={ user.status === "Activo" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800" }>{user.status}</Badge>
                      <div className="text-xs text-slate-500 w-24 text-right">{user.lastLogin}</div>
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
          <Card className="dashboard-card">
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
                        <span className="text-sm text-slate-500">{role.users} usuarios</span>
                        <span className="text-sm text-slate-500">{role.permissions} permisos</span>
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
    </div>
  );
}