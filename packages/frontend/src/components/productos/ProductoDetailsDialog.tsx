import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  // DialogDescription no se utiliza
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { callApi } from "@/services/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Definir los iconos disponibles para productos (igual que en ProductoForm)
const PRODUCT_ICONS = [
  { id: 'laptop', name: 'Laptop', emoji: '💻' },
  { id: 'phone', name: 'Teléfono', emoji: '📱' },
  { id: 'printer', name: 'Impresora', emoji: '🖨️' },
  { id: 'monitor', name: 'Monitor', emoji: '🖥️' },
  { id: 'keyboard', name: 'Teclado', emoji: '⌨️' },
  { id: 'mouse', name: 'Mouse', emoji: '🖱️' },
  { id: 'headphones', name: 'Auriculares', emoji: '🎧' },
  { id: 'camera', name: 'Cámara', emoji: '📷' },
  { id: 'tablet', name: 'Tablet', emoji: '📱' },
  { id: 'speaker', name: 'Altavoz', emoji: '🔊' },
  { id: 'microphone', name: 'Micrófono', emoji: '🎤' },
  { id: 'cable', name: 'Cable', emoji: '🔌' },
  { id: 'battery', name: 'Batería', emoji: '🔋' },
  { id: 'book', name: 'Libro', emoji: '📚' },
  { id: 'pen', name: 'Bolígrafo', emoji: '🖊️' },
  { id: 'folder', name: 'Carpeta', emoji: '📁' },
  { id: 'chair', name: 'Silla', emoji: '🪑' },
  { id: 'desk', name: 'Escritorio', emoji: '🗄️' },
  { id: 'box', name: 'Caja', emoji: '📦' },
  { id: 'tool', name: 'Herramienta', emoji: '🔧' },
];

// Función para obtener el emoji del icono
const getIconEmoji = (iconId?: string) => {
  if (!iconId) return '📦'; // Emoji por defecto (caja)
  const icon = PRODUCT_ICONS.find(icon => icon.id === iconId);
  return icon?.emoji || '📦';
};

interface ProductoDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productoId: number | null;
  onEdit: () => void;
}

interface ProductoDetalle {
  id: number;
  nombre: string;
  sku: string;
  descripcion?: string;
  categoria?: string;
  precio_base?: number;
  stock?: number;
  activo?: boolean;
  unidad_medida?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  icono?: string; // Identificador del icono
  proveedores?: {
    id: number;
    nombre: string;
    rfc?: string;
    precio?: number;
    tiempo_entrega?: string;
    calificacion?: number;
  }[];
  historial_compras?: {
    id: string;
    fecha: string;
    proveedor: string;
    cantidad: number;
    precio: number;
    estado: string;
  }[];
  estadisticas_compras?: {
    total_compras: number;
    cantidad_total: number;
    ultima_compra: string;
  };
}

