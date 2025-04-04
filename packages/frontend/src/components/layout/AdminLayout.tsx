import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom"; // Usar React Router
import {
  ShoppingCart,
  Plane,
  Settings,
  LogOut,
  User,
  DollarSign,
  ChevronDown,
  BarChart3,
  ListIcon,
  Building,
  Home,
  Bell,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar, // Re-importar useSidebar
} from "@/components/ui/sidebar"; // Asegurarse que la ruta es correcta
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import AnimatedFlask from "@/components/animated-flask"; // Eliminado temporalmente
import { useAuth } from "@/contexts/AuthContext"; // Importar hook de autenticación

// Layout principal del panel de administración
export default function AdminLayout() {
  // El componente principal configura el Provider y el fondo
  return (
    <SidebarProvider className="bg-slate-50"> {/* Pasar clase de fondo aquí */}
      <AdminLayoutContent /> {/* El contenido real está en este componente hijo */}
    </SidebarProvider>
  );
}

// Componente hijo que renderiza el layout y puede usar el hook useSidebar
function AdminLayoutContent() {
  const { state, isMobile } = useSidebar(); // Obtener estado del sidebar

  // Determinar el margen izquierdo para el contenido principal
  // Usamos ml-[--sidebar-width] y ml-[--sidebar-width-icon] que son variables CSS definidas en sidebar.tsx
  // El prefijo 'md:' asegura que esto solo aplique en pantallas medianas y grandes (desktop)
  // En móvil (isMobile = true), no aplicamos margen ya que el sidebar es un Sheet superpuesto.
  const mainMarginLeftClass = !isMobile && state === 'expanded' ? 'md:ml-[var(--sidebar-width)]' : 'md:ml-[var(--sidebar-width-icon)]';

  return (
    // El div contenedor interno se elimina, SidebarProvider ya es el contenedor flex principal.
    // Usamos un Fragment <>...</> para devolver los elementos directamente.
    <>
      <MainSidebar /> {/* Componente Sidebar */}
      {/* Aplicar margen izquierdo dinámico y transición SOLO en desktop */}
      <main className={`flex-1 flex flex-col transition-[margin-left] ease-in-out duration-300 ${!isMobile ? mainMarginLeftClass : ''}`}>
        {/* Cabecera superior */}
        <div className="flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6 shadow-sm shrink-0">
          {/* Mostrar trigger SOLO en móvil */}
          {isMobile && <SidebarTrigger />}
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            <UserDropdown /> {/* Menú desplegable del usuario */}
          </div>
        </div>
        {/* Contenido principal de la página */}
        <div className="flex-grow p-4 md:p-6 overflow-auto"> {/* Permitir scroll en el contenido */}
          <Outlet /> {/* Aquí se renderizarán las rutas anidadas */}
        </div>
      </main>
    </>
  );
}

