import React from 'react'; // Quitado useState, useEffect
import { Link } from 'react-router-dom'; // Quitado useNavigate
import { motion } from 'framer-motion'; // Quitado AnimatePresence
// import toast from 'react-hot-toast'; // Ya no se usa aquí, lo maneja el componente LoginForm con useToast
// import { Toaster } from 'react-hot-toast'; // Asumiendo que Toaster está en App.tsx o layout principal
 
// Importar imágenes desde assets
import logoPasteur from '../../assets/logo.png';
import illustrationLogin from '../../assets/scientist.png';
 
// Importar el nuevo componente de formulario
import LoginForm from '../../components/login-form'; // Ajusta la ruta si es necesario
// Quitado callApi y useAuth, ahora están dentro de LoginForm
 
const LoginPage: React.FC = () => {
  // Eliminados los estados: email, password, rememberMe, loading, success
  // Eliminado el hook useAuth y useNavigate (manejados en LoginForm)
  // Eliminada la función handleSubmit
 
  // Variantes para animación de entrada de la tarjeta principal (se mantienen)
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 }, 
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: "easeOut",
        // Añadir staggerChildren aquí para animar columnas si se desea
        // staggerChildren: 0.1 
      } 
    },
    // Eliminada variante exit
  };

  // Variantes para elementos con animación spring
  const itemVariants = {
    hidden: { opacity: 0, y: 30 }, 
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15      
      } 
    },
  };
  
  // Variante específica para la ilustración con zoom
  const illustrationVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] } }, 
  };

  // Variantes para el contenedor del formulario para escalonar sus hijos
  const formContainerVariants = {
    hidden: {}, // Necesario para que initial="hidden" funcione en el contenedor
    visible: {
      transition: {
        staggerChildren: 0.1, // Retraso entre cada hijo del formulario
      }
    }
  };

  // Eliminadas variantes splashVariants

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 overflow-hidden"> 
      {/* Eliminado AnimatePresence y la condición !showContent */}
      {/* Renderizar directamente la tarjeta principal */}
      <motion.div 
        className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden lg:flex" 
        variants={containerVariants} 
        initial="hidden" // La tarjeta completa anima su entrada
        animate="visible"
        // Eliminado exit="hidden"
      >
        {/* Columna Izquierda */}
        {/* Añadir variants a la columna si se quiere escalonar con la derecha */}
        <motion.div className="hidden lg:flex lg:w-1/2 bg-white p-0 items-center justify-center overflow-hidden"> 
           <motion.div 
            className="w-full h-full flex items-center justify-center" 
            variants={illustrationVariants} 
            // initial/animate heredados del padre si no se especifican aquí
          >
            <img 
              src={illustrationLogin} 
              alt="Ilustración de laboratorio" 
              className="w-full h-full object-cover" 
            />
          </motion.div>
        </motion.div>

        {/* Columna Derecha */}
        {/* Este div ahora hereda initial/animate del padre, pero aplica stagger a sus hijos */}
        <motion.div 
          className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center"
          variants={formContainerVariants} 
          // initial="hidden" // Heredado
          // animate="visible" // Heredado
        > 
          {/* Los hijos usarán itemVariants y serán escalonados por formContainerVariants */}
          <motion.div className="flex justify-center mb-12" variants={itemVariants}> 
             <img 
               className="h-24 w-auto" 
               src={logoPasteur} 
               alt="Institut Pasteur de Montevideo" 
             />
          </motion.div>

          {/* Reemplazar el formulario antiguo con el nuevo componente */}
          <LoginForm />
          
          <motion.p 
            className="mt-10 text-sm text-center text-gray-500" 
            variants={itemVariants} 
          >
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500"> 
              Regístrate aquí
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;