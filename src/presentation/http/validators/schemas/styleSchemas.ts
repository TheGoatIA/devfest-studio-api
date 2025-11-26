/**
 * Schémas de validation pour les styles
 */

import Joi from 'joi';

/**
 * Validation des query params pour lister les styles
 */
export const getStylesQuery = Joi.object({
  category: Joi.string()
    .valid('professional', 'artistic', 'tech', 'creative', 'thematic')
    .optional(),
  popular: Joi.boolean().optional(),
  featured: Joi.boolean().optional(),
  search: Joi.string().min(2).max(100).optional(),
  limit: Joi.number().integer().min(1).max(50).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

/**
 * Validation de l'ID de style (UUID)
 */
export const styleIdParam = Joi.object({
  styleId: Joi.string().uuid().required(),
});

/**
 * Validation de la catégorie
 */
export const categoryParam = Joi.object({
  category: Joi.string()
    .valid('professional', 'artistic', 'tech', 'creative', 'thematic')
    .required(),
});

/**
 * Validation pour style personnalisé
 */
export const validateCustomStyle = Joi.object({
  description: Joi.string().min(20).max(500).required(),
  language: Joi.string().valid('fr', 'en').default('fr'),
});

/**
 * Export des schémas
 */
export const styleSchemas = {
  getStylesQuery,
  styleIdParam,
  categoryParam,
  validateCustomStyle,
  createStyle: Joi.object({
    name: Joi.string().required(),
    nameFr: Joi.string().required(),
    nameEn: Joi.string().required(),
    category: Joi.string()
      .valid('professional', 'artistic', 'tech', 'creative', 'thematic')
      .required(),
    description: Joi.string().required(),
    descriptionFr: Joi.string().required(),
    descriptionEn: Joi.string().required(),
    images: Joi.object({
      previewUrl: Joi.string().uri().required(),
      thumbnailUrl: Joi.string().uri().required(),
      mediumUrl: Joi.string().uri().required(),
      largeUrl: Joi.string().uri().required(),
    }).required(),
    technical: Joi.object({
      modelVersion: Joi.string().required(),
      processingComplexity: Joi.string().valid('low', 'medium', 'high').required(),
      estimatedProcessingTime: Joi.number().required(),
      requiredMemory: Joi.number().required(),
    }).required(),
    geminiConfig: Joi.object({
      prompt: Joi.string().required(),
      model: Joi.string().required(),
    }).required(),
    createdBy: Joi.string().optional(),
  }),

  updateStyle: Joi.object({
    name: Joi.string().optional(),
    nameFr: Joi.string().optional(),
    nameEn: Joi.string().optional(),
    category: Joi.string()
      .valid('professional', 'artistic', 'tech', 'creative', 'thematic')
      .optional(),
    description: Joi.string().optional(),
    descriptionFr: Joi.string().optional(),
    descriptionEn: Joi.string().optional(),
    images: Joi.object({
      previewUrl: Joi.string().uri().optional(),
      thumbnailUrl: Joi.string().uri().optional(),
      mediumUrl: Joi.string().uri().optional(),
      largeUrl: Joi.string().uri().optional(),
    }).optional(),
    technical: Joi.object({
      modelVersion: Joi.string().optional(),
      processingComplexity: Joi.string().valid('low', 'medium', 'high').optional(),
      estimatedProcessingTime: Joi.number().optional(),
      requiredMemory: Joi.number().optional(),
    }).optional(),
    geminiConfig: Joi.object({
      prompt: Joi.string().optional(),
      model: Joi.string().optional(),
    }).optional(),
    availability: Joi.object({
      isActive: Joi.boolean().optional(),
      maintenanceMode: Joi.boolean().optional(),
    }).optional(),
  }),
};
