/**
 * Use Case: Récupérer une photo
 */

import { IPhotoRepository } from '../../../core/interfaces/repositories/IPhotoRepository';
import { IPhotoDocument } from '../../../infrastructure/database/mongodb/models/PhotoModel';
import logger from '../../../config/logger';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { AppError } from '../../../shared/errors/AppError';

export interface GetPhotoInput {
  photoId: string;
  userId: string;
}

export interface GetPhotoOutput {
  id: string;
  originalUrl: string;
  thumbnailUrl: string;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    format: string;
    cameraInfo?: {
      make?: string;
      model?: string;
    };
  };
  uploadStatus: string;
  createdAt: Date;
  userId: string;
}

export class GetPhotoUseCase {
  constructor(private photoRepository: IPhotoRepository) {}

  async execute(input: GetPhotoInput): Promise<GetPhotoOutput> {
    try {
      // Récupérer la photo en vérifiant qu'elle appartient à l'utilisateur
      const photo = await this.photoRepository.findByIdAndUser(
        input.photoId,
        input.userId
      );

      if (!photo) {
        throw new NotFoundError('Photo non trouvée');
      }

      logger.info('📸 Photo récupérée', {
        photoId: input.photoId,
        userId: input.userId,
      });

      return this.mapPhotoToOutput(photo);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('❌ Erreur récupération photo', {
        error: error.message,
        photoId: input.photoId,
      });

      throw new AppError('Erreur lors de la récupération de la photo', 500);
    }
  }

  /**
   * Transforme le document photo en output
   */
  private mapPhotoToOutput(photo: IPhotoDocument): GetPhotoOutput {
    return {
      id: photo.photoId,
      originalUrl: photo.storage.originalUrl,
      thumbnailUrl: photo.storage.thumbnailUrl,
      metadata: {
        width: photo.metadata.width,
        height: photo.metadata.height,
        fileSize: photo.metadata.fileSize,
        format: photo.metadata.format,
        ...(photo.metadata.cameraInfo && {
          cameraInfo: {
            make: photo.metadata.cameraInfo.make,
            model: photo.metadata.cameraInfo.model,
          },
        }),
      },
      uploadStatus: photo.processing.status,
      createdAt: photo.createdAt,
      userId: photo.userId,
    };
  }
}
