/**
 * Schémas de Validation pour l'Authentification
 *
 * Définit les règles de validation pour toutes les requêtes d'auth
 * Utilise Joi pour une validation stricte et des messages d'erreur clairs
 */

import Joi from 'joi';

/**
 * Schéma pour créer une session
 * POST /api/v1/auth/session
 */
export const createSessionSchema = Joi.object({
  device_id: Joi.string().uuid().required().messages({
    'string.base': 'device_id doit être une chaîne de caractères',
    'string.uuid': 'device_id doit être un UUID valide',
    'any.required': 'device_id est requis',
  }),

  device_info: Joi.object({
    platform: Joi.string().valid('android', 'ios').required().messages({
      'any.only': 'platform doit être "android" ou "ios"',
      'any.required': 'platform est requis',
    }),

    version: Joi.string().required().messages({
      'any.required': 'version est requise',
    }),

    model: Joi.string().required().messages({
      'any.required': 'model est requis',
    }),

    app_version: Joi.string()
      .pattern(/^\d+\.\d+\.\d+$/)
      .required()
      .messages({
        'string.pattern.base': 'app_version doit être au format X.Y.Z (ex: 1.0.0)',
        'any.required': 'app_version est requise',
      }),

    fcm_token: Joi.string().optional().allow(''),
  }).required(),
});

/**
 * Schéma pour rafraîchir les tokens
 * POST /api/v1/auth/refresh
 */
export const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'refresh_token est requis',
    'string.empty': 'refresh_token ne peut pas être vide',
  }),
});

/**
 * Schéma pour la query string de logout
 * DELETE /api/v1/auth/logout?all=true
 */
export const logoutQuerySchema = Joi.object({
  all: Joi.string().valid('true', 'false').optional().default('false'),
});

// Export de tous les schémas
export const authSchemas = {
  createSession: createSessionSchema,
  refreshToken: refreshTokenSchema,
  logoutQuery: logoutQuerySchema,
};

// Export par défaut
export default authSchemas;
