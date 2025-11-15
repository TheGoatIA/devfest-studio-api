/**
 * Modèle Session - Sessions d'authentification
 * 
 * Ce modèle gère les sessions JWT des utilisateurs
 * Permet de tracker les connexions et de révoquer les tokens si nécessaire
 */

import { Schema, model, Document, Model } from 'mongoose';

/**
 * Interface pour les méthodes d'instance de Session
 */
export interface ISessionMethods {
  isValid(): boolean;
  isAccessTokenExpired(): boolean;
  isRefreshTokenExpired(): boolean;
  revoke(): void;
  markAsCompromised(): void;
  updateActivity(feature?: string): void;
  renewTokens(
    accessToken: string,
    refreshToken: string,
    accessExpiry: Date,
    refreshExpiry: Date
  ): void;
}

/**
 * Interface pour les méthodes statiques du Session Model
 */
export interface ISessionModel extends Model<ISession, {}, ISessionMethods> {
  findBySessionId(sessionId: string): Promise<ISession | null>;
  findByAccessToken(accessToken: string): Promise<ISession | null>;
  findActiveByUserId(userId: string): Promise<ISession[]>;
  revokeAllByUserId(userId: string): Promise<any>;
  cleanExpired(): Promise<number>;
  deleteOldExpired(daysOld?: number): Promise<number>;
  getStats(): Promise<any>;
}

/**
 * Interface TypeScript pour Session
 */
export interface ISession extends Document, ISessionMethods {
  // Identifiants
  sessionId: string; // UUID unique
  userId: string; // Référence au User
  deviceId: string;

  // Tokens JWT
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: Date;
    refreshTokenExpiry: Date;
  };

  // Informations de l'appareil
  device: {
    platform: 'android' | 'ios';
    version: string;
    model: string;
    appVersion: string;
    fcmToken?: string; // Pour les notifications push
  };

  // Sécurité
  security: {
    ipAddress: string;
    userAgent: string;
    location?: {
      country: string;
      city: string;
      timezone: string;
    };
    isCompromised: boolean;
    lastVerifiedAt: Date;
  };

  // Activité
  activity: {
    lastActiveAt: Date;
    requestCount: number;
    lastRequestAt: Date;
    features: string[]; // Features utilisées pendant la session
  };

  // Statut
  status: 'active' | 'expired' | 'revoked' | 'suspended';

  // Dates
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;

  // Propriétés virtuelles
  durationMinutes: number;
  minutesUntilExpiry: number;
}

/**
 * Schéma Mongoose pour Session
 */
const SessionSchema = new Schema<ISession>(
  {
    // ========== IDENTIFIANTS ==========
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: String,
      required: true,
      index: true, // Pour rechercher toutes les sessions d'un user
    },

    deviceId: {
      type: String,
      required: true,
      index: true,
    },

    // ========== TOKENS ==========
    tokens: {
      accessToken: {
        type: String,
        required: true,
        index: true, // Pour validation rapide
      },
      refreshToken: {
        type: String,
        required: true,
        index: true,
      },
      accessTokenExpiry: {
        type: Date,
        required: true,
      },
      refreshTokenExpiry: {
        type: Date,
        required: true,
      },
    },

    // ========== APPAREIL ==========
    device: {
      platform: {
        type: String,
        enum: ['android', 'ios'],
        required: true,
      },
      version: {
        type: String,
        required: true,
      },
      model: {
        type: String,
        required: true,
      },
      appVersion: {
        type: String,
        required: true,
      },
      fcmToken: {
        type: String, // Token Firebase Cloud Messaging pour notifications
      },
    },

    // ========== SÉCURITÉ ==========
    security: {
      ipAddress: {
        type: String,
        required: true,
      },
      userAgent: {
        type: String,
        required: true,
      },
      location: {
        country: String,
        city: String,
        timezone: String,
      },
      isCompromised: {
        type: Boolean,
        default: false,
      },
      lastVerifiedAt: {
        type: Date,
        default: Date.now,
      },
    },

    // ========== ACTIVITÉ ==========
    activity: {
      lastActiveAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
      requestCount: {
        type: Number,
        default: 0,
      },
      lastRequestAt: {
        type: Date,
        default: Date.now,
      },
      features: {
        type: [String],
        default: [],
      },
    },

    // ========== STATUT ==========
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked', 'suspended'],
      default: 'active',
      index: true,
    },

    // ========== EXPIRATION ==========
    expiresAt: {
      type: Date,
      required: true,
      index: true, // Pour nettoyer les sessions expirées
    },
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

// ========== INDEXES COMPOSÉS ==========

// Index pour rechercher les sessions actives d'un utilisateur
SessionSchema.index({ userId: 1, status: 1, expiresAt: 1 });

// Index pour nettoyer les sessions expirées
SessionSchema.index({ expiresAt: 1, status: 1 });

// Index pour rechercher par access token
SessionSchema.index({ 'tokens.accessToken': 1, status: 1 });

// ========== MÉTHODES D'INSTANCE ==========

/**
 * Vérifier si la session est valide
 */
SessionSchema.methods.isValid = function (): boolean {
  const now = new Date();
  return (
    this.status === 'active' &&
    !this.security.isCompromised &&
    this.expiresAt > now
  );
};

/**
 * Vérifier si le access token est expiré
 */
