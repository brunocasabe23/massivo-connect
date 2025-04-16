// packages/frontend/src/pages/Settings/UserProfileSettingsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Importar Input
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator"; // Importar Separator
import { useToast } from "@/hooks/use-toast";
import { callApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

// Definir UserSettings aquí si no está en un archivo global
interface UserSettings {
    theme: 'light' | 'dark';
    app_notifications_enabled: boolean;
    email_order_status_enabled: boolean;
}

// Definir la interfaz User completa para este componente
interface ExtendedUser {
    id: number;
    nombre: string;
    email: string;
    estado: string;
    rol: string;
    permisos: string[];
    avatar_url?: string;
    username?: string;
    biografia?: string;
}

// Definir tipo para datos de perfil editables
interface ProfileData {
    nombre: string;
    biografia?: string;
    // email no editable por ahora
}

// Definir tipo para datos de cambio de contraseña
interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const UserProfileSettingsPage: React.FC = () => {
    const { user: authUser, theme: initialTheme, updateTheme } = useAuth(); // Obtener usuario, tema y función de actualización
    const user = authUser as ExtendedUser; // Convertir a ExtendedUser
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [profileData, setProfileData] = useState<ProfileData>({ nombre: '', biografia: '' });
    const [passwordData, setPasswordData] = useState<PasswordChangeData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Cargar configuraciones y datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            setError(null);
            // Establecer datos de perfil desde el contexto
            if (user) {
                setProfileData({
                    nombre: user.nombre,
                    biografia: user.biografia || ''
                });
            }
            // Cargar configuraciones desde la API
            try {
                const data = await callApi('/users/me/settings') as UserSettings;
                setSettings(data);
            } catch (err) {
                console.error("Error fetching settings:", err);
                setError("No se pudieron cargar las configuraciones.");
                toast({
                    title: "Error de Carga",
                    description: "No se pudieron cargar las configuraciones.",
                    variant: "destructive",
                });
                // Fallback si falla la carga de settings
                 setSettings({
                     theme: initialTheme,
                     app_notifications_enabled: true,
                     email_order_status_enabled: true,
                 });
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [toast, initialTheme, user]); // Depender de user también

    // Manejar cambios en las configuraciones
    const handleSettingChange = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        setSettings(prev => {
            if (!prev) return null;
            const newSettings = { ...prev, [key]: value };
            if (key === 'theme') {
                // Aplicar el tema inmediatamente
                updateTheme(value as 'light' | 'dark');

                // Guardar en localStorage y sessionStorage para mayor seguridad
                localStorage.setItem('theme', value as string);
                sessionStorage.setItem('theme', value as string);

                // Aplicar directamente al DOM
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(value as string);

                console.log('[Settings] Theme changed and applied:', value);
            }
            return newSettings;
        });
     }, [updateTheme]);

     // Manejar cambios en los datos del perfil
     const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
         const { name, value } = event.target;
         setProfileData(prev => ({ ...prev, [name]: value }));
     };

      // Manejar cambios en los datos de contraseña
     const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
         const { name, value } = event.target;
         setPasswordData(prev => ({ ...prev, [name]: value }));
     };


    // Guardar TODO (Perfil, Contraseña, Configuración) - Podría separarse en funciones distintas
    const handleSaveChanges = async (section: 'profile' | 'password' | 'settings') => {
        setError(null); // Limpiar errores previos

        if (section === 'settings' && settings) {
            setSavingSettings(true);
            try {
                console.log('[Settings] Saving settings to API:', settings);
                const response = await callApi('/users/me/settings', { method: 'PUT', data: settings });
                console.log('[Settings] API response:', response);

                // Asegurar que el tema se aplique correctamente
                updateTheme(settings.theme); // Esto ya actualiza el contexto, localStorage y sessionStorage

                // Guardar explícitamente en localStorage y sessionStorage como respaldo adicional
                localStorage.setItem('theme', settings.theme);
                sessionStorage.setItem('theme', settings.theme);

                // Aplicar directamente al DOM para mayor seguridad
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(settings.theme);

                console.log('[Settings] Theme applied and saved:', settings.theme);
                toast({ title: "Éxito", description: "Configuraciones guardadas correctamente." });
            } catch (err) {
                console.error("Error saving settings:", err);
                setError("Error al guardar configuraciones.");
                toast({ title: "Error", description: `Error al guardar configuraciones: ${err instanceof Error ? err.message : 'Error desconocido'}`, variant: "destructive" });
            } finally {
                setSavingSettings(false);
            }
        } else if (section === 'profile' && (profileData.nombre !== user?.nombre || profileData.biografia !== user?.biografia)) { // Guardar si cambió el nombre o la biografía
             setSavingProfile(true);
             try {
                 // Asumiendo endpoint PUT /api/users/me para actualizar perfil
                 await callApi('/users/me', { method: 'PUT', data: {
                     nombre: profileData.nombre,
                     biografia: profileData.biografia
                 }});
                 // TODO: Actualizar el nombre en AuthContext si es necesario (puede requerir refetch o función en contexto)
                 toast({ title: "Éxito", description: "Perfil actualizado correctamente." });
             } catch (err) {
                 console.error("Error saving profile:", err);
                 setError("Error al guardar perfil.");
                 toast({ title: "Error", description: `Error al guardar perfil: ${err instanceof Error ? err.message : 'Error desconocido'}`, variant: "destructive" });
                 // Revertir el nombre en el estado local si falla el guardado
                 if (user) setProfileData({
                     nombre: user.nombre,
                     biografia: user.biografia || ''
                 });
             } finally {
                 setSavingProfile(false);
             }
        } else if (section === 'password') {
            if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                toast({ title: "Error", description: "Todos los campos de contraseña son requeridos.", variant: "destructive" });
                return;
            }
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                toast({ title: "Error", description: "La nueva contraseña y la confirmación no coinciden.", variant: "destructive" });
                return;
            }
             setSavingPassword(true);
             try {
                  // Asumiendo endpoint PUT /api/users/me/password
                 await callApi('/users/me/password', {
                     method: 'PUT',
                     data: {
                         currentPassword: passwordData.currentPassword,
                         newPassword: passwordData.newPassword,
                     },
                 });
                 toast({ title: "Éxito", description: "Contraseña actualizada." });
                 // Limpiar campos de contraseña después de éxito
                 setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
             } catch (err) {
                 console.error("Error changing password:", err);
                 setError("Error al cambiar contraseña.");
                 toast({ title: "Error", description: `Error al cambiar contraseña: ${err instanceof Error ? err.message : 'Error desconocido'}`, variant: "destructive" });
             } finally {
                 setSavingPassword(false);
             }
        }
    };

    // Renderizado condicional mientras carga
    if (loading) {
        return (
            <div className="space-y-6">
                {/* Skeleton para Perfil */}
                <Card>
                    <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                 {/* Skeleton para Contraseña */}
                 <Card>
                    <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                {/* Skeleton para Configuración */}
                <Card>
                    <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Renderizado si hay error o no hay settings/user (después de intentar cargar)
     if (error || !settings || !user) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error</CardTitle>
                    <CardDescription className="text-destructive">
                        {error || "No se pudieron cargar los datos del perfil o las configuraciones."}
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    <Button variant="outline" onClick={() => window.location.reload()}>Intentar de nuevo</Button>
                 </CardContent>
            </Card>
        );
    }


    // Renderizado normal
    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Configuración de Usuario</h1>

            {/* Pestañas de navegación */}
            <div className="flex mb-6 bg-muted/20 rounded-lg overflow-hidden">
                <button className="flex-1 py-3 px-4 font-medium bg-card border-b-2 border-primary">
                    Perfil
                </button>
                <button className="flex-1 py-3 px-4 text-muted-foreground hover:text-foreground transition-colors">
                    Cuenta
                </button>
                <button className="flex-1 py-3 px-4 text-muted-foreground hover:text-foreground transition-colors">
                    Notificaciones
                </button>
                <button className="flex-1 py-3 px-4 text-muted-foreground hover:text-foreground transition-colors">
                    Apariencia
                </button>
            </div>

            {/* Contenido principal */}
            <div className="bg-card border rounded-lg p-6 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-1">Información de Perfil</h2>
                    <p className="text-muted-foreground text-sm">Actualiza tu información personal y cómo te ven otros usuarios.</p>
                </div>

                <div className="flex gap-8 mb-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-4xl text-muted-foreground">?</div>
                                )}
                            </div>
                            <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Formulario */}
                    <div className="flex-grow space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre completo</Label>
                                <Input
                                    id="nombre"
                                    name="nombre"
                                    value={profileData.nombre}
                                    onChange={handleProfileChange}
                                    disabled={savingProfile}
                                    placeholder="Juan Pérez"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Nombre de usuario</Label>
                                <Input
                                    id="username"
                                    name="username"
                                    value={user.username || ''}
                                    disabled
                                    placeholder="juanperez"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={user.email}
                                disabled
                                placeholder="juan.perez@ejemplo.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="biografia">Biografía</Label>
                            <textarea
                                id="biografia"
                                name="biografia"
                                className="w-full min-h-[100px] p-3 rounded-md border bg-background"
                                placeholder="Desarrollador de software con experiencia en React y Node.js."
                                value={profileData.biografia || ''}
                                onChange={handleProfileChange}
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 mt-8">
                    <Button variant="outline" className="px-4">
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => handleSaveChanges('profile')}
                        disabled={savingProfile || (profileData.nombre === user.nombre && !profileData.biografia)}
                        className="px-4 bg-black text-white hover:bg-gray-800"
                    >
                        {savingProfile ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </div>
            </div>

            {/* Secciones ocultas (se mostrarían al cambiar de pestaña) */}
            <div className="hidden">
                {/* Sección Cambiar Contraseña */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cambiar Contraseña</CardTitle>
                        <CardDescription>Actualiza tu contraseña de acceso.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Contraseña Actual</Label>
                            <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                disabled={savingPassword}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nueva Contraseña</Label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                disabled={savingPassword}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                disabled={savingPassword}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => handleSaveChanges('password')} disabled={savingPassword}>
                                {savingPassword ? 'Guardando...' : 'Cambiar Contraseña'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Sección Configuración (Tema y Notificaciones) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configuración de la Aplicación</CardTitle>
                        <CardDescription>Personaliza la apariencia y las notificaciones.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Configuración de Tema */}
                        <div className="space-y-2">
                            <Label>Tema de la Aplicación</Label>
                            <RadioGroup
                                value={settings.theme}
                                onValueChange={(value: 'light' | 'dark') => handleSettingChange('theme', value)}
                                className="flex space-x-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="light" id="theme-light" />
                                    <Label htmlFor="theme-light">Claro</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="dark" id="theme-dark" />
                                    <Label htmlFor="theme-dark">Oscuro</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Configuración de Notificaciones */}
                        <div className="space-y-4">
                            <Label>Preferencias de Notificación</Label>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="app-notifications" className="text-base">Notificaciones en la Aplicación</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Recibir alertas y actualizaciones dentro de la aplicación.
                                    </p>
                                </div>
                                <Switch
                                    id="app-notifications"
                                    checked={settings.app_notifications_enabled}
                                    onCheckedChange={(checked: boolean) => handleSettingChange('app_notifications_enabled', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="email-notifications" className="text-base">Correos de Estado de Pedidos</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Recibir correos electrónicos sobre cambios en el estado de tus órdenes de compra.
                                    </p>
                                </div>
                                <Switch
                                    id="email-notifications"
                                    checked={settings.email_order_status_enabled}
                                    onCheckedChange={(checked: boolean) => handleSettingChange('email_order_status_enabled', checked)}
                                />
                            </div>
                        </div>
                        <Separator /> {/* Separador antes del botón de guardar configuración */}
                        {/* Botón de Guardar Configuración */}
                        <div className="flex justify-end">
                            <Button onClick={() => handleSaveChanges('settings')} disabled={savingSettings || loading}>
                                {savingSettings ? 'Guardando...' : 'Guardar Configuración'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UserProfileSettingsPage;