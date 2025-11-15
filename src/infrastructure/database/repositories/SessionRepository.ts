/**
 * Session Repository - Gestion de l'accès aux données des sessions
 * 
 * Ce repository abstrait toutes les opérations sur la collection Session
 */

import { v4 as uuidv4 } from 'uuid';
import { SessionModel, ISession } from '../mongodb/models/SessionModel';
import logger from '../../../config/logger';
import { NotFoundError, AuthenticationError } from '../../../presentation/http/middleware/ErrorHandlerMiddleware';

/**
 * DTO pour créer une session
 */
export interface CreateSessionDTO {
  sessionId?: string; // Optionnel - sera généré si non fourni
  userId: string;
  deviceId: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
  device: {
    platform: 'android' | 'ios';
    version: string;
    model: string;
    appVersion: string;
    fcmToken?: string;
  };
  security: {
    ipAddress: string;
    userAgent: string;
    location?: {
      country: string;
      city: string;
      timezone: string;
    };
  };
}

/**
 * Classe SessionRepository
 */
export class SessionRepository {
  /**
   * Créer une nouvelle session
   *
   * @param data - Données pour créer la session
   * @returns Session créée
   */
  async create(data: CreateSessionDTO): Promise<ISession> {
    try {
      const session = new SessionModel({
        sessionId: data.sessionId || uuidv4(), // Utiliser le sessionId fourni ou en générer un nouveau
        userId: data.userId,
        deviceId: data.deviceId,
        tokens: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessTokenExpiry: data.accessTokenExpiry,
          refreshTokenExpiry: data.refreshTokenExpiry,
        },
        device: data.device,
        security: {
          ...data.security,
          isCompromised: false,
          lastVerifiedAt: new Date(),
        },
        activity: {
          lastActiveAt: new Date(),
          requestCount: 0,
          lastRequestAt: new Date(),
          features: [],
        },
        status: 'active',
        expiresAt: data.refreshTokenExpiry,
      });

      await session.save();

      logger.info('Nouvelle session créée', {
        sessionId: session.sessionId,
        userId: session.userId,
        deviceId: session.deviceId,
      });

      return session;
    } catch (error) {
      logger.error('Erreur lors de la création de la session', { error, userId: data.userId });
      throw new Error('Impossible de créer la session');
    }
  }

  /**
   * Trouver une session par son ID
   * 
   * @param sessionId - ID de la session
   * @returns Session trouvée
   * @throws NotFoundError si non trouvée
   */
  async findById(sessionId: string): Promise<ISession> {
    const session = await SessionModel.findBySessionId(sessionId);
    
    if (!session) {
      throw new NotFoundError('Session');
    }

    return session;
  }

  /**
   * Trouver une session par son access token
   * 
   * @param accessToken - Access token
   * @returns Session trouvée ou null
   */
  async findByAccessToken(accessToken: string): Promise<ISession | null> {
    return SessionModel.findByAccessToken(accessToken);
  }

  /**
   * Trouver une session par son refresh token
   * 
   * @param refreshToken - Refresh token
   * @returns Session trouvée ou null
   */
  async findByRefreshToken(refreshToken: string): Promise<ISession | null> {
    return SessionModel.findOne({
      'tokens.refreshToken': refreshToken,
      status: 'active',
    });
  }

  /**
   * Valider une session
   * Vérifie que la session est active et non compromise
   * 
   * @param sessionId - ID de la session
   * @throws AuthenticationError si session invalide
   */
  async validate(sessionId: string): Promise<ISession> {
    const session = await this.findById(sessionId);

    if (!session.isValid()) {
      logger.warn('Tentative d\'utilisation d\'une session invalide', {
        sessionId,
        status: session.status,
        isCompromised: session.security.isCompromised,
        expiresAt: session.expiresAt,
      });

      throw new AuthenticationError('Session invalide ou expirée');
    }

    return session;
  }

  /**
   * Mettre à jour les tokens d'une session
   * 
   * @param sessionId - ID de la session
   * @param tokens - Nouveaux tokens
   */
  async updateTokens(
    sessionId: string,
    tokens: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiry: Date;
      refreshTokenExpiry: Date;
    }
  ): Promise<ISession> {
    const session = await this.findById(sessionId);

    session.renewTokens(
      tokens.accessToken,
      tokens.refreshToken,
      tokens.accessTokenExpiry,
      tokens.refreshTokenExpiry
    );

    session.expiresAt = tokens.refreshTokenExpiry;
    await session.save();

    logger.info('Tokens de session renouvelés', { sessionId });

    return session;
  }

  /**
   * Mettre à jour l'activité d'une session
   * 
   * @param sessionId - ID de la session
   * @param feature - Fonctionnalité utilisée (optionnel)
   */
  async updateActivity(sessionId: string, feature?: string): Promise<void> {
    const session = await this.findById(sessionId);
    session.updateActivity(feature);
    await session.save();
  }

  /**
   * Obtenir toutes les sessions actives d'un utilisateur
   * 
   * @param userId - ID de l'utilisateur
   * @returns Liste des sessions actives
   */
  async findActiveByUserId(userId: string): Promise<ISession[]> {
    return SessionModel.findActiveByUserId(userId);
  }

  /**
   * Révoquer une session
   * 
   * @param sessionId - ID de la session
   */
  async revoke(sessionId: string): Promise<void> {
    const session = await this.findById(sessionId);
    session.revoke();
    await session.save();

    logger.info('Session révoquée', { sessionId });
  }

  /**
   * Révoquer toutes les sessions d'un utilisateur
   * Utile pour déconnexion globale ou sécurité
   * 
   * @param userId - ID de l'utilisateur
   */
  async revokeAllByUserId(userId: string): Promise<number> {
    const result = await SessionModel.revokeAllByUserId(userId);

    logger.info('Toutes les sessions utilisateur révoquées', {
      userId,
      count: result.modifiedCount,
    });

    return result.modifiedCount;
  }

  /**
   * Révoquer toutes les sessions d'un utilisateur sauf celle en cours
   * 
   * @param userId - ID de l'utilisateur
   * @param currentSessionId - ID de la session à conserver
   */
  async revokeAllExceptCurrent(userId: string, currentSessionId: string): Promise<number> {
    const result = await SessionModel.updateMany(
      {
        userId,
        sessionId: { $ne: currentSessionId },
        status: 'active',
      },
      { $set: { status: 'revoked' } }
    );

    logger.info('Sessions révoquées sauf courante', {
      userId,
      currentSessionId,
      count: result.modifiedCount,
    });

    return result.modifiedCount;
  }

  /**
   * Marquer une session comme compromise
   * 
   * @param sessionId - ID de la session
   */
  async markAsCompromised(sessionId: string): Promise<void> {
    const session = await this.findById(sessionId);
    session.markAsCompromised();
    await session.save();

    logger.warn('Session marquée comme compromise', { sessionId });
  }

  /**
   * Nettoyer les sessions expirées
   * À appeler périodiquement (ex: via un cron job)
   * 
   * @returns Nombre de sessions nettoyées
   */
  async cleanExpired(): Promise<number> {
    const count = await SessionModel.cleanExpired();
    
    if (count > 0) {
      logger.info('Sessions expirées nettoyées', { count });
    }

    return count;
  }

  /**
   * Supprimer les anciennes sessions expirées
   * 
   * @param daysOld - Nombre de jours
   * @returns Nombre de sessions supprimées
   */
  async deleteOldExpired(daysOld: number = 30): Promise<number> {
    const count = await SessionModel.deleteOldExpired(daysOld);
    
    if (count > 0) {
      logger.info('Anciennes sessions supprimées', { count, daysOld });
    }

    return count;
  }

  /**
   * Compter les sessions actives
   * 
   * @returns Nombre de sessions actives
   */
  async countActive(): Promise<number> {
    return SessionModel.countDocuments({ status: 'active' });
  }

  /**
   * Compter les sessions d'un utilisateur
   * 
   * @param userId - ID de l'utilisateur
   * @returns Nombre de sessions
   */
  async countByUserId(userId: string): Promise<number> {
    return SessionModel.countDocuments({
      userId,
      status: 'active',
    });
  }

  /**
   * Vérifier si un utilisateur a trop de sessions actives
   * 
   * @param userId - ID de l'utilisateur
   * @param maxSessions - Nombre maximum de sessions autorisées
   * @returns true si trop de sessions
   */
  async hasTooManySessions(userId: string, maxSessions: number = 5): Promise<boolean> {
    const count = await this.countByUserId(userId);
    return count >= maxSessions;
  }

  /**
   * Supprimer la session la plus ancienne d'un utilisateur
   * 
   * @param userId - ID de l'utilisateur
   */
  async deleteOldestSession(userId: string): Promise<void> {
    const sessions = await SessionModel.find({
      userId,
      status: 'active',
    })
      .sort({ 'activity.lastActiveAt': 1 })
      .limit(1);

    if (sessions.length > 0) {
      await sessions[0].deleteOne();
      logger.info('Session la plus ancienne supprimée', {
        userId,
        sessionId: sessions[0].sessionId,
      });
    }
  }

  /**
   * Obtenir les statistiques des sessions
   */
  async getStats() {
    return SessionModel.getStats();
  }

  /**
   * Obtenir des informations détaillées sur une session
   * 
   * @param sessionId - ID de la session
   * @returns Informations de la session
   */
  async getSessionInfo(sessionId: string) {
    const session = await this.findById(sessionId);

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      device: session.device,
      status: session.status,
      createdAt: session.createdAt,
      lastActiveAt: session.activity.lastActiveAt,
      requestCount: session.activity.requestCount,
      features: session.activity.features,
      expiresAt: session.expiresAt,
      minutesUntilExpiry: session.minutesUntilExpiry,
      durationMinutes: session.durationMinutes,
      ipAddress: session.security.ipAddress,
      location: session.security.location,
    };
  }
}

// Instance unique du repository (Singleton)
export const sessionRepository = new SessionRepository();

// Export par défaut
export default sessionRepository;
