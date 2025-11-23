/**
 * Use Case: Démarrer une transformation d'image
 */

import { v4 as uuidv4 } from 'uuid';
import { ITransformationRepository } from '../../../core/interfaces/repositories/ITransformationRepository';
import { IPhotoRepository } from '../../../core/interfaces/repositories/IPhotoRepository';
import { IStyleRepository } from '../../../core/interfaces/repositories/IStyleRepository';
import { IStorageService } from '../../../core/interfaces/services/IStorageService';
import { AIService } from '../../services/AIService';
import { webhookService } from '../../services/WebhookService';
import logger from '../../../config/logger';
import { AppError } from '../../../shared/errors/AppError';
import { NotFoundError } from '../../../shared/errors/NotFoundError';
import axios from 'axios';

export interface StartTransformationInput {
  userId: string;
  photoId: string;
  styleId?: string;
  customDescription?: string;
  quality?: 'standard' | 'high' | 'ultra';
  options?: {
    enableNotifications?: boolean;
    autoSave?: boolean;
    publicSharing?: boolean;
    preserveMetadata?: boolean;
  };
  priority?: 'normal' | 'high';
}

export interface StartTransformationOutput {
  transformationId: string;
  status: string;
  estimatedCompletionTime: Date;
  queuePosition: number;
  createdAt: Date;
}

export class StartTransformationUseCase {
  constructor(
    private transformationRepository: ITransformationRepository,
    private photoRepository: IPhotoRepository,
    private styleRepository: IStyleRepository,
    private storageService: IStorageService,
    private aiService: AIService
  ) {}

  async execute(input: StartTransformationInput): Promise<StartTransformationOutput> {
    try {
      // 1. Valider que photo_id OU custom_description est fourni
      if (!input.styleId && !input.customDescription) {
        throw new AppError(
          'Vous devez fournir soit un styleId soit une description personnalisée',
          400
        );
      }

      if (input.styleId && input.customDescription) {
        throw new AppError(
          'Vous ne pouvez pas fournir à la fois un styleId et une description personnalisée',
          400
        );
      }

      // 2. Vérifier que la photo existe et appartient à l'utilisateur
      const photo = await this.photoRepository.findByIdAndUser(input.photoId, input.userId);

      if (!photo) {
        throw new NotFoundError('Photo non trouvée');
      }

      // 3. Récupérer le style si styleId fourni
      let style = null;
      let customStyle:
        | { description: string; language: 'fr'; generatedPrompt: string; validationScore: number }
        | undefined = undefined;

      if (input.styleId) {
        style = await this.styleRepository.findById(input.styleId);
        if (!style) {
          throw new NotFoundError('Style non trouvé');
        }

        // Incrémenter le compteur d'usage du style
        await this.styleRepository.incrementUsage(input.styleId);
      } else if (input.customDescription) {
        // Valider le style personnalisé
        const validation = await this.aiService.validateCustomStyle(input.customDescription, 'fr');

        if (!validation.isValid) {
          throw new AppError(
            `Description de style invalide: ${validation.warnings.join(', ')}`,
            400
          );
        }

        customStyle = {
          description: input.customDescription,
          language: 'fr' as const,
          generatedPrompt: input.customDescription,
          validationScore: validation.validationScore,
        };
      }

      // 4. Créer la transformation en base
      const transformationId = uuidv4();
      const transformation = await this.transformationRepository.create({
        transformationId,
        userId: input.userId,
        photoId: input.photoId,
        styleId: input.styleId,
        customStyle,
        request: {
          quality: input.quality || 'standard',
          options: {
            enableNotifications: input.options?.enableNotifications ?? true,
            autoSave: input.options?.autoSave ?? true,
            publicSharing: input.options?.publicSharing ?? false,
            preserveMetadata: input.options?.preserveMetadata ?? true,
          },
          priority: input.priority || 'normal',
        },
        processing: {
          status: 'queued',
          progress: 0,
          currentStep: 'uploading',
          queuePosition: 1, // TODO: Calculer la vraie position dans la queue
        },
        metrics: {
          retryCount: 0,
        },
        social: {
          isFavorite: false,
          isPublic: input.options?.publicSharing ?? false,
          viewCount: 0,
          likeCount: 0,
          shareCount: 0,
          downloadCount: 0,
        },
      });

      // 5. Émettre l'événement de démarrage
      await webhookService.transformationStarted(
        transformationId,
        input.userId,
        input.photoId,
        input.styleId || 'custom'
      );

      // 6. Démarrer le traitement asynchrone
      // En production, ceci serait géré par une queue (Bull, BullMQ, etc.)
      this.processTransformationAsync(transformationId, photo, style || customStyle!, input.userId);

      // 7. Calculer le temps estimé
      const estimatedTime = style ? style.technical.estimatedProcessingTime : customStyle ? 60 : 30;
      const estimatedCompletionTime = new Date(Date.now() + estimatedTime * 1000);

      logger.info('🎨 Transformation démarrée', {
        transformationId,
        userId: input.userId,
        photoId: input.photoId,
        styleId: input.styleId,
      });

      return {
        transformationId: transformation.transformationId,
        status: transformation.processing.status,
        estimatedCompletionTime,
        queuePosition: transformation.processing.queuePosition || 1,
        createdAt: transformation.createdAt,
      };
    } catch (error: any) {
      if (error instanceof AppError || error instanceof NotFoundError) {
        throw error;
      }

      logger.error('❌ Erreur démarrage transformation', {
        error: error.message,
        userId: input.userId,
      });

      throw new AppError(`Erreur lors du démarrage de la transformation: ${error.message}`, 500);
    }
  }

