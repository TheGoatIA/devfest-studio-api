/**
 * Contrôleur pour les transformations
 */

import { Request, Response } from 'express';
import { TransformationRepository } from '../../../infrastructure/database/repositories/TransformationRepository';
import { PhotoRepository } from '../../../infrastructure/database/repositories/PhotoRepository';
import { StyleRepository } from '../../../infrastructure/database/repositories/StyleRepository';
import { AIService } from '../../../application/services/AIService';
import { StartTransformationUseCase } from '../../../application/usecases/transformations/StartTransformationUseCase';
import { GetTransformationStatusUseCase } from '../../../application/usecases/transformations/GetTransformationStatusUseCase';
import { GetTransformationUseCase } from '../../../application/usecases/transformations/GetTransformationUseCase';
import { CancelTransformationUseCase } from '../../../application/usecases/transformations/CancelTransformationUseCase';
import logger from '../../../config/logger';

export class TransformationController {
  private startTransformationUseCase: StartTransformationUseCase;
  private getTransformationStatusUseCase: GetTransformationStatusUseCase;
  private getTransformationUseCase: GetTransformationUseCase;
  private cancelTransformationUseCase: CancelTransformationUseCase;

  constructor() {
    const transformationRepository = new TransformationRepository();
    const photoRepository = new PhotoRepository();
    const styleRepository = new StyleRepository();
    const aiService = new AIService();

    this.startTransformationUseCase = new StartTransformationUseCase(
      transformationRepository,
      photoRepository,
      styleRepository,
      aiService
    );

    this.getTransformationStatusUseCase = new GetTransformationStatusUseCase(
      transformationRepository
    );

    this.getTransformationUseCase = new GetTransformationUseCase(
      transformationRepository,
      photoRepository,
      styleRepository
    );

    this.cancelTransformationUseCase = new CancelTransformationUseCase(transformationRepository);
  }

  /**
   * POST /api/v1/transform
   * Démarrer une nouvelle transformation
   */
  startTransformation = async (req: any, res: Response): Promise<void> => {
    try {
      const {
        photo_id,
        style_id,
        custom_description,
        quality = 'standard',
        options = {},
        priority = 'normal',
      } = req.body;

      const result = await this.startTransformationUseCase.execute({
        userId: req.user.userId,
        photoId: photo_id,
        styleId: style_id,
        customDescription: custom_description,
        quality,
        options,
        priority,
      });

      logger.info('✅ Transformation démarrée', {
        transformationId: result.transformationId,
        userId: req.user.userId,
      });

      res.status(201).json({
        success: true,
        data: {
          transformation_id: result.transformationId,
          status: result.status,
          estimated_completion_time: result.estimatedCompletionTime,
          queue_position: result.queuePosition,
          created_at: result.createdAt,
        },
      });
    } catch (error: any) {
      logger.error('❌ Erreur démarrage transformation', {
        error: error.message,
        userId: req.user?.userId,
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/transformation/:id/status
   * Récupérer le statut d'une transformation
   */
  getTransformationStatus = async (req: any, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.getTransformationStatusUseCase.execute({
        transformationId: id,
        userId: req.user.userId,
      });

      res.status(200).json({
        success: true,
        data: {
          id: result.id,
          status: result.status,
          progress: result.progress,
          current_step: result.currentStep,
          estimated_time_remaining: result.estimatedTimeRemaining,
          queue_position: result.queuePosition,
          error_details: result.error,
          updated_at: result.updatedAt,
        },
      });
    } catch (error: any) {
      logger.error('❌ Erreur récupération statut transformation', {
        error: error.message,
        transformationId: req.params.id,
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/transformation/:id
   * Récupérer le résultat complet d'une transformation
   */
  getTransformation = async (req: any, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.getTransformationUseCase.execute({
        transformationId: id,
        userId: req.user.userId,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('❌ Erreur récupération transformation', {
        error: error.message,
        transformationId: req.params.id,
      });
      throw error;
    }
  };

  /**
   * DELETE /api/v1/transformation/:id
   * Annuler une transformation
   */
  cancelTransformation = async (req: any, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.cancelTransformationUseCase.execute({
        transformationId: id,
        userId: req.user.userId,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('❌ Erreur annulation transformation', {
        error: error.message,
        transformationId: req.params.id,
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/transformations/recent
   * Récupérer les transformations récentes pour le dashboard
   *
   * PUBLIC - Pas d'authentification requise
   */
  getRecentTransformations = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transformationRepository = new TransformationRepository();

      const transformations = await transformationRepository.findRecent(limit);

      // Formater les données pour le dashboard
      const formattedData = transformations.map((t) => ({
        transformationId: t.transformationId,
        styleId: t.styleId || 'custom',
        resultUrl: t.result?.transformedImageUrl || '',
        url: t.result?.transformedImageUrl || '',
        timestamp: t.processing?.completedAt || t.createdAt,
        status: t.processing?.status,
      }));

      res.status(200).json({
        success: true,
        data: formattedData,
      });
    } catch (error: any) {
      logger.error('❌ Erreur récupération transformations récentes', {
        error: error.message,
      });
      throw error;
    }
  };
}
