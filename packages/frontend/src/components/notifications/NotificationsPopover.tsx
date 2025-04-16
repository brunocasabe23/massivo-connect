// packages/frontend/src/components/notifications/NotificationsPopover.tsx
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Notification, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationsCount } from '@/services/notifications.service';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cargar notificaciones al abrir el popover
  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  // Cargar conteo de notificaciones no leídas periódicamente
  useEffect(() => {
    loadUnreadCount();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getUserNotifications(10);
      setNotifications(data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las notificaciones',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await getUnreadNotificationsCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error al cargar conteo de notificaciones:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      // Actualizar la notificación en el estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, leida: true } : notif
        )
      );
      // Actualizar el conteo
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      // Actualizar todas las notificaciones en el estado local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, leida: true }))
      );
      // Actualizar el conteo
      setUnreadCount(0);
      toast({
        title: 'Éxito',
        description: 'Todas las notificaciones han sido marcadas como leídas'
      });
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron marcar las notificaciones como leídas',
        variant: 'destructive'
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída si no lo está
    if (!notification.leida) {
      handleMarkAsRead(notification.id);
    }
    
    // Navegar a la URL relacionada si existe
    if (notification.url_relacionada) {
      navigate(notification.url_relacionada);
    }
    
    // Cerrar el popover
    setOpen(false);
  };

  // Formatear fecha relativa
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm', { locale: es });
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return format(date, 'dd MMM', { locale: es });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-medium">Notificaciones</h3>
          {notifications.some(n => !n.leida) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <span className="text-sm text-gray-500">Cargando...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <span className="text-sm text-gray-500">No tienes notificaciones</span>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((notification) => (
                <li 
                  key={notification.id} 
                  className={`cursor-pointer p-3 hover:bg-gray-50 ${!notification.leida ? 'bg-blue-50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between">
                    <p className={`text-sm ${!notification.leida ? 'font-medium' : ''}`}>
                      {notification.mensaje}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatRelativeDate(notification.fecha_creacion)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
