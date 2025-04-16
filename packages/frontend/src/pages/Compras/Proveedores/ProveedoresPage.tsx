"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Trash,
  Edit,
  Eye,
  Download,
  Upload,
  Building2,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Definición de tipos
interface Proveedor {
  id: string
  nombre: string
  rfc: string
  direccion: string
  contacto: string
  telefono: string
  email: string
  sitioWeb: string
  categorias: string[]
  productos: string[]
  activo: boolean
  fechaRegistro: string
  ultimaCompra: string | null
  calificacion: number
  logo: string | null
  notas: string
}

interface Producto {
  id: string
  nombre: string
  categoria: string
  descripcion: string
}

export default function ProveedoresPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isDetalleDialogOpen, setIsDetalleDialogOpen] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)
  const [activeTab, setActiveTab] = useState("todos")
  const [isEditMode, setIsEditMode] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    message: string
    type: "success" | "error" | "warning"
  }>({
    show: false,
    message: "",
    type: "success",
  })

  // Datos de ejemplo para proveedores
  const proveedores: Proveedor[] = [
    {
      id: "PROV-001",
      nombre: "TechSupplies Inc.",
      rfc: "TSI931215ABC",
      direccion: "123 Tech Avenue, Silicon Valley, CA 94043",
      contacto: "John Smith",
      telefono: "+1 (555) 123-4567",
      email: "contact@techsupplies.com",
      sitioWeb: "www.techsupplies.com",
      categorias: ["Tecnología", "Hardware", "Software"],
      productos: ["Laptops", "Monitores", "Teclados", "Software de Desarrollo"],
      activo: true,
      fechaRegistro: "15/01/2022",
      ultimaCompra: "05/03/2023",
      calificacion: 4.8,
      logo: null,
      notas: "Proveedor principal para equipos de cómputo y accesorios.",
    },
    {
      id: "PROV-002",
      nombre: "Office Depot",
      rfc: "OFD850630XYZ",
      direccion: "456 Office Blvd, Business District, NY 10001",
      contacto: "Sarah Johnson",
      telefono: "+1 (555) 987-6543",
      email: "business@officedepot.com",
      sitioWeb: "www.officedepot.com",
      categorias: ["Papelería", "Mobiliario", "Tecnología"],
      productos: ["Papel", "Bolígrafos", "Sillas", "Escritorios", "Impresoras"],
      activo: true,
      fechaRegistro: "03/05/2021",
      ultimaCompra: "12/04/2023",
      calificacion: 4.5,
      logo: null,
      notas: "Proveedor de artículos de oficina y mobiliario.",
    },
    {
      id: "PROV-003",
      nombre: "Microsoft",
      rfc: "MSF860815DEF",
      direccion: "One Microsoft Way, Redmond, WA 98052",
      contacto: "Michael Brown",
      telefono: "+1 (555) 111-2222",
      email: "enterprise@microsoft.com",
      sitioWeb: "www.microsoft.com",
      categorias: ["Software", "Servicios Cloud", "Hardware"],
      productos: ["Office 365", "Azure", "Windows", "Surface"],
      activo: true,
      fechaRegistro: "10/02/2020",
      ultimaCompra: "20/02/2023",
      calificacion: 4.9,
      logo: null,
      notas: "Proveedor principal para licencias de software y servicios cloud.",
    },
    {
      id: "PROV-004",
      nombre: "Muebles Modernos",
      rfc: "MMO900512GHI",
      direccion: "789 Furniture St, Design District, TX 75207",
      contacto: "Laura Martinez",
      telefono: "+1 (555) 333-4444",
      email: "ventas@mueblesmodernos.com",
      sitioWeb: "www.mueblesmodernos.com",
      categorias: ["Mobiliario", "Decoración"],
      productos: ["Sillas Ergonómicas", "Escritorios", "Archiveros", "Lámparas"],
      activo: false,
      fechaRegistro: "22/07/2021",
      ultimaCompra: "15/11/2022",
      calificacion: 3.7,
      logo: null,
      notas: "Proveedor de mobiliario de oficina. Inactivo temporalmente por problemas de suministro.",
    },
    {
      id: "PROV-005",
      nombre: "Catering Deluxe",
      rfc: "CDE110623JKL",
      direccion: "321 Gourmet Ave, Culinary District, IL 60607",
      contacto: "Carlos Rodriguez",
      telefono: "+1 (555) 555-6666",
      email: "eventos@cateringdeluxe.com",
      sitioWeb: "www.cateringdeluxe.com",
      categorias: ["Alimentos", "Eventos"],
      productos: ["Coffee Break", "Almuerzos Ejecutivos", "Eventos Corporativos"],
      activo: true,
      fechaRegistro: "05/03/2022",
      ultimaCompra: "28/03/2023",
      calificacion: 4.6,
      logo: null,
      notas: "Proveedor de servicios de catering para eventos corporativos.",
    },
  ]

  // Datos de ejemplo para productos
  const productos: Producto[] = [
    {
      id: "PROD-001",
      nombre: "Laptops",
      categoria: "Hardware",
      descripcion: "Computadoras portátiles para uso profesional",
    },
    { id: "PROD-002", nombre: "Monitores", categoria: "Hardware", descripcion: "Pantallas de alta resolución" },
    { id: "PROD-003", nombre: "Teclados", categoria: "Hardware", descripcion: "Teclados ergonómicos" },
    {
      id: "PROD-004",
      nombre: "Software de Desarrollo",
      categoria: "Software",
      descripcion: "IDEs y herramientas de desarrollo",
    },
    { id: "PROD-005", nombre: "Office 365", categoria: "Software", descripcion: "Suite de productividad" },
    {
      id: "PROD-006",
      nombre: "Azure",
      categoria: "Servicios Cloud",
      descripcion: "Plataforma de servicios en la nube",
    },
    { id: "PROD-007", nombre: "Windows", categoria: "Software", descripcion: "Sistema operativo" },
    { id: "PROD-008", nombre: "Surface", categoria: "Hardware", descripcion: "Dispositivos 2 en 1" },
    { id: "PROD-009", nombre: "Papel", categoria: "Papelería", descripcion: "Papel para impresión" },
    { id: "PROD-010", nombre: "Bolígrafos", categoria: "Papelería", descripcion: "Bolígrafos de diferentes colores" },
    { id: "PROD-011", nombre: "Sillas", categoria: "Mobiliario", descripcion: "Sillas de oficina" },
    { id: "PROD-012", nombre: "Escritorios", categoria: "Mobiliario", descripcion: "Escritorios para oficina" },
    { id: "PROD-013", nombre: "Impresoras", categoria: "Tecnología", descripcion: "Impresoras láser y de inyección" },
    { id: "PROD-014", nombre: "Sillas Ergonómicas", categoria: "Mobiliario", descripcion: "Sillas con soporte lumbar" },
    { id: "PROD-015", nombre: "Archiveros", categoria: "Mobiliario", descripcion: "Muebles para archivo" },
    { id: "PROD-016", nombre: "Lámparas", categoria: "Decoración", descripcion: "Iluminación para oficina" },
    { id: "PROD-017", nombre: "Coffee Break", categoria: "Alimentos", descripcion: "Servicio de café y bocadillos" },
    { id: "PROD-018", nombre: "Almuerzos Ejecutivos", categoria: "Alimentos", descripcion: "Comidas para reuniones" },
    {
      id: "PROD-019",
      nombre: "Eventos Corporativos",
      categoria: "Eventos",
      descripcion: "Organización de eventos empresariales",
    },
  ]

  // Filtrar proveedores según la pestaña activa y el término de búsqueda
  const filteredProveedores = proveedores
    .filter((proveedor) => {
      if (activeTab === "todos") return true
      if (activeTab === "activos") return proveedor.activo
      if (activeTab === "inactivos") return !proveedor.activo
      return true
    })
    .filter(
      (proveedor) =>
        proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.rfc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )

  const handleVerDetalle = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor)
    setIsDetalleDialogOpen(true)
    setIsEditMode(false)
  }

  const handleEditarProveedor = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor)
    setIsDetalleDialogOpen(true)
    setIsEditMode(true)
  }

  const handleGuardarProveedor = () => {
    // Aquí iría la lógica para guardar los cambios del proveedor
    setIsDetalleDialogOpen(false)
    setNotification({
      show: true,
      message: "Proveedor actualizado correctamente",
      type: "success",
    })

    // Ocultar la notificación después de 3 segundos
    setTimeout(() => {
      setNotification({
        show: false,
        message: "",
        type: "success",
      })
    }, 3000)
  }

  const handleImportarProveedores = () => {
    // Aquí iría la lógica para importar proveedores
    setIsImportDialogOpen(false)
    setNotification({
      show: true,
      message: "Proveedores importados correctamente",
      type: "success",
    })

    // Ocultar la notificación después de 3 segundos
    setTimeout(() => {
      setNotification({
        show: false,
        message: "",
        type: "success",
      })
    }, 3000)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {notification.show && (
        <Alert
          className={`fixed top-4 right-4 z-50 w-96 shadow-lg ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : notification.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          {notification.type === "success" && <CheckCircle className="h-4 w-4" />}
          {notification.type === "error" && <XCircle className="h-4 w-4" />}
          {notification.type === "warning" && <AlertCircle className="h-4 w-4" />}
          <AlertTitle>
            {notification.type === "success" ? "Éxito" : notification.type === "error" ? "Error" : "Advertencia"}
          </AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proveedores</h1>
          <p className="text-slate-500">Gestiona los proveedores y sus productos asociados</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Importar Proveedores</DialogTitle>
                <DialogDescription>Sube un archivo CSV o Excel con la lista de proveedores.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
                        <span>Haz clic para seleccionar un archivo</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".csv,.xlsx,.xls"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">CSV, Excel (máx. 10MB)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Plantilla de ejemplo</h3>
                    <p className="text-xs text-gray-500">
                      Descarga nuestra plantilla para asegurarte de que tu archivo tiene el formato correcto.
                    </p>
                    <Button variant="outline" size="sm" className="mt-1">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar plantilla
                    </Button>
                  </div>

                  <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Importante</AlertTitle>
                    <AlertDescription>
                      Asegúrate de que tu archivo contiene las columnas: Nombre, RFC, Contacto, Email, Teléfono,
                      Dirección y Categorías.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="bg-[#005291]" onClick={handleImportarProveedores}>
                  Importar Proveedores
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#005291]">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proveedor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>Nuevo Proveedor</DialogTitle>
                <DialogDescription>Completa el formulario para registrar un nuevo proveedor.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <Tabs defaultValue="informacion" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="informacion">Información</TabsTrigger>
                    <TabsTrigger value="productos">Productos</TabsTrigger>
                    <TabsTrigger value="adicional">Adicional</TabsTrigger>
                  </TabsList>

                  <TabsContent value="informacion" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Nombre o Razón Social
                        </Label>
                        <Input id="nombre" placeholder="Nombre del proveedor" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rfc" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          RFC
                        </Label>
                        <Input id="rfc" placeholder="RFC del proveedor" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="direccion">Dirección</Label>
                      <Textarea id="direccion" placeholder="Dirección completa" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contacto" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Persona de Contacto
                        </Label>
                        <Input id="contacto" placeholder="Nombre del contacto" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input id="telefono" placeholder="Número de teléfono" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Email
                        </Label>
                        <Input id="email" type="email" placeholder="Correo electrónico" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sitioWeb">Sitio Web</Label>
                        <Input id="sitioWeb" placeholder="URL del sitio web" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categorias">Categorías</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categorías" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tecnologia">Tecnología</SelectItem>
                          <SelectItem value="papeleria">Papelería</SelectItem>
                          <SelectItem value="mobiliario">Mobiliario</SelectItem>
                          <SelectItem value="software">Software</SelectItem>
                          <SelectItem value="hardware">Hardware</SelectItem>
                          <SelectItem value="servicios">Servicios</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Puedes seleccionar múltiples categorías</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="activo" defaultChecked />
                      <Label htmlFor="activo">Proveedor activo</Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="productos" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Productos Asociados</Label>
                      <p className="text-xs text-gray-500 mb-2">Selecciona los productos que ofrece este proveedor</p>

                      <div className="border rounded-md">
                        <div className="p-2 border-b bg-slate-50">
                          <Input placeholder="Buscar productos..." className="text-sm" />
                        </div>
                        <ScrollArea className="h-[300px] p-2">
                          <div className="space-y-2">
                            {productos.map((producto) => (
                              <div
                                key={producto.id}
                                className="flex items-start space-x-2 p-2 hover:bg-slate-50 rounded"
                              >
                                <Checkbox id={`producto-${producto.id}`} />
                                <div className="grid gap-1">
                                  <Label htmlFor={`producto-${producto.id}`} className="font-medium">
                                    {producto.nombre}
                                  </Label>
                                  <p className="text-xs text-slate-500">
                                    <Badge variant="outline" className="mr-1">
                                      {producto.categoria}
                                    </Badge>
                                    {producto.descripcion}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="adicional" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo">Logo del Proveedor</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src="/placeholder.svg" alt="Logo" />
                          <AvatarFallback className="text-lg">
                            <Building2 className="h-8 w-8 text-slate-400" />
                          </AvatarFallback>
                        </Avatar>
                        <Input id="logo" type="file" accept="image/*" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="calificacion">Calificación</Label>
                      <Select defaultValue="5">
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar calificación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Deficiente</SelectItem>
                          <SelectItem value="2">2 - Regular</SelectItem>
                          <SelectItem value="3">3 - Bueno</SelectItem>
                          <SelectItem value="4">4 - Muy Bueno</SelectItem>
                          <SelectItem value="5">5 - Excelente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notas">Notas Adicionales</Label>
                      <Textarea id="notas" placeholder="Información adicional sobre el proveedor" />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-[#005291]"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setNotification({
                      show: true,
                      message: "Proveedor creado correctamente",
                      type: "success",
                    })

                    // Ocultar la notificación después de 3 segundos
                    setTimeout(() => {
                      setNotification({
                        show: false,
                        message: "",
                        type: "success",
                      })
                    }, 3000)
                  }}
                >
                  Guardar Proveedor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="activos">Activos</TabsTrigger>
          <TabsTrigger value="inactivos">Inactivos</TabsTrigger>
        </TabsList>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b">
            <div className="relative w-full md:w-80 mb-4 md:mb-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Buscar proveedores..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProveedores.map((proveedor) => (
                  <TableRow key={proveedor.id}>
                    <TableCell className="font-medium">{proveedor.nombre}</TableCell>
                    <TableCell>{proveedor.rfc}</TableCell>
                    <TableCell>{proveedor.contacto}</TableCell>
                    <TableCell>{proveedor.email}</TableCell>
                    <TableCell>{proveedor.telefono}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {proveedor.productos.slice(0, 2).map((producto, index) => (
                          <Badge key={index} variant="outline" className="whitespace-nowrap">
                            {producto}
                          </Badge>
                        ))}
                        {proveedor.productos.length > 2 && (
                          <Badge variant="outline" className="whitespace-nowrap">
                            +{proveedor.productos.length - 2} más
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={proveedor.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {proveedor.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleVerDetalle(proveedor)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditarProveedor(proveedor)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500">
                            <Trash className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Tabs>

      {/* Diálogo para ver detalles del proveedor */}
      <Dialog open={isDetalleDialogOpen} onOpenChange={setIsDetalleDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Proveedor" : "Detalles del Proveedor"}</DialogTitle>
            <DialogDescription>
              {selectedProveedor && (
                <>
                  {isEditMode ? "Modifica la información del proveedor" : "Información completa del proveedor"} -
                  <Badge
                    className={
                      selectedProveedor.activo ? "bg-green-100 text-green-800 ml-2" : "bg-red-100 text-red-800 ml-2"
                    }
                  >
                    {selectedProveedor.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedProveedor && (
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
              <Tabs defaultValue="informacion" className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="informacion">Información</TabsTrigger>
                  <TabsTrigger value="productos">Productos</TabsTrigger>
                  <TabsTrigger value="compras">Historial</TabsTrigger>
                  <TabsTrigger value="documentos">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="informacion" className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedProveedor.logo || ""} alt="Logo" />
                      <AvatarFallback className="text-lg">
                        <Building2 className="h-8 w-8 text-slate-400" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-nombre">Nombre o Razón Social</Label>
                          {isEditMode ? (
                            <Input id="edit-nombre" defaultValue={selectedProveedor.nombre} />
                          ) : (
                            <p className="text-sm">{selectedProveedor.nombre}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-rfc">RFC</Label>
                          {isEditMode ? (
                            <Input id="edit-rfc" defaultValue={selectedProveedor.rfc} />
                          ) : (
                            <p className="text-sm">{selectedProveedor.rfc}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="edit-direccion">Dirección</Label>
                    {isEditMode ? (
                      <Textarea id="edit-direccion" defaultValue={selectedProveedor.direccion} />
                    ) : (
                      <p className="text-sm">{selectedProveedor.direccion}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-contacto">Persona de Contacto</Label>
                      {isEditMode ? (
                        <Input id="edit-contacto" defaultValue={selectedProveedor.contacto} />
                      ) : (
                        <p className="text-sm">{selectedProveedor.contacto}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-telefono">Teléfono</Label>
                      {isEditMode ? (
                        <Input id="edit-telefono" defaultValue={selectedProveedor.telefono} />
                      ) : (
                        <p className="text-sm">{selectedProveedor.telefono}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email</Label>
                      {isEditMode ? (
                        <Input id="edit-email" type="email" defaultValue={selectedProveedor.email} />
                      ) : (
                        <p className="text-sm">{selectedProveedor.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-sitioWeb">Sitio Web</Label>
                      {isEditMode ? (
                        <Input id="edit-sitioWeb" defaultValue={selectedProveedor.sitioWeb} />
                      ) : (
                        <p className="text-sm">
                          <a
                            href={`https://${selectedProveedor.sitioWeb}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedProveedor.sitioWeb}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Categorías</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProveedor.categorias.map((categoria, index) => (
                        <Badge key={index} variant="secondary">
                          {categoria}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {isEditMode && (
                    <div className="flex items-center space-x-2">
                      <Switch id="edit-activo" defaultChecked={selectedProveedor.activo} />
                      <Label htmlFor="edit-activo">Proveedor activo</Label>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de Registro</Label>
                      <p className="text-sm">{selectedProveedor.fechaRegistro}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Última Compra</Label>
                      <p className="text-sm">{selectedProveedor.ultimaCompra || "Sin compras registradas"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-notas">Notas</Label>
                    {isEditMode ? (
                      <Textarea id="edit-notas" defaultValue={selectedProveedor.notas} />
                    ) : (
                      <p className="text-sm">{selectedProveedor.notas}</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="productos" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Productos Asociados</Label>
                      {isEditMode && (
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Añadir Productos
                        </Button>
                      )}
                    </div>

                    <div className="border rounded-md">
                      <div className="p-2 border-b bg-slate-50">
                        <Input placeholder="Buscar productos..." className="text-sm" />
                      </div>
                      <ScrollArea className="h-[300px]">
                        <div className="p-2 space-y-2">
                          {selectedProveedor.productos.map((producto, index) => {
                            const productoInfo = productos.find((p) => p.nombre === producto) || {
                              id: `unknown-${index}`,
                              nombre: producto,
                              categoria: "Sin categoría",
                              descripcion: "Sin descripción",
                            }

                            return (
                              <Card key={index} className="p-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium">{productoInfo.nombre}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline">{productoInfo.categoria}</Badge>
                                      <p className="text-xs text-slate-500">{productoInfo.descripcion}</p>
                                    </div>
                                  </div>
                                  {isEditMode && (
                                    <Button variant="ghost" size="icon" className="text-red-500">
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </Card>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="compras" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Historial de Compras</Label>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Resumen</CardTitle>
                        <CardDescription>Historial de compras con este proveedor</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-50 p-3 rounded-md">
                            <p className="text-sm text-slate-500">Total de Compras</p>
                            <p className="text-2xl font-bold">12</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-md">
                            <p className="text-sm text-slate-500">Monto Total</p>
                            <p className="text-2xl font-bold">$45,320.00</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-md">
                            <p className="text-sm text-slate-500">Última Compra</p>
                            <p className="text-lg font-medium">{selectedProveedor.ultimaCompra || "N/A"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="border rounded-md mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Productos</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">OC-2023-001</TableCell>
                            <TableCell>15/03/2023</TableCell>
                            <TableCell>Laptops (5)</TableCell>
                            <TableCell>$6,000.00</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">Completada</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">OC-2023-008</TableCell>
                            <TableCell>22/05/2023</TableCell>
                            <TableCell>Monitores (3)</TableCell>
                            <TableCell>$1,200.00</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">Completada</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">OC-2023-015</TableCell>
                            <TableCell>10/08/2023</TableCell>
                            <TableCell>Teclados (10)</TableCell>
                            <TableCell>$500.00</TableCell>
                            <TableCell>
                              <Badge className="bg-amber-100 text-amber-800">En proceso</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documentos" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Documentos del Proveedor</Label>
                      {isEditMode && (
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Añadir Documento
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded">
                                <FileText className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">Contrato de Servicios</h4>
                                <p className="text-xs text-slate-500">PDF - 2.3 MB - Subido el 15/01/2022</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                              </Button>
                              {isEditMode && (
                                <Button variant="ghost" size="icon" className="text-red-500">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-100 p-2 rounded">
                                <FileSpreadsheet className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">Lista de Precios 2023</h4>
                                <p className="text-xs text-slate-500">XLSX - 1.1 MB - Subido el 05/01/2023</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                              </Button>
                              {isEditMode && (
                                <Button variant="ghost" size="icon" className="text-red-500">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancelar
                </Button>
                <Button className="bg-[#005291]" onClick={handleGuardarProveedor}>
                  Guardar Cambios
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsDetalleDialogOpen(false)}>
                  Cerrar
                </Button>
                <Button className="bg-[#005291]" onClick={() => setIsEditMode(true)}>
                  Editar Proveedor
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
