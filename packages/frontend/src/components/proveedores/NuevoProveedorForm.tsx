import React, { useState, useEffect } from "react"; // Importar useEffect
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createProveedor, updateProveedor } from "@/services/proveedores.service"; // Proveedor no se usa aquí
import { callApi } from "@/services/api"; // Importar callApi
import { Checkbox } from "@/components/ui/checkbox"; // Importar Checkbox
import { ScrollArea } from "@/components/ui/scroll-area"; // Importar ScrollArea
import { Building2 } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Tipo para el formulario de nuevo proveedor
type NewProveedorForm = {
  nombre: string;
  rfc: string;
  direccion: string;
  contacto_nombre: string;
  telefono: string;
  email: string;
  sitio_web: string;
  categorias: string[]; // Mantener por ahora, aunque la asociación principal será por productos
  estado: string;
  logo?: File;
  calificacion?: string;
  notas_adicionales?: string;
  selectedProductoIds: number[]; // Nuevo estado para IDs de productos seleccionados
};

// Interfaz para los productos obtenidos de la API
interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
}

interface NuevoProveedorFormProps {
  onSuccess: () => void;
  // El prop proveedor debe incluir todos los campos necesarios para poblar el form
  proveedor?: Partial<NewProveedorForm> & { id: number };
}

