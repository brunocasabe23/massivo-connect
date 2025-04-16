import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building, DollarSign } from "lucide-react";
import { Area } from "@/services/areas.service";
import { Link } from "react-router-dom";
import { motion } from "framer-motion"; // Importar motion

interface CodigoCardProps {
  id: number;
  codigo: string;
  descripcion: string;
  monto: number;
  disponible: number;
  estado: 'Activo' | 'Agotado' | 'Suspendido' | string;
  areas: Area[];
  index?: number; // Para escalonar animación
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Activo": return "bg-green-100 text-green-800 border-green-300";
    case "Agotado": return "bg-amber-100 text-amber-800 border-amber-300";
    case "Suspendido": return "bg-red-100 text-red-800 border-red-300";
    default: return "bg-slate-100 text-slate-800 border-slate-300";
  }
};

const getProgressColor = (percentage: number) => {
  // Devuelve el color HEX para estilos en línea
  if (percentage < 25) return "#ef4444"; // red-500
  if (percentage < 75) return "#f59e0b"; // amber-500
  return "#22c55e"; // green-500
};

export default function CodigoCard({
  id,
  codigo,
  descripcion,
  monto,
  disponible,
  estado,
  areas,
  index = 0, // Default index para animación
}: CodigoCardProps) {
  const montoNumerico = Number(monto || 0);
  const disponibleNumerico = Number(disponible || 0);
  const porcentajeDisponible = montoNumerico > 0 ? (disponibleNumerico / montoNumerico) * 100 : 0;
  const progressColor = getProgressColor(porcentajeDisponible);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }} // Animación escalonada
    >
      <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col"> {/* Asegurar altura completa */}
        <CardContent className="p-4 space-y-3 flex-grow flex flex-col"> {/* Hacer flex y crecer */}
          <div className="flex justify-between items-start">
            <Badge className={`text-xs font-medium ${getStatusColor(estado)}`}>{estado}</Badge>
            <div className="p-1.5 rounded-full bg-blue-100 text-[#005291]"> {/* Color primario */}
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="flex-grow"> {/* Permitir que esta sección crezca */}
            <h3 className="font-semibold text-slate-900">{codigo}</h3>
            <p className="text-sm text-slate-600 line-clamp-2">{descripcion}</p> {/* Limitar líneas */}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Disponible:</span>
              <span className="font-medium text-slate-700">
                ${disponibleNumerico.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} / ${montoNumerico.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>
            {/* Usar estilos en línea para el color del indicador */}
            <Progress value={porcentajeDisponible} style={{ '--progress-indicator-color': progressColor } as React.CSSProperties} className="h-2 [&>span]:bg-[var(--progress-indicator-color)]" />
          </div>
          <div className="space-y-1 pt-2"> {/* Añadir padding top */}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Building className="h-3 w-3" />
              <span>{areas.length} Área{areas.length !== 1 ? 's' : ''} asociada{areas.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {areas.slice(0, 2).map((area) => ( // Mostrar solo 2 áreas
                <Badge key={area.id} variant="outline" className="text-xs bg-slate-100 border-slate-300 text-slate-600">
                  {area.nombre}
                </Badge>
              ))}
              {areas.length > 2 && <Badge variant="outline" className="text-xs bg-slate-100 border-slate-300 text-slate-600">+{areas.length - 2}</Badge>}
            </div>
          </div>
          <div className="text-right mt-auto pt-2"> {/* Empujar al final */}
            <Link to={`/budget-codes/${id}`} className="text-sm text-[#005291] hover:underline font-medium inline-flex items-center">
              Ver detalles <span className="ml-1">&rarr;</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}