/**
 * Use Case: Créer une Session
 * 
 * Gère la création d'une nouvelle session pour un utilisateur
 * Processus:
 * 1. Trouver ou créer l'utilisateur
 * 2. Générer les tokens JWT
 * 3. Créer la session dans la DB
 * 4. Mettre en cache dans Redis
 */

import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../../../infrastructure/database/repositories/UserRepository';
import { sessionRepository } from '../../../infrastructure/database/repositories/SessionRepository';
import { jwtService } from '../../../infrastructure/security/JWTService';
import { redisConnection } from '../../../config/database/redis';
import logger from '../../../config/logger';

/**
 * DTO d'entrée pour créer une session
 */
export interface CreateSessionInput {
  deviceId: string;
  deviceInfo: {
    platform: 'android' | 'ios';
    version: string;
    model: string;
    appVersion: string;
    fcmToken?: string;
  };
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    timezone: string;
  };
}

/**
 * DTO de sortie pour une session créée
 */
export interface CreateSessionOutput {
  sessionToken: string;
  refreshToken: string;
  userId: string;
  sessionId: string;
  expiresAt: Date;
  user: {
    isNew: boolean;
    preferences: any;
    quota: {
      daily: number;
      used: number;
      remaining: number;
    };
  };
}

/**
 * Use Case: CreateSession
 */
export class CreateSessionUseCase {
  /**
   * Exécuter le use case
   * 
   * @param input - Données d'entrée
   * @returns Session créée avec tokens
   */
  async execute(input: CreateSessionInput): Promise<CreateSessionOutput> {
    try {
      logger.info('Création de session', {
        deviceId: input.deviceId,
        platform: input.deviceInfo.platform,
      });

      // 1. Trouver ou créer l'utilisateur
      const { user, created: isNewUser } = await userRepository.findOrCreate({
        deviceId: input.deviceId,
        deviceInfo: input.deviceInfo,
      });

      logger.info(isNewUser ? 'Nouvel utilisateur créé' : 'Utilisateur existant trouvé', {
        userId: user.userId,
      });

      // 2. Vérifier si l'utilisateur n'a pas trop de sessions
      const maxSessions = 5;
      if (await sessionRepository.hasTooManySessions(user.userId, maxSessions)) {
        logger.warn('Utilisateur a trop de sessions, suppression de la plus ancienne', {
          userId: user.userId,
        });
        await sessionRepository.deleteOldestSession(user.userId);
      }

      // 3. Générer un ID de session
      const sessionId = uuidv4();

      // 4. Générer les tokens JWT
      const tokens = jwtService.generateTokenPair(user.userId, input.deviceId, sessionId);

      // 5. Créer la session dans MongoDB
      const session = await sessionRepository.create({
        sessionId: sessionId, // IMPORTANT: Passer le même sessionId que celui dans le JWT
        userId: user.userId,
        deviceId: input.deviceId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiry: tokens.accessTokenExpiry,
        refreshTokenExpiry: tokens.refreshTokenExpiry,
        device: input.deviceInfo,
        security: {
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          location: input.location,
        },
      });

      // 6. Mettre en cache dans Redis (pour validation rapide)
      await this.cacheSession(sessionId, {
        userId: user.userId,
        deviceId: input.deviceId,
        status: 'active',
        expiresAt: tokens.refreshTokenExpiry,
      });

      // 7. Mettre à jour la dernière activité de l'utilisateur
      await userRepository.updateActivity(user.userId);

      logger.info('Session créée avec succès', {
        sessionId: session.sessionId,
        userId: user.userId,
        isNewUser,
      });

      // 8. Retourner la réponse
      return {
        sessionToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.userId,
        sessionId: session.sessionId,
        expiresAt: tokens.refreshTokenExpiry,
        user: {
          isNew: isNewUser,
          preferences: user.preferences,
          quota: {
            daily: user.quota.dailyTransformations,
            used: user.quota.usedToday,
            remaining: user.getRemainingTransformations(),
          },
        },
      };
    } catch (error) {
      logger.error('Erreur lors de la création de session', { error, input });
      throw error;
    }
  }

  /**
   * Mettre en cache les informations de session dans Redis
   * 
   * @param sessionId - ID de la session
   * @param data - Données à mettre en cache
   */
  private async cacheSession(sessionId: string, data: any): Promise<void> {
    try {
      const cacheKey = `session:${sessionId}`;
      const ttl = 30 * 24 * 60 * 60; // 30 jours en secondes

      await redisConnection.set(cacheKey, data, ttl);

      logger.debug('Session mise en cache', { sessionId });
    } catch (error) {
      // Ne pas échouer si le cache ne fonctionne pas
      logger.warn('Impossible de mettre la session en cache', { error, sessionId });
    }
  }
}

// Instance unique du use case
export const createSessionUseCase = new CreateSessionUseCase();

// Export par défaut
export default createSessionUseCase;
