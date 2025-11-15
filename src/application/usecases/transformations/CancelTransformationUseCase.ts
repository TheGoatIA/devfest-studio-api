/**
 * Use Case: Annuler une transformation
 */

import { ITransformationRepository } from '../../../core/interfaces/repositories/ITransformationRepository';
import logger from '../../../config/logger';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { AppError } from '../../../shared/errors/AppError';

export interface CancelTransformationInput {
  transformationId: string;
  userId: string;
}

export interface CancelTransformationOutput {
  cancelled: true;
  message: string;
  cancelledAt: Date;
}

export class CancelTransformationUseCase {
  constructor(private transformationRepository: ITransformationRepository) {}

  async execute(input: CancelTransformationInput): Promise<CancelTransformationOutput> {
    try {
      const transformation = await this.transformationRepository.findByIdAndUser(
        input.transformationId,
        input.userId
      );

      if (!transformation) {
        throw new NotFoundError('Transformation non trouvée');
      }

      // Vérifier que la transformation peut être annulée
      if (transformation.processing.status === 'completed') {
        throw new AppError("Impossible d'annuler une transformation terminée", 409);
      }

      if (transformation.processing.status === 'cancelled') {
        throw new AppError('Cette transformation est déjà annulée', 409);
      }

      // Mettre à jour le statut
      await this.transformationRepository.updateStatus(input.transformationId, 'cancelled');

      logger.info('🚫 Transformation annulée', {
        transformationId: input.transformationId,
        userId: input.userId,
      });

      return {
        cancelled: true,
        message: 'Transformation annulée avec succès',
        cancelledAt: new Date(),
      };
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof AppError) {
        throw error;
      }

      logger.error('❌ Erreur annulation transformation', {
        error: error.message,
        transformationId: input.transformationId,
      });

      throw new AppError("Erreur lors de l'annulation de la transformation", 500);
    }
  }
}
