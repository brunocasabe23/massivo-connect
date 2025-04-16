import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import ProductoDetailsDialog from '@/components/productos/ProductoDetailsDialog';
import { Plus, Edit, Trash, MoreHorizontal } from 'lucide-react';
import ProductoForm from '@/components/productos/ProductoForm'; // Importar el formulario (una sola vez)
import { callApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

// Interfaz Producto actualizada para coincidir con ProductoData y DB
interface Producto {
  id: number;
  nombre: string;
  sku: string;
  descripcion?: string;
  categoria?: string;
  subcategoria?: string;
  unidad_medida?: string;
  precio_base?: number;
  stock?: number;
  activo?: boolean;
  icono?: string; // Añadir icono
  proveedores?: { id: number; nombre: string }[]; // Añadir proveedores asociados
}

const ProductosPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [selectedProductoId, setSelectedProductoId] = useState<number | null>(null);
  // const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Eliminado, ya no se usa
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const data = await callApi('/productos');
      setProductos(data || []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast({ title: "Error", description: "No se pudieron cargar los productos.", variant: "destructive" });
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleOpenNewForm = () => {
    setEditingProducto(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (producto: Producto) => {
    setEditingProducto(producto);
    setIsFormOpen(true);
  };

  const handleDeleteProducto = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    try {
      await callApi(`/productos/${id}`, { method: 'DELETE' });
      toast({ title: "Éxito", description: "Producto eliminado." });
      fetchProductos();
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchProductos();
  };

  // Filtros
  const filteredProductos = productos.filter((prod) => {
    if (activeTab === "activos") return prod.activo;
    if (activeTab === "agotados") return prod.stock === 0;
    if (activeTab === "inactivos") return prod.activo === false;
    return true;
  }).filter((prod) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      prod.nombre.toLowerCase().includes(searchLower) ||
      prod.sku?.toLowerCase().includes(searchLower) ||
      prod.categoria?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-slate-500">Gestiona el catálogo de productos y sus proveedores asociados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Importar</Button>
          <Button className="bg-[#005291]" onClick={handleOpenNewForm}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="activos">Activos</TabsTrigger>
            <TabsTrigger value="agotados">Agotados</TabsTrigger>
            <TabsTrigger value="inactivos">Inactivos</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button variant="outline">Filtrar</Button>
          <Button variant="outline">Exportar</Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">Icono</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Proveedores</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center">Cargando...</TableCell></TableRow>
            ) : filteredProductos.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center">No hay productos creados.</TableCell></TableRow>
            ) : (
              filteredProductos.map((prod) => (
                <TableRow key={prod.id}>
                  <TableCell className="w-10">
                    <div className="flex justify-center">
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback className="text-lg bg-slate-100">
                          {getIconEmoji(prod.icono)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{prod.nombre}</TableCell>
                  <TableCell className="font-mono">{prod.sku}</TableCell>
                  <TableCell>
                    {prod.categoria ? (
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{prod.categoria}</span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {prod.precio_base !== undefined
                      ? `$${prod.precio_base.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <span className={prod.stock && prod.stock > 0 ? "text-green-600 font-semibold" : "text-red-600"}>
                      {prod.stock !== undefined ? prod.stock : "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {prod.proveedores && prod.proveedores.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {prod.proveedores.map((prov) => (
                          <span key={prov.id} className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {prov.nombre}
                          </span>
                        ))}
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <span className={prod.activo ? "inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800" : "inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800"}>
                      {prod.activo ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedProductoId(prod.id)}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="mr-2"><path d="M12 5v14m7-7H5" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" /></svg>
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEditForm(prod)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProducto(prod.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de detalles de producto */}
      <ProductoDetailsDialog
        isOpen={!!selectedProductoId}
        onClose={() => setSelectedProductoId(null)}
        productoId={selectedProductoId}
        onEdit={() => {
          if (selectedProductoId) {
            const prod = productos.find(p => p.id === selectedProductoId) || null;
            setEditingProducto(prod);
            setIsFormOpen(true);
            setSelectedProductoId(null);
          }
        }}
      />

      {/* Diálogo para crear/editar producto */}
      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingProducto ? 'Editar' : 'Nuevo'} Producto</DialogTitle>
              <DialogDescription>
                Completa la información del producto.
              </DialogDescription>
            </DialogHeader>
            <ProductoForm
              producto={editingProducto}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProductosPage;