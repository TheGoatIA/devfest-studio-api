/**
 * Use Case: Révoquer une Session (Déconnexion)
 * 
 * Révoque une session active pour déconnecter l'utilisateur
 * Processus:
 * 1. Trouver la session
 * 2. Révoquer en DB
 * 3. Supprimer du cache Redis
 */

import { sessionRepository } from '../../../infrastructure/database/repositories/SessionRepository';
import { redisConnection } from '../../../config/database/redis';
import logger from '../../../config/logger';

/**
 * DTO d'entrée pour révoquer une session
 */
export interface RevokeSessionInput {
  sessionId: string;
  userId: string; // Pour vérification
  revokeAll?: boolean; // Révoquer toutes les sessions de l'utilisateur
}

/**
 * DTO de sortie pour une session révoquée
 */
export interface RevokeSessionOutput {
  success: true;
  message: string;
  revokedCount: number;
}

/**
 * Use Case: RevokeSession
 */
export class RevokeSessionUseCase {
  /**
   * Exécuter le use case
   * 
   * @param input - Session à révoquer
   * @returns Confirmation de révocation
   */
  async execute(input: RevokeSessionInput): Promise<RevokeSessionOutput> {
    try {
      logger.info('Révocation de session', {
        sessionId: input.sessionId,
        userId: input.userId,
        revokeAll: input.revokeAll,
      });

      let revokedCount = 0;

      if (input.revokeAll) {
        // Révoquer toutes les sessions de l'utilisateur
        revokedCount = await this.revokeAllSessions(input.userId);
        
        logger.info('Toutes les sessions révoquées', {
          userId: input.userId,
          count: revokedCount,
        });

        return {
          success: true,
          message: 'Toutes les sessions ont été révoquées',
          revokedCount,
        };
      } else {
        // Révoquer uniquement la session spécifique
        await this.revokeSession(input.sessionId, input.userId);
        
        logger.info('Session révoquée', {
          sessionId: input.sessionId,
          userId: input.userId,
        });

        return {
          success: true,
          message: 'Session révoquée avec succès',
          revokedCount: 1,
        };
      }
    } catch (error) {
      logger.error('Erreur lors de la révocation de session', { error, input });
      throw error;
    }
  }

  /**
   * Révoquer une session spécifique
   * 
   * @param sessionId - ID de la session
   * @param userId - ID de l'utilisateur (pour vérification)
   */
  private async revokeSession(sessionId: string, userId: string): Promise<void> {
    // 1. Récupérer la session
    const session = await sessionRepository.findById(sessionId);

    // 2. Vérifier que la session appartient bien à l'utilisateur
    if (session.userId !== userId) {
      logger.warn('Tentative de révocation d\'une session d\'un autre utilisateur', {
        sessionId,
        sessionUserId: session.userId,
        requestUserId: userId,
      });
      throw new Error('Session non autorisée');
    }

    // 3. Révoquer dans MongoDB
    await sessionRepository.revoke(sessionId);

    // 4. Supprimer du cache Redis
    await this.removeSessionFromCache(sessionId);
  }

  /**
   * Révoquer toutes les sessions d'un utilisateur
   * 
   * @param userId - ID de l'utilisateur
   * @returns Nombre de sessions révoquées
   */
  private async revokeAllSessions(userId: string): Promise<number> {
    // 1. Récupérer toutes les sessions actives
    const sessions = await sessionRepository.findActiveByUserId(userId);

    // 2. Révoquer dans MongoDB
    const count = await sessionRepository.revokeAllByUserId(userId);

    // 3. Supprimer du cache Redis
    for (const session of sessions) {
      await this.removeSessionFromCache(session.sessionId);
    }

    return count;
  }

  /**
   * Supprimer une session du cache Redis
   * 
   * @param sessionId - ID de la session
   */
  private async removeSessionFromCache(sessionId: string): Promise<void> {
    try {
      const cacheKey = `session:${sessionId}`;
      await redisConnection.del(cacheKey);

      logger.debug('Session supprimée du cache', { sessionId });
    } catch (error) {
      logger.warn('Impossible de supprimer du cache', { error, sessionId });
    }
  }
}

// Instance unique du use case
export const revokeSessionUseCase = new RevokeSessionUseCase();

// Export par défaut
export default revokeSessionUseCase;
