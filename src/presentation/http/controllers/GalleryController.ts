/**
 * Contrôleur pour la galerie
 */

import { Request, Response } from 'express';
import { TransformationRepository } from '../../../infrastructure/database/repositories/TransformationRepository';
import { GetUserGalleryUseCase } from '../../../application/usecases/gallery/GetUserGalleryUseCase';
import { AddToFavoritesUseCase } from '../../../application/usecases/gallery/AddToFavoritesUseCase';
import { RemoveFromFavoritesUseCase } from '../../../application/usecases/gallery/RemoveFromFavoritesUseCase';
import logger from '../../../config/logger';

export class GalleryController {
  private getUserGalleryUseCase: GetUserGalleryUseCase;
  private addToFavoritesUseCase: AddToFavoritesUseCase;
  private removeFromFavoritesUseCase: RemoveFromFavoritesUseCase;

  constructor() {
    const transformationRepository = new TransformationRepository();

    this.getUserGalleryUseCase = new GetUserGalleryUseCase(transformationRepository);
    this.addToFavoritesUseCase = new AddToFavoritesUseCase(transformationRepository);
    this.removeFromFavoritesUseCase = new RemoveFromFavoritesUseCase(
      transformationRepository
    );
  }

  /**
   * GET /api/v1/gallery
   * Récupérer la galerie de l'utilisateur
   */
  getUserGallery = async (req: any, res: Response): Promise<void> => {
    try {
      const {
        status,
        style_category,
        date_from,
        date_to,
        favorites_only,
        page,
        limit,
        sort_by,
        sort_order,
      } = req.query;

      const result = await this.getUserGalleryUseCase.execute({
        userId: req.user.userId,
        filters: {
          status,
          styleCategory: style_category,
          dateFrom: date_from ? new Date(date_from) : undefined,
          dateTo: date_to ? new Date(date_to) : undefined,
          favoritesOnly: favorites_only === 'true',
        },
        pagination: {
          page: page ? parseInt(page) : 1,
          limit: limit ? parseInt(limit) : 20,
          sortBy: sort_by || 'createdAt',
          sortOrder: sort_order || 'desc',
        },
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('❌ Erreur récupération galerie', {
        error: error.message,
        userId: req.user?.userId,
      });
      throw error;
    }
  };

  /**
   * POST /api/v1/favorites
   * Ajouter une transformation aux favoris
   */
  addToFavorites = async (req: any, res: Response): Promise<void> => {
    try {
      const { transformation_id } = req.body;

      const result = await this.addToFavoritesUseCase.execute({
        userId: req.user.userId,
        transformationId: transformation_id,
      });

      res.status(201).json({
        success: true,
        data: {
          transformation_id: result.transformationId,
          is_favorite: result.isFavorite,
          added_at: result.addedAt,
        },
      });
    } catch (error: any) {
      logger.error('❌ Erreur ajout favoris', {
        error: error.message,
        transformationId: req.body.transformation_id,
      });
      throw error;
    }
  };

  /**
   * DELETE /api/v1/favorites/:transformationId
   * Retirer une transformation des favoris
   */
  removeFromFavorites = async (req: any, res: Response): Promise<void> => {
    try {
      const { transformationId } = req.params;

      const result = await this.removeFromFavoritesUseCase.execute({
        userId: req.user.userId,
        transformationId,
      });

      res.status(200).json({
        success: true,
        data: {
          transformation_id: result.transformationId,
          is_favorite: result.isFavorite,
          removed_at: result.removedAt,
        },
      });
    } catch (error: any) {
      logger.error('❌ Erreur retrait favoris', {
        error: error.message,
        transformationId: req.params.transformationId,
      });
      throw error;
    }
  };
}
