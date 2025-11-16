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
import transformationRoutes from './transformationRoutes';
import galleryRoutes from './galleryRoutes';
import eventsRoutes from './eventsRoutes';

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
 * Monter les routes des transformations
 * Routes pour lancer et suivre les transformations d'images
 */
router.use('/', transformationRoutes);

/**
 * Monter les routes de la galerie
 * Routes pour consultation de la galerie et gestion des favoris
 */
router.use('/', galleryRoutes);

/**
 * Monter les routes des événements
 * Routes pour les événements en temps réel (SSE)
 */
router.use('/', eventsRoutes);

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
      description: "API de transformation d'images via IA Gemini",
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        photos: '/api/v1/photos',
        upload: '/api/v1/upload',
        styles: '/api/v1/styles',
        transform: '/api/v1/transform',
        transformations: '/api/v1/transformation/:id',
        gallery: '/api/v1/gallery',
        favorites: '/api/v1/favorites',
        docs: '/api/v1/docs',
      },
    },
  });
});

// Export du router
export default router;
