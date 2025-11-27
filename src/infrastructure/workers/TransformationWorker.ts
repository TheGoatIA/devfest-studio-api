import { Worker, Job } from 'bullmq';
import logger from '../../config/logger';
import { config } from '../../config/environment';
import { TransformationProcessingService } from '../../application/services/TransformationProcessingService';
import { TransformationRepository } from '../database/repositories/TransformationRepository';
import { PhotoRepository } from '../database/repositories/PhotoRepository';
import { StyleRepository } from '../database/repositories/StyleRepository';
import { LocalStorageService } from '../../application/services/LocalStorageService';
import { AIService } from '../../application/services/AIService';
import { TransformationJobData } from '../../application/services/TransformationQueueService';

export class TransformationWorker {
    private worker: Worker;
    private processingService: TransformationProcessingService;
    private readonly QUEUE_NAME = 'transformations';

    constructor() {
        // Initialiser les dépendances
        const transformationRepository = new TransformationRepository();
        const photoRepository = new PhotoRepository();
        const styleRepository = new StyleRepository();
        const storageService = new LocalStorageService();
        const aiService = new AIService();

        this.processingService = new TransformationProcessingService(
            transformationRepository,
            photoRepository,
            styleRepository,
            storageService,
            aiService
        );

        // Configuration de la connexion Redis
        const connection = {
            host: 'localhost',
            port: 6379,
        };

        if (config.REDIS_URL) {
            try {
                const url = new URL(config.REDIS_URL);
                connection.host = url.hostname;
                connection.port = parseInt(url.port);
            } catch (error) {
                logger.warn('⚠️ URL Redis invalide pour le worker', { error });
            }
        }

        // Créer le worker BullMQ
        this.worker = new Worker<TransformationJobData>(
            this.QUEUE_NAME,
            async (job: Job<TransformationJobData>) => {
                logger.info(`🔨 Worker: Traitement du job ${job.id}`, {
                    transformationId: job.data.transformationId
                });

                await this.processingService.process(
                    job.data.transformationId,
                    job.data.userId,
                    job.data.photoId,
                    job.data.styleId,
                    job.data.customStyle
                );
            },
            {
                connection,
                concurrency: config.QUEUE_CONCURRENCY || 5, // Utiliser la config d'environnement
                limiter: {
                    max: 10, // Max 10 jobs
                    duration: 10000, // Par 10 secondes (Rate Limit global du worker)
                },
            }
        );

        this.setupEventListeners();
        logger.info(`👷 TransformationWorker démarré avec concurrence: ${config.QUEUE_CONCURRENCY || 5}`);
    }

    private setupEventListeners() {
        this.worker.on('completed', (job) => {
            logger.info(`✅ Job ${job.id} terminé avec succès`);
        });

        this.worker.on('failed', (job, err) => {
            logger.error(`❌ Job ${job?.id} a échoué`, { error: err.message });
        });

        this.worker.on('error', (err) => {
            logger.error('❌ Erreur du worker', { error: err.message });
        });
    }

    public async close() {
        await this.worker.close();
    }
}