SessionSchema.methods.isAccessTokenExpired = function (): boolean {
  return new Date() > this.tokens.accessTokenExpiry;
};

/**
 * Vérifier si le refresh token est expiré
 */
SessionSchema.methods.isRefreshTokenExpired = function (): boolean {
  return new Date() > this.tokens.refreshTokenExpiry;
};

/**
 * Révoquer la session
 */
SessionSchema.methods.revoke = function (): void {
  this.status = 'revoked';
};

/**
 * Marquer comme compromise
 */
SessionSchema.methods.markAsCompromised = function (): void {
  this.security.isCompromised = true;
  this.status = 'suspended';
};

/**
 * Mettre à jour l'activité
 */
SessionSchema.methods.updateActivity = function (feature?: string): void {
  this.activity.lastActiveAt = new Date();
  this.activity.lastRequestAt = new Date();
  this.activity.requestCount += 1;

  if (feature && !this.activity.features.includes(feature)) {
    this.activity.features.push(feature);
  }
};

/**
 * Renouveler les tokens
 */
SessionSchema.methods.renewTokens = function (
  accessToken: string,
  refreshToken: string,
  accessExpiry: Date,
  refreshExpiry: Date
): void {
  this.tokens.accessToken = accessToken;
  this.tokens.refreshToken = refreshToken;
  this.tokens.accessTokenExpiry = accessExpiry;
  this.tokens.refreshTokenExpiry = refreshExpiry;
  this.security.lastVerifiedAt = new Date();
};

// ========== MÉTHODES STATIQUES ==========

/**
 * Trouver une session par son ID
 */
SessionSchema.statics.findBySessionId = function (sessionId: string) {
  return this.findOne({ sessionId, status: 'active' });
};

/**
 * Trouver une session par access token
 */
SessionSchema.statics.findByAccessToken = function (accessToken: string) {
  return this.findOne({
    'tokens.accessToken': accessToken,
    status: 'active',
  });
};

/**
 * Trouver toutes les sessions actives d'un utilisateur
 */
SessionSchema.statics.findActiveByUserId = function (userId: string) {
  return this.find({
    userId,
    status: 'active',
    expiresAt: { $gt: new Date() },
  }).sort({ 'activity.lastActiveAt': -1 });
};

/**
 * Révoquer toutes les sessions d'un utilisateur
 */
SessionSchema.statics.revokeAllByUserId = async function (userId: string) {
  return this.updateMany(
    { userId, status: 'active' },
    { $set: { status: 'revoked' } }
  );
};

/**
 * Nettoyer les sessions expirées
 * À appeler périodiquement (ex: via un cron job)
 */
SessionSchema.statics.cleanExpired = async function () {
  const now = new Date();
  const result = await this.updateMany(
    {
      $or: [
        { expiresAt: { $lt: now } },
        { 'tokens.refreshTokenExpiry': { $lt: now } },
      ],
      status: 'active',
    },
    { $set: { status: 'expired' } }
  );

  return result.modifiedCount;
};

/**
 * Supprimer les anciennes sessions expirées (cleanup)
 */
SessionSchema.statics.deleteOldExpired = async function (daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    status: { $in: ['expired', 'revoked'] },
    updatedAt: { $lt: cutoffDate },
  });

  return result.deletedCount;
};

/**
 * Obtenir les statistiques des sessions
 */
SessionSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgRequestCount: { $avg: '$activity.requestCount' },
      },
    },
  ]);

  const totalActive = await this.countDocuments({ status: 'active' });
  const totalExpired = await this.countDocuments({ status: 'expired' });
  const totalRevoked = await this.countDocuments({ status: 'revoked' });

  return {
    active: totalActive,
    expired: totalExpired,
    revoked: totalRevoked,
    details: stats,
  };
};

// ========== MIDDLEWARE ==========

/**
 * Avant la sauvegarde, vérifier l'expiration
 */
SessionSchema.pre('save', function (next) {
  // Si la session est nouvelle et n'a pas d'expiresAt, le définir
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = this.tokens.refreshTokenExpiry;
  }

  // Marquer comme expirée si la date est dépassée
  if (this.expiresAt < new Date() && this.status === 'active') {
    this.status = 'expired';
  }

  next();
});

/**
 * Après la sauvegarde, logger l'événement (en développement)
 */
SessionSchema.post('save', function (doc) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Session sauvegardée: ${doc.sessionId} (${doc.status})`);
  }
});

// ========== VIRTUALS ==========

/**
 * Durée de la session en minutes
 */
SessionSchema.virtual('durationMinutes').get(function () {
  const created = this.createdAt.getTime();
  const lastActive = this.activity.lastActiveAt.getTime();
  return Math.round((lastActive - created) / 60000);
});

/**
 * Temps restant avant expiration (en minutes)
 */
SessionSchema.virtual('minutesUntilExpiry').get(function () {
  const now = Date.now();
  const expiry = this.expiresAt.getTime();
  return Math.max(0, Math.round((expiry - now) / 60000));
});

// Permettre l'utilisation des virtuals dans JSON
SessionSchema.set('toJSON', { virtuals: true });
SessionSchema.set('toObject', { virtuals: true });

// ========== CRÉATION DU MODÈLE ==========
export const SessionModel = model<ISession, ISessionModel>('Session', SessionSchema);

// Export par défaut
export default SessionModel;