// Eliminado "use client"
import type React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  const [period, setPeriod] = useState("Este mes"); // Estado para el período seleccionado

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }} // Puedes ajustar delay si es necesario
    >
      <Card className="h-full border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex flex-col">
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            <p className="text-sm text-slate-500">{period}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPeriod("Hoy")}>Hoy</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod("Esta semana")}>Esta semana</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod("Este mes")}>Este mes</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod("Este año")}>Este año</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="pt-4">{children}</CardContent>
      </Card>
    </motion.div>
  );
}