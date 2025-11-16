/**
 * Schémas de validation pour les transformations
 */

import Joi from 'joi';

/**
 * Validation pour démarrer une transformation
 */
export const startTransformation = Joi.object({
  photo_id: Joi.string().uuid().required(),
  style_id: Joi.string().uuid().optional(),
  custom_description: Joi.string().min(20).max(500).optional(),
  quality: Joi.string().valid('standard', 'high', 'ultra').default('standard'),
  options: Joi.object({
    enable_notifications: Joi.boolean().default(true),
    auto_save: Joi.boolean().default(true),
    public_sharing: Joi.boolean().default(false),
    preserve_metadata: Joi.boolean().default(true),
  }).default({}),
  priority: Joi.string().valid('normal', 'high').default('normal'),
}).custom((value, helpers) => {
  // Valider qu'au moins un de style_id ou custom_description est fourni
  if (!value.style_id && !value.custom_description) {
    return helpers.error('any.custom', {
      message: 'Either style_id or custom_description is required',
    });
  }

  // Valider qu'on ne peut pas avoir les deux
  if (value.style_id && value.custom_description) {
    return helpers.error('any.custom', {
      message: 'Cannot specify both style_id and custom_description',
    });
  }

  return value;
});

/**
 * Validation de l'ID de transformation (UUID)
 */
export const transformationIdParam = Joi.object({
  id: Joi.string().uuid().required(),
});

/**
 * Export des schémas
 */
export const transformationSchemas = {
  startTransformation,
  transformationIdParam,
};
