/**
 * Use Case: Retirer une transformation des favoris
 */

import { ITransformationRepository } from '../../../core/interfaces/repositories/ITransformationRepository';
import logger from '../../../config/logger';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { AppError } from '../../../shared/errors/AppError';

export interface RemoveFromFavoritesInput {
  userId: string;
  transformationId: string;
}

export interface RemoveFromFavoritesOutput {
  transformationId: string;
  isFavorite: false;
  removedAt: Date;
}

export class RemoveFromFavoritesUseCase {
  constructor(private transformationRepository: ITransformationRepository) {}

  async execute(
    input: RemoveFromFavoritesInput
  ): Promise<RemoveFromFavoritesOutput> {
    try {
      // Vérifier que la transformation existe et appartient à l'utilisateur
      const transformation = await this.transformationRepository.findByIdAndUser(
        input.transformationId,
        input.userId
      );

      if (!transformation) {
        throw new NotFoundError('Transformation non trouvée');
      }

      // Retirer des favoris
      await this.transformationRepository.update(input.transformationId, {
        'social.isFavorite': false,
      } as any);

      logger.info('⭐ Retiré des favoris', {
        transformationId: input.transformationId,
        userId: input.userId,
      });

      return {
        transformationId: input.transformationId,
        isFavorite: false,
        removedAt: new Date(),
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('❌ Erreur retrait des favoris', {
        error: error.message,
        transformationId: input.transformationId,
      });

      throw new AppError('Erreur lors du retrait des favoris', 500);
    }
  }
}
