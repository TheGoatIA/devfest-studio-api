/**
 * Use Case: Récupérer le résultat complet d'une transformation
 */

import { ITransformationRepository } from '../../../core/interfaces/repositories/ITransformationRepository';
import { IPhotoRepository } from '../../../core/interfaces/repositories/IPhotoRepository';
import { IStyleRepository } from '../../../core/interfaces/repositories/IStyleRepository';
import logger from '../../../config/logger';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { AppError } from '../../../shared/errors/AppError';

export interface GetTransformationInput {
  transformationId: string;
  userId: string;
}

export interface GetTransformationOutput {
  id: string;
  photo: {
    id: string;
    originalUrl: string;
    thumbnailUrl: string;
  };
  style?: {
    id: string;
    name: string;
    category: string;
  };
  customStyle?: {
    description: string;
    language: string;
  };
  transformedImageUrl?: string;
  transformedImages?: {
    thumbnail: string;
    medium: string;
    large: string;
    original: string;
  };
  status: string;
  progress: number;
  aiAnalysis?: {
    explanation: string;
    confidence: number;
    detectedElements: string[];
  };
  processingMetrics?: {
    totalTime: number;
    queueTime: number;
    processingTime: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

export class GetTransformationUseCase {
  constructor(
    private transformationRepository: ITransformationRepository,
    private photoRepository: IPhotoRepository,
    private styleRepository: IStyleRepository
  ) {}

  async execute(input: GetTransformationInput): Promise<GetTransformationOutput> {
    try {
      const transformation = await this.transformationRepository.findByIdAndUser(
        input.transformationId,
        input.userId
      );

      if (!transformation) {
        throw new NotFoundError('Transformation non trouvée');
      }

      // Récupérer la photo
      const photo = await this.photoRepository.findById(transformation.photoId);
      if (!photo) {
        throw new NotFoundError('Photo associée non trouvée');
      }

      // Récupérer le style si applicable
      let styleInfo = undefined;
      if (transformation.styleId) {
        const style = await this.styleRepository.findById(transformation.styleId);
        if (style) {
          styleInfo = {
            id: style.styleId,
            name: style.name,
            category: style.category,
          };
        }
      }

      logger.info('🎨 Transformation récupérée', {
        transformationId: input.transformationId,
        status: transformation.processing.status,
      });

      return {
        id: transformation.transformationId,
        photo: {
          id: photo.photoId,
          originalUrl: photo.storage.originalUrl,
          thumbnailUrl: photo.storage.thumbnailUrl,
        },
        style: styleInfo,
        customStyle: transformation.customStyle
          ? {
              description: transformation.customStyle.description,
              language: transformation.customStyle.language,
            }
          : undefined,
        transformedImageUrl: transformation.result?.transformedImageUrl,
        transformedImages: transformation.result?.transformedImages,
        status: transformation.processing.status,
        progress: transformation.processing.progress,
        aiAnalysis: transformation.result?.aiAnalysis
          ? {
              explanation: transformation.result.aiAnalysis.explanation,
              confidence: transformation.result.aiAnalysis.confidence,
              detectedElements: transformation.result.aiAnalysis.detectedElements,
            }
          : undefined,
        processingMetrics: transformation.metrics
          ? {
              totalTime: transformation.metrics.totalProcessingTime || 0,
              queueTime: transformation.metrics.queueTime || 0,
              processingTime: transformation.metrics.actualProcessingTime || 0,
            }
          : undefined,
        createdAt: transformation.createdAt,
        completedAt: transformation.processing.completedAt,
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('❌ Erreur récupération transformation', {
        error: error.message,
        transformationId: input.transformationId,
      });

      throw new AppError('Erreur lors de la récupération de la transformation', 500);
    }
  }
}
