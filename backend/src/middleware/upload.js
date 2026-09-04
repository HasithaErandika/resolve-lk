import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(AppError.badRequest({ photo: 'Photo must be an image file.' }));
    }
    cb(null, true);
  },
}).single('photo');