// Componente para el menú desplegable del usuario
function UserDropdown() {
  const { user, logout } = useAuth(); // Obtener usuario y función logout

  const handleLogout = () => {
    logout();
    // No necesitamos navigate aquí, ProtectedRoute se encargará de redirigir
  };

  return (
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            {/* TODO: Usar imagen real del usuario si está disponible */}
            <AvatarImage src="/placeholder-user.jpg" />
            {/* TODO: Usar iniciales reales del usuario */}
            <AvatarFallback>{user?.nombre ? user.nombre.substring(0, 2).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          {/* TODO: Crear ruta /perfil */}
          <Link to="/perfil">
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
           {/* TODO: Crear ruta /configuracion */}
          <Link to="/configuracion">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


// Componente Sidebar principal (adaptado de sidebar-navigation.tsx)
function MainSidebar() {
  const location = useLocation(); // Hook de React Router para obtener la ruta actual
  const pathname = location.pathname;
  const { logout, permisos } = useAuth(); // Obtener logout y permisos

  // Helper para verificar permisos con log de depuración
  const hasPermission = (key: string) => {
    const has = permisos.includes(key);
    console.log(`[MainSidebar] Verificando permiso '${key}': ${has ? 'SÍ' : 'NO'} (permisos: ${permisos.join(', ')})`);
    return has;
  };

  // Estados para controlar submenús abiertos
  // Inicializar basado en si la ruta actual incluye la base del submenú
  const [presupuestosOpen, setPresupuestosOpen] = React.useState(pathname.includes("/codigos-presupuestales"));
  const [adminOpen, setAdminOpen] = React.useState(pathname.includes("/admin"));

  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarHeader className="border-b border-slate-200">
        <div className="flex items-center gap-2 px-4 py-3">
          {/* <AnimatedFlask /> */} {/* Comentado temporalmente si causa problemas */}
          {/* TODO: Reemplazar con logo real */}
          <span className="text-xl font-bold text-[#005291]">SistemaPro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {/* Enlace Inicio */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
              <Link to="/dashboard">
                <Home className="h-5 w-5" />
                <span>Inicio</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Enlace Compras (Condicional) */}
          {hasPermission('ver_compras') && (
            <SidebarMenuItem>
              {/* TODO: Crear ruta /compras */}
              <SidebarMenuButton asChild isActive={pathname === "/compras"}>
                <Link to="/compras">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Compras</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Enlace Viáticos (Condicional) */}
          {hasPermission('ver_viaticos') && (
            <SidebarMenuItem>
              {/* TODO: Crear ruta /viaticos */}
              <SidebarMenuButton asChild isActive={pathname === "/viaticos"}>
                <Link to="/viaticos">
                  <Plane className="h-5 w-5" />
                  <span>Viáticos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Códigos Presupuestales con submenú (Condicional) */}
          {hasPermission('ver_codigos_presupuestales') && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.includes("/budget-codes") || pathname.includes("/codigos-presupuestales")} // Incluir ambas bases de ruta
                onClick={() => setPresupuestosOpen(!presupuestosOpen)}
              >
                <DollarSign className="h-5 w-5" />
                <span>Códigos Presupuestales</span>
                <ChevronDown
                  className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${
                    presupuestosOpen ? "rotate-180" : ""
                  }`}
                />
              </SidebarMenuButton>

              {presupuestosOpen && (
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    {/* Ruta ya existente */}
                    <SidebarMenuSubButton asChild isActive={pathname === "/budget-codes"}>
                      <Link to="/budget-codes">
                        <ListIcon className="h-4 w-4" />
                        <span>Lista de Códigos</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  {/* TODO: Añadir verificación de permisos para sub-items si es necesario */}
                  <SidebarMenuSubItem>
                    {/* TODO: Crear ruta /codigos-presupuestales/dashboard */}
                    <SidebarMenuSubButton asChild isActive={pathname === "/codigos-presupuestales/dashboard"}>
                      <Link to="/codigos-presupuestales/dashboard">
                        <BarChart3 className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    {/* TODO: Crear ruta /codigos-presupuestales/areas */}
                    <SidebarMenuSubButton asChild isActive={pathname === "/codigos-presupuestales/areas"}>
                      <Link to="/codigos-presupuestales/areas">
                        <Building className="h-4 w-4" />
                        <span>Áreas</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

          {/* Administración con submenú (Condicional) */}
          {hasPermission('ver_administracion') && ( // Usar un permiso general para la sección
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.includes("/admin")}
                onClick={() => setAdminOpen(!adminOpen)}
              >
                <ShieldCheck className="h-5 w-5" />
                <span>Administración</span>
                <ChevronDown
                  className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${
                    adminOpen ? "rotate-180" : ""
                  }`}
                />
              </SidebarMenuButton>

              {adminOpen && (
                <SidebarMenuSub>
                  {/* TODO: Añadir verificación de permisos para sub-items si es necesario */}
                  <SidebarMenuSubItem>
                    {/* TODO: Crear ruta /admin */}
                    <SidebarMenuSubButton asChild isActive={pathname === "/admin"}>
                      <Link to="/admin">
                        <BarChart3 className="h-4 w-4" />
                        <span>Panel Principal</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    {/* TODO: Crear ruta /admin/usuarios */}
                    <SidebarMenuSubButton asChild isActive={pathname === "/admin/usuarios"}>
                      <Link to="/admin/usuarios">
                        <Users className="h-4 w-4" />
                        <span>Usuarios</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    {/* TODO: Crear ruta /admin/roles */}
                    <SidebarMenuSubButton asChild isActive={pathname === "/admin/roles"}>
                      <Link to="/admin/roles">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Roles y Permisos</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

           {/* Enlace Perfil (Siempre visible?) */}
          <SidebarMenuItem>
             {/* TODO: Crear ruta /perfil */}
            <SidebarMenuButton asChild isActive={pathname === "/perfil"}>
              <Link to="/perfil">
                <User className="h-5 w-5" />
                <span>Perfil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

           {/* Enlace Configuración (Condicional?) */}
           {hasPermission('ver_configuracion') && ( // Ejemplo de permiso
             <SidebarMenuItem>
               {/* TODO: Crear ruta /configuracion */}
              <SidebarMenuButton asChild isActive={pathname === "/configuracion"}>
                <Link to="/configuracion">
                  <Settings className="h-5 w-5" />
                  <span>Configuración</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
           )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-200">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Usar la variable logout obtenida del hook */}
            <SidebarMenuButton onClick={logout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}