/**
 * User Repository - Gestion de l'accès aux données des utilisateurs
 *
 * Ce repository abstrait toutes les opérations sur la collection User
 * Cela permet de séparer la logique métier de l'accès aux données
 */

import { v4 as uuidv4 } from 'uuid';
import { UserModel, IUser } from '../mongodb/models/UserModel';
import logger from '../../../config/logger';
import {
  NotFoundError,
  ConflictError,
} from '../../../presentation/http/middleware/ErrorHandlerMiddleware';

/**
 * DTO pour créer un utilisateur
 */
export interface CreateUserDTO {
  deviceId: string;
  deviceInfo: {
    platform: 'android' | 'ios';
    version: string;
    model: string;
    appVersion: string;
  };
}

/**
 * DTO pour mettre à jour les préférences
 */
export interface UpdatePreferencesDTO {
  defaultQuality?: 'standard' | 'high' | 'ultra';
  autoSave?: boolean;
  notificationsEnabled?: boolean;
  language?: 'fr' | 'en';
  theme?: 'light' | 'dark' | 'system';
}

/**
 * Classe UserRepository
 */
export class UserRepository {
  /**
   * Créer un nouvel utilisateur
   *
   * @param data - Données pour créer l'utilisateur
   * @returns Utilisateur créé
   */
  async create(data: CreateUserDTO): Promise<IUser> {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existing = await UserModel.findOne({ deviceId: data.deviceId });
      if (existing) {
        logger.warn("Tentative de création d'utilisateur existant", { deviceId: data.deviceId });
        throw new ConflictError('Un utilisateur existe déjà pour cet appareil');
      }

      // Créer l'utilisateur
      const user = new UserModel({
        userId: uuidv4(),
        deviceId: data.deviceId,
        deviceInfo: data.deviceInfo,
        status: 'active',
      });

      await user.save();

      logger.info('Nouvel utilisateur créé', {
        userId: user.userId,
        deviceId: user.deviceId,
        platform: user.deviceInfo.platform,
      });

      return user;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      logger.error("Erreur lors de la création de l'utilisateur", { error, data });
      throw new Error("Impossible de créer l'utilisateur");
    }
  }

  /**
   * Trouver un utilisateur par son ID
   *
   * @param userId - ID de l'utilisateur
   * @returns Utilisateur trouvé
   * @throws NotFoundError si non trouvé
   */
  async findById(userId: string): Promise<IUser> {
    const user = await UserModel.findOne({ userId, status: 'active' });

    if (!user) {
      throw new NotFoundError('Utilisateur');
    }

    return user;
  }

  /**
   * Trouver un utilisateur par son deviceId
   *
   * @param deviceId - ID de l'appareil
   * @returns Utilisateur trouvé ou null
   */
  async findByDeviceId(deviceId: string): Promise<IUser | null> {
    return UserModel.findByDeviceId(deviceId);
  }

  /**
   * Trouver ou créer un utilisateur par deviceId
   * Si l'utilisateur existe, le retourner
   * Sinon, le créer
   *
   * @param data - Données pour créer l'utilisateur si nécessaire
   * @returns Utilisateur (existant ou nouveau)
   */
  async findOrCreate(data: CreateUserDTO): Promise<{ user: IUser; created: boolean }> {
    try {
      // Chercher l'utilisateur existant
      let user = await this.findByDeviceId(data.deviceId);

      if (user) {
        // Utilisateur existant trouvé
        logger.debug('Utilisateur existant trouvé', { userId: user.userId });

        // Mettre à jour les infos de l'appareil si elles ont changé
        let updated = false;
        if (user.deviceInfo.appVersion !== data.deviceInfo.appVersion) {
          user.deviceInfo.appVersion = data.deviceInfo.appVersion;
          updated = true;
        }
        if (user.deviceInfo.version !== data.deviceInfo.version) {
          user.deviceInfo.version = data.deviceInfo.version;
          updated = true;
        }

        if (updated) {
          await user.save();
          logger.info('Informations appareil mises à jour', { userId: user.userId });
        }

        return { user, created: false };
      }

      // Créer un nouvel utilisateur
      user = await this.create(data);
      return { user, created: true };
    } catch (error) {
      logger.error('Erreur dans findOrCreate', { error, deviceId: data.deviceId });
      throw error;
    }
  }

  /**
   * Mettre à jour les préférences d'un utilisateur
   *
   * @param userId - ID de l'utilisateur
   * @param preferences - Nouvelles préférences
   * @returns Utilisateur mis à jour
   */
  async updatePreferences(userId: string, preferences: UpdatePreferencesDTO): Promise<IUser> {
    const user = await this.findById(userId);

    // Mettre à jour seulement les champs fournis
    if (preferences.defaultQuality !== undefined) {
      user.preferences.defaultQuality = preferences.defaultQuality;
    }
    if (preferences.autoSave !== undefined) {
      user.preferences.autoSave = preferences.autoSave;
    }
    if (preferences.notificationsEnabled !== undefined) {
      user.preferences.notificationsEnabled = preferences.notificationsEnabled;
    }
    if (preferences.language !== undefined) {
      user.preferences.language = preferences.language;
    }
    if (preferences.theme !== undefined) {
      user.preferences.theme = preferences.theme;
    }

    await user.save();

    logger.info('Préférences utilisateur mises à jour', { userId, preferences });

    return user;
  }

  /**
   * Mettre à jour la dernière activité
   *
   * @param userId - ID de l'utilisateur
   */
  async updateActivity(userId: string): Promise<void> {
    const user = await this.findById(userId);
    user.updateActivity();
    await user.save();
  }

  /**
   * Incrémenter le quota de transformations
   *
   * @param userId - ID de l'utilisateur
   * @throws RateLimitError si quota atteint
   */
  async incrementQuota(userId: string): Promise<void> {
    const user = await this.findById(userId);

    // Vérifier et réinitialiser le quota si nouveau jour
    user.resetQuotaIfNeeded();

    // Vérifier si le quota est atteint
    if (user.hasReachedDailyQuota()) {
      throw new Error('Quota quotidien atteint');
    }

    // Incrémenter
    user.incrementQuota();
    await user.save();

    logger.debug('Quota incrémenté', {
      userId,
      used: user.quota.usedToday,
      limit: user.quota.dailyTransformations,
    });
  }

  /**
   * Obtenir les transformations restantes
   *
   * @param userId - ID de l'utilisateur
   * @returns Nombre de transformations restantes
   */
  async getRemainingTransformations(userId: string): Promise<number> {
    const user = await this.findById(userId);
    user.resetQuotaIfNeeded();
    return user.getRemainingTransformations();
  }

  /**
   * Mettre à jour les statistiques
   *
   * @param userId - ID de l'utilisateur
   * @param stats - Statistiques à mettre à jour
   */
  async updateStats(
    userId: string,
    stats: {
      totalTransformations?: number;
      completedTransformations?: number;
      failedTransformations?: number;
      totalProcessingTime?: number;
    }
  ): Promise<void> {
    const user = await this.findById(userId);

    if (stats.totalTransformations !== undefined) {
      user.stats.totalTransformations += stats.totalTransformations;
    }
    if (stats.completedTransformations !== undefined) {
      user.stats.completedTransformations += stats.completedTransformations;
    }
    if (stats.failedTransformations !== undefined) {
      user.stats.failedTransformations += stats.failedTransformations;
    }
    if (stats.totalProcessingTime !== undefined) {
      user.stats.totalProcessingTime += stats.totalProcessingTime;
    }

    await user.save();
  }

  /**
   * Obtenir les statistiques d'un utilisateur
   *
   * @param userId - ID de l'utilisateur
   * @returns Statistiques
   */
  async getStats(userId: string) {
    const user = await this.findById(userId);

    return {
      totalTransformations: user.stats.totalTransformations,
      completedTransformations: user.stats.completedTransformations,
      failedTransformations: user.stats.failedTransformations,
      averageProcessingTime:
        user.stats.totalTransformations > 0
          ? user.stats.totalProcessingTime / user.stats.totalTransformations
          : 0,
      quota: {
        daily: user.quota.dailyTransformations,
        used: user.quota.usedToday,
        remaining: user.getRemainingTransformations(),
      },
      subscription: user.subscription.type,
      isPremium: user.isPremium,
    };
  }

  /**
   * Suspendre un utilisateur
   *
   * @param userId - ID de l'utilisateur
   */
  async suspend(userId: string): Promise<void> {
    const user = await this.findById(userId);
    user.status = 'suspended';
    await user.save();

    logger.warn('Utilisateur suspendu', { userId });
  }

  /**
   * Réactiver un utilisateur
   *
   * @param userId - ID de l'utilisateur
   */
  async activate(userId: string): Promise<void> {
    const user = await UserModel.findOne({ userId });
    if (!user) {
      throw new NotFoundError('Utilisateur');
    }

    user.status = 'active';
    await user.save();

    logger.info('Utilisateur réactivé', { userId });
  }

  /**
   * Supprimer un utilisateur (soft delete)
   *
   * @param userId - ID de l'utilisateur
   */
  async delete(userId: string): Promise<void> {
    const user = await this.findById(userId);
    user.status = 'deleted';
    await user.save();

    logger.info('Utilisateur supprimé', { userId });
  }

  /**
   * Obtenir les statistiques globales
   */
  async getGlobalStats() {
    return UserModel.getGlobalStats();
  }
}

// Instance unique du repository (Singleton)
export const userRepository = new UserRepository();

// Export par défaut
export default userRepository;
