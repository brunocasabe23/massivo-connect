import AppRouterProvider from './routes'; // Importar el proveedor del enrutador
// import { Toaster } from 'react-hot-toast'; // Quitar Toaster de react-hot-toast
import { Toaster } from "@/components/ui/toaster" // Importar Toaster de shadcn/ui

function App() {
  return (
    <> {/* Usar Fragment para agrupar */}
      <AppRouterProvider /> {/* El enrutador que muestra las páginas */}
      <Toaster /> {/* Usar el Toaster de shadcn/ui */}
    </>
  );
}

export default App;