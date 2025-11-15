/**
 * Middleware de gestion des erreurs
 *
 * Ce middleware capture toutes les erreurs de l'application
 * et les formate de manière cohérente pour le client
 */

import { Request, Response, NextFunction } from 'express';
import logger, { logError } from '../../../config/logger';
import { config } from '../../../config/environment';

/**
 * Classe de base pour les erreurs applicatives
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Maintenir la stack trace correcte
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreurs spécifiques pour différents cas
 */

export class ValidationError extends AppError {
  constructor(message: string, _details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Non authentifié') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Non autorisé') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Ressource') {
    super(`${resource} introuvable`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Trop de requêtes') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, _originalError?: Error) {
    super(`Erreur du service ${service}`, 503, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

/**
 * Interface pour la réponse d'erreur
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
}

/**
 * Formater l'erreur pour l'envoyer au client
 */
function formatErrorResponse(
  error: AppError | Error,
  includeStack: boolean = false
): ErrorResponse {
  const isAppError = error instanceof AppError;

  const response: ErrorResponse = {
    success: false,
    error: {
      code: isAppError ? error.code : 'INTERNAL_ERROR',
      message: error.message || 'Une erreur est survenue',
    },
  };

  // Inclure la stack trace uniquement en développement
  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
}

/**
 * Middleware principal de gestion des erreurs
 * Doit être placé APRÈS toutes les routes
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Logger l'erreur
  logError('Erreur capturée par le middleware', error, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Déterminer le status code
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  // Déterminer si on inclut la stack trace
  const includeStack = config.NODE_ENV === 'development';

  // Formater et envoyer la réponse
  const response = formatErrorResponse(error, includeStack);
  res.status(statusCode).json(response);
}

/**
 * Middleware pour capturer les routes non trouvées (404)
 * Doit être placé AVANT le errorHandler mais APRÈS toutes les routes valides
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Route ${req.method} ${req.url} introuvable`);
  next(error);
}

/**
 * Wrapper pour les fonctions async
 * Évite d'avoir à faire try/catch dans chaque route
 *
 * Utilisation:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsersUseCase.execute();
 *   res.json(users);
 * }));
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Gestion des erreurs non capturées (fallback)
 */
export function setupGlobalErrorHandlers(): void {
  // Promesses rejetées non gérées
  process.on('unhandledRejection', (reason: Error) => {
    logger.error('❌ Promesse rejetée non gérée', {
      error: reason.message,
      stack: reason.stack,
    });

    // En production, on pourrait vouloir arrêter le processus
    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  // Exceptions non capturées
  process.on('uncaughtException', (error: Error) => {
    logger.error('❌ Exception non capturée', {
      error: error.message,
      stack: error.stack,
    });

    // Arrêter le processus car l'état de l'application est incertain
    process.exit(1);
  });
}

// Export par défaut
export default errorHandler;
