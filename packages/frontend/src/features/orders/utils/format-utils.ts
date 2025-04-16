import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha en formato dd/MM/yyyy
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: es });
  } catch (error) {
    return dateString;
  }
};

/**
 * Obtiene la clase CSS para el color de la insignia según el estado
 */
export const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'Nueva':
      return 'bg-blue-100 text-blue-800';
    case 'EnRevision':
      return 'bg-amber-100 text-amber-800';
    case 'Aprobada':
      return 'bg-green-100 text-green-800';
    case 'Rechazada':
      return 'bg-red-100 text-red-800';
    case 'Cerrada':
      return 'bg-slate-100 text-slate-800';
    case 'CierreSolicitado':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

/**
 * Formatea el estado para mostrar
 */
export const formatStatus = (status: string): string => {
  switch (status) {
    case 'EnRevision':
      return 'En Revisión';
    case 'CierreSolicitado':
      return 'Cierre Solicitado';
    default:
      return status;
  }
};
