import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_secreto'; 

// Extender la interfaz Request de Express para incluir la propiedad 'user'
declare global {
  namespace Express {
    interface Request {
      user?: any; // O un tipo más específico si definimos el payload del JWT
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extraer token 'Bearer <token>'

  if (token == null) {
    return res.status(401).json({ message: 'Acceso denegado: No se proporcionó token.' }); // No token
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.error("Error verificando token:", err.message);
      // Diferenciar entre token expirado y token inválido si es necesario
      if (err.name === 'TokenExpiredError') {
         return res.status(401).json({ message: 'Token expirado.' });
      }
      return res.status(403).json({ message: 'Token inválido.' }); // Token inválido/manipulado
    }

    // Token válido, adjuntar payload del usuario a la solicitud
    req.user = user; 
    next(); // Pasar al siguiente middleware o controlador
  });
};

// Podríamos añadir aquí un middleware para verificar roles/permisos específicos
// export const authorizeRoles = (...allowedRoles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//      if (!req.user || !req.user.roles || !req.user.roles.some(role => allowedRoles.includes(role))) {
//         return res.status(403).json({ message: 'Acceso denegado: Rol no autorizado.' });
//      }
//      next();
//   };
// };