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
};
