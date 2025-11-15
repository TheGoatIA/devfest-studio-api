/**
 * Routes pour les transformations
 */

import { Router } from 'express';
import { TransformationController } from '../controllers/TransformationController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware';
import { transformationSchemas } from '../validators/schemas/transformationSchemas';
import 'express-async-errors';

const router = Router();
const transformationController = new TransformationController();
const authMiddleware = new AuthMiddleware();
const validationMiddleware = new ValidationMiddleware();

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
  authMiddleware.authenticate(),
  validationMiddleware.validateBody(transformationSchemas.startTransformation),
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
  authMiddleware.authenticate(),
  validationMiddleware.validateParams(transformationSchemas.transformationIdParam),
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
  authMiddleware.authenticate(),
  validationMiddleware.validateParams(transformationSchemas.transformationIdParam),
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
  authMiddleware.authenticate(),
  validationMiddleware.validateParams(transformationSchemas.transformationIdParam),
  transformationController.cancelTransformation
);

export default router;
