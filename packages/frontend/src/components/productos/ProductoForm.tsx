import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Checkbox } from "@/components/ui/checkbox"; // Ya no se utiliza
import { ScrollArea } from "@/components/ui/scroll-area"; // Importar ScrollArea
import { useToast } from "@/hooks/use-toast";
import { callApi } from '@/services/api';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Plus, Trash2, ExternalLink, Building2 } from "lucide-react";

// Definir los iconos disponibles para productos
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

// Interfaz para los detalles de un proveedor asociado a un producto
interface ProveedorProducto {
  proveedor_id: number;
  nombre: string;
  rfc?: string;
  precio?: number;
  tiempo_entrega?: string;
  calificacion?: number;
}

// Interfaz para los datos del producto (coincide con columnas DB + activo)
interface ProductoData {
  id?: number; // Opcional para creación
  nombre: string;
  sku: string;
  descripcion?: string;
  categoria?: string;
  subcategoria?: string; // Asumiendo que existe o se añadirá
  unidad_medida?: string;
  precio_base?: number;
  stock?: number;
  activo?: boolean;
  proveedor_ids?: number[]; // Para recibir IDs al editar (a implementar carga)
  loadingProveedoresAsociados?: boolean; // Para mostrar loading si es necesario
  selectedProveedorIds?: number[]; // Para manejar selección en el form
  proveedoresDetalle?: ProveedorProducto[]; // Detalles de los proveedores asociados

  // Campos adicionales
  icono?: string; // Identificador del icono seleccionado
  codigo_barras?: string; // Código de barras
  ubicacion_almacen?: string; // Ubicación en almacén
  notas_adicionales?: string; // Notas adicionales
}

interface ProductoFormProps {
  producto?: ProductoData | null; // Para edición
  onSuccess: () => void; // Callback al guardar
  onCancel: () => void; // Callback al cancelar
}

