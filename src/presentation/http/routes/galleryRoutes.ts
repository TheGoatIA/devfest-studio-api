/**
 * Routes pour la galerie
 */

import { Router } from 'express';
import { GalleryController } from '../controllers/GalleryController';
import { gallerySchemas } from '../validators/schemas/gallerySchemas';
import 'express-async-errors';
import AuthMiddleware from '../middleware/AuthMiddleware';
import ValidationMiddleware from '../middleware/ValidationMiddleware';

const router = Router();
const galleryController = new GalleryController();
const authMiddleware = new AuthMiddleware();
const validationMiddleware = new ValidationMiddleware();

/**
 * GET /api/v1/gallery
 * Récupérer la galerie de l'utilisateur
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Query params:
 *   status?: queued|processing|completed|failed|cancelled
 *   style_category?: professional|artistic|tech|creative|thematic
 *   date_from?: ISO_DATE
 *   date_to?: ISO_DATE
 *   favorites_only?: boolean
 *   page?: number (default: 1)
 *   limit?: number (default: 20, max: 100)
 *   sort_by?: createdAt|completedAt|likeCount|viewCount
 *   sort_order?: asc|desc
 */
router.get(
  '/gallery',
  authMiddleware.authenticate(),
  validationMiddleware.validateQuery(gallerySchemas.getGalleryQuery),
  galleryController.getUserGallery
);

/**
 * POST /api/v1/favorites
 * Ajouter une transformation aux favoris
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Body:
 *   transformation_id: string (UUID)
 */
router.post(
  '/favorites',
  authMiddleware.authenticate(),
  validationMiddleware.validateBody(gallerySchemas.addToFavorites),
  galleryController.addToFavorites
);

/**
 * DELETE /api/v1/favorites/:transformationId
 * Retirer une transformation des favoris
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Params:
 *   transformationId: UUID
 */
router.delete(
  '/favorites/:transformationId',
  authMiddleware.authenticate(),
  validationMiddleware.validateParams(gallerySchemas.transformationIdParam),
  galleryController.removeFromFavorites
);

export default router;
