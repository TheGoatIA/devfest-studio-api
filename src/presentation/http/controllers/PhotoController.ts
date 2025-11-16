/**
 * Contrôleur pour les photos
 */

import { Response } from 'express';
import { PhotoRepository } from '../../../infrastructure/database/repositories/PhotoRepository';
import { LocalStorageService } from '../../../application/services/LocalStorageService';
import { UploadPhotoUseCase } from '../../../application/usecases/photos/UploadPhotoUseCase';
import { GetPhotoUseCase } from '../../../application/usecases/photos/GetPhotoUseCase';
import { DeletePhotoUseCase } from '../../../application/usecases/photos/DeletePhotoUseCase';
import { GetUserPhotosUseCase } from '../../../application/usecases/photos/GetUserPhotosUseCase';
import { AppError } from '../../../shared/errors/AppError';
import logger from '../../../config/logger';

export class PhotoController {
  private uploadPhotoUseCase: UploadPhotoUseCase;
  private getPhotoUseCase: GetPhotoUseCase;
  private deletePhotoUseCase: DeletePhotoUseCase;
  private getUserPhotosUseCase: GetUserPhotosUseCase;

  constructor() {
    const photoRepository = new PhotoRepository();
    const storageService = new LocalStorageService();

    this.uploadPhotoUseCase = new UploadPhotoUseCase(photoRepository, storageService);
    this.getPhotoUseCase = new GetPhotoUseCase(photoRepository);
    this.deletePhotoUseCase = new DeletePhotoUseCase(photoRepository, storageService);
    this.getUserPhotosUseCase = new GetUserPhotosUseCase(photoRepository);
  }

  /**
   * POST /api/v1/upload
   * Upload une photo
   */
  uploadPhoto = async (req: any, res: Response): Promise<void> => {
    try {
      // Vérifier qu'un fichier a été uploadé
      if (!req.file) {
        throw new AppError('Aucun fichier fourni', 400);
      }

      // Récupérer les métadonnées optionnelles
      let metadata: any = {};
      if (req.body.metadata) {
        try {
          metadata = JSON.parse(req.body.metadata);
        } catch (error) {
          logger.warn('⚠️  Métadonnées JSON invalides, ignorées', {
            metadata: req.body.metadata,
          });
        }
      }

      // Exécuter le use case
      const result = await this.uploadPhotoUseCase.execute({
        userId: req.user.userId,
        file: {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        metadata,
        clientInfo: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });

      logger.info('✅ Photo uploadée avec succès', {
        photoId: result.photoId,
        userId: req.user.userId,
      });

      res.status(201).json({
        success: true,
        data: {
          photo_id: result.photoId,
          original_url: result.originalUrl,
          thumbnail_url: result.thumbnailUrl,
          metadata: result.metadata,
          uploaded_at: result.uploadedAt,
        },
      });
    } catch (error: any) {
      logger.error('❌ Erreur upload photo', {
        error: error.message,
        userId: req.user?.userId,
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/photos/:photoId
   * Récupérer une photo par ID
   */
  getPhoto = async (req: any, res: Response): Promise<void> => {
    try {
      const { photoId } = req.params;

      const result = await this.getPhotoUseCase.execute({
        photoId,
        userId: req.user.userId,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('❌ Erreur récupération photo', {
        error: error.message,
        photoId: req.params.photoId,
      });
      throw error;
    }
  };

  /**
   * GET /api/v1/photos
   * Lister les photos de l'utilisateur
   */
  listPhotos = async (req: any, res: Response): Promise<void> => {
    try {
      const {
        limit = 20,
        offset = 0,
        status,
        sort_by = 'createdAt',
        sort_order = 'desc',
      } = req.query;

      const result = await this.getUserPhotosUseCase.execute({
        userId: req.user.userId,
        limit: parseInt(limit),
        offset: parseInt(offset),
        status,
        sortBy: sort_by,
        sortOrder: sort_order,
      });

      res.status(200).json({
        success: true,
        data: {
          photos: result.photos,
          pagination: result.pagination,
        },
      });
    } catch (error: any) {
      logger.error('❌ Erreur listage photos', {
        error: error.message,
        userId: req.user?.userId,
      });
      throw error;
    }
  };

  /**
   * DELETE /api/v1/photos/:photoId
   * Supprimer une photo
   */
  deletePhoto = async (req: any, res: Response): Promise<void> => {
    try {
      const { photoId } = req.params;

      const result = await this.deletePhotoUseCase.execute({
        photoId,
        userId: req.user.userId,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('❌ Erreur suppression photo', {
        error: error.message,
        photoId: req.params.photoId,
      });
      throw error;
    }
  };
}
