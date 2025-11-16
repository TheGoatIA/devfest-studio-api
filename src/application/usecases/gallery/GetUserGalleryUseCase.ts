/**
 * Use Case: Récupérer la galerie d'un utilisateur
 */

import { ITransformationRepository } from '../../../core/interfaces/repositories/ITransformationRepository';
import logger from '../../../config/logger';
import { AppError } from '../../../shared/errors/AppError';

export interface GetUserGalleryInput {
  userId: string;
  filters?: {
    status?: string;
    styleCategory?: string;
    dateFrom?: Date;
    dateTo?: Date;
    favoritesOnly?: boolean;
  };
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

export interface GalleryItem {
  transformation: {
    id: string;
    transformedImageUrl?: string;
    thumbnailUrl?: string;
    style?: {
      id: string;
      name: string;
      category: string;
    };
    status: string;
    createdAt: Date;
    completedAt?: Date;
  };
  isFavorite: boolean;
  isPublic: boolean;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  downloadCount: number;
}

export interface GetUserGalleryOutput {
  items: GalleryItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrevious: boolean;
    perPage: number;
  };
  filtersApplied: any;
}

export class GetUserGalleryUseCase {
  constructor(private transformationRepository: ITransformationRepository) {}

  async execute(input: GetUserGalleryInput): Promise<GetUserGalleryOutput> {
    try {
      const page = input.pagination?.page || 1;
      const limit = input.pagination?.limit || 20;
      const offset = (page - 1) * limit;

      // Construire les options de filtre
      const options: any = {
        limit,
        offset,
        sortBy: input.pagination?.sortBy || 'createdAt',
        sortOrder: input.pagination?.sortOrder || 'desc',
      };

      if (input.filters?.status) {
        options.status = input.filters.status;
      }

      // Récupérer les transformations
      const { transformations, total } = await this.transformationRepository.findByUser(
        input.userId,
        options
      );

      // Filtrer par favoris si demandé
      let filteredTransformations = transformations;
      if (input.filters?.favoritesOnly) {
        filteredTransformations = transformations.filter((t) => t.social.isFavorite);
      }

      // Mapper les données
      const items: GalleryItem[] = filteredTransformations.map((t) => ({
        transformation: {
          id: t.transformationId,
          transformedImageUrl: t.result?.transformedImageUrl,
          thumbnailUrl: t.result?.transformedImages?.thumbnail,
          style: t.styleId
            ? {
                id: t.styleId,
                name: 'Style', // À enrichir avec les données du style
                category: 'unknown',
              }
            : undefined,
          status: t.processing.status,
          createdAt: t.createdAt,
          completedAt: t.processing.completedAt,
        },
        isFavorite: t.social.isFavorite,
        isPublic: t.social.isPublic,
        viewCount: t.social.viewCount,
        likeCount: t.social.likeCount,
        shareCount: t.social.shareCount,
        downloadCount: t.social.downloadCount,
      }));

      const totalPages = Math.ceil(total / limit);

      logger.info('🖼️  Galerie utilisateur récupérée', {
        userId: input.userId,
        count: items.length,
        total,
      });

      return {
        items,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
          perPage: limit,
        },
        filtersApplied: input.filters || {},
      };
    } catch (error: any) {
      logger.error('❌ Erreur récupération galerie utilisateur', {
        error: error.message,
        userId: input.userId,
      });

      throw new AppError('Erreur lors de la récupération de la galerie', 500);
    }
  }
}
