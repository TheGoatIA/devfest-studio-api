/**
 * Index des Routes
 * 
 * Point central pour toutes les routes de l'API
 * Monte tous les routers sur /api/v1
 */

import { Router } from 'express';
import authRoutes from './authRoutes';
import photoRoutes from './photoRoutes';
import styleRoutes from './styleRoutes';

// Créer le router principal
const router = Router();

/**
 * Monter les routes d'authentification
 * Toutes les routes auth seront préfixées par /api/v1/auth
 */
router.use('/auth', authRoutes);

/**
 * Monter les routes des photos
 * Routes pour upload et gestion des photos
 */
router.use('/', photoRoutes);

/**
 * Monter les routes des styles
 * Routes pour consultation des styles de transformation
 */
router.use('/', styleRoutes);

/**
 * Route de test pour vérifier que l'API fonctionne
 * GET /api/v1/ping
 */
router.get('/ping', (_req, res) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Route d'information sur l'API
 * GET /api/v1/info
 */
router.get('/info', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'DevFest Studio API',
      version: '1.0.0',
      description: 'API de transformation d\'images via IA Gemini',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        photos: '/api/v1/photos',
        upload: '/api/v1/upload',
        styles: '/api/v1/styles',
        docs: '/api/v1/docs',
      },
    },
  });
});

// Export du router
export default router;
