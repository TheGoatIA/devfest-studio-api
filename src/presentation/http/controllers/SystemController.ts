import { systemStateService } from '../../../application/services/SystemStateService';
import { systemStatsService } from '../../../application/services/SystemStatsService';
import logger from '../../../config/logger';
import { Request, Response } from 'express';

export class SystemController {
    /**
     * GET /api/v1/system/status
     * Obtenir le statut du système
     */
    getStatus = async (_req: Request, res: Response): Promise<void> => {
        res.status(200).json({
            success: true,
            data: {
                maintenance: systemStateService.isMaintenance(),
                version: '1.0.0',
                uptime: process.uptime(),
            },
        });
    };

    /**
     * POST /api/v1/system/maintenance
     * Activer/Désactiver le mode maintenance
     */
    toggleMaintenance = async (req: Request, res: Response): Promise<void> => {
        try {
            const { enabled } = req.body;

            if (typeof enabled !== 'boolean') {
                res.status(400).json({
                    success: false,
                    error: 'Le paramètre "enabled" doit être un booléen',
                });
                return;
            }

            systemStateService.setMaintenanceMode(enabled);

            res.status(200).json({
                success: true,
                message: `Mode maintenance ${enabled ? 'activé' : 'désactivé'}`,
                data: {
                    maintenance: enabled,
                },
            });
        } catch (error: any) {
            logger.error('❌ Erreur changement mode maintenance', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erreur serveur interne',
            });
        }
    };
    /**
     * GET /api/v1/system/stats
     * Obtenir les statistiques détaillées du système
     */
    getStats = async (_req: Request, res: Response): Promise<void> => {
        try {
            const stats = await systemStatsService.getStats();
            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            logger.error('❌ Erreur récupération stats', { error: error.message });
            res.status(500).json({
                success: false,
                error: 'Erreur serveur interne',
            });
        }
    };
}