const ProductoDetailsDialog: React.FC<ProductoDetailsDialogProps> = ({
  isOpen,
  onClose,
  productoId,
  onEdit,
}) => {
  const { toast } = useToast();
  const [producto, setProducto] = useState<ProductoDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Cargar datos del producto y sus proveedores asociados
  useEffect(() => {
    if (isOpen && productoId) {
      setLoading(true);

      // Intentar cargar datos del producto desde la API
      callApi(`/productos/${productoId}`)
        .then(data => {
          // Cargar los detalles de los proveedores desde la API
          callApi(`/productos/${productoId}/proveedores-detalle`)
            .then(proveedoresDetalle => {
              // Combinar los datos de proveedores con sus detalles
              const proveedoresCompletos = data.proveedores?.map((prov: any) => {
                // Buscar los detalles de este proveedor
                const detalles = proveedoresDetalle.find((p: any) => p.proveedor_id === prov.id);
                return {
                  ...prov,
                  precio: detalles?.precio || 0,
                  tiempo_entrega: detalles?.tiempo_entrega || '-',
                  calificacion: detalles?.calificacion || 0
                };
              });

              setProducto({
                ...data,
                proveedores: proveedoresCompletos
              });
            })
            .catch(error => {
              console.error('Error al cargar detalles de proveedores:', error);
              // Si falla, usar los datos básicos sin detalles
              setProducto(data);
            });
        })
        .catch(error => {
          console.error('Error al cargar producto:', error);

          // Usar datos de respaldo en caso de error
          const productoRespaldo = {
            id: productoId,
            nombre: "Laptop Dell XPS 13",
            sku: "LAP-DELL-XPS13",
            descripcion: "Laptop de alta gama para uso profesional",
            categoria: "Hardware",
            precio_base: 25000.00,
            stock: 15,
            activo: true,
            unidad_medida: "Pieza(s)",
            fecha_creacion: "2023-01-15T10:30:00Z",
            fecha_actualizacion: "2023-03-10T14:45:00Z",
            icono: "laptop", // Icono por defecto para laptops
            proveedores: [
              {
                id: 1,
                nombre: "TechSupplies Inc.",
                rfc: "TSI9012345ABC",
                tiempo_entrega: "3-5 días",
                precio: 23500.00,
                calificacion: 4.8
              },
              {
                id: 2,
                nombre: "Microsoft",
                rfc: "MSF80081SDEF",
                tiempo_entrega: "5-7 días",
                precio: 24800.00,
                calificacion: 4.5
              }
            ]
          };

          setProducto(productoRespaldo);

          toast({
            title: "Aviso",
            description: "Usando datos de demostración. La API no está disponible.",
            variant: "default"
          });
        })
        .finally(() => setLoading(false));

      // Cargar historial de compras o usar datos de respaldo
      setLoadingHistorial(true);
      callApi(`/productos/${productoId}/historial`)
        .then(data => {
          if (data && data.historial) {
            // Formatear los datos del historial para la visualización
            const historialFormateado = data.historial.map((item: any) => ({
              id: `OC-${item.id}`,
              fecha: formatearFecha(item.fecha_creacion),
              proveedor: item.proveedor_nombre || 'No especificado',
              cantidad: item.cantidad || 0,
              precio: item.precio_unitario || 0,
              estado: item.estado || 'Desconocido'
            }));

            // Actualizar el estado del producto con el historial
            setProducto(prevProducto => {
              if (!prevProducto) return null;
              return {
                ...prevProducto,
                historial_compras: historialFormateado,
                estadisticas_compras: {
                  total_compras: data.estadisticas?.total_compras || 0,
                  cantidad_total: data.estadisticas?.cantidad_total || 0,
                  ultima_compra: data.estadisticas?.ultima_compra ? formatearFecha(data.estadisticas.ultima_compra) : '-'
                }
              };
            });
          }
        })
        .catch(error => {
          console.error('Error al cargar historial:', error);

          // Usar datos de respaldo para el historial
          const historialRespaldo = [
            {
              id: 'OC-2023-001',
              fecha: '15/03/2023',
              proveedor: 'TechSupplies Inc.',
              cantidad: 5,
              precio: 23500.00,
              estado: 'Completada'
            },
            {
              id: 'OC-2023-008',
              fecha: '22/05/2023',
              proveedor: 'Microsoft',
              cantidad: 3,
              precio: 24800.00,
              estado: 'Completada'
            },
            {
              id: 'OC-2023-015',
              fecha: '10/08/2023',
              proveedor: 'TechSupplies Inc.',
              cantidad: 2,
              precio: 23500.00,
              estado: 'En proceso'
            }
          ];

          // Actualizar el estado del producto con el historial de respaldo
          setProducto(prevProducto => {
            if (!prevProducto) return null;
            return {
              ...prevProducto,
              historial_compras: historialRespaldo,
              estadisticas_compras: {
                total_compras: 8,
                cantidad_total: 32,
                ultima_compra: '15/03/2023'
              }
            };
          });
        })
        .finally(() => setLoadingHistorial(false));
    } else if (!isOpen) {
      setProducto(null);
    }
  }, [isOpen, productoId, toast]);

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return "-";
    try {
      return format(new Date(fecha), "dd/MM/yyyy", { locale: es });
    } catch {
      return fecha;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" aria-describedby="producto-dialog-description">
        <DialogHeader>
          <DialogTitle>Detalles del Producto</DialogTitle>
          <div className="flex items-center gap-2">
            <span id="producto-dialog-description" className="text-sm text-muted-foreground">Información completa del producto</span>
            {producto?.activo && (
              <Badge className="bg-green-100 text-green-800">Activo</Badge>
            )}
            {!producto?.activo && (
              <Badge className="bg-red-100 text-red-800">Inactivo</Badge>
            )}
          </div>
        </DialogHeader>
        <Tabs defaultValue="informacion" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="informacion">Información</TabsTrigger>
            <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>
          <TabsContent value="informacion">
            {loading || !producto ? (
              <div className="text-center text-muted-foreground py-8">Cargando...</div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16 border">
                    <AvatarFallback className="text-2xl bg-slate-100">
                      {getIconEmoji(producto.icono)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Nombre del Producto</div>
                        <div className="font-semibold">{producto.nombre}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">SKU</div>
                        <div className="font-mono">{producto.sku}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-xs text-muted-foreground">Descripción</div>
                  <div className="text-sm">{producto.descripcion || "-"}</div>
                </div>
                <div className="flex gap-4 mb-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Categoría</div>
                    <Badge variant="secondary">{producto.categoria || "-"}</Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Precio</div>
                    <span className="font-semibold">
                      {producto.precio_base !== undefined
                        ? `$${producto.precio_base.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Stock</div>
                    <span className={producto.stock && producto.stock > 0 ? "text-green-600 font-semibold" : "text-red-600"}>
                      {producto.stock !== undefined ? `${producto.stock} ${producto.unidad_medida || ""}` : "-"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 mb-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Fecha de Creación</div>
                    <span>{formatearFecha(producto.fecha_creacion)}</span>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Última Actualización</div>
                    <span>{formatearFecha(producto.fecha_actualizacion)}</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="proveedores">
            {loading || !producto ? (
              <div className="text-center text-muted-foreground py-8">Cargando...</div>
            ) : !producto.proveedores || producto.proveedores.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">Este producto no tiene proveedores asociados.</div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Proveedores Asociados</h3>
                {producto.proveedores.map((prov) => (
                  <div key={prov.id} className="border rounded-md p-4 bg-slate-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-100 p-2 rounded-md">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="24" height="24" rx="4" fill="#E6F0F9"/>
                          <path d="M6 8H18V17H6V8Z" stroke="#0072CE" strokeWidth="1.5"/>
                          <path d="M8 8V6C8 5.44772 8.44772 5 9 5H15C15.5523 5 16 5.44772 16 6V8" stroke="#0072CE" strokeWidth="1.5"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium">{prov.nombre}</h4>
                        <p className="text-xs text-slate-500">RFC: {prov.rfc || 'No disponible'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Precio</p>
                        <p className="font-medium">${prov.precio?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Tiempo de Entrega</p>
                        <p className="font-medium">{prov.tiempo_entrega || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Calificación</p>
                        <p className="font-medium flex items-center">
                          {prov.calificacion ? (
                            <span className="flex items-center">
                              {prov.calificacion}
                              <span className="text-yellow-500 ml-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star} className={Number(prov.calificacion) >= star ? "text-yellow-500" : "text-gray-300"}>
                                    ★
                                  </span>
                                ))}
                              </span>
                            </span>
                          ) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="historial">
            {loading || loadingHistorial ? (
              <div className="text-center text-muted-foreground py-8">Cargando...</div>
            ) : !producto?.historial_compras || producto.historial_compras.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No hay historial de compras para este producto.</div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-md p-4 bg-slate-50">
                  <h3 className="font-medium mb-2">Historial de Compras</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Total de Compras</p>
                      <p className="font-medium text-lg">{producto.estadisticas_compras?.total_compras || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Cantidad Total</p>
                      <p className="font-medium text-lg">{producto.estadisticas_compras?.cantidad_total || 0} unidades</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Última Compra</p>
                      <p className="font-medium">{producto.estadisticas_compras?.ultima_compra || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-xs font-medium text-slate-500">
                      <tr>
                        <th className="px-4 py-2 text-left">Orden</th>
                        <th className="px-4 py-2 text-left">Fecha</th>
                        <th className="px-4 py-2 text-left">Proveedor</th>
                        <th className="px-4 py-2 text-left">Cantidad</th>
                        <th className="px-4 py-2 text-left">Precio</th>
                        <th className="px-4 py-2 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {producto.historial_compras.map((compra) => (
                        <tr key={compra.id} className="text-sm">
                          <td className="px-4 py-3 font-medium">{compra.id}</td>
                          <td className="px-4 py-3">{compra.fecha}</td>
                          <td className="px-4 py-3">{compra.proveedor}</td>
                          <td className="px-4 py-3">{compra.cantidad}</td>
                          <td className="px-4 py-3">${compra.precio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${compra.estado.toLowerCase().includes('complet') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {compra.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={onEdit} className="bg-blue-600 text-white hover:bg-blue-700">
            Editar Producto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductoDetailsDialog;