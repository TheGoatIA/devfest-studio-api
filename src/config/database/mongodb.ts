/**
 * Configuration et connexion à MongoDB avec Mongoose
 *
 * Ce fichier gère :
 * - La connexion à MongoDB
 * - Les événements de connexion/déconnexion
 * - La reconnexion automatique en cas d'erreur
 * - Les indexes pour optimiser les requêtes
 */

import mongoose from 'mongoose';
import logger from '../logger';
import { config } from '../environment';

/**
 * Options de connexion Mongoose
 * Ces options optimisent la connexion et la gestion des erreurs
 */
const mongooseOptions: mongoose.ConnectOptions = {
  // Nom de la base de données
  dbName: config.MONGODB_DB_NAME,

  // Options de connexion
  maxPoolSize: 10, // Nombre maximum de connexions simultanées
  minPoolSize: 2, // Nombre minimum de connexions à maintenir
  socketTimeoutMS: 45000, // Timeout pour les opérations socket
  serverSelectionTimeoutMS: 5000, // Timeout pour sélectionner un serveur

  // Options de retry
  retryWrites: true, // Réessayer automatiquement les écritures échouées
  retryReads: true, // Réessayer automatiquement les lectures échouées
};

/**
 * Classe pour gérer la connexion MongoDB
 */
class MongoDBConnection {
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private readonly maxRetries: number = 5;

  /**
   * Établir la connexion à MongoDB
   */
  async connect(): Promise<void> {
    try {
      logger.info('📦 Connexion à MongoDB en cours...');

      // Désactiver les warnings Mongoose obsolètes
      mongoose.set('strictQuery', false);

      // Événements de connexion
      this.setupEventListeners();

      // Connexion à MongoDB
      await mongoose.connect(config.MONGODB_URI, mongooseOptions);

      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('✅ Connexion à MongoDB établie avec succès');
      logger.info(`📊 Base de données: ${config.MONGODB_DB_NAME}`);

      // Afficher les collections disponibles en développement
      if (config.NODE_ENV === 'development') {
        const collections = await mongoose.connection.db!.listCollections().toArray();
        logger.debug('📋 Collections disponibles:', {
          count: collections.length,
          names: collections.map((c) => c.name),
        });
      }
    } catch (error) {
      this.isConnected = false;
      this.connectionAttempts++;

      logger.error('❌ Erreur de connexion à MongoDB', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries,
      });

      // Réessayer la connexion si on n'a pas atteint le maximum
      if (this.connectionAttempts < this.maxRetries) {
        const retryDelay = this.connectionAttempts * 2000; // Délai croissant
        logger.info(`🔄 Nouvelle tentative dans ${retryDelay / 1000}s...`);

        setTimeout(() => {
          this.connect();
        }, retryDelay);
      } else {
        logger.error("❌ Nombre maximum de tentatives atteint. Arrêt de l'application.");
        throw new Error('Impossible de se connecter à MongoDB');
      }
    }
  }

  /**
   * Configurer les écouteurs d'événements Mongoose
   */
  private setupEventListeners(): void {
    // Événement : connexion établie
    mongoose.connection.on('connected', () => {
      logger.info('🔗 Mongoose connecté à MongoDB');
    });

    // Événement : erreur de connexion
    mongoose.connection.on('error', (error) => {
      logger.error('❌ Erreur Mongoose', { error: error.message });
      this.isConnected = false;
    });

    // Événement : déconnexion
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  Mongoose déconnecté de MongoDB');
      this.isConnected = false;
    });

    // Événement : reconnexion
    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 Mongoose reconnecté à MongoDB');
      this.isConnected = true;
    });

    // Événement : index créé
    mongoose.connection.on('index', (info) => {
      logger.debug('📇 Index créé', { collection: info });
    });
  }

  /**
   * Fermer proprement la connexion MongoDB
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      logger.warn("⚠️  MongoDB n'est pas connecté");
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('👋 Déconnexion de MongoDB réussie');
    } catch (error) {
      logger.error('❌ Erreur lors de la déconnexion de MongoDB', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
      throw error;
    }
  }

  /**
   * Vérifier l'état de la connexion
   */
  isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Obtenir des statistiques sur la connexion
   */
  getStats() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      collections: Object.keys(mongoose.connection.collections).length,
    };
  }

  /**
   * Nettoyer la base de données (UNIQUEMENT EN DÉVELOPPEMENT)
   * ⚠️ DANGER : Supprime toutes les données !
   */
  async dropDatabase(): Promise<void> {
    if (config.NODE_ENV === 'production') {
      throw new Error('❌ Impossible de supprimer la base en production !');
    }

    try {
      await mongoose.connection.dropDatabase();
      logger.warn('🗑️  Base de données supprimée (mode développement)');
    } catch (error) {
      logger.error('❌ Erreur lors de la suppression de la base', { error });
      throw error;
    }
  }
}

// Instance unique de la connexion MongoDB (Singleton)
export const mongoDBConnection = new MongoDBConnection();

// Export de mongoose pour utilisation dans les modèles
export { mongoose };

// Export par défaut
export default mongoDBConnection;
