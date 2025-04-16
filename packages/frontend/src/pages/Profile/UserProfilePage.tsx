// packages/frontend/src/pages/Profile/UserProfilePage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { callApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Edit, Upload } from 'lucide-react';

// Obtener la URL base de la API desde las variables de entorno de Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''; // Ej: http://localhost:5000

interface UserSettings {
    theme: 'light' | 'dark';
    app_notifications_enabled: boolean;
    email_order_status_enabled: boolean;
}

interface ProfileData {
    nombre: string;
    username?: string;
    bio?: string;
}

interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const UserProfilePage: React.FC = () => {
    const { user, token, theme: initialTheme, updateTheme, updateUserContext } = useAuth();
    const [initialSettings, setInitialSettings] = useState<UserSettings | null>(null);
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [profileData, setProfileData] = useState<ProfileData>({ nombre: '', username: '', bio: '' });
    const [passwordData, setPasswordData] = useState<PasswordChangeData>({
        currentPassword: '', newPassword: '', confirmPassword: '',
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            setError(null);
            if (user) {
                setProfileData({
                    nombre: user.nombre,
                    username: '', // TODO: Cargar desde user si existe
                    bio: '', // TODO: Cargar desde user si existe
                });
            }
            try {
                const data = await callApi('/users/me/settings') as UserSettings;
                setSettings(data);
                setInitialSettings(data);
            } catch (err) {
                console.error("Error fetching settings:", err);
                setError("No se pudieron cargar las configuraciones.");
                toast({ title: "Error de Carga", description: "No se pudieron cargar las configuraciones.", variant: "destructive" });
                 const fallbackSettings = { theme: initialTheme, app_notifications_enabled: true, email_order_status_enabled: true };
                 setSettings(fallbackSettings);
                 setInitialSettings(fallbackSettings);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [toast, initialTheme, user]);

    // --- Handlers de Cambios ---
    const handleSettingChange = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        setSettings(prev => {
            if (!prev) return null;
            const newSettings = { ...prev, [key]: value };
            if (key === 'theme') {
                updateTheme(value as 'light' | 'dark');
            }
            return newSettings;
        });
     }, [updateTheme]);

     const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
         const { name, value } = event.target;
         setProfileData(prev => ({ ...prev, [name]: value }));
     };

     const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
         const { name, value } = event.target;
         setPasswordData(prev => ({ ...prev, [name]: value }));
     };

    // Handler para seleccionar archivo de avatar
    const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: "Archivo demasiado grande", description: "El tamaño máximo del avatar es 5MB.", variant: "destructive" });
                return;
            }
            if (!file.type.startsWith('image/')) {
                 toast({ title: "Tipo de archivo inválido", description: "Por favor, selecciona una imagen.", variant: "destructive" });
                 return;
            }
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => { setAvatarPreview(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    // Handler para activar el input de archivo
    const handleAvatarEditClick = () => {
        fileInputRef.current?.click();
    };

    // Handler para subir el avatar seleccionado
    const handleUploadAvatar = async () => {
        if (!avatarFile || !token) return;
        setIsUploadingAvatar(true);
        setError(null);
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/me/avatar`, { // Usar URL absoluta
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) { throw new Error(result.message || 'Error al subir el avatar.'); }

            if (updateUserContext && result.avatarUrl) {
                const publicPath = result.avatarUrl.startsWith('/') ? result.avatarUrl : `/${result.avatarUrl}`;
                updateUserContext({ avatarUrl: publicPath }); // Guardar la ruta relativa en el contexto/localStorage
            }
            setAvatarPreview(null);
            setAvatarFile(null);
            toast({ title: "Éxito", description: "Avatar actualizado correctamente." });

        } catch (err) {
            console.error("Error uploading avatar:", err);
            setError("Error al subir el avatar.");
            toast({ title: "Error", description: `Error al subir el avatar: ${err instanceof Error ? err.message : 'Error desconocido'}`, variant: "destructive" });
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) { fileInputRef.current.value = ""; }
        }
    };


    // Guardar todos los cambios pendientes (excluye avatar)
    const handleSaveChanges = async () => {
        setError(null);
        setIsSaving(true);
        let somethingChanged = false;
        const promises = [];

        // --- Preparar guardado de Perfil ---
        const profileChanged = profileData.nombre !== user?.nombre /* || otros campos */;
        if (profileChanged) {
            somethingChanged = true;
            promises.push(
                callApi('/users/me', { method: 'PUT', data: { nombre: profileData.nombre } })
                    .then(() => {
                        if (user && updateUserContext) {
                            updateUserContext({ nombre: profileData.nombre });
                        }
                        return { section: 'profile', success: true };
                    })
                    .catch(err => {
                        console.error("Error saving profile:", err);
                        toast({ title: "Error Perfil", description: `Error al guardar perfil: ${err instanceof Error ? err.message : 'Error desconocido'}`, variant: "destructive" });
                        if (user) setProfileData({ ...profileData, nombre: user.nombre }); // Revertir
                        return { section: 'profile', success: false, error: err };
                    })
            );
        }

        // --- Preparar cambio de Contraseña ---
        const passwordFieldsFilled = passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword;
        if (passwordFieldsFilled) {
            if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                toast({ title: "Error Contraseña", description: "Todos los campos de contraseña son requeridos para cambiarla.", variant: "destructive" });
            } else if (passwordData.newPassword !== passwordData.confirmPassword) {
                toast({ title: "Error Contraseña", description: "La nueva contraseña y la confirmación no coinciden.", variant: "destructive" });
            } else {
                somethingChanged = true;
                promises.push(
                    callApi('/users/me/password', {
                        method: 'PUT',
                        data: {
                            currentPassword: passwordData.currentPassword,
                            newPassword: passwordData.newPassword,
                        },
                    })
                    .then(() => {
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Limpiar
                        return { section: 'password', success: true };
                    })
                    .catch(err => {
                        console.error("Error changing password:", err);
                        toast({ title: "Error Contraseña", description: `Error al cambiar contraseña: ${err instanceof Error ? err.message : 'Error desconocido'}`, variant: "destructive" });
                        return { section: 'password', success: false, error: err };
                    })
                );
            }
        }

        // --- Preparar guardado de Configuración ---
        const settingsChanged = JSON.stringify(settings) !== JSON.stringify(initialSettings);
        if (settings && settingsChanged) {
            somethingChanged = true;
            promises.push(
                callApi('/users/me/settings', { method: 'PUT', data: settings })
                    .then(() => {
                        updateTheme(settings.theme);
                        localStorage.setItem('theme', settings.theme);
                        setInitialSettings(settings); // Actualizar settings iniciales tras guardar
                        return { section: 'settings', success: true };
                    })
                    .catch(err => {
                        console.error("Error saving settings:", err);
                        toast({ title: "Error Configuración", description: `Error al guardar configuraciones: ${err instanceof Error ? err.message : 'Error desconocido'}`, variant: "destructive" });
                        return { section: 'settings', success: false, error: err };
                    })
            );
        }

        if (!somethingChanged) {
            toast({ description: "No hay cambios para guardar." });
            setIsSaving(false);
            return;
        }

        // Ejecutar todas las promesas de guardado
        const results = await Promise.all(promises);
        setIsSaving(false);
        const allSucceeded = results.every(r => r.success);
        if (allSucceeded) {
            toast({ title: "Éxito", description: "Cambios guardados correctamente." });
        } else {
             setError("Algunos cambios no pudieron guardarse.");
        }
    };


    // Renderizado condicional mientras carga
    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48 mb-4" /> {/* Título */}
                <Skeleton className="h-10 w-full" /> {/* TabsList */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-64 mt-1" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                         <div className="flex justify-end gap-2">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Renderizado si hay error o no hay settings/user
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


    // Renderizado normal con Tabs
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Configuración de Usuario</h1>
            <Tabs defaultValue="perfil" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="perfil">Perfil</TabsTrigger>
                    <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
                    <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
                    <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
                </TabsList>

                {/* Pestaña Perfil */}
                <TabsContent value="perfil">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de Perfil</CardTitle>
                            <CardDescription>Actualiza tu información personal y cómo te ven otros usuarios.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="flex items-start space-x-6">
                                 {/* Avatar con Input oculto y botón de edición */}
                                 <div className="relative">
                                     <input type="file" ref={fileInputRef} onChange={handleAvatarFileChange} accept="image/*" hidden />
                                     <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarEditClick}>
                                         {/* Construir URL absoluta para mostrar */}
                                         {/* Mostrar imagen solo si hay preview o URL válida */}
                                         {(avatarPreview || user?.avatarUrl) ? (
                                            <AvatarImage
                                                src={avatarPreview || (user?.avatarUrl ? `${API_BASE_URL}${user.avatarUrl}` : undefined)} // No poner placeholder aquí
                                                alt={user?.nombre || 'Usuario'}
                                                // Quitar onError o ajustarlo si es necesario, ya que el fallback se encargará
                                            />
                                         ) : null}
                                         <AvatarFallback>{user?.nombre?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                     </Avatar>
                                     <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full h-7 w-7" onClick={handleAvatarEditClick}>
                                         <Edit className="h-4 w-4" />
                                         <span className="sr-only">Editar avatar</span>
                                     </Button>
                                 </div>
                                 {/* Campos a la derecha */}
                                 <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="nombre">Nombre completo</Label>
                                        <Input id="nombre" name="nombre" value={profileData.nombre} onChange={handleProfileChange} disabled={isSaving || isUploadingAvatar} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Nombre de usuario</Label>
                                        <Input id="username" name="username" value={profileData.username} onChange={handleProfileChange} placeholder="juanperez" disabled={isSaving || isUploadingAvatar} />
                                    </div>
                                 </div>
                             </div>
                             {/* Mostrar botón de subir solo si hay preview */}
                             {avatarPreview && (
                                 <div className="flex justify-start">
                                     <Button onClick={handleUploadAvatar} disabled={isUploadingAvatar}>
                                         {isUploadingAvatar ? 'Subiendo...' : <><Upload className="mr-2 h-4 w-4" /> Subir Nueva Imagen</>}
                                     </Button>
                                 </div>
                             )}
                             {/* Campos debajo */}
                             <div className="space-y-2">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input id="email" type="email" value={user.email} disabled />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="bio">Biografía</Label>
                                <Textarea id="bio" name="bio" placeholder="Cuenta algo sobre ti..." value={profileData.bio} onChange={handleProfileChange} className="min-h-[100px]" disabled={isSaving || isUploadingAvatar} />
                            </div>
                             <Separator />
                             <div className="flex justify-end gap-2">
                                <Button variant="outline" disabled={isSaving || isUploadingAvatar}>Cancelar</Button>
                                {/* Botón de guardado general (excluye avatar) */}
                                <Button onClick={handleSaveChanges} disabled={isSaving || isUploadingAvatar}>
                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pestaña Cuenta */}
                <TabsContent value="cuenta">
                     <Card>
                        <CardHeader>
                            <CardTitle>Cambiar Contraseña</CardTitle>
                            <CardDescription>Actualiza tu contraseña de acceso. Asegúrate de usar una contraseña segura.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                                <Input id="currentPassword" name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} disabled={isSaving || isUploadingAvatar} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                                <Input id="newPassword" name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} disabled={isSaving || isUploadingAvatar} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                                <Input id="confirmPassword" name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} disabled={isSaving || isUploadingAvatar} />
                            </div>
                             <Separator />
                             <div className="flex justify-end">
                                {/* Botón de guardado general */}
                                <Button onClick={handleSaveChanges} disabled={isSaving || isUploadingAvatar}>
                                    {isSaving ? 'Guardando...' : 'Actualizar Contraseña'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                 {/* Pestaña Notificaciones */}
                <TabsContent value="notificaciones">
                     <Card>
                        <CardHeader>
                            <CardTitle>Preferencias de Notificación</CardTitle>
                            <CardDescription>Elige cómo quieres recibir notificaciones.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="app-notifications" className="text-base">Notificaciones en la Aplicación</Label>
                                    <p className="text-sm text-muted-foreground">Recibir alertas y actualizaciones dentro de la aplicación.</p>
                                </div>
                                <Switch id="app-notifications" checked={settings?.app_notifications_enabled || false} onCheckedChange={(checked: boolean) => handleSettingChange('app_notifications_enabled', checked)} disabled={isSaving || isUploadingAvatar} />
                            </div>
                             <div className="flex items-center justify-between rounded-lg border p-4">
                                 <div className="space-y-0.5">
                                    <Label htmlFor="email-notifications" className="text-base">Correos de Estado de Pedidos</Label>
                                    <p className="text-sm text-muted-foreground">Recibir correos electrónicos sobre cambios en el estado de tus órdenes de compra.</p>
                                </div>
                                <Switch id="email-notifications" checked={settings?.email_order_status_enabled || false} onCheckedChange={(checked: boolean) => handleSettingChange('email_order_status_enabled', checked)} disabled={isSaving || isUploadingAvatar} />
                            </div>
                             <Separator />
                             <div className="flex justify-end">
                                {/* Botón de guardado general */}
                                <Button onClick={handleSaveChanges} disabled={isSaving || isUploadingAvatar}>
                                    {isSaving ? 'Guardando...' : 'Guardar Preferencias'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                 {/* Pestaña Apariencia */}
                <TabsContent value="apariencia">
                     <Card>
                        <CardHeader>
                            <CardTitle>Apariencia</CardTitle>
                            <CardDescription>Personaliza cómo se ve la aplicación.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tema de la Aplicación</Label>
                                <RadioGroup
                                    value={settings?.theme || 'light'}
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
                             <Separator />
                             <div className="flex justify-end">
                                {/* Botón de guardado general */}
                                <Button onClick={handleSaveChanges} disabled={isSaving || isUploadingAvatar}>
                                    {isSaving ? 'Guardando...' : 'Guardar Tema'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
};

export default UserProfilePage;