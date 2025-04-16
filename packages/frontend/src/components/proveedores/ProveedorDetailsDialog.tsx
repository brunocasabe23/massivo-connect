import React, { useState, useEffect } from "react"; // Importar hooks
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Proveedor } from "@/services/proveedores.service"; // Usaremos un tipo extendido
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { callApi } from "@/services/api"; // Importar callApi
import { useToast } from "@/hooks/use-toast"; // Importar useToast
import { ScrollArea } from "@/components/ui/scroll-area"; // Importar ScrollArea
import { Card } from "@/components/ui/card"; // Importar Card (CardContent no se usa)

interface ProveedorDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  // Usar un tipo extendido que incluya los productos
  proveedor: (Proveedor & { productos?: { id: number; nombre: string; sku?: string; categoria?: string }[] }) | null;
  onEdit: () => void;
}

export const ProveedorDetailsDialog: React.FC<ProveedorDetailsDialogProps> = ({
  isOpen,
  onClose,
  proveedor,
  onEdit,
}) => {
  const { toast } = useToast();
  const [detailedProveedor, setDetailedProveedor] = useState<Proveedor & { productos?: any[] } | null>(proveedor);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Cargar detalles completos (incluyendo productos) cuando el diálogo se abre o el proveedor cambia
  useEffect(() => {
    if (isOpen && proveedor?.id) {
      setLoadingDetails(true);
      callApi(`/suppliers/${proveedor.id}/detailed`)
        .then(data => {
          setDetailedProveedor(data);
        })
        .catch(error => {
          console.error("Error fetching detailed supplier:", error);
          toast({ title: "Error", description: "No se pudieron cargar los detalles completos del proveedor.", variant: "destructive" });
          setDetailedProveedor(proveedor); // Volver a los datos básicos si falla
        })
        .finally(() => setLoadingDetails(false));
    } else if (!isOpen) {
        setDetailedProveedor(null); // Limpiar al cerrar
    }
  }, [isOpen, proveedor, toast]);


  // Usar detailedProveedor para mostrar la info, o el prop original si aún no carga
  const displayProveedor = detailedProveedor || proveedor;

  if (!displayProveedor) return null;

  const formatearFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), "dd/MM/yyyy", { locale: es });
    } catch (error) {
      return fecha;
    }
  };

  const formatearURL = (url: string | undefined) => {
    if (!url || url.trim() === '') return '';
    url = url.trim();
    if (url.match(/^https?:\/\//i)) return url;
    return `https://${url}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Detalles del Proveedor</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Información completa del proveedor
              </DialogDescription>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={displayProveedor.estado === "activo" ? "default" : "destructive"} className="capitalize">
                  {displayProveedor.estado}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="informacion" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="informacion">Información</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="informacion" className="space-y-6 py-4">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-slate-100 p-3 rounded-md">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="#E6F0F9"/>
                  <path d="M6 8H18V17H6V8Z" stroke="#0072CE" strokeWidth="1.5"/>
                  <path d="M8 8V6C8 5.44772 8.44772 5 9 5H15C15.5523 5 16 5.44772 16 6V8" stroke="#0072CE" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="grid grid-cols-2 gap-6 flex-1">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Nombre o Razón Social</h3>
                  <p className="text-sm font-medium">{displayProveedor.nombre}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">RFC</h3>
                  <p className="text-sm font-medium">{displayProveedor.rfc || '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Dirección</h3>
              <p className="text-sm">{displayProveedor.direccion || '-'}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Persona de Contacto</h3>
                <p className="text-sm">{displayProveedor.contacto_nombre || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Teléfono</h3>
                <p className="text-sm">{displayProveedor.telefono || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                <p className="text-sm text-blue-600">
                  {displayProveedor.email ? (
                    <a href={`mailto:${displayProveedor.email}`} className="text-blue-600 hover:underline">
                      {displayProveedor.email}
                    </a>
                  ) : '-'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Sitio Web</h3>
                <p className="text-sm">
                  {displayProveedor.sitio_web && displayProveedor.sitio_web.trim() !== '' ? (
                    <a
                      href={formatearURL(displayProveedor.sitio_web)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {displayProveedor.sitio_web}
                    </a>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Categorías</h3>
              <div className="flex flex-wrap gap-2">
                {displayProveedor.categorias && Array.isArray(displayProveedor.categorias) && displayProveedor.categorias.length > 0 ? (
                  displayProveedor.categorias.map((categoria, index) => {
                    // Mapeo de IDs de categoría a nombres más amigables
                    const categoriasMap: Record<string, string> = {
                      'tecnologia': 'Tecnología',
                      'papeleria': 'Papelería',
                      'mobiliario': 'Mobiliario',
                      'servicios': 'Servicios',
                      'oficina': 'Oficina',
                      'limpieza': 'Limpieza'
                    };
                    const categoriaLower = typeof categoria === 'string' ? categoria.toLowerCase() : '';
                    const nombreCategoria = categoriasMap[categoriaLower] || categoria;
                    return (
                      <Badge key={index} variant="secondary" className="capitalize">
                        {nombreCategoria}
                      </Badge>
                    );
                  })
                ) : displayProveedor.categoria ? (
                  <Badge variant="secondary" className="capitalize">
                    {displayProveedor.categoria}
                  </Badge>
                ) : (
                  '-'
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Fecha de Registro</h3>
                <p className="text-sm">{formatearFecha(displayProveedor.fecha_creacion)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Última Compra</h3>
                <p className="text-sm">{displayProveedor.ultima_compra ? formatearFecha(displayProveedor.ultima_compra) : '-'}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Notas</h3>
              <p className="text-sm text-gray-600">
                {displayProveedor.notas_adicionales || displayProveedor.notas || "-"}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="productos" className="py-4">
             <h3 className="text-sm font-medium text-gray-500 mb-2">Productos Asociados</h3>
             {loadingDetails ? (
                 <p className="text-sm text-gray-500">Cargando productos...</p>
             ) : !displayProveedor.productos || displayProveedor.productos.length === 0 ? (
                 <p className="text-sm text-gray-500">Este proveedor no tiene productos asociados.</p>
             ) : (
                 <ScrollArea className="h-[200px] border rounded-md p-2">
                     <div className="space-y-2">
                         {displayProveedor.productos.map(prod => (
                             <Card key={prod.id} className="p-2 text-sm">
                                 <p className="font-medium">{prod.nombre}</p>
                                 {prod.sku && <p className="text-xs text-muted-foreground">SKU: {prod.sku}</p>}
                                 {prod.categoria && <p className="text-xs text-muted-foreground">Categoría: {prod.categoria}</p>}
                             </Card>
                         ))}
                     </div>
                 </ScrollArea>
             )}
          </TabsContent>

          <TabsContent value="historial">
            <div className="py-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Historial de Compras</h3>
              {loadingDetails ? (
                <p className="text-sm text-gray-500">Cargando historial...</p>
              ) : !displayProveedor.ultima_compra ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No hay historial de compras para este proveedor.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Última Compra</h3>
                      <p className="text-sm">{formatearFecha(displayProveedor.ultima_compra)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Estado</h3>
                      <Badge variant="outline" className="capitalize">
                        Completada
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-blue-600 cursor-pointer hover:underline">
                    Ver todas las compras
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documentos">
            <div className="py-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Documentos</h3>
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No hay documentos disponibles para este proveedor.</p>
                <Button variant="outline" size="sm" className="mt-4">
                  Subir documento
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onEdit} className="bg-blue-600 text-white hover:bg-blue-700">
            Editar Proveedor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};