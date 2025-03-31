import React from 'react'; // Quitado useState, useEffect
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Quitado AnimatePresence
// import toast from 'react-hot-toast'; // Manejado por RegisterForm
 
// Importar imágenes desde assets
import logoPasteur from '../../assets/logo.png';
import illustrationLogin from '../../assets/scientist.png';
 
// Importar el nuevo componente de formulario
import RegisterForm from '../../components/register-form'; // Ajusta la ruta si es necesario
// Quitado callApi, ahora está dentro de RegisterForm
 
const RegisterPage: React.FC = () => {
  // Eliminados los estados: nombre, email, password, confirmPassword, loading, success
  // Eliminada la función handleSubmit
 
   // Variantes para animación de entrada (igual que LoginPage) (se mantienen)
   const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: "easeOut",
      } 
    },
  };

  // Variantes para elementos con animación spring (igual que LoginPage)
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

  // Variante específica para la ilustración con zoom (igual que LoginPage)
  const illustrationVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] } }, 
  };

  // Variantes para el contenedor del formulario/columna derecha para escalonar sus hijos (igual que LoginPage)
  const formContainerVariants = {
    hidden: {}, 
    visible: {
      transition: {
        staggerChildren: 0.1, 
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
        initial="hidden"
        animate="visible"
      >
        {/* Columna Izquierda */}
        <motion.div className="hidden lg:flex lg:w-1/2 bg-white p-0 items-center justify-center overflow-hidden"> 
           <motion.div 
            className="w-full h-full flex items-center justify-center" 
            variants={illustrationVariants} 
          >
            <img 
              src={illustrationLogin} 
              alt="Ilustración de laboratorio" 
              className="w-full h-full object-cover" 
            />
          </motion.div>
        </motion.div>

        {/* Columna Derecha */}
        <motion.div 
          className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center"
          variants={formContainerVariants} 
          initial="hidden" 
          animate="visible" 
        > 
           <motion.div className="flex justify-center mb-12" variants={itemVariants}> 
             <img 
               className="h-24 w-auto" 
               src={logoPasteur} 
               alt="Institut Pasteur de Montevideo" 
             />
          </motion.div>

          {/* Reemplazar el mensaje de éxito y el formulario antiguo con el nuevo componente */}
          <RegisterForm />
          
          <motion.p 
            className="mt-10 text-sm text-center text-gray-500" 
            variants={itemVariants} 
          >
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500"> 
              Inicia Sesión aquí
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;