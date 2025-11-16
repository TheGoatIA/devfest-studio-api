/**
 * Modèle User - Utilisateurs de l'application
 *
 * Ce modèle représente un utilisateur dans la base de données.
 * Chaque utilisateur est identifié par son device_id (approche sans compte)
 */

import { Schema, model, Document, Model } from 'mongoose';

/**
 * Interface pour les méthodes d'instance du User
 */
export interface IUserMethods {
  hasReachedDailyQuota(): boolean;
  resetQuotaIfNeeded(): void;
  incrementQuota(): void;
  updateActivity(): void;
  getRemainingTransformations(): number;
}

/**
 * Interface pour les méthodes statiques du User Model
 */
export interface IUserModel extends Model<IUser, {}, IUserMethods> {
  findByDeviceId(deviceId: string): Promise<IUser | null>;
  findByUserId(userId: string): Promise<IUser | null>;
  getGlobalStats(): Promise<any>;
}

/**
 * Interface TypeScript pour le User
 * Définit la structure des données d'un utilisateur
 */
export interface IUser extends Document, IUserMethods {
  // Identifiants
  userId: string; // UUID unique
  deviceId: string; // ID de l'appareil

  // Informations de l'appareil
  deviceInfo: {
    platform: 'android' | 'ios';
    version: string; // Version de l'OS
    model: string; // Modèle de l'appareil
    appVersion: string; // Version de l'app
  };

  // Préférences utilisateur
  preferences: {
    defaultQuality: 'standard' | 'high' | 'ultra';
    autoSave: boolean;
    notificationsEnabled: boolean;
    language: 'fr' | 'en';
    theme: 'light' | 'dark' | 'system';
  };

  // Abonnement (pour version future)
  subscription: {
    type: 'free' | 'premium';
    startDate?: Date;
    endDate?: Date;
    features: string[];
  };

  // Quota de transformations
  quota: {
    dailyTransformations: number; // Limite quotidienne
    usedToday: number; // Utilisées aujourd'hui
    lastReset: Date; // Dernière réinitialisation
  };

  // Statistiques
  stats: {
    totalTransformations: number;
    completedTransformations: number;
    failedTransformations: number;
    totalProcessingTime: number; // en secondes
    favoriteStyleId?: string;
    favoriteStyleUsage: number;
  };

  // Statut du compte
  status: 'active' | 'suspended' | 'deleted';

  // Dates
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;

  // Propriétés virtuelles
  isPremium: boolean;
  quotaPercentage: number;
}

/**
 * Schéma Mongoose pour User
 */
