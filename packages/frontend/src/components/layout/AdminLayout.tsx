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
  ShieldCheck,
  Users,
  Activity,
  LayoutDashboard, // Icono para Centro de Compras
  Store, // Icono para Proveedores
} from "lucide-react";

import { NotificationsPopover } from "@/components/notifications/NotificationsPopover"; // Importar componente de notificaciones

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
  // Obtener el tema actual del contexto de autenticación
  const { theme } = useAuth();

  // El componente principal configura el Provider y el fondo
  return (
    <SidebarProvider className={theme === 'dark' ? 'bg-background' : 'bg-slate-50'}> {/* Aplicar clase de fondo según el tema */}
      <AdminLayoutContent /> {/* El contenido real está en este componente hijo */}
    </SidebarProvider>
  );
}

// Componente hijo que renderiza el layout y puede usar el hook useSidebar
function AdminLayoutContent() {
  const { state, isMobile } = useSidebar(); // Obtener estado del sidebar
  const { theme } = useAuth(); // Obtener el tema actual

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
        <div className={`flex h-16 items-center gap-4 border-b ${theme === 'dark' ? 'bg-card border-slate-700' : 'bg-white border-slate-200'} px-4 md:px-6 shadow-sm shrink-0`}>
          {/* Mostrar trigger SOLO en móvil */}
          {isMobile && <SidebarTrigger />}
          <div className="ml-auto flex items-center gap-4">
            <NotificationsPopover /> {/* Componente de notificaciones */}
            <UserDropdown /> {/* Menú desplegable del usuario */}
          </div>
        </div>
        {/* Contenido principal de la página */}
        <div className={`flex-grow p-4 md:p-6 overflow-auto ${theme === 'dark' ? 'bg-background' : ''}`}> {/* Permitir scroll en el contenido */}
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
            <AvatarImage src={user?.avatarUrl || "/placeholder-user.jpg"} />
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
          {/* Enlace a la página de configuración del perfil */}
          <Link to="/perfil">
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
    // console.log(`[MainSidebar] Verificando permiso '${key}': ${has ? 'SÍ' : 'NO'} (permisos: ${permisos.join(', ')})`); // Log de depuración eliminado
    return has;
  };

  // Estados para controlar submenús abiertos
  // Inicializar basado en si la ruta actual incluye la base del submenú
  const [presupuestosOpen, setPresupuestosOpen] = React.useState(pathname.includes("/codigos-presupuestales") || pathname.includes("/dashboard/presupuestos")); // Ajustado para incluir dashboard
  const [adminOpen, setAdminOpen] = React.useState(pathname.includes("/admin"));
  const [comprasOpen, setComprasOpen] = React.useState(pathname.includes("/compras")); // Estado para submenú Compras
  
  // Obtener el tema actual del contexto de autenticación
  const { theme } = useAuth();

  return (
    <Sidebar className={`border-r ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
      <SidebarHeader className={`border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2 px-4 py-3">
          {/* <AnimatedFlask /> */} {/* Comentado temporalmente si causa problemas */}
          {/* TODO: Reemplazar con logo real */}
          <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#005291]'}`}>SistemaPro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {/* Enlace Inicio */}
          <SidebarMenuItem>
            <Link to="/dashboard">
              <SidebarMenuButton isActive={pathname === "/dashboard"}>
                <Home className="h-5 w-5" />
                <span>Inicio</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          {/* Compras con submenú (Condicional) */}
          {hasPermission('ver_compras') && ( // Permiso general para la sección Compras
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.includes("/compras")} // Activo si la ruta empieza con /compras
                onClick={() => setComprasOpen(!comprasOpen)}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Compras</span>
                <ChevronDown
                  className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${
                    comprasOpen ? "rotate-180" : ""
                  }`}
                />
              </SidebarMenuButton>

              {comprasOpen && (
                <SidebarMenuSub>
                  {/* TODO: Añadir permiso específico para Solicitudes si es necesario */}
                  <SidebarMenuSubItem>
                    {/* Enlace a /compras (que ahora muestra Solicitudes por defecto) o /compras/solicitudes */}
                    <Link to="/compras/solicitudes"> {/* Puede seguir apuntando a la ruta explícita */}
                      <SidebarMenuSubButton isActive={pathname === "/compras" || pathname === "/compras/solicitudes"}> {/* Activo en la ruta base o la explícita */}
                        <ListIcon className="h-4 w-4" /> {/* Icono para Solicitudes */}
                        <span>Solicitudes</span>
                      </SidebarMenuSubButton>
                    </Link>
                  </SidebarMenuSubItem>

                  {/* Enlace Proveedores (Condicional dentro de Compras) */}
                  {hasPermission('ver_proveedores') && (
                    <SidebarMenuSubItem>
                      <Link to="/compras/proveedores"> {/* Ruta anidada */}
                        <SidebarMenuSubButton isActive={pathname === "/compras/proveedores"}> {/* Ruta anidada */}
                          <Store className="h-4 w-4" /> {/* Icono Proveedores */}
                          <span>Proveedores</span>
                        </SidebarMenuSubButton>
                      </Link>
                    </SidebarMenuSubItem>
                  )}

                  {/* Enlace Centro de Compras (Condicional dentro de Compras) */}
                  {hasPermission('ver_centro_compras') && (
                     <SidebarMenuSubItem>
                       <Link to="/compras/centro-compras"> {/* Ruta anidada */}
                         <SidebarMenuSubButton isActive={pathname === "/compras/centro-compras"}> {/* Ruta anidada */}
                           <LayoutDashboard className="h-4 w-4" /> {/* Icono Centro de Compras */}
                           <span>Centro de Compras</span>
                         </SidebarMenuSubButton>
                       </Link>
                     </SidebarMenuSubItem>
                  )}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}
          {/* Los enlaces originales de Centro de Compras y Proveedores se eliminan de aquí */}

          {/* Enlace Viáticos (Condicional) */}
          {hasPermission('ver_viaticos') && (
            <SidebarMenuItem>
              {/* TODO: Crear ruta /viaticos */}
            <Link to="/viaticos">
              <SidebarMenuButton isActive={pathname === "/viaticos"}>
                <Plane className="h-5 w-5" />
                <span>Viáticos</span>
              </SidebarMenuButton>
            </Link>
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
                  <Link to="/budget-codes">
                    <SidebarMenuSubButton isActive={pathname === "/budget-codes"}>
                      <ListIcon className="h-4 w-4" />
                      <span>Lista de Códigos</span>
                    </SidebarMenuSubButton>
                  </Link>
                  </SidebarMenuSubItem>
                  {/* TODO: Añadir verificación de permisos para sub-items si es necesario */}
                  <SidebarMenuSubItem>
                    {/* Enlace al nuevo dashboard de presupuestos */}
                  <Link to="/dashboard/presupuestos">
                    <SidebarMenuSubButton isActive={pathname === "/dashboard/presupuestos"}>
                      <BarChart3 className="h-4 w-4" />
                      <span>Dashboard</span>
                    </SidebarMenuSubButton>
                  </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    {/* TODO: Crear ruta /codigos-presupuestales/areas */}
                  <Link to="/codigos-presupuestales/areas">
                    <SidebarMenuSubButton isActive={pathname === "/codigos-presupuestales/areas"}>
                      <Building className="h-4 w-4" />
                      <span>Áreas</span>
                    </SidebarMenuSubButton>
                  </Link>
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
                  <Link to="/admin">
                    <SidebarMenuSubButton isActive={pathname === "/admin"}>
                      <BarChart3 className="h-4 w-4" />
                      <span>Panel Principal</span>
                    </SidebarMenuSubButton>
                  </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    {/* TODO: Crear ruta /admin/usuarios */}
                  <Link to="/admin/usuarios">
                    <SidebarMenuSubButton isActive={pathname === "/admin/usuarios"}>
                      <Users className="h-4 w-4" />
                      <span>Usuarios</span>
                    </SidebarMenuSubButton>
                  </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    {/* TODO: Crear ruta /admin/roles */}
                  <Link to="/admin/roles">
                    <SidebarMenuSubButton isActive={pathname === "/admin/roles"}>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Roles y Permisos</span>
                    </SidebarMenuSubButton>
                  </Link>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                  <Link to="/admin/actividades">
                    <SidebarMenuSubButton isActive={pathname === "/admin/actividades"}>
                      <Activity className="h-4 w-4" />
                      <span>Registro de Actividades</span>
                    </SidebarMenuSubButton>
                  </Link>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

           {/* Enlace Perfil eliminado, ya que está integrado en Configuración (/perfil) */}
          {/* <SidebarMenuItem>
             <SidebarMenuButton isActive={pathname === "/perfil"}>
              <User className="h-5 w-5" />
              <span>Perfil</span>
              <Link to="/perfil" className="absolute inset-0" aria-hidden="true" />
            </SidebarMenuButton>
          </SidebarMenuItem> */}


           {/* Enlace Configuración (Accesible a todos los usuarios logueados) */}
           {/* {hasPermission('ver_configuracion') && ( // Eliminada condición de permiso */}
             <SidebarMenuItem>
               {/* Enlace a la página de configuración del perfil */}
            <Link to="/perfil">
              <SidebarMenuButton isActive={pathname === "/perfil"}>
                <Settings className="h-5 w-5" />
                <span>Configuración</span>
              </SidebarMenuButton>
            </Link>
            </SidebarMenuItem>
           {/* )} */}
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