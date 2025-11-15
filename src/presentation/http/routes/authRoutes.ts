/**
 * Routes d'Authentification
 *
 * Définit tous les endpoints liés à l'authentification
 */

import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { authenticate } from '../middleware/AuthMiddleware';
import { validate } from '../middleware/ValidationMiddleware';
import { authSchemas } from '../validators/schemas/authSchemas';

// Créer le router
const router = Router();

/**
 * POST /api/v1/auth/session
 * Créer une nouvelle session (connexion/inscription)
 *
 * Public - Pas besoin d'authentification
 */
router.post('/session', validate(authSchemas.createSession, 'body'), authController.createSession);

/**
 * POST /api/v1/auth/validate
 * Valider une session existante
 *
 * Protégé - Nécessite un token valide
 */
router.post('/validate', authenticate, authController.validateSession);

/**
 * POST /api/v1/auth/refresh
 * Rafraîchir les tokens
 *
 * Public - Utilise le refresh token
 */
router.post('/refresh', validate(authSchemas.refreshToken, 'body'), authController.refreshToken);

/**
 * DELETE /api/v1/auth/logout
 * Déconnexion (révoquer la session)
 * Query param optionnel: ?all=true pour révoquer toutes les sessions
 *
 * Protégé - Nécessite un token valide
 */
router.delete(
  '/logout',
  authenticate,
  validate(authSchemas.logoutQuery, 'query'),
  authController.logout
);

/**
 * GET /api/v1/auth/sessions
 * Obtenir toutes les sessions actives de l'utilisateur
 *
 * Protégé - Nécessite un token valide
 */
router.get('/sessions', authenticate, authController.getUserSessions);

// Export du router
export default router;
