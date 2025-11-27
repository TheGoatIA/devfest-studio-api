import os from 'os';
import { transformationQueueService } from './TransformationQueueService';
import { TransformationRepository } from '../../infrastructure/database/repositories/TransformationRepository';
import { PhotoRepository } from '../../infrastructure/database/repositories/PhotoRepository';
import { redisConnection } from '../../config/database/redis';
import { systemStateService } from './SystemStateService';
import logger from '../../config/logger';

export class SystemStatsService {
    private transformationRepository: TransformationRepository;
    private photoRepository: PhotoRepository;

    constructor() {
        this.transformationRepository = new TransformationRepository();
        this.photoRepository = new PhotoRepository();
    }

    /**
     * Récupérer toutes les statistiques du système
     */
    public async getStats() {
        try {
            const [
                queueStats,
                dbStats,
                redisStats,
                systemInfo
            ] = await Promise.all([
                this.getQueueStats(),
                this.getDbStats(),
                this.getRedisStats(),
                this.getSystemInfo()
            ]);

            return {
                system: systemInfo,
                database: dbStats,
                queue: queueStats,
                redis: redisStats,
                application: {
                    version: process.env.npm_package_version || '1.0.0',
                    environment: process.env.NODE_ENV || 'development',
                    maintenance: systemStateService.isMaintenance(),
                }
            };
        } catch (error: any) {
            logger.error('❌ Erreur récupération statistiques système', { error: error.message });
            throw error;
        }
    }

    private async getQueueStats() {
        try {
            const queue = transformationQueueService.getQueue();
            const [waiting, active, completed, failed, delayed] = await Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
                queue.getDelayedCount(),
            ]);

            return {
                waiting,
                active,
                completed,
                failed,
                delayed,
                total: waiting + active + completed + failed + delayed
            };
        } catch (error) {
            logger.warn('⚠️ Impossible de récupérer les stats de la queue', { error });
            return { error: 'Queue stats unavailable' };
        }
    }

    private async getDbStats() {
        try {
            const [totalTransformations, transformationsByStatus, totalPhotos] = await Promise.all([
                this.transformationRepository.countTotal(),
                this.transformationRepository.countByStatus(),
                this.photoRepository.countTotal(),
            ]);

            return {
                transformations: {
                    total: totalTransformations,
                    byStatus: transformationsByStatus
                },
                photos: {
                    total: totalPhotos
                }
            };
        } catch (error) {
            logger.warn('⚠️ Impossible de récupérer les stats DB', { error });
            return { error: 'DB stats unavailable' };
        }
    }

    private async getRedisStats() {
        try {
            const stats = await redisConnection.getStats();
            return stats;
        } catch (error) {
            logger.warn('⚠️ Impossible de récupérer les stats Redis', { error });
            return { error: 'Redis stats unavailable' };
        }
    }

    private getSystemInfo() {
        const cpus = os.cpus();
        const loadAvg = os.loadavg();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        return {
            platform: os.platform(),
            arch: os.arch(),
            cpus: cpus.length,
            cpuModel: cpus[0].model,
            loadAverage: loadAvg,
            memory: {
                total: this.formatBytes(totalMem),
                free: this.formatBytes(freeMem),
                used: this.formatBytes(usedMem),
                percentage: Math.round((usedMem / totalMem) * 100)
            },
            uptime: process.uptime(),
            processMemory: this.formatBytes(process.memoryUsage().rss)
        };
    }

    private formatBytes(bytes: number, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

export const systemStatsService = new SystemStatsService();
