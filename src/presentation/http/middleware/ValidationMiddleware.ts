/**
 * Middleware de Validation
 * 
 * Valide les données des requêtes (body, query, params)
 * avec les schémas Joi définis
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../../../config/logger';

/**
 * Type pour définir quoi valider
 */
type ValidationSource = 'body' | 'query' | 'params';

/**
 * Options de validation
 */
interface ValidationOptions {
  abortEarly?: boolean; // Arrêter à la première erreur ou tout valider
  allowUnknown?: boolean; // Autoriser les champs non définis dans le schéma
  stripUnknown?: boolean; // Supprimer les champs non définis
}

/**
 * Créer un middleware de validation
 * 
 * @param schema - Schéma Joi à utiliser
 * @param source - Source des données à valider (body, query, params)
 * @param options - Options de validation
 * @returns Middleware Express
 * 
 * Utilisation:
 * router.post('/login',
 *   validate(authSchemas.createSession, 'body'),
 *   authController.createSession
 * );
 */
export function validate(
  schema: Joi.ObjectSchema,
  source: ValidationSource = 'body',
  options: ValidationOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Options par défaut
    const validationOptions: Joi.ValidationOptions = {
      abortEarly: options.abortEarly ?? false, // Valider tout et retourner toutes les erreurs
      allowUnknown: options.allowUnknown ?? false, // Ne pas autoriser les champs inconnus
      stripUnknown: options.stripUnknown ?? true, // Supprimer les champs inconnus
      convert: true, // Convertir les types si possible
    };

    // Récupérer les données à valider
    const dataToValidate = req[source];

    // Valider
    const { error, value } = schema.validate(dataToValidate, validationOptions);

    if (error) {
      // Formater les erreurs de validation
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      logger.warn('Erreur de validation', {
        source,
        errors,
        url: req.url,
        method: req.method,
      });

      // Répondre avec une erreur 400
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Erreur de validation des données',
          details: errors,
        },
      });
      return;
    }

    // Remplacer les données validées (avec conversions et sans champs inconnus)
    req[source] = value;

    logger.debug('Validation réussie', {
      source,
      url: req.url,
    });

    next();
  };
}

/**
 * Valider plusieurs sources en même temps
 * 
 * @param schemas - Objet avec les schémas pour chaque source
 * @returns Middleware Express
 * 
 * Utilisation:
 * router.put('/user/:id',
 *   validateMultiple({
 *     body: updateUserSchema,
 *     params: userIdParamSchema
 *   }),
 *   userController.update
 * );
 */
export function validateMultiple(schemas: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: any[] = [];

    // Valider chaque source
    for (const [source, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      const { error, value } = schema.validate(req[source as ValidationSource], {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
        convert: true,
      });

      if (error) {
        errors.push(...error.details.map(detail => ({
          source,
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type,
        })));
      } else {
        // Remplacer avec les données validées
        req[source as ValidationSource] = value;
      }
    }

    if (errors.length > 0) {
      logger.warn('Erreur de validation multiple', {
        errors,
        url: req.url,
        method: req.method,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Erreur de validation des données',
          details: errors,
        },
      });
      return;
    }

    logger.debug('Validation multiple réussie', {
      sources: Object.keys(schemas),
      url: req.url,
    });

    next();
  };
}

/**
 * Middleware pour valider les UUIDs dans les paramètres de route
 * 
 * Utilisation:
 * router.get('/user/:userId', validateUUID('userId'), ...)
 */
export function validateUUID(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const errors: any[] = [];

    for (const paramName of paramNames) {
      const value = req.params[paramName];
      
      if (!value) {
        errors.push({
          field: paramName,
          message: `${paramName} est requis`,
        });
      } else if (!uuidRegex.test(value)) {
        errors.push({
          field: paramName,
          message: `${paramName} doit être un UUID valide`,
        });
      }
    }

    if (errors.length > 0) {
      logger.warn('Erreur de validation UUID', {
        errors,
        url: req.url,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Paramètres invalides',
          details: errors,
        },
      });
      return;
    }

    next();
  };
}

// Export par défaut
export default validate;
