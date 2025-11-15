/**
 * Interface du repository Style
 */

import { IStyleDocument } from '../../../infrastructure/database/mongodb/models/StyleModel';

export interface StyleFilters {
  category?: string;
  popular?: boolean;
  featured?: boolean;
  search?: string;
  isPremium?: boolean;
  tier?: string;
  tags?: string[];
}

export interface StyleQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IStyleRepository {
  /**
   * Créer un nouveau style
   */
  create(styleData: Partial<IStyleDocument>): Promise<IStyleDocument>;

  /**
   * Trouver un style par ID
   */
  findById(styleId: string): Promise<IStyleDocument | null>;

  /**
   * Lister les styles avec filtres
   */
  find(
    filters?: StyleFilters,
    options?: StyleQueryOptions
  ): Promise<{ styles: IStyleDocument[]; total: number }>;

  /**
   * Récupérer les styles populaires
   */
  findPopular(limit?: number): Promise<IStyleDocument[]>;

  /**
   * Rechercher des styles par texte
   */
  search(query: string, limit?: number): Promise<IStyleDocument[]>;

  /**
   * Mettre à jour un style
   */
  update(styleId: string, updates: Partial<IStyleDocument>): Promise<IStyleDocument | null>;

  /**
   * Supprimer un style
   */
  delete(styleId: string): Promise<boolean>;

  /**
   * Incrémenter le compteur d'usage d'un style
   */
  incrementUsage(styleId: string): Promise<void>;

  /**
   * Récupérer les styles par catégorie
   */
  findByCategory(
    category: string,
    options?: StyleQueryOptions
  ): Promise<IStyleDocument[]>;

  /**
   * Compter les styles
   */
  count(filters?: StyleFilters): Promise<number>;
}
