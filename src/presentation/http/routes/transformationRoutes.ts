/**
 * Routes pour les transformations
 */

import { Router } from 'express';
import { TransformationController } from '../controllers/TransformationController';
import { transformationSchemas } from '../validators/schemas/transformationSchemas';
import 'express-async-errors';
import authenticate from '../middleware/AuthMiddleware';
import { validate } from '../middleware/ValidationMiddleware';

const router = Router();
const transformationController = new TransformationController();

/**
 * POST /api/v1/transform
 * Démarrer une nouvelle transformation
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Body:
 *   photo_id: string (UUID)
 *   style_id?: string (UUID)
 *   custom_description?: string (min: 20, max: 500)
 *   quality?: standard|high|ultra
 *   options?: object
 *   priority?: normal|high
 */
router.post(
  '/transform',
  authenticate,
  validate(transformationSchemas.startTransformation, 'body'),
  transformationController.startTransformation
);

/**
 * GET /api/v1/transformation/:id/status
 * Récupérer le statut d'une transformation
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Params:
 *   id: UUID
 */
router.get(
  '/transformation/:id/status',
  authenticate,
  validate(transformationSchemas.transformationIdParam, 'params'),
  transformationController.getTransformationStatus
);

/**
 * GET /api/v1/transformation/:id
 * Récupérer le résultat complet d'une transformation
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Params:
 *   id: UUID
 */
router.get(
  '/transformation/:id',
  authenticate,
  validate(transformationSchemas.transformationIdParam, 'params'),
  transformationController.getTransformation
);

/**
 * DELETE /api/v1/transformation/:id
 * Annuler une transformation
 *
 * Headers:
 *   Authorization: Bearer <token>
 * Params:
 *   id: UUID
 */
router.delete(
  '/transformation/:id',
  authenticate,
  validate(transformationSchemas.transformationIdParam, 'params'),
  transformationController.cancelTransformation
);

export default router;