  /**
   * Traitement asynchrone de la transformation
   * En production, ceci serait dans un worker séparé
   */
  private async processTransformationAsync(
    transformationId: string,
    photo: any,
    style: any,
    userId: string
  ): Promise<void> {
    try {
      // Mettre à jour le statut
      await this.transformationRepository.updateStatus(transformationId, 'processing', 0.1);

      // Télécharger l'image depuis le storage
      // Pour simplifier, on suppose que photo.storage.originalUrl est accessible
      logger.info('📥 Téléchargement image pour transformation', {
        transformationId,
      });

      // Simuler le téléchargement (en vrai, vous utiliseriez axios ou fetch)
       const imageBuffer = await this.downloadImage(photo.storage.originalUrl);

      // Pour la démo, créer un buffer fictif
      //const imageBuffer = Buffer.from('fake-image-data');

      // Progression: Analyse
      await this.transformationRepository.updateStatus(transformationId, 'processing', 0.3);

      // Appeler l'IA pour la transformation
      logger.info('🤖 Transformation IA en cours', { transformationId });

      const transformResult = await this.aiService.transformImage({
        imageBuffer,
        style,
        quality: 'standard',
      });

      // Progression: Upload résultat
      await this.transformationRepository.updateStatus(transformationId, 'processing', 0.7);

      // Uploader l'image transformée
      const uploadResult = await this.storageService.uploadFile(
        transformResult.transformedImageBuffer,
        {
          originalName: `transformed_${transformationId}.jpg`,
          mimeType: 'image/jpeg',
          userId: photo.userId,
          type: 'transformation',
        }
      );

      // Marquer comme complété
      await this.transformationRepository.markAsCompleted(transformationId, {
        transformedImageUrl: uploadResult.publicUrl,
        transformedImages: {
          thumbnail: uploadResult.thumbnailUrl || '',
          medium: uploadResult.publicUrl,
          large: uploadResult.publicUrl,
          original: uploadResult.publicUrl,
        },
        aiAnalysis: transformResult.analysis,
        metadata: {
          originalResolution: { width: 1920, height: 1080 },
          outputResolution: { width: 1920, height: 1080 },
          fileSize: uploadResult.size,
          format: 'jpeg',
        },
      });

      logger.info('✅ Transformation complétée', { transformationId });

      // Émettre l'événement de complétion
      await webhookService.transformationCompleted(
        transformationId,
        userId,
        photo.photoId,
        style.styleId || 'custom',
        uploadResult.publicUrl
      );
    } catch (error: any) {
      logger.error('❌ Erreur traitement transformation', {
        error: error.message,
        transformationId,
      });

      await this.transformationRepository.markAsFailed(transformationId, {
        code: 'PROCESSING_FAILED',
        message: error.message,
        retryable: true,
      });

      // Émettre l'événement d'échec
      await webhookService.transformationFailed(transformationId, userId, error.message);
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    try {
      logger.info(`📥 Téléchargement de l'image depuis : ${url}`);

      const response = await axios.get(url, {
        responseType: 'arraybuffer', // Très important : demande les données binaires
      });

      // Convertit la réponse en Buffer Node.js
      return Buffer.from(response.data);

    } catch (error: any) {
      logger.error("❌ Échec du téléchargement de l'image", {
        url,
        error: error.message
      });
      throw new AppError(`Impossible de télécharger l'image originale: ${error.message}`, 500);
    }
  }
}
