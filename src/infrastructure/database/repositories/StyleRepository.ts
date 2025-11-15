/**
 * Repository pour la gestion des styles
 */

import {
  IStyleRepository,
  StyleFilters,
  StyleQueryOptions,
} from '../../../core/interfaces/repositories/IStyleRepository';
import { StyleModel, IStyleDocument } from '../mongodb/models/StyleModel';
import logger from '../../../config/logger';

export class StyleRepository implements IStyleRepository {
  /**
   * Créer un nouveau style
   */
  async create(styleData: Partial<IStyleDocument>): Promise<IStyleDocument> {
    try {
      const style = new StyleModel(styleData);
      await style.save();

      logger.info('✅ Style créé', {
        styleId: style.styleId,
        name: style.name,
      });

      return style;
    } catch (error: any) {
      logger.error('❌ Erreur création style', { error: error.message });
      throw error;
    }
  }

  /**
   * Trouver un style par ID
   */
  async findById(styleId: string): Promise<IStyleDocument | null> {
    try {
      const style = await StyleModel.findOne({
        styleId,
        'availability.isActive': true,
      });
      return style;
    } catch (error: any) {
      logger.error('❌ Erreur recherche style par ID', {
        error: error.message,
        styleId,
      });
      throw error;
    }
  }

  /**
   * Lister les styles avec filtres
   */
  async find(
    filters: StyleFilters = {},
    options: StyleQueryOptions = {}
  ): Promise<{ styles: IStyleDocument[]; total: number }> {
    try {
      const {
        limit = 20,
        offset = 0,
        sortBy = 'metrics.popularity',
        sortOrder = 'desc',
      } = options;

      // Construire le filtre
      const query: any = { 'availability.isActive': true };

      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.isPremium !== undefined) {
        query['pricing.isPremium'] = filters.isPremium;
      }

      if (filters.tier) {
        query['pricing.tier'] = filters.tier;
      }

      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }

      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { nameFr: { $regex: filters.search, $options: 'i' } },
          { nameEn: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
          { tags: { $regex: filters.search, $options: 'i' } },
        ];
      }

      // Filtre popularité
      if (filters.popular) {
        query['metrics.popularity'] = { $gte: 0.7 };
      }

      if (filters.featured) {
        query['metrics.popularity'] = { $gte: 0.8 };
      }

      // Construire le tri
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Exécuter les requêtes en parallèle
      const [styles, total] = await Promise.all([
        StyleModel.find(query).sort(sort).skip(offset).limit(limit).lean(),
        StyleModel.countDocuments(query),
      ]);

      return { styles: styles as IStyleDocument[], total };
    } catch (error: any) {
      logger.error('❌ Erreur listage styles', { error: error.message });
      throw error;
    }
  }

  /**
   * Récupérer les styles populaires
   */
  async findPopular(limit: number = 10): Promise<IStyleDocument[]> {
    try {
      const styles = await StyleModel.find({
        'availability.isActive': true,
      })
        .sort({ 'metrics.popularity': -1, 'metrics.usageCount': -1 })
        .limit(limit)
        .lean();

      return styles as IStyleDocument[];
    } catch (error: any) {
      logger.error('❌ Erreur récupération styles populaires', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Rechercher des styles par texte
   */
  async search(query: string, limit: number = 20): Promise<IStyleDocument[]> {
    try {
      const styles = await StyleModel.find({
        'availability.isActive': true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { nameFr: { $regex: query, $options: 'i' } },
          { nameEn: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } },
        ],
      })
        .sort({ 'metrics.popularity': -1 })
        .limit(limit)
        .lean();

      return styles as IStyleDocument[];
    } catch (error: any) {
      logger.error('❌ Erreur recherche styles', {
        error: error.message,
        query,
      });
      throw error;
    }
  }

  /**
   * Mettre à jour un style
   */
  async update(
    styleId: string,
    updates: Partial<IStyleDocument>
  ): Promise<IStyleDocument | null> {
    try {
      const style = await StyleModel.findOneAndUpdate(
        { styleId },
        { $set: updates },
        { new: true }
      );

      if (style) {
        logger.info('✅ Style mis à jour', { styleId });
      }

      return style;
    } catch (error: any) {
      logger.error('❌ Erreur mise à jour style', {
        error: error.message,
        styleId,
      });
      throw error;
    }
  }

  /**
   * Supprimer un style (soft delete)
   */
  async delete(styleId: string): Promise<boolean> {
    try {
      const result = await StyleModel.updateOne(
        { styleId },
        {
          $set: {
            'availability.isActive': false,
            'availability.deprecatedAt': new Date(),
          },
        }
      );

      if (result.modifiedCount > 0) {
        logger.info('🗑️  Style désactivé', { styleId });
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('❌ Erreur suppression style', {
        error: error.message,
        styleId,
      });
      throw error;
    }
  }

  /**
   * Incrémenter le compteur d'usage
   */
  async incrementUsage(styleId: string): Promise<void> {
    try {
      await StyleModel.updateOne(
        { styleId },
        {
          $inc: { 'metrics.usageCount': 1 },
        }
      );

      logger.debug('📊 Usage style incrémenté', { styleId });
    } catch (error: any) {
      logger.error('❌ Erreur incrémentation usage style', {
        error: error.message,
        styleId,
      });
      // Ne pas throw, c'est non-bloquant
    }
  }

  /**
   * Récupérer les styles par catégorie
   */
  async findByCategory(
    category: string,
    options: StyleQueryOptions = {}
  ): Promise<IStyleDocument[]> {
    try {
      const { limit = 20, offset = 0, sortBy = 'metrics.popularity', sortOrder = 'desc' } = options;

      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const styles = await StyleModel.find({
        category,
        'availability.isActive': true,
      })
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .lean();

      return styles as IStyleDocument[];
    } catch (error: any) {
      logger.error('❌ Erreur récupération styles par catégorie', {
        error: error.message,
        category,
      });
      throw error;
    }
  }

  /**
   * Compter les styles
   */
  async count(filters: StyleFilters = {}): Promise<number> {
    try {
      const query: any = { 'availability.isActive': true };

      if (filters.category) {
        query.category = filters.category;
      }

      if (filters.isPremium !== undefined) {
        query['pricing.isPremium'] = filters.isPremium;
      }

      const count = await StyleModel.countDocuments(query);
      return count;
    } catch (error: any) {
      logger.error('❌ Erreur comptage styles', { error: error.message });
      throw error;
    }
  }
}
