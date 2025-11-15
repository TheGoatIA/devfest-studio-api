/**
 * Use Case: Upload une photo
 */

import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { IPhotoRepository } from '../../../core/interfaces/repositories/IPhotoRepository';
import { StorageService } from '../../services/StorageService';
import logger from '../../../config/logger';
import { AppError } from '../../../shared/errors/AppError';
import { config } from '../../../config/environment';

export interface UploadPhotoInput {
  userId: string;
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  metadata?: {
    capturedAt?: string;
    cameraInfo?: {
      make?: string;
      model?: string;
      focalLength?: string;
    };
  };
  clientInfo?: {
    ip?: string;
    userAgent?: string;
  };
}

export interface UploadPhotoOutput {
  photoId: string;
  originalUrl: string;
  thumbnailUrl: string;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    format: string;
  };
  uploadedAt: Date;
}

export class UploadPhotoUseCase {
  constructor(
    private photoRepository: IPhotoRepository,
    private storageService: StorageService
  ) {}

  async execute(input: UploadPhotoInput): Promise<UploadPhotoOutput> {
    try {
      // 1. Valider le fichier
      this.validateFile(input.file);

      // 2. Extraire les métadonnées de l'image
      const imageMetadata = await this.extractImageMetadata(input.file.buffer);

      // 3. Uploader vers le cloud storage
      const photoId = uuidv4();
      const uploadResult = await this.storageService.uploadFile(input.file.buffer, {
        originalName: input.file.originalname,
        mimeType: input.file.mimetype,
        userId: input.userId,
        type: 'photo',
        tags: ['user-upload'],
      });

      // 4. Créer l'entrée dans la base de données
      const photo = await this.photoRepository.create({
        photoId,
        userId: input.userId,
        originalFilename: input.file.originalname,
        metadata: {
          width: imageMetadata.width,
          height: imageMetadata.height,
          fileSize: input.file.size,
          mimeType: input.file.mimetype,
          format: imageMetadata.format,
          colorSpace: imageMetadata.space,
          orientation: imageMetadata.orientation,
          ...(input.metadata?.cameraInfo && {
            cameraInfo: input.metadata.cameraInfo,
          }),
        },
        storage: {
          originalUrl: uploadResult.publicUrl,
          thumbnailUrl: uploadResult.thumbnailUrl || '',
          cloudPath: uploadResult.path,
          bucket: config.STORAGE_BUCKET,
        },
        processing: {
          status: 'ready',
          thumbnailGenerated: !!uploadResult.thumbnailUrl,
          compressionApplied: false,
        },
        uploadInfo: {
          uploadedAt: new Date(),
          processedAt: new Date(),
          clientIp: input.clientInfo?.ip,
          userAgent: input.clientInfo?.userAgent,
        },
      });

      logger.info('✅ Photo uploadée avec succès', {
        photoId,
        userId: input.userId,
        size: input.file.size,
      });

      return {
        photoId: photo.photoId,
        originalUrl: photo.storage.originalUrl,
        thumbnailUrl: photo.storage.thumbnailUrl,
        metadata: {
          width: photo.metadata.width,
          height: photo.metadata.height,
          fileSize: photo.metadata.fileSize,
          format: photo.metadata.format,
        },
        uploadedAt: photo.uploadInfo.uploadedAt,
      };
    } catch (error: any) {
      logger.error('❌ Erreur upload photo', {
        error: error.message,
        userId: input.userId,
      });
      throw error;
    }
  }

  /**
   * Valide le fichier uploadé
   */
  private validateFile(file: { buffer: Buffer; mimetype: string; size: number }): void {
    // Vérifier la taille
    const maxSize = config.MAX_FILE_SIZE || 10 * 1024 * 1024; // 10MB par défaut
    if (file.size > maxSize) {
      throw new AppError(
        `Fichier trop volumineux. Taille maximale: ${maxSize / 1024 / 1024}MB`,
        413
      );
    }

    // Vérifier le type MIME
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError(
        `Format de fichier non supporté. Formats acceptés: JPG, PNG, HEIC, WebP`,
        422
      );
    }
  }

  /**
   * Extrait les métadonnées de l'image
   */
  private async extractImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    try {
      const metadata = await sharp(buffer).metadata();
      return metadata;
    } catch (error: any) {
      logger.error('❌ Erreur extraction métadonnées image', {
        error: error.message,
      });
      throw new AppError('Impossible de lire les métadonnées de l\'image', 422);
    }
  }
}
