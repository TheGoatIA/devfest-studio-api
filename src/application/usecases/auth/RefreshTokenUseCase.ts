/**
 * Use Case: Rafraîchir les Tokens
 * 
 * Permet de renouveler les tokens avec un refresh token
 * Processus:
 * 1. Vérifier le refresh token
 * 2. Générer de nouveaux tokens
 * 3. Mettre à jour la session
 * 4. Mettre à jour le cache
 */

import { jwtService } from '../../../infrastructure/security/JWTService';
import { sessionRepository } from '../../../infrastructure/database/repositories/SessionRepository';
import { redisConnection } from '../../../config/database/redis';
import logger from '../../../config/logger';
import { AuthenticationError } from '../../../presentation/http/middleware/ErrorHandlerMiddleware';

/**
 * DTO d'entrée pour rafraîchir les tokens
 */
export interface RefreshTokenInput {
  refreshToken: string;
}

/**
 * DTO de sortie pour les nouveaux tokens
 */
export interface RefreshTokenOutput {
  sessionToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Use Case: RefreshToken
 */
export class RefreshTokenUseCase {
  /**
   * Exécuter le use case
   * 
   * @param input - Refresh token
   * @returns Nouveaux tokens
   * @throws AuthenticationError si le refresh token est invalide
   */
  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    try {
      logger.info('Rafraîchissement des tokens');

      // 1. Vérifier et décoder le refresh token
      const payload = jwtService.verifyToken(input.refreshToken);

      logger.debug('Refresh token valide', {
        userId: payload.userId,
        sessionId: payload.sessionId,
      });

      // Vérifier que c'est bien un refresh token
      if (!jwtService.isRefreshToken(input.refreshToken)) {
        throw new AuthenticationError('Type de token invalide');
      }

      // 2. Trouver la session par refresh token
      const session = await sessionRepository.findByRefreshToken(input.refreshToken);

      if (!session) {
        logger.warn('Session non trouvée pour le refresh token');
        throw new AuthenticationError('Session non trouvée');
      }

      // 3. Vérifier que la session est valide
      if (!session.isValid()) {
        logger.warn('Tentative de rafraîchissement d\'une session invalide', {
          sessionId: session.sessionId,
          status: session.status,
        });
        throw new AuthenticationError('Session invalide ou expirée');
      }

      // 4. Vérifier que le refresh token correspond bien
      if (session.tokens.refreshToken !== input.refreshToken) {
        logger.warn('Refresh token ne correspond pas', {
          sessionId: session.sessionId,
        });
        throw new AuthenticationError('Token invalide');
      }

      // 5. Vérifier que le refresh token n'est pas expiré
      if (session.isRefreshTokenExpired()) {
        logger.warn('Refresh token expiré', {
          sessionId: session.sessionId,
          expiry: session.tokens.refreshTokenExpiry,
        });
        throw new AuthenticationError('Refresh token expiré');
      }

      // 6. Générer de nouveaux tokens
      const newTokens = jwtService.generateTokenPair(
        session.userId,
        session.deviceId,
        session.sessionId
      );

      logger.debug('Nouveaux tokens générés', {
        sessionId: session.sessionId,
      });

      // 7. Mettre à jour la session dans la DB
      await sessionRepository.updateTokens(session.sessionId, {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        accessTokenExpiry: newTokens.accessTokenExpiry,
        refreshTokenExpiry: newTokens.refreshTokenExpiry,
      });

      // 8. Mettre à jour le cache Redis
      await this.updateSessionCache(session.sessionId, {
        userId: session.userId,
        deviceId: session.deviceId,
        status: session.status,
        expiresAt: newTokens.refreshTokenExpiry,
      });

      logger.info('Tokens rafraîchis avec succès', {
        sessionId: session.sessionId,
        userId: session.userId,
      });

      // 9. Retourner les nouveaux tokens
      return {
        sessionToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: newTokens.refreshTokenExpiry,
      };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        logger.warn('Échec du rafraîchissement', { error: error.message });
        throw error;
      }

      logger.error('Erreur lors du rafraîchissement des tokens', { error });
      throw new AuthenticationError('Impossible de rafraîchir les tokens');
    }
  }

  /**
   * Mettre à jour la session dans le cache Redis
   * 
   * @param sessionId - ID de la session
   * @param data - Nouvelles données
   */
  private async updateSessionCache(sessionId: string, data: any): Promise<void> {
    try {
      const cacheKey = `session:${sessionId}`;
      const ttl = 30 * 24 * 60 * 60; // 30 jours

      await redisConnection.set(cacheKey, data, ttl);

      logger.debug('Cache de session mis à jour', { sessionId });
    } catch (error) {
      logger.warn('Impossible de mettre à jour le cache', { error, sessionId });
    }
  }
}

// Instance unique du use case
export const refreshTokenUseCase = new RefreshTokenUseCase();

// Export par défaut
export default refreshTokenUseCase;
