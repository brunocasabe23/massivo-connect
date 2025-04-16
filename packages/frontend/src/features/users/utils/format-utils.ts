/**
 * Obtiene la clase CSS para el color del badge según el rol
 */
export const getRoleBadgeColor = (role: string): string => {
  switch (role) {
    case "Administrador": return "bg-red-100 text-red-800 border-red-300";
    case "Gerente": return "bg-blue-100 text-blue-800 border-blue-300";
    case "Supervisor": return "bg-green-100 text-green-800 border-green-300";
    case "Contador": return "bg-purple-100 text-purple-800 border-purple-300";
    case "Analista": return "bg-amber-100 text-amber-800 border-amber-300";
    default: return "bg-slate-100 text-slate-800 border-slate-300";
  }
};

/**
 * Obtiene la clase CSS para el color del badge según el estado
 */
export const getStatusBadgeColor = (status: string): string => {
  return status.toLowerCase() === "activo"
    ? "bg-green-100 text-green-800 border-green-300"
    : "bg-slate-100 text-slate-800 border-slate-300";
};

/**
 * Genera iniciales a partir del nombre completo
 */
export const generateInitials = (name: string): string => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};
