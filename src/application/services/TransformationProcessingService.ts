import { ITransformationRepository } from '../../core/interfaces/repositories/ITransformationRepository';
import { IPhotoRepository } from '../../core/interfaces/repositories/IPhotoRepository';
import { IStyleRepository } from '../../core/interfaces/repositories/IStyleRepository';
import { IStorageService } from '../../core/interfaces/services/IStorageService';
import { AIService } from './AIService';
import { webhookService } from './WebhookService';
import logger from '../../config/logger';
import { AppError } from '../../shared/errors/AppError';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import axios from 'axios';

export class TransformationProcessingService {
    constructor(
        private transformationRepository: ITransformationRepository,
        private photoRepository: IPhotoRepository,
        private styleRepository: IStyleRepository,
        private storageService: IStorageService,
        private aiService: AIService
    ) { }

    /**
     * Exécute le traitement d'une transformation
     */
    public async process(
        transformationId: string,
        userId: string,
        photoId: string,
        styleId?: string,
        customStyle?: any
    ): Promise<void> {
        try {
            logger.info('⚙️ Début du traitement de la transformation', { transformationId });

            // 1. Récupérer les données fraîches
            const photo = await this.photoRepository.findByIdAndUser(photoId, userId);
            if (!photo) {
                throw new NotFoundError('Photo non trouvée');
            }

            let style = null;
            if (styleId) {
                style = await this.styleRepository.findById(styleId);
                if (!style) {
                    throw new NotFoundError('Style non trouvé');
                }
            }

            // 2. Mettre à jour le statut
            await this.transformationRepository.updateStatus(transformationId, 'processing', 0.1);

            // 3. Télécharger l'image
            logger.info('📥 Téléchargement image pour transformation', { transformationId });
            const imageBuffer = await this.downloadImage(photo.storage.originalUrl);

            // 4. Progression: Analyse
            await this.transformationRepository.updateStatus(transformationId, 'processing', 0.3);

            // 5. Appeler l'IA
            logger.info('🤖 Transformation IA en cours', { transformationId });
            const transformResult = await this.aiService.transformImage({
                imageBuffer,
                style: style || customStyle,
                quality: 'standard',
            });

            // 6. Progression: Upload résultat
            await this.transformationRepository.updateStatus(transformationId, 'processing', 0.7);

            // 7. Uploader l'image transformée
            const uploadResult = await this.storageService.uploadFile(
                transformResult.transformedImageBuffer,
                {
                    originalName: `transformed_${transformationId}.jpg`,
                    mimeType: 'image/jpeg',
                    userId: photo.userId,
                    type: 'transformation',
                }
            );

            // 8. Marquer comme complété
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

            logger.info('✅ Transformation complétée avec succès', { transformationId });

            // 9. Émettre l'événement de complétion
            await webhookService.transformationCompleted(
                transformationId,
                userId,
                photoId,
                styleId || 'custom',
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

            throw error; // Propager l'erreur pour que BullMQ gère le retry
        }
    }

    private async downloadImage(url: string): Promise<Buffer> {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
            });
            return Buffer.from(response.data);
        } catch (error: any) {
            throw new AppError(`Impossible de télécharger l'image originale: ${error.message}`, 500);
        }
    }
}
