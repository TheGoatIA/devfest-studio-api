/**
 * Middleware pour gérer l'upload de fichiers avec multer
 */

import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { config } from '../../../config/environment';
import { AppError } from '../../../shared/errors/AppError';
import logger from '../../../config/logger';

/**
 * Configuration du filtre de fichiers
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  // Types MIME autorisés
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    logger.warn('⚠️  Type de fichier non autorisé', {
      mimetype: file.mimetype,
      originalname: file.originalname,
    });

    callback(
      new AppError(
        `Type de fichier non supporté: ${file.mimetype}. Formats acceptés: JPG, PNG, HEIC, WebP`,
        422
      )
    );
  }
};

/**
 * Configuration multer pour l'upload en mémoire
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB par défaut
    files: 1, // Un seul fichier à la fois
  },
  fileFilter,
});

/**
 * Middleware pour upload d'une seule photo
 */
export const uploadSinglePhoto = upload.single('file');

/**
 * Middleware pour upload de plusieurs photos
 */
export const uploadMultiplePhotos = upload.array('files', 10); // Maximum 10 fichiers

/**
 * Gestionnaire d'erreurs pour multer
 */
export const handleMulterError = (error: any, _req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    logger.error('❌ Erreur Multer', {
      code: error.code,
      field: error.field,
      message: error.message,
    });

    // Gérer les différents types d'erreurs Multer
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `Fichier trop volumineux. Taille maximale: ${
              (config.MAX_FILE_SIZE || 10485760) / 1024 / 1024
            }MB`,
            max_size: config.MAX_FILE_SIZE || 10485760,
          },
        });

      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOO_MANY_FILES',
            message: 'Trop de fichiers. Maximum 10 fichiers par requête',
          },
        });

      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: {
            code: 'UNEXPECTED_FIELD',
            message: `Champ de fichier inattendu: ${error.field}`,
          },
        });

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: error.message,
          },
        });
    }
  }

  // Si ce n'est pas une erreur Multer, passer au middleware suivant
  next(error);
};
