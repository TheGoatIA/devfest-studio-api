/**
 * Contrôleur pour les événements en temps réel (Server-Sent Events)
 */

import { Request, Response } from 'express';
import { webhookService } from '../../../application/services/WebhookService';
import logger from '../../../config/logger';

export class EventsController {
  /**
   * GET /api/v1/events/stream
   * Stream SSE pour les événements en temps réel
   *
   * PUBLIC - Pas d'authentification requise pour la démo
   */
  streamEvents = async (req: Request, res: Response): Promise<void> => {
    // Configuration SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    logger.info('📡 Nouveau client SSE connecté', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Envoyer un message de connexion
    res.write(
      `data: ${JSON.stringify({
        event: 'connected',
        message: 'Connexion établie',
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Écouter tous les événements webhook
    const eventHandler = (data: any) => {
      try {
        res.write(`event: ${data.event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error: any) {
        logger.error('❌ Erreur envoi événement SSE', {
          error: error.message,
        });
      }
    };

    // S'abonner à tous les événements
    webhookService.on('*', eventHandler);

    // Heartbeat toutes les 30 secondes pour garder la connexion active
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch (error) {
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    // Nettoyer quand le client se déconnecte
    req.on('close', () => {
      logger.info('📡 Client SSE déconnecté');
      clearInterval(heartbeatInterval);
      webhookService.off('*', eventHandler);
    });
  };

  /**
   * GET /api/v1/events/stats
   * Récupérer les statistiques des webhooks
   *
   * PUBLIC - Pas d'authentification requise
   */
  getStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = webhookService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('❌ Erreur récupération stats webhooks', {
        error: error.message,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erreur lors de la récupération des statistiques',
        },
      });
    }
  };
}
