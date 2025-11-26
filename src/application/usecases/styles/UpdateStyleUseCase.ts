import { IStyleRepository } from '../../../core/interfaces/repositories/IStyleRepository';
import { IStyleDocument } from '../../../infrastructure/database/mongodb/models/StyleModel';
import logger from '../../../config/logger';
import { AppError } from '../../../shared/errors/AppError';

export interface UpdateStyleInput {
    styleId: string;
    name?: string;
    nameFr?: string;
    nameEn?: string;
    category?: 'professional' | 'artistic' | 'tech' | 'creative' | 'thematic';
    description?: string;
    descriptionFr?: string;
    descriptionEn?: string;
    images?: {
        previewUrl?: string;
        thumbnailUrl?: string;
        mediumUrl?: string;
        largeUrl?: string;
        exampleTransformations?: {
            beforeUrl: string;
            afterUrl: string;
            caption?: string;
        }[];
    };
    technical?: {
        modelVersion?: string;
        processingComplexity?: 'low' | 'medium' | 'high';
        estimatedProcessingTime?: number;
        requiredMemory?: number;
        supportedResolutions?: string[];
        gpuRequired?: boolean;
    };
    geminiConfig?: {
        prompt?: string;
        model?: string;
    };
    availability?: {
        isActive?: boolean;
        regions?: string[];
        maintenanceMode?: boolean;
    };
}

export class UpdateStyleUseCase {
    constructor(private styleRepository: IStyleRepository) { }

    async execute(input: UpdateStyleInput): Promise<IStyleDocument> {
        try {
            const { styleId, ...updates } = input;

            const existingStyle = await this.styleRepository.findById(styleId);
            if (!existingStyle) {
                throw new AppError('Style non trouvé', 404);
            }

            const updatedStyle = await this.styleRepository.update(styleId, updates as any);

            if (!updatedStyle) {
                throw new AppError('Erreur lors de la mise à jour du style', 500);
            }

            logger.info('✨ Style mis à jour avec succès', { styleId });

            return updatedStyle;
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('❌ Erreur mise à jour style', { error: error.message });
            throw new AppError('Erreur lors de la mise à jour du style', 500);
        }
    }
}
