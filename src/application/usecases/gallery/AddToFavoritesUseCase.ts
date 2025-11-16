/**
 * Use Case: Ajouter une transformation aux favoris
 */

import { ITransformationRepository } from '../../../core/interfaces/repositories/ITransformationRepository';
import logger from '../../../config/logger';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { AppError } from '../../../shared/errors/AppError';

export interface AddToFavoritesInput {
  userId: string;
  transformationId: string;
}

export interface AddToFavoritesOutput {
  transformationId: string;
  isFavorite: true;
  addedAt: Date;
}

export class AddToFavoritesUseCase {
  constructor(private transformationRepository: ITransformationRepository) {}

  async execute(input: AddToFavoritesInput): Promise<AddToFavoritesOutput> {
    try {
      // Vérifier que la transformation existe et appartient à l'utilisateur
      const transformation = await this.transformationRepository.findByIdAndUser(
        input.transformationId,
        input.userId
      );

      if (!transformation) {
        throw new NotFoundError('Transformation non trouvée');
      }

      // Vérifier si déjà en favoris
      if (transformation.social.isFavorite) {
        logger.info('⭐ Transformation déjà en favoris', {
          transformationId: input.transformationId,
          userId: input.userId,
        });

        return {
          transformationId: input.transformationId,
          isFavorite: true,
          addedAt: new Date(),
        };
      }

      // Ajouter aux favoris
      await this.transformationRepository.update(input.transformationId, {
        'social.isFavorite': true,
      } as any);

      logger.info('⭐ Ajouté aux favoris', {
        transformationId: input.transformationId,
        userId: input.userId,
      });

      return {
        transformationId: input.transformationId,
        isFavorite: true,
        addedAt: new Date(),
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('❌ Erreur ajout aux favoris', {
        error: error.message,
        transformationId: input.transformationId,
      });

      throw new AppError("Erreur lors de l'ajout aux favoris", 500);
    }
  }
}
