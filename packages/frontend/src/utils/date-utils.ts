/**
 * Formatea una fecha como "Hace X tiempo" (ej: "Hace 2 horas y 15 minutos", "Hace 3 días")
 * @param date Fecha a formatear (string o Date)
 * @param detailed Si es true, incluye más detalles en el formato (ej: "Hace 2 horas y 15 minutos")
 * @returns String formateado
 */
export function formatRelativeTime(date: string | Date, detailed: boolean = false): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // Verificar si la fecha es futura
  if (dateObj > now) {
    console.warn(`Fecha futura detectada: ${dateObj.toISOString()}. Usando fecha actual.`);
    return formatDate(now, true); // Devolver la fecha actual formateada
  }

  const diffMs = now.getTime() - dateObj.getTime();

  // Convertir a diferentes unidades de tiempo
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  // Calcular los restos para el formato detallado
  const remainingMonths = diffMonths % 12;
  const remainingDays = diffDays % 30;
  const remainingHours = diffHours % 24;
  const remainingMinutes = diffMinutes % 60;
  const remainingSeconds = diffSeconds % 60;

  // Formatear la fecha con el nivel de detalle adecuado
  if (diffYears > 0) {
    if (detailed && remainingMonths > 0) {
      return `Hace ${diffYears} ${diffYears === 1 ? 'año' : 'años'} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
    }
    return `Hace ${diffYears} ${diffYears === 1 ? 'año' : 'años'}`;
  } else if (diffMonths > 0) {
    if (detailed && remainingDays > 0) {
      return `Hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'} y ${remainingDays} ${remainingDays === 1 ? 'día' : 'días'}`;
    }
    return `Hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
  } else if (diffDays > 0) {
    if (detailed && remainingHours > 0) {
      return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'} y ${remainingHours} ${remainingHours === 1 ? 'hora' : 'horas'}`;
    }
    return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  } else if (diffHours > 0) {
    if (detailed && remainingMinutes > 0) {
      return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'} y ${remainingMinutes} ${remainingMinutes === 1 ? 'minuto' : 'minutos'}`;
    }
    return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  } else if (diffMinutes > 0) {
    if (detailed && remainingSeconds > 0) {
      return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'} y ${remainingSeconds} ${remainingSeconds === 1 ? 'segundo' : 'segundos'}`;
    }
    return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
  } else {
    return `Hace ${diffSeconds} ${diffSeconds === 1 ? 'segundo' : 'segundos'}`;
  }
}

/**
 * Formatea una fecha en formato legible (ej: "15 de junio de 2023, 14:30")
 * @param date Fecha a formatear (string o Date)
 * @param includeTime Si es true, incluye la hora en el formato
 * @returns String formateado
 */
export function formatDate(date: string | Date, includeTime: boolean = true): string {
  try {
    // Verificar si la fecha es válida
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Verificar si la fecha es válida
    if (isNaN(dateObj.getTime())) {
      console.warn(`Fecha inválida: ${date}. Usando fecha actual.`);
      return formatDate(new Date(), includeTime);
    }

    // Verificar si la fecha es futura
    const now = new Date();
    if (dateObj > now) {
      console.warn(`Fecha futura detectada: ${dateObj.toISOString()}. Usando fecha actual.`);
      return formatDate(now, includeTime);
    }

    // Opciones para el formato de fecha
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    // Añadir opciones de hora si se solicita
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    // Formatear la fecha usando el locale español
    return dateObj.toLocaleDateString('es-ES', options);
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Fecha desconocida';
  }
}

/**
 * Genera iniciales a partir de un nombre completo
 * @param name Nombre completo
 * @returns Iniciales (máximo 2 caracteres)
 */
export function generateInitials(name: string): string {
  if (!name) return 'U';

  const nameParts = name.split(' ').filter(part => part.length > 0);

  if (nameParts.length === 0) return 'U';
  if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

  return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
}
