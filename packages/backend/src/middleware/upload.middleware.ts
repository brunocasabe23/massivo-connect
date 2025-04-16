// packages/backend/src/middleware/upload.middleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// import { Request } from 'express'; // Importar Request

// Interfaz para extender Request y añadir user (similar a otros middlewares)
// interface AuthenticatedRequest extends Request {
//   user?: { id: number };
// }

// Asegurarse de que el directorio de subida exista
// Usamos path.resolve para obtener una ruta absoluta desde la raíz del proyecto
const projectRoot = path.resolve(__dirname, '../../..'); // Asumiendo que middleware está en src/middleware
const uploadDir = path.join(projectRoot, 'uploads', 'avatars');

console.log(`[UploadMiddleware] Upload directory target: ${uploadDir}`); // Log para depuración

try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`[UploadMiddleware] Created upload directory: ${uploadDir}`);
    }
} catch (error) {
    console.error(`[UploadMiddleware] Error creating upload directory: ${uploadDir}`, error);
    // Considerar lanzar un error o manejarlo de otra forma si el directorio es crítico
}


// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Directorio donde se guardarán los avatares
    },
    filename: function (req: any, file, cb) { // Usar any temporalmente
        // Generar un nombre de archivo único: userId-timestamp.extension
        const userId = req.user?.id || 'unknown_user'; // Obtener userId del middleware de autenticación
        const timestamp = Date.now();
        const extension = path.extname(file.originalname).toLowerCase(); // Asegurar extensión en minúsculas
        const filename = `${userId}-${timestamp}${extension}`;
        console.log(`[UploadMiddleware] Generating filename: ${filename} for user: ${userId}`);
        cb(null, filename);
    }
});

// Filtro para aceptar solo imágenes comunes
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.warn(`[UploadMiddleware] Rejected file type: ${file.mimetype}`);
        // Pasar un error específico que el controlador pueda manejar
        const err = new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, GIF, WebP).') as any;
        err.code = 'INVALID_FILE_TYPE';
        cb(err);
    }
};

// Crear instancia de Multer
const upload = multer({
    storage: storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // Limitar tamaño a 5MB (5 * 1024 * 1024 bytes)
    }
});

// Middleware específico para subir un solo archivo llamado 'avatar'
const uploadAvatarMiddleware = upload.single('avatar');

export default uploadAvatarMiddleware;