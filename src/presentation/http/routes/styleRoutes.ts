/**
 * Routes pour les styles
 * Tous les endpoints sont publics (pas d'authentification requise)
 */

import { Router } from 'express';
import { StyleController } from '../controllers/StyleController';
import { styleSchemas } from '../validators/schemas/styleSchemas';
import 'express-async-errors';
import { validate } from '../middleware/ValidationMiddleware';

const router = Router();
const styleController = new StyleController();

/**
 * GET /api/v1/styles
 * Lister les styles disponibles
 *
 * PUBLIC - Pas d'authentification requise
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
  validate(styleSchemas.getStylesQuery, 'query'),
  styleController.getStyles
);

/**
 * GET /api/v1/styles/popular
 * Récupérer les styles populaires
 *
 * PUBLIC - Pas d'authentification requise
 * Query params:
 *   limit: number (default: 10)
 */
router.get(
  '/styles/popular',
  styleController.getPopularStyles
);

/**
 * GET /api/v1/styles/category/:category
 * Récupérer les styles par catégorie
 *
 * PUBLIC - Pas d'authentification requise
 * Params:
 *   category: professional|artistic|tech|creative|thematic
 * Query params:
 *   limit: number (default: 20)
 *   offset: number (default: 0)
 */
router.get(
  '/styles/category/:category',
  validate(styleSchemas.categoryParam, 'params'),
  styleController.getStylesByCategory
);

/**
 * GET /api/v1/styles/:styleId
 * Récupérer un style par ID
 *
 * PUBLIC - Pas d'authentification requise
 * Params:
 *   styleId: UUID
 */
router.get(
  '/styles/:styleId',
  validate(styleSchemas.styleIdParam, 'params'),
  styleController.getStyleById
);

export default router;