const ProductoForm: React.FC<ProductoFormProps> = ({ producto, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProductoData>({
    nombre: '',
    sku: '',
    descripcion: '',
    categoria: '',
    subcategoria: '',
    unidad_medida: '',
    precio_base: 0,
    stock: 0,
    activo: true,
    ...producto, // Sobrescribir con datos existentes si es edición
    selectedProveedorIds: producto?.proveedor_ids || [], // Inicializar con IDs existentes si es edición (requiere cargar esta info)
    proveedoresDetalle: [] // Inicializar el array de detalles de proveedores
  });
  const [categorias, setCategorias] = useState<string[]>([]); // Para el select de categorías
  // const [loadingProveedoresAsociados, setLoadingProveedoresAsociados] = useState(false); // Eliminado, no se usa
  const [availableProveedores, setAvailableProveedores] = useState<{id: number, nombre: string}[]>([]);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [iconSearchTerm, setIconSearchTerm] = useState(''); // Para buscar iconos

  // Cargar categorías
  useEffect(() => {
    // Cargar categorías (ejemplo)
    // TODO: Cargar categorías reales desde API (ej. GET /api/productos/categorias)
    setCategorias(['Tecnología', 'Papelería', 'Mobiliario', 'Servicios', 'Otros']);
  }, []);

  // Cargar proveedores disponibles
  useEffect(() => {
    const fetchProveedores = async () => {
      setLoadingProveedores(true);
      try {
        const data = await callApi('/suppliers/simple');
        console.log('[ProductoForm] Proveedores recibidos:', data); // Log para depuración
        setAvailableProveedores(data || []);
      } catch (error) {
        console.error("Error al cargar proveedores:", error);
        toast({ title: "Error", description: "No se pudieron cargar los proveedores.", variant: "destructive" });
      } finally {
        setLoadingProveedores(false);
      }
    };
    fetchProveedores();
  }, [toast]);

  // Cargar proveedores asociados al producto cuando se está editando
  useEffect(() => {
    // Si no estamos editando o no hay proveedores disponibles, salir
    if (!producto?.id || availableProveedores.length === 0) return;

    setLoadingProveedores(true);

    // Primero cargar los IDs de los proveedores asociados
    callApi(`/productos/${producto.id}/proveedores`)
      .then(async (ids: number[]) => {
        // Guardar los IDs
        setFormData(prev => ({
          ...prev,
          selectedProveedorIds: ids || []
        }));

        // Si hay proveedores asociados, cargar sus detalles
        if (ids && ids.length > 0) {
          try {
            // Intentar cargar los detalles de los proveedores
            // Esta es una llamada simulada - ajustar según la API real
            const detallesProveedores = await callApi(`/productos/${producto.id}/proveedores-detalle`)
              .catch(() => null); // Si falla, devolver null para manejar en el siguiente bloque

            // Si no hay detalles disponibles, crear objetos básicos con los IDs
            if (!detallesProveedores || detallesProveedores.length === 0) {
              console.log('Creando detalles básicos de proveedores');
              // Crear detalles básicos a partir de los IDs y los proveedores disponibles
              const proveedoresDetalleBasicos = ids.map(id => {
                const provInfo = availableProveedores.find(p => p.id === id);
                return {
                  proveedor_id: id,
                  nombre: provInfo?.nombre || `Proveedor ${id}`,
                  rfc: '',
                  precio: 0,
                  tiempo_entrega: '',
                  calificacion: 0
                };
              });

              setFormData(prev => ({
                ...prev,
                proveedoresDetalle: proveedoresDetalleBasicos
              }));
            } else {
              // Usar los detalles recibidos de la API
              setFormData(prev => ({
                ...prev,
                proveedoresDetalle: detallesProveedores
              }));
            }
          } catch (detailError) {
            console.error("Error al cargar detalles de proveedores:", detailError);

            // En caso de error, crear objetos básicos
            const proveedoresDetalleBasicos = ids.map(id => {
              const provInfo = availableProveedores.find(p => p.id === id);
              return {
                proveedor_id: id,
                nombre: provInfo?.nombre || `Proveedor ${id}`,
                rfc: '',
                precio: 0,
                tiempo_entrega: '',
                calificacion: 0
              };
            });

            setFormData(prev => ({
              ...prev,
              proveedoresDetalle: proveedoresDetalleBasicos
            }));
          }
        }
      })
      .catch((error) => {
        console.error("Error al cargar proveedores asociados al producto:", error);
        toast({ title: "Error", description: "No se pudieron cargar los proveedores asociados.", variant: "destructive" });
      })
      .finally(() => setLoadingProveedores(false));
  }, [producto, availableProveedores, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    // const isCheckbox = type === 'checkbox'; // Eliminado, no se usa

    setFormData(prev => ({
      ...prev,
      [name]: isNumber ? (value === '' ? undefined : Number(value)) : value
    }));
  };

  // Manejador para la selección de icono
  const handleIconChange = (iconId: string) => {
    setFormData(prev => ({
      ...prev,
      icono: iconId
    }));
  };

  // Función para obtener el emoji del icono seleccionado
  const getSelectedIconEmoji = () => {
    const selectedIcon = PRODUCT_ICONS.find(icon => icon.id === formData.icono);
    return selectedIcon?.emoji || '📦'; // Emoji por defecto si no hay selección
  };

   const handleSelectChange = (name: keyof ProductoData, value: string) => {
     setFormData(prev => ({ ...prev, [name]: value }));
   };

   const handleSwitchChange = (name: keyof ProductoData, checked: boolean) => {
     setFormData(prev => ({ ...prev, [name]: checked }));
   };

  // Manejar selección/deselección de proveedores
  const handleProveedorSelectionChange = (proveedorId: number, isSelected: boolean) => {
    setFormData(prev => {
      const currentSelectedIds = prev.selectedProveedorIds || [];
      if (isSelected) {
        // Buscar el proveedor en availableProveedores
        const proveedorSeleccionado = availableProveedores.find(p => p.id === proveedorId);

        // Añadir el proveedor a proveedoresDetalle si no existe
        const proveedoresDetalleActualizados = [...(prev.proveedoresDetalle || [])];
        if (!proveedoresDetalleActualizados.some(p => p.proveedor_id === proveedorId) && proveedorSeleccionado) {
          proveedoresDetalleActualizados.push({
            proveedor_id: proveedorId,
            nombre: proveedorSeleccionado.nombre,
            rfc: '',
            precio: 0,
            tiempo_entrega: '',
            calificacion: 0
          });
        }

        return {
          ...prev,
          selectedProveedorIds: [...new Set([...currentSelectedIds, proveedorId])],
          proveedoresDetalle: proveedoresDetalleActualizados
        };
      } else {
        // Eliminar el proveedor de proveedoresDetalle
        const proveedoresDetalleActualizados = (prev.proveedoresDetalle || []).filter(
          p => p.proveedor_id !== proveedorId
        );

        return {
          ...prev,
          selectedProveedorIds: currentSelectedIds.filter(id => id !== proveedorId),
          proveedoresDetalle: proveedoresDetalleActualizados
        };
      }
    });
  };

  // Actualizar detalles de un proveedor
  const handleProveedorDetalleChange = (proveedorId: number, field: keyof Omit<ProveedorProducto, 'proveedor_id' | 'nombre'>, value: any) => {
    setFormData(prev => {
      const proveedoresDetalle = [...(prev.proveedoresDetalle || [])];
      const index = proveedoresDetalle.findIndex(p => p.proveedor_id === proveedorId);

      if (index !== -1) {
        proveedoresDetalle[index] = {
          ...proveedoresDetalle[index],
          [field]: value
        };
      }

      return {
        ...prev,
        proveedoresDetalle
      };
    });
  };

  // Añadir un nuevo proveedor
  const handleAddProveedor = (proveedorId: number) => {
    if (!formData.selectedProveedorIds?.includes(proveedorId)) {
      handleProveedorSelectionChange(proveedorId, true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (!formData.nombre || !formData.sku || !formData.categoria || !formData.unidad_medida) {
      toast({ title: "Error", description: "Nombre, SKU, Categoría y Unidad de Medida son requeridos.", variant: "destructive" });
      return;
    }

    try {
      const apiPath = formData.id ? `/productos/${formData.id}` : '/productos';
      const method = formData.id ? 'PUT' : 'POST';

      // Por ahora, enviamos los datos sin la imagen para que funcione con el backend actual
      // En una implementación completa, se debería modificar el backend para manejar FormData

      // Preparar solo los datos que el backend espera
      const dataToSend = {
          nombre: formData.nombre,
          sku: formData.sku,
          descripcion: formData.descripcion || '',
          categoria: formData.categoria || '',
          subcategoria: formData.subcategoria || '',
          unidad_medida: formData.unidad_medida || '',
          precio_base: formData.precio_base ?? 0,
          stock: formData.stock ?? 0,
          activo: formData.activo ?? true,
          proveedor_ids: formData.selectedProveedorIds || [], // Enviar IDs seleccionados
          // Detalles de proveedores
          proveedores_detalle: formData.proveedoresDetalle || [],
          // Campos adicionales
          codigo_barras: formData.codigo_barras || '',
          ubicacion_almacen: formData.ubicacion_almacen || '',
          notas_adicionales: formData.notas_adicionales || '',
          icono: formData.icono || 'box' // Icono por defecto si no se selecciona ninguno
      };

      // Enviar los datos como JSON normal (sin FormData)
      const response = await callApi(apiPath, {
        method,
        data: dataToSend
      });

      // Si hay detalles de proveedores, enviarlos al endpoint específico
      if (formData.proveedoresDetalle && formData.proveedoresDetalle.length > 0) {
        const productoId = formData.id || response.id;
        try {
          await callApi(`/productos/${productoId}/proveedores-detalle`, {
            method: 'POST',
            data: {
              proveedores_detalle: formData.proveedoresDetalle
            }
          });
          console.log('Detalles de proveedores guardados correctamente');
        } catch (proveedorError) {
          console.error('Error al guardar detalles de proveedores:', proveedorError);
          // No interrumpir el flujo principal si falla este paso
        }
      }

      // Nota: Para implementar la carga de imágenes, se necesitaría modificar el backend
      // para que acepte FormData y procese tanto los datos JSON como los archivos

      toast({ title: "Éxito", description: `Producto ${formData.id ? 'actualizado' : 'creado'} correctamente.` });
      onSuccess(); // Llamar al callback de éxito
    } catch (error: any) {
      console.error(`Error al ${formData.id ? 'actualizar' : 'crear'} producto:`, error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || `No se pudo ${formData.id ? 'actualizar' : 'crear'} el producto.`,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="informacion" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="informacion">Información</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
          <TabsTrigger value="adicional">Adicional</TabsTrigger>
        </TabsList>

        <TabsContent value="informacion" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="nombre" className="required">Nombre del Producto</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sku" className="required">SKU</Label>
              <Input id="sku" name="sku" placeholder="Código único" value={formData.sku} onChange={handleChange} required />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" name="descripcion" placeholder="Descripción detallada" value={formData.descripcion || ''} onChange={handleChange} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="categoria" className="required">Categoría</Label>
              <Select name="categoria" value={formData.categoria} onValueChange={(value) => handleSelectChange('categoria', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-1">
               <Label htmlFor="unidad_medida" className="required">Unidad de Medida</Label>
               <Select name="unidad_medida" value={formData.unidad_medida} onValueChange={(value) => handleSelectChange('unidad_medida', value)} required>
                 <SelectTrigger>
                   <SelectValue placeholder="Seleccionar unidad" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="Unidad">Unidad</SelectItem>
                   <SelectItem value="Caja">Caja</SelectItem>
                   <SelectItem value="Paquete">Paquete</SelectItem>
                   <SelectItem value="Kg">Kg</SelectItem>
                   <SelectItem value="Litro">Litro</SelectItem>
                   {/* Añadir más unidades */}
                 </SelectContent>
               </Select>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <Label htmlFor="precio_base">Precio</Label>
               <Input id="precio_base" name="precio_base" type="number" placeholder="0.00" value={formData.precio_base ?? ''} onChange={handleChange} step="0.01" min="0"/>
             </div>
             <div className="space-y-1">
               <Label htmlFor="stock">Stock</Label>
               <Input id="stock" name="stock" type="number" placeholder="Cantidad disponible" value={formData.stock ?? ''} onChange={handleChange} step="1" min="0"/>
             </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="activo" name="activo" checked={formData.activo} onCheckedChange={(checked) => handleSwitchChange('activo', checked)} />
            <Label htmlFor="activo">Producto activo</Label>
          </div>
        </TabsContent>

        <TabsContent value="proveedores" className="py-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Proveedores Asociados</h3>
            <Select
              value="placeholder"
              onValueChange={(value) => {
                if (value && value !== 'placeholder') {
                  const proveedorId = parseInt(value);
                  handleAddProveedor(proveedorId);
                }
              }}
            >
              <SelectTrigger className="w-[200px]">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Añadir Proveedor</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>Seleccionar proveedor</SelectItem>
                {availableProveedores
                  .filter(p => !formData.selectedProveedorIds?.includes(p.id))
                  .map(prov => (
                    <SelectItem key={prov.id} value={prov.id.toString()}>
                      {prov.nombre}
                    </SelectItem>
                  ))
                }
                {availableProveedores.filter(p => !formData.selectedProveedorIds?.includes(p.id)).length === 0 && (
                  <SelectItem value="no-disponibles" disabled>No hay proveedores disponibles</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {loadingProveedores ? (
            <div className="text-center py-12 border rounded-md bg-slate-50">
              <div className="flex justify-center mb-4">
                <div className="animate-pulse bg-slate-200 p-4 rounded-full">
                  <Building2 className="h-10 w-10 text-slate-300" />
                </div>
              </div>
              <h4 className="text-base font-medium text-slate-700 mb-2">Cargando proveedores</h4>
              <p className="text-sm text-slate-500">Espere un momento mientras obtenemos la información...</p>
            </div>
          ) : formData.proveedoresDetalle?.length === 0 ? (
            <div className="text-center py-12 border rounded-md bg-slate-50">
              <div className="flex justify-center mb-4">
                <div className="bg-slate-100 p-4 rounded-full">
                  <Building2 className="h-10 w-10 text-slate-400" />
                </div>
              </div>
              <h4 className="text-base font-medium text-slate-700 mb-2">No hay proveedores asociados a este producto</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                Los proveedores te permiten registrar diferentes opciones de compra para este producto,
                incluyendo precios, tiempos de entrega y calificaciones.
              </p>
              <Button
                variant="outline"
                className="mx-auto flex items-center gap-2"
                onClick={() => {
                  // Enfocar el selector de proveedores
                  const selectTrigger = document.querySelector('[class*="SelectTrigger"]');
                  if (selectTrigger instanceof HTMLElement) {
                    selectTrigger.click();
                  }
                }}
              >
                <Plus className="h-4 w-4" />
                Añadir Proveedor
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.proveedoresDetalle?.map((prov) => (
                <div key={prov.proveedor_id} className="border rounded-md overflow-hidden shadow-sm">
                  <div className="bg-white border-b p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-800">{prov.nombre}</h4>
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                              onClick={() => window.open(`/proveedores/${prov.proveedor_id}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" /> Ver
                            </button>
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-slate-500">RFC:</span>
                            <Input
                              className="inline-block w-32 h-6 ml-1 text-xs py-0 bg-slate-50"
                              value={prov.rfc || ''}
                              onChange={(e) => handleProveedorDetalleChange(prov.proveedor_id, 'rfc', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-slate-100"
                        onClick={() => handleProveedorSelectionChange(prov.proveedor_id, false)}
                        title="Eliminar proveedor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50">
                    <div>
                      <Label htmlFor={`precio-${prov.proveedor_id}`} className="text-xs text-slate-500 block mb-1 font-medium">Precio</Label>
                      <div className="flex items-center bg-white rounded-md border overflow-hidden">
                        <span className="px-2 text-slate-500">$</span>
                        <Input
                          id={`precio-${prov.proveedor_id}`}
                          type="number"
                          className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                          value={prov.precio || ''}
                          onChange={(e) => handleProveedorDetalleChange(
                            prov.proveedor_id,
                            'precio',
                            e.target.value === '' ? '' : parseFloat(e.target.value)
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`tiempo-${prov.proveedor_id}`} className="text-xs text-slate-500 block mb-1 font-medium">Tiempo de Entrega</Label>
                      <Input
                        id={`tiempo-${prov.proveedor_id}`}
                        className="h-8 bg-white"
                        placeholder="Ej: 3-5 días"
                        value={prov.tiempo_entrega || ''}
                        onChange={(e) => handleProveedorDetalleChange(prov.proveedor_id, 'tiempo_entrega', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`calificacion-${prov.proveedor_id}`} className="text-xs text-slate-500 block mb-1 font-medium">Calificación</Label>
                      <Select
                        value={(prov.calificacion === 0 || prov.calificacion === undefined) ? '0' : prov.calificacion?.toString() || '0'}
                        onValueChange={(value) => handleProveedorDetalleChange(
                          prov.proveedor_id,
                          'calificacion',
                          value === '0' ? 0 : parseFloat(value)
                        )}
                      >
                        <SelectTrigger className="h-8 bg-white">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sin calificación</SelectItem>
                          <SelectItem value="5">5 - Excelente</SelectItem>
                          <SelectItem value="4">4 - Muy bueno</SelectItem>
                          <SelectItem value="3">3 - Bueno</SelectItem>
                          <SelectItem value="2">2 - Regular</SelectItem>
                          <SelectItem value="1">1 - Malo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="adicional" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Icono del Producto</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                  <AvatarFallback className="text-2xl">
                    {getSelectedIconEmoji()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  Selecciona un icono para representar este producto
                </div>
              </div>

              <div className="mt-4">
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Buscar iconos..."
                    className="pl-10"
                    value={iconSearchTerm}
                    onChange={(e) => setIconSearchTerm(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-[200px] border rounded-md p-2">
                  <RadioGroup
                    value={formData.icono || ''}
                    onValueChange={handleIconChange}
                    className="grid grid-cols-4 gap-2"
                  >
                    {PRODUCT_ICONS.filter(icon =>
                      icon.name.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
                      icon.id.toLowerCase().includes(iconSearchTerm.toLowerCase())
                    ).map((icon) => (
                      <div key={icon.id} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={icon.id}
                          id={`icon-${icon.id}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`icon-${icon.id}`}
                          className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer w-full"
                        >
                          <span className="text-2xl">{icon.emoji}</span>
                          <span className="text-xs mt-1 text-center">{icon.name}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </ScrollArea>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="codigo_barras">Código de Barras</Label>
              <Input
                id="codigo_barras"
                name="codigo_barras"
                placeholder="Código de barras del producto"
                value={formData.codigo_barras || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ubicacion_almacen">Ubicación en Almacén</Label>
              <Input
                id="ubicacion_almacen"
                name="ubicacion_almacen"
                placeholder="Ej: Estante A, Pasillo 3"
                value={formData.ubicacion_almacen || ''}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notas_adicionales">Notas Adicionales</Label>
              <Textarea
                id="notas_adicionales"
                name="notas_adicionales"
                placeholder="Información adicional sobre el producto"
                value={formData.notas_adicionales || ''}
                onChange={handleChange}
                rows={4}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-[#005291]">
          {formData.id ? 'Actualizar' : 'Guardar'} Producto
        </Button>
      </div>
    </form>
  );
};

export default ProductoForm;