const NuevoProveedorForm: React.FC<NuevoProveedorFormProps> = ({ onSuccess, proveedor }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<NewProveedorForm>({
    // Valores iniciales por defecto
    nombre: "",
    rfc: "",
    direccion: "",
    contacto_nombre: "",
    telefono: "",
    email: "",
    sitio_web: "",
    categorias: [],
    estado: "activo",
    calificacion: "5",
    notas_adicionales: "",
    selectedProductoIds: [],
  });

  // Efecto para poblar el formulario si estamos editando
  useEffect(() => {
    if (proveedor) {
      setFormData({
        nombre: proveedor.nombre || "",
        rfc: proveedor.rfc || "",
        direccion: proveedor.direccion || "",
        contacto_nombre: proveedor.contacto_nombre || "",
        telefono: proveedor.telefono || "",
        email: proveedor.email || "",
        sitio_web: proveedor.sitio_web || "",
        categorias: proveedor.categorias || [],
        estado: proveedor.estado || "activo",
        calificacion: proveedor.calificacion || "5",
        notas_adicionales: proveedor.notas_adicionales || "",
        selectedProductoIds: [], // Se carga en el otro useEffect
        // No incluir 'logo' aquí, se maneja por separado
      });
    } else {
      // Resetear si no hay proveedor (modo creación)
       setFormData({
         nombre: "", rfc: "", direccion: "", contacto_nombre: "", telefono: "",
         email: "", sitio_web: "", categorias: [], estado: "activo",
         calificacion: "5", notas_adicionales: "", selectedProductoIds: []
       });
    }
  }, [proveedor]); // Ejecutar cuando el prop proveedor cambie
  const [availableProductos, setAvailableProductos] = useState<Producto[]>([]); // Estado para productos disponibles
  const [loadingProductos, setLoadingProductos] = useState(false); // Estado de carga para productos

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, logo: e.target.files[0] });
    }
  };

  // Cargar productos disponibles al montar el componente
  useEffect(() => {
    const fetchProductos = async () => {
      setLoadingProductos(true);
      try {
        const data = await callApi('/productos'); // Asumiendo endpoint GET /api/productos
        setAvailableProductos(data || []);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos disponibles.",
          variant: "destructive",
        });
      } finally {
        setLoadingProductos(false);
      }
    };
    fetchProductos();

    // Si estamos editando un proveedor, cargar productos asociados
    if (proveedor && proveedor.id) {
      callApi(`/suppliers/${proveedor.id}/productos`)
        .then((ids: number[]) => {
          setFormData(prev => ({
            ...prev,
            selectedProductoIds: ids || []
          }));
        })
        .catch((error) => {
          console.error("Error al cargar productos asociados al proveedor:", error);
          toast({ title: "Error", description: "No se pudieron cargar los productos asociados.", variant: "destructive" });
        });
    }

  }, [proveedor, toast]); // Añadir proveedor a las dependencias

  // Manejar selección/deselección de productos
  const handleProductoSelectionChange = (productoId: number, isSelected: boolean) => {
    setFormData(prev => {
      const currentSelectedIds = prev.selectedProductoIds;
      if (isSelected) {
        // Añadir ID si no está presente
        return { ...prev, selectedProductoIds: [...new Set([...currentSelectedIds, productoId])] };
      } else {
        // Quitar ID
        return { ...prev, selectedProductoIds: currentSelectedIds.filter(id => id !== productoId) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!proveedor?.id; // Mover la definición aquí para que esté disponible en todo el scope
    try {
      // Preparar los datos
      const preparedData = {
        ...formData,
        // Si sitio_web está vacío, establecerlo como undefined
        sitio_web: formData.sitio_web.trim() || undefined,
        // Eliminar el campo logo si está vacío
        logo: formData.logo || undefined,
        producto_ids: formData.selectedProductoIds, // Incluir los IDs seleccionados
        // Asegurarse de que categorias se envíe correctamente
        categorias: formData.categorias.length > 0 ? formData.categorias : undefined
      };

      console.log('Enviando datos al servidor:', preparedData);

      // Si hay un archivo de logo, usar FormData
      if (preparedData.logo) {
        const formDataToSend = new FormData();

        // Añadir todos los campos excepto categorías como strings
        // Añadir todos los campos excepto categorías y producto_ids como strings o File
        Object.entries(preparedData).forEach(([key, value]) => {
          if (value !== undefined && key !== 'categorias' && key !== 'producto_ids') {
            if (key === 'logo' && value instanceof File) {
              formDataToSend.append('logo', value);
            } else {
              formDataToSend.append(key, String(value));
            }
          }
        });

        // Añadir categorías y producto_ids como JSON
        if (preparedData.categorias) {
          formDataToSend.append('categorias', JSON.stringify(preparedData.categorias));
        }
        if (preparedData.producto_ids && preparedData.producto_ids.length > 0) {
          formDataToSend.append('producto_ids', JSON.stringify(preparedData.producto_ids));
        }
        // Añadir sitio_web explícitamente
        if (preparedData.sitio_web) {
          formDataToSend.append('sitio_web', preparedData.sitio_web);
        }

        // alert(`[Debug] Enviando FormData con producto_ids: ${JSON.stringify(preparedData.producto_ids)}`); // Eliminar alert temporal
        if (isEditing && proveedor) { // Añadir check para proveedor
          // La función updateProveedor espera Partial<Proveedor>, no FormData
          // Necesitamos enviar un objeto JSON, incluso si hay logo (el backend debe manejar la subida si es necesario)
          // Por ahora, asumimos que updateProveedor no maneja logo y enviamos JSON
           const { logo, selectedProductoIds, ...jsonData } = preparedData;
           // Asegurarse de que se envíen los campos correctos
           console.log('Actualizando proveedor con datos:', { ...jsonData, producto_ids: preparedData.producto_ids });
           await updateProveedor(proveedor.id, {
             ...jsonData,
             producto_ids: preparedData.producto_ids,
             sitio_web: preparedData.sitio_web,
             categorias: preparedData.categorias
           });
        } else {
          await createProveedor(formDataToSend); // Crear sí puede usar FormData por el logo
        }
      } else {
        // Si no hay logo, enviar como JSON normal
        const { logo, selectedProductoIds, ...jsonData } = preparedData; // Excluir selectedProductoIds
        if (isEditing && proveedor) { // Añadir check para proveedor
          await updateProveedor(proveedor.id, { ...jsonData, producto_ids: preparedData.producto_ids }); // Llamar a update si editamos con JSON
        } else {
          await createProveedor({ ...jsonData, producto_ids: preparedData.producto_ids }); // Llamar a create si creamos con JSON
        }
      }

      toast({
        title: "Éxito",
        description: `Proveedor ${isEditing ? 'actualizado' : 'creado'} correctamente`,
      });
      onSuccess();
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `No se pudo ${isEditing ? 'actualizar' : 'crear'} el proveedor`,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="informacion" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informacion">Información</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="adicional">Adicional</TabsTrigger>
        </TabsList>

        <TabsContent value="informacion" className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="required">Nombre o Razón Social</Label>
              <Input
                id="nombre"
                placeholder="Nombre del proveedor"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfc" className="required">RFC</Label>
              <Input
                id="rfc"
                placeholder="RFC del proveedor"
                value={formData.rfc}
                onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea
              id="direccion"
              placeholder="Dirección completa"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contacto" className="required">Persona de Contacto</Label>
              <Input
                id="contacto"
                placeholder="Nombre del contacto"
                value={formData.contacto_nombre}
                onChange={(e) => setFormData({ ...formData, contacto_nombre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                placeholder="Número de teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="required">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sitio_web">Sitio Web</Label>
              <Input
                id="sitio_web"
                type="url"
                placeholder="https://ejemplo.com"
                value={formData.sitio_web}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  setFormData({ ...formData, sitio_web: value });
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categorías</Label>
            <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
              {[
                { id: 'tecnologia', label: 'Tecnología' },
                { id: 'papeleria', label: 'Papelería' },
                { id: 'mobiliario', label: 'Mobiliario' },
                { id: 'servicios', label: 'Servicios' },
                { id: 'oficina', label: 'Oficina' },
                { id: 'limpieza', label: 'Limpieza' }
              ].map((categoria) => (
                <div key={categoria.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`categoria-${categoria.id}`}
                    checked={formData.categorias.includes(categoria.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          categorias: [...formData.categorias, categoria.id]
                        });
                      } else {
                        setFormData({
                          ...formData,
                          categorias: formData.categorias.filter(cat => cat !== categoria.id)
                        });
                      }
                    }}
                  />
                  <Label
                    htmlFor={`categoria-${categoria.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {categoria.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500">Selecciona todas las categorías que apliquen</p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="estado"
              checked={formData.estado === "activo"}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, estado: checked ? "activo" : "inactivo" })
              }
            />
            <Label htmlFor="estado">Proveedor activo</Label>
          </div>
        </TabsContent>

        <TabsContent value="productos" className="py-4">
          <Label>Productos Asociados</Label>
          <p className="text-xs text-slate-500 mb-2">Selecciona los productos que ofrece este proveedor</p>
          <ScrollArea className="h-[300px] border rounded-md p-2">
            {loadingProductos ? (
              <p className="text-sm text-slate-500">Cargando productos...</p>
            ) : availableProductos.length === 0 ? (
              <p className="text-sm text-slate-500">No hay productos disponibles para seleccionar.</p>
            ) : (
              <div className="space-y-2">
                {availableProductos.map((producto) => (
                  <div key={producto.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`producto-${producto.id}`}
                      checked={formData.selectedProductoIds.includes(producto.id)}
                      onCheckedChange={(checked) => handleProductoSelectionChange(producto.id, !!checked)}
                    />
                    <Label htmlFor={`producto-${producto.id}`} className="font-normal">
                      {producto.nombre}
                      {producto.categoria && <span className="text-xs text-slate-500 ml-2">({producto.categoria})</span>}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="adicional" className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="logo">Logo del Proveedor</Label>
            <div className="flex items-center gap-4">
              <Building2 className="h-8 w-8 text-slate-400" />
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="flex-1"
              />
            </div>
            <p className="text-sm text-slate-500">Sin archivos seleccionados</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calificacion">Calificación</Label>
            <Select
              value={formData.calificacion}
              onValueChange={(value) => setFormData({ ...formData, calificacion: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar calificación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 - Excelente</SelectItem>
                <SelectItem value="4">4 - Muy Bueno</SelectItem>
                <SelectItem value="3">3 - Bueno</SelectItem>
                <SelectItem value="2">2 - Regular</SelectItem>
                <SelectItem value="1">1 - Malo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas_adicionales">Notas Adicionales</Label>
            <Textarea
              id="notas_adicionales"
              placeholder="Información adicional sobre el proveedor"
              value={formData.notas_adicionales}
              onChange={(e) => setFormData({ ...formData, notas_adicionales: e.target.value })}
              rows={4}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-blue-600 text-white">
          {proveedor ? 'Actualizar' : 'Guardar'} Proveedor
        </Button>
      </div>
    </form>
  );
};

export default NuevoProveedorForm;