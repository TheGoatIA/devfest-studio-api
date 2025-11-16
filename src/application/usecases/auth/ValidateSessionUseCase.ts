/**
 * Use Case: Valider une Session
 *
 * Vérifie qu'une session est valide et active
 * Processus:
 * 1. Vérifier le cache Redis d'abord (rapide)
 * 2. Vérifier le token JWT
 * 3. Valider la session en DB
 * 4. Mettre à jour l'activité
 */

import { jwtService } from '../../../infrastructure/security/JWTService';
import { sessionRepository } from '../../../infrastructure/database/repositories/SessionRepository';
import { userRepository } from '../../../infrastructure/database/repositories/UserRepository';
import { redisConnection } from '../../../config/database/redis';
import logger from '../../../config/logger';
import { AuthenticationError } from '../../../presentation/http/middleware/ErrorHandlerMiddleware';

/**
 * DTO d'entrée pour valider une session
 */
export interface ValidateSessionInput {
  accessToken: string;
}

/**
 * DTO de sortie pour une session validée
 */
export interface ValidateSessionOutput {
  valid: true;
  userId: string;
  sessionId: string;
  deviceId: string;
  expiresAt: Date;
  user: {
    preferences: any;
    quota: {
      daily: number;
      used: number;
      remaining: number;
    };
  };
}

/**
 * Use Case: ValidateSession
 */
export class ValidateSessionUseCase {
  /**
   * Exécuter le use case
   *
   * @param input - Token à valider
   * @returns Informations de session si valide
   * @throws AuthenticationError si invalide
   */
  async execute(input: ValidateSessionInput): Promise<ValidateSessionOutput> {
    try {
      // 1. Vérifier et décoder le token JWT
      const payload = jwtService.verifyToken(input.accessToken);

      logger.debug('Token JWT valide', {
        userId: payload.userId,
        sessionId: payload.sessionId,
      });

      // Vérifier que c'est bien un access token
      if (!jwtService.isAccessToken(input.accessToken)) {
        throw new AuthenticationError('Type de token invalide');
      }

      // 2. Vérifier le cache Redis d'abord (plus rapide)
      const cachedSession = await this.getSessionFromCache(payload.sessionId);

      if (cachedSession) {
        // Session trouvée en cache, vérifier qu'elle est active
        if (cachedSession.status !== 'active') {
          throw new AuthenticationError('Session inactive');
        }

        logger.debug('Session trouvée en cache', { sessionId: payload.sessionId });
      } else {
        logger.debug('Session non trouvée en cache, vérification en DB', {
          sessionId: payload.sessionId,
        });
      }

      // 3. Valider la session en base de données
      const session = await sessionRepository.validate(payload.sessionId);

      // 4. Vérifier que le token correspond bien
      if (session.tokens.accessToken !== input.accessToken) {
        logger.warn('Token ne correspond pas à la session', {
          sessionId: payload.sessionId,
        });
        throw new AuthenticationError('Token invalide');
      }

      // 5. Mettre à jour l'activité de la session
      await sessionRepository.updateActivity(payload.sessionId);

      // 6. Obtenir les informations de l'utilisateur
      const user = await userRepository.findById(payload.userId);

      // 7. Remettre en cache si nécessaire
      if (!cachedSession) {
        await this.cacheSession(payload.sessionId, {
          userId: session.userId,
          deviceId: session.deviceId,
          status: session.status,
          expiresAt: session.expiresAt,
        });
      }

      logger.info('Session validée avec succès', {
        sessionId: payload.sessionId,
        userId: payload.userId,
      });

      // 8. Retourner les informations
      return {
        valid: true,
        userId: session.userId,
        sessionId: session.sessionId,
        deviceId: session.deviceId,
        expiresAt: session.expiresAt,
        user: {
          preferences: user.preferences,
          quota: {
            daily: user.quota.dailyTransformations,
            used: user.quota.usedToday,
            remaining: user.getRemainingTransformations(),
          },
        },
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        logger.warn('Échec de validation de session', { error: error.message });
        throw error;
      }

      logger.error('Erreur lors de la validation de session', { error });
      throw new AuthenticationError('Impossible de valider la session');
    }
  }

  /**
   * Récupérer une session du cache Redis
   *
   * @param sessionId - ID de la session
   * @returns Données en cache ou null
   */
  private async getSessionFromCache(sessionId: string): Promise<any | null> {
    try {
      const cacheKey = `session:${sessionId}`;
      return await redisConnection.get(cacheKey);
    } catch (error) {
      logger.warn('Impossible de lire le cache', { error, sessionId });
      return null;
    }
  }

  /**
   * Mettre en cache une session
   *
   * @param sessionId - ID de la session
   * @param data - Données à mettre en cache
   */
  private async cacheSession(sessionId: string, data: any): Promise<void> {
    try {
      const cacheKey = `session:${sessionId}`;
      const ttl = 30 * 24 * 60 * 60; // 30 jours

      await redisConnection.set(cacheKey, data, ttl);

      logger.debug('Session mise en cache', { sessionId });
    } catch (error) {
      logger.warn('Impossible de mettre en cache', { error, sessionId });
    }
  }
}

// Instance unique du use case
export const validateSessionUseCase = new ValidateSessionUseCase();

// Export par défaut
export default validateSessionUseCase;
