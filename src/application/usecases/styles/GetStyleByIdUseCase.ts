/**
 * Use Case: Récupérer un style par ID
 */

import { IStyleRepository } from '../../../core/interfaces/repositories/IStyleRepository';
import logger from '../../../config/logger';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { AppError } from '../../../shared/errors/AppError';

export interface GetStyleByIdInput {
  styleId: string;
}

export interface GetStyleByIdOutput {
  id: string;
  name: string;
  nameFr: string;
  nameEn: string;
  category: string;
  description: string;
  descriptionFr: string;
  descriptionEn: string;
  longDescription?: string;
  longDescriptionFr?: string;
  longDescriptionEn?: string;
  previewImageUrl: string;
  images: {
    thumbnail: string;
    medium: string;
    large: string;
  };
  exampleTransformations: {
    beforeUrl: string;
    afterUrl: string;
    caption?: string;
  }[];
  technicalDetails: {
    modelVersion: string;
    processingComplexity: string;
    supportedResolutions: string[];
  };
  popularity: number;
  usageCount: number;
  averageRating: number;
  isPremium: boolean;
  estimatedProcessingTime: number;
  tags: string[];
}

export class GetStyleByIdUseCase {
  constructor(private styleRepository: IStyleRepository) {}

  async execute(input: GetStyleByIdInput): Promise<GetStyleByIdOutput> {
    try {
      const style = await this.styleRepository.findById(input.styleId);

      if (!style) {
        throw new NotFoundError('Style non trouvé');
      }

      logger.info('🎨 Style récupéré', {
        styleId: input.styleId,
        name: style.name,
      });

      return {
        id: style.styleId,
        name: style.name,
        nameFr: style.nameFr,
        nameEn: style.nameEn,
        category: style.category,
        description: style.description,
        descriptionFr: style.descriptionFr,
        descriptionEn: style.descriptionEn,
        longDescription: style.longDescription,
        longDescriptionFr: style.longDescriptionFr,
        longDescriptionEn: style.longDescriptionEn,
        previewImageUrl: style.images.previewUrl,
        images: {
          thumbnail: style.images.thumbnailUrl,
          medium: style.images.mediumUrl,
          large: style.images.largeUrl,
        },
        exampleTransformations: style.images.exampleTransformations || [],
        technicalDetails: {
          modelVersion: style.technical.modelVersion,
          processingComplexity: style.technical.processingComplexity,
          supportedResolutions: style.technical.supportedResolutions,
        },
        popularity: style.metrics.popularity,
        usageCount: style.metrics.usageCount,
        averageRating: style.metrics.averageRating,
        isPremium: style.pricing.isPremium,
        estimatedProcessingTime: style.technical.estimatedProcessingTime,
        tags: style.tags,
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('❌ Erreur récupération style par ID', {
        error: error.message,
        styleId: input.styleId,
      });

      throw new AppError('Erreur lors de la récupération du style', 500);
    }
  }
}
