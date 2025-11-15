/**
 * Controller d'Authentification
 * 
 * Gère tous les endpoints liés à l'authentification :
 * - Création de session (connexion)
 * - Validation de session
 * - Rafraîchissement de token
 * - Révocation de session (déconnexion)
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/AuthMiddleware';
import { createSessionUseCase } from '../../../application/usecases/auth/CreateSessionUseCase';
import { refreshTokenUseCase } from '../../../application/usecases/auth/RefreshTokenUseCase';
import { revokeSessionUseCase } from '../../../application/usecases/auth/RevokeSessionUseCase';
import logger from '../../../config/logger';
import { asyncHandler } from '../middleware/ErrorHandlerMiddleware';
import { mapDeviceInfoFromAPI } from '../../../shared/utils/MappingHelpers';

/**
 * Classe AuthController
 */
export class AuthController {
  /**
   * POST /api/v1/auth/session
   * Créer une nouvelle session (connexion)
   * 
   * Body:
   * {
   *   "device_id": "string",
   *   "device_info": {
   *     "platform": "android|ios",
   *     "version": "string",
   *     "model": "string",
   *     "app_version": "string"
   *   }
   * }
   */
  createSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { device_id, device_info } = req.body;

    logger.info('Requête de création de session', {
      deviceId: device_id,
      platform: device_info?.platform,
      ip: req.ip,
    });

    // Mapper les données de snake_case (API) vers camelCase (interne)
    const deviceInfo = mapDeviceInfoFromAPI(device_info);

    // Exécuter le use case
    const result = await createSessionUseCase.execute({
      deviceId: device_id,
      deviceInfo: deviceInfo,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    });

    // Réponse
    res.status(201).json({
      success: true,
      data: {
        session_token: result.sessionToken,
        refresh_token: result.refreshToken,
        user_id: result.userId,
        session_id: result.sessionId,
        expires_at: result.expiresAt,
        user: {
          is_new: result.user.isNew,
          preferences: result.user.preferences,
          quota: result.user.quota,
        },
      },
    });
  });

  /**
   * POST /api/v1/auth/validate
   * Valider une session existante
   * 
   * Headers:
   * Authorization: Bearer <session_token>
   */
  validateSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Le middleware authenticate a déjà validé la session
    // On récupère juste les infos depuis req.user

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session non valide',
        },
      });
      return;
    }

    logger.debug('Session validée', {
      userId: req.user.userId,
      sessionId: req.user.sessionId,
    });

    res.json({
      success: true,
      data: {
        valid: true,
        user_id: req.user.userId,
        session_id: req.user.sessionId,
        device_id: req.user.deviceId,
      },
    });
  });

  /**
   * POST /api/v1/auth/refresh
   * Rafraîchir les tokens
   * 
   * Body:
   * {
   *   "refresh_token": "string"
   * }
   */
  refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { refresh_token } = req.body;

    logger.info('Requête de rafraîchissement de token');

    // Exécuter le use case
    const result = await refreshTokenUseCase.execute({
      refreshToken: refresh_token,
    });

    // Réponse
    res.json({
      success: true,
      data: {
        session_token: result.sessionToken,
        refresh_token: result.refreshToken,
        expires_at: result.expiresAt,
      },
    });
  });

  /**
   * DELETE /api/v1/auth/logout
   * Déconnexion (révoquer la session)
   * 
   * Headers:
   * Authorization: Bearer <session_token>
   * 
   * Query params (optionnel):
   * ?all=true  // Pour révoquer toutes les sessions
   */
  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Non authentifié',
        },
      });
    }

    const revokeAll = req.query.all === 'true';

    logger.info('Requête de déconnexion', {
      userId: req.user.userId,
      sessionId: req.user.sessionId,
      revokeAll,
    });

    try {
      // Exécuter le use case
      const result = await revokeSessionUseCase.execute({
        sessionId: req.user.sessionId,
        userId: req.user.userId,
        revokeAll,
      });

      // Réponse
      return res.json({
        success: true,
        data: {
          message: result.message,
          revoked_count: result.revokedCount,
        },
      });
    } catch (error) {
      logger.error('Erreur lors de la déconnexion', { error });
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Une erreur est survenue lors de la déconnexion',
        },
      });
    }
  });

  /**
   * GET /api/v1/auth/sessions
   * Obtenir toutes les sessions actives de l'utilisateur
   * 
   * Headers:
   * Authorization: Bearer <session_token>
   */
  getUserSessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Non authentifié',
          },
        });
      }

      // Importer le repository
      const { sessionRepository } = await import('../../../infrastructure/database/repositories/SessionRepository');

      // Récupérer les sessions
      const sessions = await sessionRepository.findActiveByUserId(req.user.userId);

      // Formater la réponse
      const formattedSessions = sessions.map(session => ({
        session_id: session.sessionId,
        device: {
          platform: session.device.platform,
          model: session.device.model,
          app_version: session.device.appVersion,
        },
        created_at: session.createdAt,
        last_active: session.activity.lastActiveAt,
        is_current: session.sessionId === req.user!.sessionId,
        location: session.security.location,
      }));

      return res.json({
        success: true,
        data: {
          sessions: formattedSessions,
          total: formattedSessions.length,
        },
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des sessions utilisateur', { error });
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Une erreur est survenue lors de la récupération des sessions utilisateur',
        },
      });
    }
  });
}

// Instance unique du controller
export const authController = new AuthController();

// Export par défaut
export default authController;