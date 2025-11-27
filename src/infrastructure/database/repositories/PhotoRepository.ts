/**
 * Repository pour la gestion des photos
 */

import { IPhotoRepository } from '../../../core/interfaces/repositories/IPhotoRepository';
import { PhotoModel, IPhotoDocument } from '../mongodb/models/PhotoModel';
import logger from '../../../config/logger';

export class PhotoRepository implements IPhotoRepository {
  /**
   * Créer une nouvelle photo
   */
  async create(photoData: Partial<IPhotoDocument>): Promise<IPhotoDocument> {
    try {
      const photo = new PhotoModel(photoData);
      await photo.save();

      logger.info('✅ Photo créée', {
        photoId: photo.photoId,
        userId: photo.userId,
      });

      return photo;
    } catch (error: any) {
      logger.error('❌ Erreur création photo', { error: error.message });
      throw error;
    }
  }

  /**
   * Trouver une photo par ID
   */
  async findById(photoId: string): Promise<IPhotoDocument | null> {
    try {
      const photo = await PhotoModel.findOne({ photoId });
      return photo;
    } catch (error: any) {
      logger.error('❌ Erreur recherche photo par ID', {
        error: error.message,
        photoId,
      });
      throw error;
    }
  }

  /**
   * Trouver une photo par ID et userId
   */
  async findByIdAndUser(photoId: string, userId: string): Promise<IPhotoDocument | null> {
    try {
      const photo = await PhotoModel.findOne({ photoId, userId });
      return photo;
    } catch (error: any) {
      logger.error('❌ Erreur recherche photo par ID et utilisateur', {
        error: error.message,
        photoId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Lister les photos d'un utilisateur
   */
  async findByUser(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ photos: IPhotoDocument[]; total: number }> {
    try {
      const { limit = 20, offset = 0, status, sortBy = 'createdAt', sortOrder = 'desc' } = options;

      // Construire le filtre
      const filter: any = { userId };
      if (status) {
        filter['processing.status'] = status;
      }

      // Construire le tri
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Exécuter les requêtes en parallèle
      const [photos, total] = await Promise.all([
        PhotoModel.find(filter).sort(sort).skip(offset).limit(limit).lean(),
        PhotoModel.countDocuments(filter),
      ]);

      return { photos: photos as unknown as IPhotoDocument[], total };
    } catch (error: any) {
      logger.error('❌ Erreur listage photos utilisateur', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Mettre à jour une photo
   */
  async update(photoId: string, updates: Partial<IPhotoDocument>): Promise<IPhotoDocument | null> {
    try {
      const photo = await PhotoModel.findOneAndUpdate(
        { photoId },
        { $set: updates },
        { new: true }
      );

      if (photo) {
        logger.info('✅ Photo mise à jour', { photoId });
      }

      return photo;
    } catch (error: any) {
      logger.error('❌ Erreur mise à jour photo', {
        error: error.message,
        photoId,
      });
      throw error;
    }
  }

  /**
   * Supprimer une photo
   */
  async delete(photoId: string): Promise<boolean> {
    try {
      const result = await PhotoModel.deleteOne({ photoId });

      if (result.deletedCount > 0) {
        logger.info('🗑️  Photo supprimée', { photoId });
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('❌ Erreur suppression photo', {
        error: error.message,
        photoId,
      });
      throw error;
    }
  }

  /**
   * Supprimer les photos expirées
   */
  async deleteExpired(): Promise<number> {
    try {
      const result = await PhotoModel.deleteMany({
        expiresAt: { $lte: new Date() },
      });

      if (result.deletedCount > 0) {
        logger.info('🗑️  Photos expirées supprimées', {
          count: result.deletedCount,
        });
      }

      return result.deletedCount;
    } catch (error: any) {
      logger.error('❌ Erreur suppression photos expirées', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Compter les photos d'un utilisateur
   */
  async countByUser(userId: string): Promise<number> {
    try {
      const count = await PhotoModel.countDocuments({ userId });
      return count;
    } catch (error: any) {
      logger.error('❌ Erreur comptage photos utilisateur', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Marquer une photo comme prête
   */
  async markAsReady(photoId: string): Promise<IPhotoDocument | null> {
    try {
      const photo = await PhotoModel.findOneAndUpdate(
        { photoId },
        {
          $set: {
            'processing.status': 'ready',
            'uploadInfo.processedAt': new Date(),
          },
        },
        { new: true }
      );

      if (photo) {
        logger.info('✅ Photo marquée comme prête', { photoId });
      }

      return photo;
    } catch (error: any) {
      logger.error('❌ Erreur marquage photo comme prête', {
        error: error.message,
        photoId,
      });
      throw error;
    }
  }

  /**
   * Marquer une photo comme échouée
   */
  async markAsFailed(photoId: string): Promise<IPhotoDocument | null> {
    try {
      const photo = await PhotoModel.findOneAndUpdate(
        { photoId },
        {
          $set: {
            'processing.status': 'failed',
          },
        },
        { new: true }
      );

      if (photo) {
        logger.warn('⚠️  Photo marquée comme échouée', { photoId });
      }

      return photo;
    } catch (error: any) {
      logger.error('❌ Erreur marquage photo comme échouée', {
        error: error.message,
        photoId,
      });
      throw error;
    }
  }

  /**
   * Compter le nombre total de photos
   */
  async countTotal(): Promise<number> {
    try {
      return await PhotoModel.countDocuments();
    } catch (error: any) {
      logger.error('❌ Erreur comptage total photos', { error: error.message });
      return 0;
    }
  }
}
