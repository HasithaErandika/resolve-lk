import multer from 'multer';
import { AppError } from '../utils/AppError.js';

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json(err.fieldErrors ? { error: err.message, errors: err.fieldErrors } : { error: err.message });
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be 5MB or smaller.' : 'Could not process the uploaded file.';
    return res.status(400).json({ error: message, errors: { photo: message } });
  }

  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}.` });
}
