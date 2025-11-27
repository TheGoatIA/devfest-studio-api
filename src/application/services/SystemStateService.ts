/**
 * Service pour gérer l'état du système (Maintenance, etc.)
 */
import logger from '../../config/logger';

export class SystemStateService {
    private static instance: SystemStateService;
    private isMaintenanceMode: boolean = false;

    private constructor() { }

    public static getInstance(): SystemStateService {
        if (!SystemStateService.instance) {
            SystemStateService.instance = new SystemStateService();
        }
        return SystemStateService.instance;
    }

    public setMaintenanceMode(enabled: boolean): void {
        this.isMaintenanceMode = enabled;
        logger.info(`🔧 Mode maintenance ${enabled ? 'activé' : 'désactivé'}`);
    }

    public isMaintenance(): boolean {
        return this.isMaintenanceMode;
    }
}

export const systemStateService = SystemStateService.getInstance();
