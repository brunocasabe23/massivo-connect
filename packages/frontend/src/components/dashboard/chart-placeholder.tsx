// Eliminado "use client"
import { motion } from "framer-motion";
import React from "react"; // Importar React para useMemo

interface ChartPlaceholderProps {
  height?: number;
  color?: string;
}

export default function ChartPlaceholder({ height = 200, color = "#005291" }: ChartPlaceholderProps) {
  // Simulación de datos para un gráfico
  const data = React.useMemo(() => Array.from({ length: 12 }, () => Math.floor(Math.random() * 100)), []);
  const max = React.useMemo(() => Math.max(...data, 1), [data]); // Añadir 1 para evitar división por cero si todos son 0

  return (
    <div className="w-full h-full" style={{ height }}>
      <div className="flex items-end justify-between h-full w-full">
        {data.map((value, index) => {
          const barHeight = (value / max) * 100;

          return (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${barHeight}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="w-full mx-0.5 rounded-t relative group"
              style={{ backgroundColor: color, opacity: 0.7 + barHeight / 300 }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {value}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((month, index) => (
          <div key={index} className="text-xs text-slate-500 text-center" style={{ width: `${100 / 12}%` }}>
            {month}
          </div>
        ))}
      </div>
    </div>
  );
}