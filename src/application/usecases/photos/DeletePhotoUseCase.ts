/**
 * Use Case: Supprimer une photo
 */

import { IPhotoRepository } from '../../../core/interfaces/repositories/IPhotoRepository';
import { IStorageService } from '../../../core/interfaces/services/IStorageService';
import logger from '../../../config/logger';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { AppError } from '../../../shared/errors/AppError';

export interface DeletePhotoInput {
  photoId: string;
  userId: string;
}

export interface DeletePhotoOutput {
  success: boolean;
  message: string;
  deletedAt: Date;
}

export class DeletePhotoUseCase {
  constructor(
    private photoRepository: IPhotoRepository,
    private storageService: IStorageService
  ) {}

  async execute(input: DeletePhotoInput): Promise<DeletePhotoOutput> {
    try {
      // 1. Récupérer la photo
      const photo = await this.photoRepository.findByIdAndUser(input.photoId, input.userId);

      if (!photo) {
        throw new NotFoundError('Photo non trouvée');
      }

      // 2. Supprimer le fichier du cloud storage
      try {
        await this.storageService.deleteFile(photo.storage.cloudPath);
      } catch (error: any) {
        logger.warn('⚠️  Erreur suppression fichier cloud (non-bloquant)', {
          error: error.message,
          cloudPath: photo.storage.cloudPath,
        });
        // Continuer même si la suppression cloud échoue
      }

      // 3. Supprimer l'entrée de la base de données
      const deleted = await this.photoRepository.delete(input.photoId);

      if (!deleted) {
        throw new AppError('Erreur lors de la suppression de la photo', 500);
      }

      logger.info('🗑️  Photo supprimée avec succès', {
        photoId: input.photoId,
        userId: input.userId,
      });

      return {
        success: true,
        message: 'Photo supprimée avec succès',
        deletedAt: new Date(),
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('❌ Erreur suppression photo', {
        error: error.message,
        photoId: input.photoId,
      });

      throw new AppError('Erreur lors de la suppression de la photo', 500);
    }
  }
}
