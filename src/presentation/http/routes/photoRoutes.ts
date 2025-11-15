/**
 * Routes pour les photos
 */

import { Router } from 'express';
import { PhotoController } from '../controllers/PhotoController';
import {
  uploadSinglePhoto,
  handleMulterError,
} from '../middleware/UploadMiddleware';
import { photoSchemas } from '../validators/schemas/photoSchemas';
import 'express-async-errors';
import AuthMiddleware from '../middleware/AuthMiddleware';
import ValidationMiddleware from '../middleware/ValidationMiddleware';

const router = Router();
const photoController = new PhotoController();
const authMiddleware = new AuthMiddleware();
const validationMiddleware = new ValidationMiddleware();

/**
 * POST /api/v1/upload
 * Upload une photo
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Body (multipart/form-data):
 *   file: Image file
 *   metadata: JSON object (optional)
 */
router.post(
  '/upload',
  authMiddleware.authenticate(),
  uploadSinglePhoto,
  handleMulterError,
  photoController.uploadPhoto
);

/**
 * GET /api/v1/photos
 * Lister les photos de l'utilisateur
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Query params:
 *   limit: number (default: 20, max: 100)
 *   offset: number (default: 0)
 *   status: uploaded|processing|ready|failed
 *   sort_by: createdAt|updatedAt|fileSize
 *   sort_order: asc|desc
 */
router.get(
  '/photos',
  authMiddleware.authenticate(),
  validationMiddleware.validateQuery(photoSchemas.listPhotosQuery),
  photoController.listPhotos
);

/**
 * GET /api/v1/photos/:photoId
 * Récupérer une photo par ID
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Params:
 *   photoId: UUID
 */
router.get(
  '/photos/:photoId',
  authMiddleware.authenticate(),
  validationMiddleware.validateParams(photoSchemas.photoIdParam),
  photoController.getPhoto
);

/**
 * DELETE /api/v1/photos/:photoId
 * Supprimer une photo
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Params:
 *   photoId: UUID
 */
router.delete(
  '/photos/:photoId',
  authMiddleware.authenticate(),
  validationMiddleware.validateParams(photoSchemas.photoIdParam),
  photoController.deletePhoto
);

export default router;
