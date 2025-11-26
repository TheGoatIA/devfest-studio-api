/**
 * Contrôleur pour les styles
 */

import { Request, Response } from 'express';
import { StyleRepository } from '../../../infrastructure/database/repositories/StyleRepository';
import { GetStylesUseCase } from '../../../application/usecases/styles/GetStylesUseCase';
import { GetStyleByIdUseCase } from '../../../application/usecases/styles/GetStyleByIdUseCase';
import { CreateStyleUseCase } from '../../../application/usecases/styles/CreateStyleUseCase';
import { UpdateStyleUseCase } from '../../../application/usecases/styles/UpdateStyleUseCase';
import { DeleteStyleUseCase } from '../../../application/usecases/styles/DeleteStyleUseCase';
import logger from '../../../config/logger';

export class StyleController {
  private getStylesUseCase: GetStylesUseCase;
  private getStyleByIdUseCase: GetStyleByIdUseCase;
  private createStyleUseCase: CreateStyleUseCase;
  private updateStyleUseCase: UpdateStyleUseCase;
  private deleteStyleUseCase: DeleteStyleUseCase;

  constructor() {
    const styleRepository = new StyleRepository();

    this.getStylesUseCase = new GetStylesUseCase(styleRepository);
    this.getStyleByIdUseCase = new GetStyleByIdUseCase(styleRepository);
    this.createStyleUseCase = new CreateStyleUseCase(styleRepository);
    this.updateStyleUseCase = new UpdateStyleUseCase(styleRepository);
    this.deleteStyleUseCase = new DeleteStyleUseCase(styleRepository);
  }

  /**
   * GET /api/v1/styles
   * Lister les styles disponibles
   */
  getStyles = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, popular, featured, search, limit, offset } = req.query;

      const result = await this.getStylesUseCase.execute({
        category: category as string,
        popular: popular === 'true',
        featured: featured === 'true',
        search: search as string,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      });

      res.status(200).json({
        success: true,
        data: {
          styles: result.styles,
          pagination: result.pagination,
        },
      });
    } catch (error: any) {
      logger.error('❌ Erreur listage styles', { error: error.message });
      throw error;
    }
  };

  /**
   * GET /api/v1/styles/:styleId
   * Récupérer un style par ID
   */
  getStyleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { styleId } = req.params;

      const result = await this.getStyleByIdUseCase.execute({ styleId });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('❌ Erreur récupération style', {
        error: error.message,
        styleId: req.params.styleId,
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/styles/popular
   * Récupérer les styles populaires
   */
  getPopularStyles = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const result = await this.getStylesUseCase.execute({
        popular: true,
        limit,
        offset: 0,
      });

      res.status(200).json({
        success: true,
        data: {
          styles: result.styles,
        },
      });
    } catch (error: any) {
      logger.error('❌ Erreur récupération styles populaires', {
        error: error.message,
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/styles/category/:category
   * Récupérer les styles par catégorie
   */
  getStylesByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const result = await this.getStylesUseCase.execute({
        category,
        limit,
        offset,
      });

      res.status(200).json({
        success: true,
        data: {
          category,
          styles: result.styles,
          pagination: result.pagination,
        },
      });
    } catch (error: any) {
      logger.error('❌ Erreur récupération styles par catégorie', {
        error: error.message,
        category: req.params.category,
      });
      throw error;
    }
  };

  /**
   * POST /api/v1/styles
   * Créer un nouveau style
   */
  createStyle = async (req: Request, res: Response): Promise<void> => {
    try {
      const styleData = req.body;

      const style = await this.createStyleUseCase.execute(styleData);

      res.status(201).json({
        success: true,
        data: style,
      });
    } catch (error: any) {
      logger.error('❌ Erreur création style', { error: error.message });
      throw error;
    }
  };

  /**
   * PUT /api/v1/styles/:styleId
   * Mettre à jour un style
   */
  updateStyle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { styleId } = req.params;
      const updates = req.body;

      const style = await this.updateStyleUseCase.execute({
        styleId,
        ...updates,
      });

      res.status(200).json({
        success: true,
        data: style,
      });
    } catch (error: any) {
      logger.error('❌ Erreur mise à jour style', {
        error: error.message,
        styleId: req.params.styleId,
      });
      throw error;
    }
  };

  /**
   * DELETE /api/v1/styles/:styleId
   * Supprimer un style
   */
  deleteStyle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { styleId } = req.params;

      await this.deleteStyleUseCase.execute({ styleId });

      res.status(200).json({
        success: true,
        message: 'Style supprimé avec succès',
      });
    } catch (error: any) {
      logger.error('❌ Erreur suppression style', {
        error: error.message,
        styleId: req.params.styleId,
      });
      throw error;
    }
  };
}
