/**
 * Middleware d'Authentification
 * 
 * Protège les routes en vérifiant que l'utilisateur est authentifié
 * Utilise le ValidateSessionUseCase pour valider la session
 */

import { Request, Response, NextFunction } from 'express';
import { validateSessionUseCase } from '../../../application/usecases/auth/ValidateSessionUseCase';
import logger from '../../../config/logger';
import { AuthenticationError } from './ErrorHandlerMiddleware';

/**
 * Interface pour étendre Request avec les infos utilisateur
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    sessionId: string;
    deviceId: string;
  };
}

/**
 * Middleware d'authentification
 * À utiliser sur toutes les routes qui nécessitent une authentification
 * 
 * Utilisation:
 * router.get('/protected', authenticate, (req: AuthenticatedRequest, res) => {
 *   const userId = req.user.userId;
 *   ...
 * });
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Extraire le token de l'header Authorization
    const token = extractToken(req);

    if (!token) {
      logger.warn('Tentative d\'accès sans token', {
        url: req.url,
        method: req.method,
        ip: req.ip,
      });

      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Token d\'authentification requis',
        },
      });
      return;
    }

    // 2. Valider la session avec le use case
    const session = await validateSessionUseCase.execute({
      accessToken: token,
    });

    // 3. Attacher les informations utilisateur à la requête
    req.user = {
      userId: session.userId,
      sessionId: session.sessionId,
      deviceId: session.deviceId,
    };

    logger.debug('Requête authentifiée', {
      userId: session.userId,
      sessionId: session.sessionId,
      url: req.url,
    });

    // 4. Continuer vers le prochain middleware
    next();
  } catch (error) {
    // Erreur d'authentification
    if (error instanceof AuthenticationError) {
      logger.warn('Échec d\'authentification', {
        error: error.message,
        url: req.url,
        method: req.method,
        ip: req.ip,
      });

      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: error.message,
        },
      });
      return;
    }

    // Autre erreur
    logger.error('Erreur lors de l\'authentification', {
      error,
      url: req.url,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erreur lors de l\'authentification',
      },
    });
  }
}

/**
 * Middleware d'authentification optionnel
 * Authentifie si un token est présent, sinon continue quand même
 * 
 * Utilisation:
 * router.get('/optional', optionalAuth, (req: AuthenticatedRequest, res) => {
 *   if (req.user) {
 *     // Utilisateur authentifié
 *   } else {
 *     // Utilisateur anonyme
 *   }
 * });
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      // Pas de token, continuer sans authentification
      return next();
    }

    // Essayer de valider
    const session = await validateSessionUseCase.execute({
      accessToken: token,
    });

    req.user = {
      userId: session.userId,
      sessionId: session.sessionId,
      deviceId: session.deviceId,
    };

    next();
  } catch (error) {
    // En cas d'erreur, continuer sans authentification
    logger.debug('Auth optionnelle échouée, continuation sans auth', { error });
    next();
  }
}

/**
 * Extraire le token de l'header Authorization
 * 
 * Formats supportés:
 * - Authorization: Bearer <token>
 * - Authorization: <token>
 * 
 * @param req - Requête Express
 * @returns Token ou null
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Format: "Bearer token"
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Format: "token" (sans Bearer)
  return authHeader;
}

/**
 * Middleware pour vérifier les permissions (à implémenter selon vos besoins)
 * 
 * Exemple:
 * function requirePremium(req: AuthenticatedRequest, res: Response, next: NextFunction) {
 *   if (!req.user.isPremium) {
 *     return res.status(403).json({ error: 'Premium requis' });
 *   }
 *   next();
 * }
 */

// Export par défaut
export default authenticate;
