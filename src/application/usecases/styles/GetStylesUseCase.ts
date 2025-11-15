/**
 * Use Case: Récupérer la liste des styles
 */

import { IStyleRepository } from '../../../core/interfaces/repositories/IStyleRepository';
import logger from '../../../config/logger';
import { AppError } from '../../../shared/errors/AppError';

export interface GetStylesInput {
  category?: string;
  popular?: boolean;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface StyleSummary {
  id: string;
  name: string;
  nameFr: string;
  nameEn: string;
  category: string;
  description: string;
  descriptionFr: string;
  descriptionEn: string;
  previewImageUrl: string;
  thumbnailUrl: string;
  tags: string[];
  popularity: number;
  isPremium: boolean;
  estimatedProcessingTime: number;
  usageCount: number;
}

export interface GetStylesOutput {
  styles: StyleSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class GetStylesUseCase {
  constructor(private styleRepository: IStyleRepository) {}

  async execute(input: GetStylesInput): Promise<GetStylesOutput> {
    try {
      const { category, popular, featured, search, limit = 20, offset = 0 } = input;

      // Valider les paramètres
      if (limit > 50) {
        throw new AppError('La limite maximale est de 50 styles par requête', 400);
      }

      // Récupérer les styles
      const { styles, total } = await this.styleRepository.find(
        {
          category,
          popular,
          featured,
          search,
        },
        {
          limit,
          offset,
          sortBy: popular || featured ? 'metrics.popularity' : 'createdAt',
          sortOrder: 'desc',
        }
      );

      logger.info('🎨 Styles récupérés', {
        count: styles.length,
        total,
        filters: { category, popular, featured, search },
      });

      return {
        styles: styles.map((style) => ({
          id: style.styleId,
          name: style.name,
          nameFr: style.nameFr,
          nameEn: style.nameEn,
          category: style.category,
          description: style.description,
          descriptionFr: style.descriptionFr,
          descriptionEn: style.descriptionEn,
          previewImageUrl: style.images.previewUrl,
          thumbnailUrl: style.images.thumbnailUrl,
          tags: style.tags,
          popularity: style.metrics.popularity,
          isPremium: style.pricing.isPremium,
          estimatedProcessingTime: style.technical.estimatedProcessingTime,
          usageCount: style.metrics.usageCount,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + styles.length < total,
        },
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('❌ Erreur récupération styles', { error: error.message });
      throw new AppError('Erreur lors de la récupération des styles', 500);
    }
  }
}
