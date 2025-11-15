/**
 * Middleware pour logger les requêtes HTTP
 * 
 * Ce middleware enregistre toutes les requêtes entrantes avec :
 * - Méthode HTTP
 * - URL
 * - Status code de la réponse
 * - Temps de traitement
 * - IP du client
 */

import { Request, Response, NextFunction } from 'express';
import logger, { logRequest } from '../../../config/logger';
import { config } from '../../../config/environment';

/**
 * Interface pour les informations de requête
 */
interface RequestInfo {
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Middleware pour logger les requêtes
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Vérifier si le logging des requêtes est activé
  if (!config.ENABLE_REQUEST_LOGGING) {
    return next();
  }

  // Informations de la requête
  const requestInfo: RequestInfo = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent'),
    timestamp: new Date(),
  };

  // Timestamp de début pour calculer la durée
  const startTime = Date.now();

  // Logger la requête entrante (en mode debug)
  if (config.LOG_LEVEL === 'debug') {
    logger.debug('➡️  Requête entrante', {
      method: requestInfo.method,
      url: requestInfo.url,
      ip: requestInfo.ip,
      headers: req.headers,
    });
  }

  // Intercepter la fin de la réponse
  const originalSend = res.send;
  res.send = function (data): Response {
    // Calculer la durée de traitement
    const duration = Date.now() - startTime;
    
    logRequest(
      requestInfo.method,
      requestInfo.url,
      res.statusCode,
      duration
    );

    // Logger les détails en mode debug
    if (config.LOG_LEVEL === 'debug') {
      logger.debug('⬅️  Réponse envoyée', {
        method: requestInfo.method,
        url: requestInfo.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length'),
      });
    }

    // Logger les requêtes lentes (> 1 seconde)
    if (duration > 1000) {
      logger.warn('🐌 Requête lente détectée', {
        method: requestInfo.method,
        url: requestInfo.url,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }

    // Appeler la fonction send originale
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Middleware pour ajouter un identifiant unique à chaque requête
 * Utile pour tracer les requêtes dans les logs
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  // Générer un ID unique (ou utiliser celui fourni par un load balancer)
  const id = req.get('X-Request-ID') || generateRequestId();
  
  // Ajouter l'ID à la requête et à la réponse
  (req as any).requestId = id;
  res.set('X-Request-ID', id);
  
  next();
}

/**
 * Générer un ID de requête simple
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware pour logger les erreurs de parsing du body
 */
export function bodyParserErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error) {
    logger.error('❌ Erreur de parsing du body', {
      error: error.message,
      url: req.url,
      method: req.method,
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Le corps de la requête n\'est pas un JSON valide',
      },
    });
    return;
  }

  next();
}

/**
 * Middleware pour logger les uploads de fichiers
 */
export function uploadLogger(req: Request, _res: Response, next: NextFunction): void {
  if (req.file || req.files) {
    logger.info('📤 Upload de fichier détecté', {
      url: req.url,
      method: req.method,
      file: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      } : undefined,
      filesCount: req.files ? Object.keys(req.files).length : 0,
    });
  }

  next();
}

// Export par défaut
export default requestLogger;