const UserSchema = new Schema<IUser>(
  {
    // ========== IDENTIFIANTS ==========
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Index pour recherche rapide
    },

    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ========== INFORMATIONS APPAREIL ==========
    deviceInfo: {
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
    },

    // ========== PRÉFÉRENCES ==========
    preferences: {
      defaultQuality: {
        type: String,
        enum: ['standard', 'high', 'ultra'],
        default: 'standard',
      },
      autoSave: {
        type: Boolean,
        default: true,
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
      language: {
        type: String,
        enum: ['fr', 'en'],
        default: 'fr',
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
    },

    // ========== ABONNEMENT ==========
    subscription: {
      type: {
        type: String,
        enum: ['free', 'premium'],
        default: 'free',
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      features: {
        type: [String],
        default: [],
      },
    },

    // ========== QUOTA ==========
    quota: {
      dailyTransformations: {
        type: Number,
        default: 10, // 10 transformations par jour pour les utilisateurs gratuits
      },
      usedToday: {
        type: Number,
        default: 0,
      },
      lastReset: {
        type: Date,
        default: Date.now,
      },
    },

    // ========== STATISTIQUES ==========
    stats: {
      totalTransformations: {
        type: Number,
        default: 0,
      },
      completedTransformations: {
        type: Number,
        default: 0,
      },
      failedTransformations: {
        type: Number,
        default: 0,
      },
      totalProcessingTime: {
        type: Number,
        default: 0,
      },
      favoriteStyleId: {
        type: String,
      },
      favoriteStyleUsage: {
        type: Number,
        default: 0,
      },
    },

    // ========== STATUT ==========
    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active',
      index: true,
    },

    // ========== DATES ==========
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Options du schéma
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
    collection: 'users', // Nom de la collection dans MongoDB
  }
);

// ========== INDEXES ==========
// Index composé pour rechercher les utilisateurs actifs
UserSchema.index({ status: 1, lastActiveAt: -1 });

// Index pour les recherches par plateforme
UserSchema.index({ 'deviceInfo.platform': 1 });

// ========== MÉTHODES D'INSTANCE ==========

/**
 * Vérifier si l'utilisateur a atteint son quota quotidien
 */
UserSchema.methods.hasReachedDailyQuota = function (): boolean {
  return this.quota.usedToday >= this.quota.dailyTransformations;
};

/**
 * Réinitialiser le quota quotidien si nécessaire
 */
UserSchema.methods.resetQuotaIfNeeded = function (): void {
  const now = new Date();
  const lastReset = new Date(this.quota.lastReset);

  // Vérifier si on est un jour différent
  if (
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  ) {
    this.quota.usedToday = 0;
    this.quota.lastReset = now;
  }
};

/**
 * Incrémenter le compteur de transformations utilisées
 */
UserSchema.methods.incrementQuota = function (): void {
  this.quota.usedToday += 1;
};

/**
 * Mettre à jour la dernière activité
 */
UserSchema.methods.updateActivity = function (): void {
  this.lastActiveAt = new Date();
};

/**
 * Obtenir le nombre de transformations restantes
 */
UserSchema.methods.getRemainingTransformations = function (): number {
  return Math.max(0, this.quota.dailyTransformations - this.quota.usedToday);
};

// ========== MÉTHODES STATIQUES ==========

/**
 * Trouver un utilisateur par son deviceId
 */
UserSchema.statics.findByDeviceId = function (deviceId: string) {
  return this.findOne({ deviceId, status: 'active' });
};

/**
 * Trouver un utilisateur par son userId
 */
UserSchema.statics.findByUserId = function (userId: string) {
  return this.findOne({ userId, status: 'active' });
};

/**
 * Obtenir les statistiques globales des utilisateurs
 */
UserSchema.statics.getGlobalStats = async function () {
  const stats = await this.aggregate([
    {
      $match: { status: 'active' },
    },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalTransformations: { $sum: '$stats.totalTransformations' },
        avgTransformationsPerUser: { $avg: '$stats.totalTransformations' },
        iosUsers: {
          $sum: { $cond: [{ $eq: ['$deviceInfo.platform', 'ios'] }, 1, 0] },
        },
        androidUsers: {
          $sum: { $cond: [{ $eq: ['$deviceInfo.platform', 'android'] }, 1, 0] },
        },
      },
    },
  ]);

  return stats[0] || null;
};

// ========== MIDDLEWARE ==========

/**
 * Avant la sauvegarde, vérifier et réinitialiser le quota si nécessaire
 */
UserSchema.pre('save', function (next) {
  // Réinitialiser le quota si on est un nouveau jour
  this.resetQuotaIfNeeded();
  next();
});

/**
 * Après la sauvegarde, logger l'événement (en développement)
 */
UserSchema.post('save', function (doc) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ User sauvegardé: ${doc.userId}`);
  }
});

// ========== VIRTUALS ==========

/**
 * Propriété virtuelle : isPremium
 */
UserSchema.virtual('isPremium').get(function () {
  return this.subscription.type === 'premium';
});

/**
 * Propriété virtuelle : quotaPercentage
 */
UserSchema.virtual('quotaPercentage').get(function () {
  return (this.quota.usedToday / this.quota.dailyTransformations) * 100;
});

// Permettre l'utilisation des virtuals dans JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// ========== CRÉATION DU MODÈLE ==========
export const UserModel = model<IUser, IUserModel>('User', UserSchema);

// Export par défaut
export default UserModel;
