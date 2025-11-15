/**
 * Service JWT - Gestion des JSON Web Tokens
 * 
 * Ce service gère :
 * - La génération de tokens (access et refresh)
 * - La validation des tokens
 * - La vérification de l'expiration
 * - Le décodage sécurisé
 */

import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { config } from '../../config/environment';
import logger from '../../config/logger';
import { AuthenticationError } from '../../presentation/http/middleware/ErrorHandlerMiddleware';

/**
 * Interface pour le payload du JWT
 * Contient les informations encodées dans le token
 */
export interface TokenPayload extends JwtPayload {
  userId: string;
  deviceId: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

/**
 * Interface pour la réponse de génération de tokens
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: Date;
  refreshTokenExpiry: Date;
}

/**
 * Classe JWTService pour gérer les tokens
 */
class JWTService {
  private readonly secret: string;
  private readonly accessExpiry: string;
  private readonly refreshExpiry: string;

  constructor() {
    this.secret = config.JWT_SECRET;
    this.accessExpiry = config.JWT_ACCESS_EXPIRY;
    this.refreshExpiry = config.JWT_REFRESH_EXPIRY;
  }

  /**
   * Générer une paire de tokens (access + refresh)
   * 
   * @param userId - ID de l'utilisateur
   * @param deviceId - ID de l'appareil
   * @param sessionId - ID de la session
   * @returns Paire de tokens avec leurs dates d'expiration
   */
  generateTokenPair(userId: string, deviceId: string, sessionId: string): TokenPair {
    try {
      // Générer le token d'accès (courte durée)
      const accessToken = this.generateToken(
        { userId, deviceId, sessionId, type: 'access' },
        this.accessExpiry
      );

      // Générer le token de rafraîchissement (longue durée)
      const refreshToken = this.generateToken(
        { userId, deviceId, sessionId, type: 'refresh' },
        this.refreshExpiry
      );

      // Calculer les dates d'expiration
      const accessTokenExpiry = this.calculateExpiry(this.accessExpiry);
      const refreshTokenExpiry = this.calculateExpiry(this.refreshExpiry);

      logger.debug('Tokens générés', {
        userId,
        sessionId,
        accessExpiry: accessTokenExpiry,
        refreshExpiry: refreshTokenExpiry,
      });

      return {
        accessToken,
        refreshToken,
        accessTokenExpiry,
        refreshTokenExpiry,
      };
    } catch (error) {
      logger.error('Erreur lors de la génération des tokens', { error, userId });
      throw new Error('Impossible de générer les tokens');
    }
  }

  /**
   * Générer un token JWT
   * 
   * @param payload - Données à encoder dans le token
   * @param expiresIn - Durée de validité (ex: '15m', '7d')
   * @returns Token JWT signé
   */
  private generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresIn: any): string {
    const options: SignOptions = {
      expiresIn,
      issuer: 'devfest-studio-api',
      audience: 'devfest-studio-app',
    };

    return jwt.sign(payload, this.secret, options);
  }

  /**
   * Vérifier et décoder un token
   * 
   * @param token - Token JWT à vérifier
   * @returns Payload décodé si le token est valide
   * @throws AuthenticationError si le token est invalide ou expiré
   */
  verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'devfest-studio-api',
        audience: 'devfest-studio-app',
      }) as TokenPayload;

      logger.debug('Token vérifié avec succès', {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        type: decoded.type,
      });

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Token expiré', { error: error.message });
        throw new AuthenticationError('Token expiré');
      }

      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Token invalide', { error: error.message });
        throw new AuthenticationError('Token invalide');
      }

      logger.error('Erreur lors de la vérification du token', { error });
      throw new AuthenticationError('Erreur de vérification du token');
    }
  }

  /**
   * Décoder un token sans le vérifier (attention : non sécurisé)
   * Utile uniquement pour extraire des informations non sensibles
   * 
   * @param token - Token JWT à décoder
   * @returns Payload décodé ou null
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded;
    } catch (error) {
      logger.warn('Impossible de décoder le token', { error });
      return null;
    }
  }

  /**
   * Vérifier si un token est expiré sans lever d'exception
   * 
   * @param token - Token JWT à vérifier
   * @returns true si expiré, false sinon
   */
  isTokenExpired(token: string): boolean {
    try {
      this.verifyToken(token);
      return false;
    } catch (error) {
      if (error instanceof AuthenticationError && error.message === 'Token expiré') {
        return true;
      }
      return false;
    }
  }

  /**
   * Extraire le userId d'un token (même s'il est expiré)
   * 
   * @param token - Token JWT
   * @returns userId ou null
   */
  extractUserId(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.userId || null;
  }

  /**
   * Extraire le sessionId d'un token
   * 
   * @param token - Token JWT
   * @returns sessionId ou null
   */
  extractSessionId(token: string): string | null {
    const decoded = this.decodeToken(token);
    return decoded?.sessionId || null;
  }

  /**
   * Vérifier que le token est bien un access token
   * 
   * @param token - Token JWT
   * @returns true si c'est un access token
   */
  isAccessToken(token: string): boolean {
    const decoded = this.decodeToken(token);
    return decoded?.type === 'access';
  }

  /**
   * Vérifier que le token est bien un refresh token
   * 
   * @param token - Token JWT
   * @returns true si c'est un refresh token
   */
  isRefreshToken(token: string): boolean {
    const decoded = this.decodeToken(token);
    return decoded?.type === 'refresh';
  }

  /**
   * Calculer la date d'expiration à partir d'une durée
   * 
   * @param expiresIn - Durée (ex: '15m', '7d')
   * @returns Date d'expiration
   */
  private calculateExpiry(expiresIn: string): Date {
    const now = new Date();
    const value = parseInt(expiresIn.slice(0, -1), 10);
    const unit = expiresIn.slice(-1);

    switch (unit) {
      case 's': // secondes
        return new Date(now.getTime() + value * 1000);
      case 'm': // minutes
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h': // heures
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd': // jours
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        // Par défaut, considérer comme des secondes
        return new Date(now.getTime() + parseInt(expiresIn, 10) * 1000);
    }
  }

  /**
   * Obtenir le temps restant avant expiration (en secondes)
   * 
   * @param token - Token JWT
   * @returns Secondes restantes ou -1 si expiré/invalide
   */
  getTimeUntilExpiry(token: string): number {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return -1;
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = decoded.exp - now;
    
    return Math.max(0, remaining);
  }

  /**
   * Générer un token temporaire pour des actions spéciales
   * (ex: reset password, email verification)
   * 
   * @param payload - Données à encoder
   * @param expiresIn - Durée de validité
   * @returns Token temporaire
   */
  generateTemporaryToken(payload: Record<string, any> ): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: "1h",
      issuer: 'devfest-studio-api',
      audience: 'devfest-studio-client',
    });
  }

  /**
   * Vérifier un token temporaire
   * 
   * @param token - Token temporaire
   * @returns Payload décodé
   */
  verifyTemporaryToken(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new AuthenticationError('Token temporaire invalide ou expiré');
    }
  }
}

// Instance unique du service (Singleton)
export const jwtService = new JWTService();

// Export par défaut
export default jwtService;
