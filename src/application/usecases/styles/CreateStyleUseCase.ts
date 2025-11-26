import { IStyleRepository } from '../../../core/interfaces/repositories/IStyleRepository';
import { IStyleDocument } from '../../../infrastructure/database/mongodb/models/StyleModel';
import logger from '../../../config/logger';
import { AppError } from '../../../shared/errors/AppError';
import { v4 as uuidv4 } from 'uuid';

export interface CreateStyleInput {
    name: string;
    nameFr: string;
    nameEn: string;
    category: 'professional' | 'artistic' | 'tech' | 'creative' | 'thematic';
    description: string;
    descriptionFr: string;
    descriptionEn: string;
    images: {
        previewUrl: string;
        thumbnailUrl: string;
        mediumUrl: string;
        largeUrl: string;
    };
    technical: {
        modelVersion: string;
        processingComplexity: 'low' | 'medium' | 'high';
        estimatedProcessingTime: number;
        requiredMemory: number;
    };
    geminiConfig: {
        prompt: string;
        model: string;
    };
    createdBy?: string;
}

export class CreateStyleUseCase {
    constructor(private styleRepository: IStyleRepository) { }

    async execute(input: CreateStyleInput): Promise<IStyleDocument> {
        try {
            const styleId = uuidv4();

            const styleData: Partial<IStyleDocument> = {
                styleId,
                technical: {
                    ...input.technical,
                    supportedResolutions: ['1024x1024'],
                    gpuRequired: false
                },
                images: {
                    ...input.images,
                    exampleTransformations: []
                },
                tags: [],
                pricing: {
                    isPremium: false,
                    tier: 'free'
                },
                metrics: {
                    popularity: 0,
                    usageCount: 0,
                    averageRating: 0,
                    ratingCount: 0,
                    successRate: 1
                },
                availability: {
                    isActive: true,
                    regions: ['all'],
                    maintenanceMode: false
                },
                createdBy: input.createdBy || 'system',
            };

            const style = await this.styleRepository.create(styleData);

            logger.info('✨ Style créé avec succès', { styleId: style.styleId });

            return style;
        } catch (error: any) {
            logger.error('❌ Erreur création style', { error: error.message });
            throw new AppError('Erreur lors de la création du style', 500);
        }
    }
}
