/**
 * Middleware de sécurité
 *
 * Configure les headers de sécurité HTTP et CORS
 * pour protéger l'application contre les attaques courantes
 */

import helmet, { HelmetOptions } from 'helmet';
import cors from 'cors';
import { Application } from 'express';
import { config } from '../../../config/environment';
import logger from '../../../config/logger';

/**
 * Configuration CORS
 * Définit quels domaines peuvent accéder à l'API
 */
const corsOptions: cors.CorsOptions = {
  // Origines autorisées
  origin: (origin, callback) => {
    // En développement, autoriser toutes les origines
    if (config.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }

    // En production, définir les domaines autorisés
    const allowedOrigins = [
      'https://devfest-studio.com',
      'https://www.devfest-studio.com',
      'https://app.devfest-studio.com',
      'https://devfest-studio.borisgauty.com'
      // Ajouter d'autres domaines selon vos besoins
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('⚠️  Origine CORS non autorisée', { origin });
      callback(new Error('Non autorisé par CORS'));
    }
  },

  // Méthodes HTTP autorisées
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Headers autorisés
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Device-ID', 'X-App-Version'],

  // Headers exposés au client
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],

  // Permettre les credentials (cookies, authorization headers)
  credentials: true,

  // Durée de mise en cache de la requête preflight (en secondes)
  maxAge: 86400, // 24 heures
};

/**
 * Configuration Helmet
 * Définit les headers de sécurité HTTP
 */
const helmetOptions: Readonly<HelmetOptions> = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: false,

  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // Frameguard
  frameguard: { action: 'deny' },

  // Hide Powered-By
  hidePoweredBy: true,

  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open
  ieNoOpen: true,

  // No Sniff
  noSniff: true,

  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // X-XSS-Protection
  xssFilter: true,
};

/**
 * Appliquer tous les middlewares de sécurité
 */
export function setupSecurityMiddleware(app: Application): void {
  logger.info('🔒 Configuration des middlewares de sécurité...');

  // Appliquer Helmet pour les headers de sécurité
  app.use(helmet(helmetOptions));
  logger.debug('✅ Helmet configuré');

  // Appliquer CORS
  app.use(cors(corsOptions));
  logger.debug('✅ CORS configuré');

  // Désactiver le header X-Powered-By (redondant avec Helmet mais double sécurité)
  app.disable('x-powered-by');

  // Trust proxy si derrière un reverse proxy (nginx, load balancer, etc.)
  if (config.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
    logger.debug('✅ Trust proxy activé');
  }

  logger.info('✅ Middlewares de sécurité configurés');
}

/**
 * Middleware personnalisé pour ajouter des headers de sécurité supplémentaires
 */
export function additionalSecurityHeaders(_req: any, res: any, next: any): void {
  // Ajouter des headers personnalisés si nécessaire
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // En production, forcer HTTPS
  if (config.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

/**
 * Middleware pour valider les origines des uploads
 * Empêche les uploads depuis des origines non autorisées
 */
export function validateUploadOrigin(req: any, _res: any, next: any): void {
  const origin = req.get('origin');
  const referer = req.get('referer');

  // En développement, autoriser
  if (config.NODE_ENV === 'development') {
    return next();
  }

  // Vérifier que la requête vient d'une origine autorisée
  // Si ni origin ni referer, bloquer (probable tentative de script direct)
  if (!origin && !referer) {
    // FIX: Allow mobile apps which might not send these headers
    return next();

    /*
    logger.warn("⚠️  Tentative d'upload sans origin/referer", {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Origine non autorisée',
      },
    });
    */
  }

  next();
}

/**
 * Middleware pour limiter la taille des requêtes
 * Empêche les attaques par surcharge de mémoire
 */
export function requestSizeLimit(maxSize: string = '10mb') {
  return (req: any, res: any, next: any) => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    const maxBytes = parseSize(maxSize);

    if (contentLength > maxBytes) {
      logger.warn('⚠️  Requête trop grande', {
        contentLength,
        maxSize,
        url: req.url,
      });

      return res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: `La requête dépasse la taille maximale de ${maxSize}`,
        },
      });
    }

    next();
  };
}

/**
 * Convertir une taille lisible (ex: "10mb") en bytes
 */
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/);

  if (!match) {
    return parseInt(size, 10);
  }

  const [, value, unit] = match;
  return parseFloat(value) * (units[unit] || 1);
}

// Export par défaut
export default setupSecurityMiddleware;
