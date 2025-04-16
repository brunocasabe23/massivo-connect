// packages/frontend/src/components/orders/OrderDetailDialog.tsx
import { useState } from 'react'; // React no es necesario importar explícitamente aquí
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X } from 'lucide-react'; // Eliminado AlertCircle no utilizado
import { callApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Interfaz para la orden de compra
interface OrderDetail {
  id: number;
  fecha_creacion: string;
  fecha_actualizacion?: string; // Hacer opcional ya que no se usa en este componente
  fecha_entrega?: string;
  estado: string;
  descripcion: string;
  monto: number;
  moneda?: string;
  proveedor_id?: number; // Cambiado a ID
  proveedor_nombre?: string; // Nuevo campo con nombre
  producto?: string;
  cantidad?: number;
  precio_unitario?: number;
  prioridad?: string;
  laboratorio?: string;
  solicitante?: string;
  codigo_presupuestal?: string;
  cp_id: number;
}

interface OrderDetailDialogProps {
  order: OrderDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: () => void;
}

export function OrderDetailDialog({ order, open, onOpenChange, onOrderUpdated }: OrderDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [comentario, setComentario] = useState('');
  const { toast } = useToast();
  const { permisos } = useAuth();

  // Verificar si el usuario tiene permisos para aprobar/rechazar
  const canApprove = permisos.includes('aprobar_orden_compra');
  const canReject = permisos.includes('rechazar_orden_compra');
  // const canUpdateStatus = permisos.includes('actualizar_estado_orden'); // Variable no utilizada eliminada

  if (!order) return null;

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  // Obtener color de badge según estado
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobada':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'rechazada':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'pendiente':
      case 'en revisión':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'completada':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'cancelada':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default:
        return 'bg-slate-100 text-slate-800 hover:bg-slate-100';
    }
  };

  // Manejar cambio de estado
  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      await callApi(`/orders/${order.id}/status`, {
        method: 'PUT',
        data: { 
          estado: newStatus,
          comentario: comentario.trim() || undefined
        }
      });
      
      toast({
        title: 'Estado actualizado',
        description: `La orden ha sido ${newStatus.toLowerCase()} correctamente.`,
      });
      
      onOrderUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error al actualizar estado:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el estado de la orden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalle de Solicitud #{order.id}</DialogTitle>
          <DialogDescription>
            Creada el {formatDate(order.fecha_creacion)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Estado actual */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Estado:</span>
            <Badge className={getStatusColor(order.estado)}>
              {order.estado}
            </Badge>
          </div>
          
          {/* Información general */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium">Solicitante:</span>
              <p className="text-sm">{order.solicitante || 'No especificado'}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Código Presupuestal:</span>
              <p className="text-sm">{order.codigo_presupuestal || 'No especificado'}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Fecha de Entrega:</span>
              <p className="text-sm">{order.fecha_entrega ? format(new Date(order.fecha_entrega), 'dd/MM/yyyy', { locale: es }) : 'No especificada'}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Prioridad:</span>
              <p className="text-sm">{order.prioridad || 'Media'}</p>
            </div>
          </div>
          
          {/* Detalles del producto */}
          <div className="border rounded-md p-4 bg-slate-50">
            <h4 className="font-medium mb-2">Detalles del Producto</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">Producto:</span>
                <p className="text-sm">{order.producto || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Proveedor:</span>
                <p className="text-sm">{order.proveedor_nombre || 'No especificado'}</p> {/* Mostrar nombre */}
              </div>
              <div>
                <span className="text-sm font-medium">Cantidad:</span>
                <p className="text-sm">{order.cantidad || 0}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Precio Unitario:</span>
                <p className="text-sm">{order.moneda || '$'} {order.precio_unitario?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm font-medium">Monto Total:</span>
              <p className="text-lg font-bold">{order.moneda || '$'} {order.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          
          {/* Descripción */}
          <div>
            <span className="text-sm font-medium">Descripción:</span>
            <p className="text-sm mt-1 whitespace-pre-wrap">{order.descripcion}</p>
          </div>
          
          {/* Comentario para aprobación/rechazo */}
          {(canApprove || canReject) && order.estado !== 'Aprobada' && order.estado !== 'Rechazada' && (
            <div className="mt-4">
              <span className="text-sm font-medium">Comentario (opcional):</span>
              <Textarea
                placeholder="Añade un comentario para el solicitante..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          {/* Botones de acción según permisos y estado */}
          <div className="flex gap-2">
            {canApprove && order.estado !== 'Aprobada' && order.estado !== 'Rechazada' && (
              <Button 
                onClick={() => handleStatusChange('Aprobada')} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
            )}
            
            {canReject && order.estado !== 'Aprobada' && order.estado !== 'Rechazada' && (
              <Button 
                onClick={() => handleStatusChange('Rechazada')} 
                disabled={loading}
                variant="destructive"
              >
                <X className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
            )}
          </div>
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
