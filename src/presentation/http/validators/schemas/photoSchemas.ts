/**
 * Schémas de validation pour les photos
 */

import Joi from 'joi';

/**
 * Validation des métadonnées de photo lors de l'upload
 */
export const uploadPhotoMetadata = Joi.object({
  captured_at: Joi.date().iso().optional(),
  camera_info: Joi.object({
    make: Joi.string().max(100).optional(),
    model: Joi.string().max(100).optional(),
    focal_length: Joi.string().max(50).optional(),
  }).optional(),
});

/**
 * Validation des paramètres de liste de photos
 */
export const listPhotosQuery = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  status: Joi.string()
    .valid('uploaded', 'processing', 'ready', 'failed')
    .optional(),
  sort_by: Joi.string()
    .valid('createdAt', 'updatedAt', 'fileSize')
    .default('createdAt'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc'),
});

/**
 * Validation de l'ID de photo (UUID)
 */
export const photoIdParam = Joi.object({
  photoId: Joi.string().uuid().required(),
});

/**
 * Export des schémas
 */
export const photoSchemas = {
  uploadPhotoMetadata,
  listPhotosQuery,
  photoIdParam,
};
