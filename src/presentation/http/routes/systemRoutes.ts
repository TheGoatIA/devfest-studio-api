import { Router } from 'express';
import { SystemController } from '../controllers/SystemController';

const router = Router();
const systemController = new SystemController();

/**
 * GET /api/v1/system/status
 * Obtenir le statut du système
 */
/**
 * GET /api/v1/system/status
 * Obtenir le statut du système
 */
router.get('/status', systemController.getStatus);

/**
 * GET /api/v1/system/stats
 * Obtenir les statistiques détaillées
 */
router.get('/stats', systemController.getStats);

/**
 * POST /api/v1/system/maintenance
 * Activer/Désactiver le mode maintenance
 */
router.post('/maintenance', systemController.toggleMaintenance);

export default router;
