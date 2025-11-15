/**
 * Use Case: Récupérer le statut d'une transformation
 */

import { ITransformationRepository } from '../../../core/interfaces/repositories/ITransformationRepository';
import logger from '../../../config/logger';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import { AppError } from '../../../shared/errors/AppError';

export interface GetTransformationStatusInput {
  transformationId: string;
  userId: string;
}

export interface GetTransformationStatusOutput {
  id: string;
  status: string;
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
  queuePosition?: number;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  updatedAt: Date;
}

export class GetTransformationStatusUseCase {
  constructor(private transformationRepository: ITransformationRepository) {}

  async execute(
    input: GetTransformationStatusInput
  ): Promise<GetTransformationStatusOutput> {
    try {
      const transformation = await this.transformationRepository.findByIdAndUser(
        input.transformationId,
        input.userId
      );

      if (!transformation) {
        throw new NotFoundError('Transformation non trouvée');
      }

      logger.info('📊 Statut transformation récupéré', {
        transformationId: input.transformationId,
        status: transformation.processing.status,
      });

      return {
        id: transformation.transformationId,
        status: transformation.processing.status,
        progress: transformation.processing.progress,
        currentStep: transformation.processing.currentStep,
        estimatedTimeRemaining: transformation.processing.estimatedTimeRemaining,
        queuePosition: transformation.processing.queuePosition,
        error: transformation.error
          ? {
              code: transformation.error.code,
              message: transformation.error.message,
              retryable: transformation.error.retryable,
            }
          : undefined,
        updatedAt: transformation.updatedAt,
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('❌ Erreur récupération statut transformation', {
        error: error.message,
        transformationId: input.transformationId,
      });

      throw new AppError(
        'Erreur lors de la récupération du statut de la transformation',
        500
      );
    }
  }
}
