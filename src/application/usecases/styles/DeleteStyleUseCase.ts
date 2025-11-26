import { IStyleRepository } from '../../../core/interfaces/repositories/IStyleRepository';
import logger from '../../../config/logger';
import { AppError } from '../../../shared/errors/AppError';

export interface DeleteStyleInput {
    styleId: string;
}

export class DeleteStyleUseCase {
    constructor(private styleRepository: IStyleRepository) { }

    async execute(input: DeleteStyleInput): Promise<void> {
        try {
            const { styleId } = input;

            const existingStyle = await this.styleRepository.findById(styleId);
            if (!existingStyle) {
                throw new AppError('Style non trouvé', 404);
            }

            const deleted = await this.styleRepository.delete(styleId);

            if (!deleted) {
                throw new AppError('Erreur lors de la suppression du style', 500);
            }

            logger.info('🗑️ Style supprimé avec succès', { styleId });
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('❌ Erreur suppression style', { error: error.message });
            throw new AppError('Erreur lors de la suppression du style', 500);
        }
    }
}
