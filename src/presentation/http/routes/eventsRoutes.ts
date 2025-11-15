/**
 * Routes pour les événements en temps réel (SSE)
 * Tous les endpoints sont publics pour la démo
 */

import { Router } from 'express';
import { EventsController } from '../controllers/EventsController';
import 'express-async-errors';

const router = Router();
const eventsController = new EventsController();

/**
 * GET /api/v1/events/stream
 * Stream SSE pour recevoir les événements en temps réel
 *
 * PUBLIC - Pas d'authentification requise
 */
router.get('/events/stream', eventsController.streamEvents);

/**
 * GET /api/v1/events/stats
 * Récupérer les statistiques des webhooks
 *
 * PUBLIC - Pas d'authentification requise
 */
router.get('/events/stats', eventsController.getStats);

export default router;
