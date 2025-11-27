/**
 * Index des middlewares
 *
 * Centralise l'export de tous les middlewares de l'application
 */

export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  setupGlobalErrorHandlers,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
} from './ErrorHandlerMiddleware';

export {
  requestLogger,
  requestId,
  bodyParserErrorHandler,
  uploadLogger,
} from './RequestLoggerMiddleware';

export {
  setupSecurityMiddleware,
  additionalSecurityHeaders,
  validateUploadOrigin,
  requestSizeLimit,
  apiRateLimiter,
} from './SecurityMiddleware';

export { authenticate, optionalAuth, AuthenticatedRequest } from './AuthMiddleware';

export { validate, validateMultiple, validateUUID } from './ValidationMiddleware';

// Export par défaut d'un objet contenant tous les middlewares
import errorHandler, { notFoundHandler } from './ErrorHandlerMiddleware';
import requestLogger from './RequestLoggerMiddleware';
import setupSecurityMiddleware from './SecurityMiddleware';
import authenticate from './AuthMiddleware';
import validate from './ValidationMiddleware';

export default {
  errorHandler,
  notFoundHandler,
  requestLogger,
  setupSecurityMiddleware,
  authenticate,
  validate,
};
