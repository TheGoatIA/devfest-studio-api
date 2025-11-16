/**
 * Schémas de validation pour la galerie
 */

import Joi from 'joi';

/**
 * Validation des query params pour la galerie
 */
export const getGalleryQuery = Joi.object({
  status: Joi.string().valid('queued', 'processing', 'completed', 'failed', 'cancelled').optional(),
  style_category: Joi.string()
    .valid('professional', 'artistic', 'tech', 'creative', 'thematic')
    .optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  favorites_only: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort_by: Joi.string()
    .valid('createdAt', 'completedAt', 'likeCount', 'viewCount')
    .default('createdAt'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc'),
});

/**
 * Validation pour ajouter aux favoris
 */
export const addToFavorites = Joi.object({
  transformation_id: Joi.string().uuid().required(),
});

/**
 * Validation du paramètre transformationId
 */
export const transformationIdParam = Joi.object({
  transformationId: Joi.string().uuid().required(),
});

/**
 * Export des schémas
 */
export const gallerySchemas = {
  getGalleryQuery,
  addToFavorites,
  transformationIdParam,
};
