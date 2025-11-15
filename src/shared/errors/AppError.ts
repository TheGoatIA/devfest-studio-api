/**
 * Classe d'erreur personnalisée pour l'application
 * Permet de créer des erreurs avec un code HTTP et un message personnalisé
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);

    // Maintenir la stack trace appropriée
    Object.setPrototypeOf(this, AppError.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Capturer la stack trace
    Error.captureStackTrace(this, this.constructor);

    // Nom de l'erreur
    this.name = this.constructor.name;
  }
}

/**
 * Erreurs spécifiques de l'application
 */

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, 429);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = 'Quota exceeded') {
    super(message, 402);
  }
}
