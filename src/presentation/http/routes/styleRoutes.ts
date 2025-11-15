/**
 * Routes pour les styles
 */

import { Router } from 'express';
import { StyleController } from '../controllers/StyleController';
import { styleSchemas } from '../validators/schemas/styleSchemas';
import 'express-async-errors';
import authenticate from '../middleware/AuthMiddleware';
import { validate } from '../middleware/ValidationMiddleware';

const router = Router();
const styleController = new StyleController();

/**
 * GET /api/v1/styles
 * Lister les styles disponibles
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Query params:
 *   category: professional|artistic|tech|creative|thematic
 *   popular: boolean
 *   featured: boolean
 *   search: string
 *   limit: number (default: 20, max: 50)
 *   offset: number (default: 0)
 */
router.get(
  '/styles',
  authenticate,
  validate(styleSchemas.getStylesQuery, 'query'),
  styleController.getStyles
);

/**
 * GET /api/v1/styles/popular
 * Récupérer les styles populaires
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Query params:
 *   limit: number (default: 10)
 */
router.get(
  '/styles/popular',
  authenticate,
  styleController.getPopularStyles
);

/**
 * GET /api/v1/styles/category/:category
 * Récupérer les styles par catégorie
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Params:
 *   category: professional|artistic|tech|creative|thematic
 * Query params:
 *   limit: number (default: 20)
 *   offset: number (default: 0)
 */
router.get(
  '/styles/category/:category',
  authenticate,
  validate(styleSchemas.categoryParam, 'params'),
  styleController.getStylesByCategory
);

/**
 * GET /api/v1/styles/:styleId
 * Récupérer un style par ID
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Params:
 *   styleId: UUID
 */
router.get(
  '/styles/:styleId',
  authenticate,
  validate(styleSchemas.styleIdParam, 'params'),
  styleController.getStyleById
);

export default router;
