import { Queue } from 'bullmq';
import logger from '../../config/logger';
import { config } from '../../config/environment';
import { redisConnection } from '../../config/database/redis';

export interface TransformationJobData {
    transformationId: string;
    userId: string;
    photoId: string;
    styleId?: string;
    customStyle?: any;
}

export class TransformationQueueService {
    private static instance: TransformationQueueService;
    private queue: Queue;
    private readonly QUEUE_NAME = 'transformations';

    private constructor() {
        // Utiliser la connexion Redis existante
        const connection = {
            host: 'localhost', // Par défaut pour dev local sans docker
            port: 6379,
        };

        // Si REDIS_URL est défini (ex: redis://redis:6379), parser l'URL
        if (config.REDIS_URL) {
            try {
                const url = new URL(config.REDIS_URL);
                connection.host = url.hostname;
                connection.port = parseInt(url.port);
            } catch (error) {
                logger.warn('⚠️ URL Redis invalide, utilisation des défauts', { error });
            }
        }

        this.queue = new Queue(this.QUEUE_NAME, {
            connection,
            defaultJobOptions: {
                attempts: 3, // Réessayer 3 fois en cas d'échec
                backoff: {
                    type: 'exponential',
                    delay: 1000, // Attendre 1s, 2s, 4s...
                },
                removeOnComplete: 100, // Garder les 100 derniers succès
                removeOnFail: 500, // Garder les 500 derniers échecs pour debug
            },
        });

        logger.info('🚀 File d\'attente de transformations (BullMQ) initialisée');
    }

    public static getInstance(): TransformationQueueService {
        if (!TransformationQueueService.instance) {
            TransformationQueueService.instance = new TransformationQueueService();
        }
        return TransformationQueueService.instance;
    }

    /**
     * Ajoute une tâche de transformation à la file d'attente Redis
     */
    public async addJob(data: TransformationJobData): Promise<void> {
        try {
            await this.queue.add('transform-image', data, {
                jobId: data.transformationId, // Utiliser l'ID de transformation comme ID de job
                priority: 1,
            });

            const count = await this.queue.count();
            logger.info(`📥 Job ajouté à la queue Redis. Total en attente: ${count}`, {
                transformationId: data.transformationId
            });
        } catch (error) {
            logger.error('❌ Erreur lors de l\'ajout du job à la queue', { error });
            throw error;
        }
    }

    /**
     * Retourne la taille de la file d'attente (attente + actif)
     */
    public async getQueueLength(): Promise<number> {
        return await this.queue.count();
    }

    /**
     * Récupère la queue (pour le worker)
     */
    public getQueue(): Queue {
        return this.queue;
    }
}

export const transformationQueueService = TransformationQueueService.getInstance();
