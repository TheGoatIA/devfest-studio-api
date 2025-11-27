/**
 * Repository pour la gestion des transformations
 */

import { ITransformationRepository } from '../../../core/interfaces/repositories/ITransformationRepository';
import {
  TransformationModel,
  ITransformationDocument,
} from '../mongodb/models/TransformationModel';
import logger from '../../../config/logger';

export class TransformationRepository implements ITransformationRepository {
  /**
   * Créer une nouvelle transformation
   */
  async create(data: Partial<ITransformationDocument>): Promise<ITransformationDocument> {
    try {
      const transformation = new TransformationModel(data);
      await transformation.save();

      logger.info('✅ Transformation créée', {
        transformationId: transformation.transformationId,
        userId: transformation.userId,
      });

      return transformation;
    } catch (error: any) {
      logger.error('❌ Erreur création transformation', { error: error.message });
      throw error;
    }
  }

  /**
   * Trouver une transformation par ID
   */
  async findById(transformationId: string): Promise<ITransformationDocument | null> {
    try {
      return await TransformationModel.findOne({ transformationId });
    } catch (error: any) {
      logger.error('❌ Erreur recherche transformation', {
        error: error.message,
        transformationId,
      });
      throw error;
    }
  }

  /**
   * Trouver une transformation par ID et userId
   */
  async findByIdAndUser(
    transformationId: string,
    userId: string
  ): Promise<ITransformationDocument | null> {
    try {
      return await TransformationModel.findOne({ transformationId, userId });
    } catch (error: any) {
      logger.error('❌ Erreur recherche transformation par user', {
        error: error.message,
        transformationId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Lister les transformations d'un utilisateur
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
  ): Promise<{ transformations: ITransformationDocument[]; total: number }> {
    try {
      const { limit = 20, offset = 0, status, sortBy = 'createdAt', sortOrder = 'desc' } = options;

      const filter: any = { userId };
      if (status) {
        filter['processing.status'] = status;
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [transformations, total] = await Promise.all([
        TransformationModel.find(filter).sort(sort).skip(offset).limit(limit).lean(),
        TransformationModel.countDocuments(filter),
      ]);

      return { transformations: transformations as unknown as ITransformationDocument[], total };
    } catch (error: any) {
      logger.error('❌ Erreur listage transformations', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Mettre à jour une transformation
   */
  async update(
    transformationId: string,
    updates: Partial<ITransformationDocument>
  ): Promise<ITransformationDocument | null> {
    try {
      const transformation = await TransformationModel.findOneAndUpdate(
        { transformationId },
        { $set: updates },
        { new: true }
      );

      if (transformation) {
        logger.info('✅ Transformation mise à jour', { transformationId });
      }

      return transformation;
    } catch (error: any) {
      logger.error('❌ Erreur mise à jour transformation', {
        error: error.message,
        transformationId,
      });
      throw error;
    }
  }

  /**
   * Supprimer une transformation
   */
  async delete(transformationId: string): Promise<boolean> {
    try {
      const result = await TransformationModel.deleteOne({ transformationId });

      if (result.deletedCount > 0) {
        logger.info('🗑️  Transformation supprimée', { transformationId });
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('❌ Erreur suppression transformation', {
        error: error.message,
        transformationId,
      });
      throw error;
    }
  }

  /**
   * Mettre à jour le statut
   */
  async updateStatus(transformationId: string, status: string, progress?: number): Promise<void> {
    try {
      const updates: any = {
        'processing.status': status,
      };

      if (progress !== undefined) {
        updates['processing.progress'] = progress;
      }

      if (status === 'processing' && progress === 0) {
        updates['processing.startedAt'] = new Date();
      }

      await TransformationModel.updateOne({ transformationId }, { $set: updates });

      logger.debug('📊 Statut transformation mis à jour', {
        transformationId,
        status,
        progress,
      });
    } catch (error: any) {
      logger.error('❌ Erreur mise à jour statut', {
        error: error.message,
        transformationId,
      });
      throw error;
    }
  }

  /**
   * Marquer comme complétée
   */
  async markAsCompleted(transformationId: string, result: any): Promise<void> {
    try {
      await TransformationModel.updateOne(
        { transformationId },
        {
          $set: {
            'processing.status': 'completed',
            'processing.progress': 1,
            'processing.completedAt': new Date(),
            result,
          },
        }
      );

      logger.info('✅ Transformation complétée', { transformationId });
    } catch (error: any) {
      logger.error('❌ Erreur marquage transformation complétée', {
        error: error.message,
        transformationId,
      });
      throw error;
    }
  }

  /**
   * Marquer comme échouée
   */
  async markAsFailed(transformationId: string, error: any): Promise<void> {
    try {
      await TransformationModel.updateOne(
        { transformationId },
        {
          $set: {
            'processing.status': 'failed',
            error: {
              code: error.code || 'TRANSFORMATION_FAILED',
              message: error.message || 'Transformation failed',
              details: error.details,
              retryable: error.retryable !== false,
              occurredAt: new Date(),
            },
          },
        }
      );

      logger.warn('⚠️  Transformation échouée', {
        transformationId,
        error: error.message,
      });
    } catch (err: any) {
      logger.error('❌ Erreur marquage transformation échouée', {
        error: err.message,
        transformationId,
      });
      throw err;
    }
  }

  /**
   * Récupérer les transformations récentes (pour le dashboard)
   */
  async findRecent(limit: number = 50): Promise<ITransformationDocument[]> {
    try {
      const transformations = await TransformationModel.find({
        'processing.status': 'completed',
      })
        .sort({ 'processing.completedAt': -1 })
        .limit(limit)
        .lean();

      return transformations as unknown as ITransformationDocument[];
    } catch (error: any) {
      logger.error('❌ Erreur récupération transformations récentes', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Compter le nombre total de transformations
   */
  async countTotal(): Promise<number> {
    try {
      return await TransformationModel.countDocuments();
    } catch (error: any) {
      logger.error('❌ Erreur comptage total transformations', { error: error.message });
      return 0;
    }
  }

  /**
   * Compter les transformations par statut
   */
  async countByStatus(): Promise<Record<string, number>> {
    try {
      const stats = await TransformationModel.aggregate([
        {
          $group: {
            _id: '$processing.status',
            count: { $sum: 1 },
          },
        },
      ]);

      const result: Record<string, number> = {};
      stats.forEach((stat) => {
        result[stat._id] = stat.count;
      });

      return result;
    } catch (error: any) {
      logger.error('❌ Erreur comptage transformations par statut', { error: error.message });
      return {};
    }
  }
}
