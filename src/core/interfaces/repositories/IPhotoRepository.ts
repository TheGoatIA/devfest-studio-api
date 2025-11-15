/**
 * Interface du repository Photo
 */

import { IPhotoDocument } from '../../../infrastructure/database/mongodb/models/PhotoModel';

export interface IPhotoRepository {
  /**
   * Créer une nouvelle photo
   */
  create(photoData: Partial<IPhotoDocument>): Promise<IPhotoDocument>;

  /**
   * Trouver une photo par ID
   */
  findById(photoId: string): Promise<IPhotoDocument | null>;

  /**
   * Trouver une photo par ID et userId (sécurité)
   */
  findByIdAndUser(photoId: string, userId: string): Promise<IPhotoDocument | null>;

  /**
   * Lister les photos d'un utilisateur
   */
  findByUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ photos: IPhotoDocument[]; total: number }>;

  /**
   * Mettre à jour une photo
   */
  update(photoId: string, updates: Partial<IPhotoDocument>): Promise<IPhotoDocument | null>;

  /**
   * Supprimer une photo
   */
  delete(photoId: string): Promise<boolean>;

  /**
   * Supprimer les photos expirées
   */
  deleteExpired(): Promise<number>;

  /**
   * Compter les photos d'un utilisateur
   */
  countByUser(userId: string): Promise<number>;

  /**
   * Marquer une photo comme prête
   */
  markAsReady(photoId: string): Promise<IPhotoDocument | null>;

  /**
   * Marquer une photo comme échouée
   */
  markAsFailed(photoId: string): Promise<IPhotoDocument | null>;
}
