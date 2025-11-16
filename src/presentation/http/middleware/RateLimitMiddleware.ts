/**
 * Middleware de rate limiting avec Redis
 */

import { Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';
import logger from '../../../config/logger';
import { config } from '../../../config/environment';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

export class RateLimitMiddleware {
  private redisClient: RedisClientType | null = null;
  private isConnected = false;

  constructor() {
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    try {
      this.redisClient = createClient({ url: config.REDIS_URL });
      await this.redisClient.connect();
      this.isConnected = true;
      logger.info('✅ RateLimitMiddleware: Redis connecté');
    } catch (error: any) {
      logger.warn('⚠️  RateLimitMiddleware: Redis non disponible, rate limiting désactivé', {
        error: error.message,
      });
      this.isConnected = false;
    }
  }

  /**
   * Créer un rate limiter
   */
  createRateLimit(config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Si Redis n'est pas connecté, skip le rate limiting
      if (!this.isConnected || !this.redisClient) {
        return next();
      }

      try {
        const key = config.keyGenerator ? config.keyGenerator(req) : this.defaultKeyGenerator(req);

        const windowKey = `ratelimit:${key}:${Math.floor(Date.now() / config.windowMs)}`;

        // Incrémenter le compteur
        const currentCount = await this.redisClient.incr(windowKey);

        // Définir l'expiration pour la première requête
        if (currentCount === 1) {
          await this.redisClient.expire(windowKey, Math.ceil(config.windowMs / 1000));
        }

        // Vérifier la limite
        if (currentCount > config.maxRequests) {
          const resetTime =
            Math.ceil(Date.now() / config.windowMs) * config.windowMs + config.windowMs;

          logger.warn('⚠️  Rate limit exceeded', {
            key,
            currentCount,
            limit: config.maxRequests,
            ip: req.ip,
          });

          return res.status(429).json({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: config.message || 'Trop de requêtes. Veuillez réessayer plus tard.',
              retry_after: Math.ceil((resetTime - Date.now()) / 1000),
              limit: {
                window: `${config.windowMs / 1000}s`,
                max_requests: config.maxRequests,
                current_count: currentCount,
              },
            },
          });
        }

        // Ajouter les headers de rate limit
        res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
        res.setHeader(
          'X-RateLimit-Remaining',
          Math.max(0, config.maxRequests - currentCount).toString()
        );
        res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / config.windowMs + 1).toString());

        next();
      } catch (error: any) {
        logger.error('❌ Erreur rate limit middleware', {
          error: error.message,
        });
        // En cas d'erreur, on laisse passer (fail open)
        next();
      }
    };
  }

  private defaultKeyGenerator(req: Request): string {
    // Utiliser l'userId si disponible, sinon IP
    const user = (req as any).user;
    return user?.userId || req.ip || 'unknown';
  }

  /**
   * Configurations prédéfinies
   */
  static uploadRateLimit(): RateLimitConfig {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10,
      message: "Trop de requêtes d'upload. Veuillez réessayer dans 15 minutes.",
    };
  }

  static transformRateLimit(): RateLimitConfig {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      message: 'Trop de demandes de transformation. Veuillez réessayer dans 15 minutes.',
    };
  }

  static apiRateLimit(): RateLimitConfig {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 200,
      message: 'Trop de requêtes API. Veuillez réessayer dans 15 minutes.',
    };
  }

  static authRateLimit(): RateLimitConfig {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10,
      message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
      keyGenerator: (req: Request) => req.ip || 'unknown',
    };
  }
}

// Export une instance singleton
export const rateLimitMiddleware = new RateLimitMiddleware();
