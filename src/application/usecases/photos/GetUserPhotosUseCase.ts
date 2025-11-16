/**
 * Use Case: Récupérer les photos d'un utilisateur
 */

import { IPhotoRepository } from '../../../core/interfaces/repositories/IPhotoRepository';
import logger from '../../../config/logger';
import { AppError } from '../../../shared/errors/AppError';

export interface GetUserPhotosInput {
  userId: string;
  limit?: number;
  offset?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PhotoSummary {
  id: string;
  thumbnailUrl: string;
  originalUrl: string;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    format: string;
  };
  status: string;
  createdAt: Date;
}

export interface GetUserPhotosOutput {
  photos: PhotoSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class GetUserPhotosUseCase {
  constructor(private photoRepository: IPhotoRepository) {}

  async execute(input: GetUserPhotosInput): Promise<GetUserPhotosOutput> {
    try {
      const {
        userId,
        limit = 20,
        offset = 0,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = input;

      // Valider les paramètres
      if (limit > 100) {
        throw new AppError('La limite maximale est de 100 photos par requête', 400);
      }

      // Récupérer les photos
      const { photos, total } = await this.photoRepository.findByUser(userId, {
        limit,
        offset,
        status,
        sortBy,
        sortOrder,
      });

      logger.info('📸 Photos utilisateur récupérées', {
        userId,
        count: photos.length,
        total,
      });

      return {
        photos: photos.map((photo) => ({
          id: photo.photoId,
          thumbnailUrl: photo.storage.thumbnailUrl,
          originalUrl: photo.storage.originalUrl,
          metadata: {
            width: photo.metadata.width,
            height: photo.metadata.height,
            fileSize: photo.metadata.fileSize,
            format: photo.metadata.format,
          },
          status: photo.processing.status,
          createdAt: photo.createdAt,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + photos.length < total,
        },
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('❌ Erreur récupération photos utilisateur', {
        error: error.message,
        userId: input.userId,
      });

      throw new AppError('Erreur lors de la récupération des photos', 500);
    }
  }
}
