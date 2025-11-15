/**
 * Configuration et connexion à Redis
 * 
 * Ce fichier gère :
 * - La connexion au serveur Redis
 * - Le cache des données fréquemment utilisées
 * - Les sessions utilisateurs
 * - Les files d'attente de traitement
 */

import { createClient, RedisClientType } from 'redis';
import logger from '../logger';
import { config } from '../environment';

/**
 * Classe pour gérer la connexion Redis
 */
class RedisConnection {
  private client: RedisClientType | null = null;
  private subscriber: RedisClientType | null = null;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private readonly maxRetries: number = 5;

  /**
   * Établir la connexion à Redis
   */
  async connect(): Promise<void> {
    try {
      logger.info('🔴 Connexion à Redis en cours...');

      // Créer le client principal
      this.client = createClient({
        url: config.REDIS_URL,
        socket: {
          connectTimeout: 10000, // 10 secondes
          reconnectStrategy: (retries) => {
            // Stratégie de reconnexion exponentielle
            if (retries > this.maxRetries) {
              logger.error('❌ Nombre maximum de tentatives Redis atteint');
              return new Error('Trop de tentatives de reconnexion');
            }
            const delay = Math.min(retries * 100, 3000);
            logger.info(`🔄 Reconnexion Redis dans ${delay}ms...`);
            return delay;
          },
        },
      });

      // Créer un client pour les abonnements (pub/sub)
      this.subscriber = this.client.duplicate();

      // Configurer les événements
      this.setupEventListeners();

      // Connexion
      await this.client.connect();
      await this.subscriber.connect();

      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info('✅ Connexion à Redis établie avec succès');

      // Test de connexion
      const pingResponse = await this.client.ping();
      logger.debug('🏓 Redis PING:', { response: pingResponse });

      // Afficher les informations en développement
      if (config.NODE_ENV === 'development') {
        const info = await this.client.info('server');
        const version = info.match(/redis_version:([\d.]+)/)?.[1];
        logger.debug('📊 Redis version:', { version });
      }

    } catch (error) {
      this.isConnected = false;
      this.connectionAttempts++;

      logger.error('❌ Erreur de connexion à Redis', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries,
      });

      // Réessayer la connexion
      if (this.connectionAttempts < this.maxRetries) {
        const retryDelay = this.connectionAttempts * 2000;
        logger.info(`🔄 Nouvelle tentative dans ${retryDelay / 1000}s...`);
        
        setTimeout(() => {
          this.connect();
        }, retryDelay);
      } else {
        logger.error('❌ Impossible de se connecter à Redis');
        throw new Error('Impossible de se connecter à Redis');
      }
    }
  }

  /**
   * Configurer les écouteurs d'événements Redis
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    // Événement : connexion établie
    this.client.on('connect', () => {
      logger.info('🔗 Redis connecté');
    });

    // Événement : prêt à recevoir des commandes
    this.client.on('ready', () => {
      logger.info('✅ Redis prêt');
      this.isConnected = true;
    });

    // Événement : erreur
    this.client.on('error', (error) => {
      logger.error('❌ Erreur Redis', { error: error.message });
      this.isConnected = false;
    });

    // Événement : reconnexion
    this.client.on('reconnecting', () => {
      logger.info('🔄 Redis en cours de reconnexion...');
    });

    // Événement : fin de connexion
    this.client.on('end', () => {
      logger.warn('⚠️  Connexion Redis terminée');
      this.isConnected = false;
    });
  }

  /**
   * Obtenir le client Redis
   */
  getClient(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis client n\'est pas initialisé');
    }
    if (!this.isConnected) {
      throw new Error('Redis n\'est pas connecté');
    }
    return this.client;
  }

  /**
   * Obtenir le client subscriber
   */
  getSubscriber(): RedisClientType {
    if (!this.subscriber) {
      throw new Error('Redis subscriber n\'est pas initialisé');
    }
    return this.subscriber;
  }

  /**
   * Fermer proprement la connexion Redis
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      logger.warn('⚠️  Redis n\'est pas connecté');
      return;
    }

    try {
      if (this.client) {
        await this.client.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      
      this.isConnected = false;
      logger.info('👋 Déconnexion de Redis réussie');
    } catch (error) {
      logger.error('❌ Erreur lors de la déconnexion de Redis', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
      throw error;
    }
  }

  /**
   * Vérifier l'état de la connexion
   */
  isHealthy(): boolean {
    return this.isConnected && this.client?.isOpen === true;
  }

  /**
   * Obtenir des statistiques sur Redis
   */
  async getStats() {
    if (!this.isConnected || !this.client) {
      return { isConnected: false };
    }

    try {
      const dbSize = await this.client.dbSize();
      const memory = await this.client.info('memory');
      
      // Parser la mémoire utilisée
      const usedMemoryMatch = memory.match(/used_memory_human:(.+)/);
      const usedMemory = usedMemoryMatch ? usedMemoryMatch[1].trim() : 'N/A';

      return {
        isConnected: true,
        keysCount: dbSize,
        usedMemory,
        clients: await this.client.clientList(),
      };
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des stats Redis', { error });
      return { isConnected: false, error };
    }
  }

  /**
   * Nettoyer toutes les données Redis (UNIQUEMENT EN DÉVELOPPEMENT)
   * ⚠️ DANGER : Supprime toutes les clés !
   */
  async flushAll(): Promise<void> {
    if (config.NODE_ENV === 'production') {
      throw new Error('❌ Impossible de vider Redis en production !');
    }

    if (!this.client) {
      throw new Error('Redis client n\'est pas initialisé');
    }

    try {
      await this.client.flushAll();
      logger.warn('🗑️  Redis vidé (mode développement)');
    } catch (error) {
      logger.error('❌ Erreur lors du vidage de Redis', { error });
      throw error;
    }
  }

  // =============== MÉTHODES UTILITAIRES POUR LE CACHE ===============

  /**
   * Sauvegarder une valeur dans le cache
   */
  async set(key: string, value: any, expirySeconds?: number): Promise<boolean> {
    try {
      const client = this.getClient();
      const serialized = JSON.stringify(value);
      
      if (expirySeconds) {
        await client.setEx(key, expirySeconds, serialized);
      } else {
        await client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      logger.error('❌ Erreur Redis SET', { key, error });
      return false;
    }
  }

  /**
   * Récupérer une valeur du cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = this.getClient();
      const value = await client.get(key);
      
      if (!value) return null;
      
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('❌ Erreur Redis GET', { key, error });
      return null;
    }
  }

  /**
   * Supprimer une clé
   */
  async del(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('❌ Erreur Redis DEL', { key, error });
      return false;
    }
  }

  /**
   * Vérifier si une clé existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('❌ Erreur Redis EXISTS', { key, error });
      return false;
    }
  }

  /**
   * Incrémenter une valeur
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      const client = this.getClient();
      return await client.incrBy(key, by);
    } catch (error) {
      logger.error('❌ Erreur Redis INCR', { key, error });
      throw error;
    }
  }

  /**
   * Définir l'expiration d'une clé
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const client = this.getClient();
      return (await client.expire(key, seconds)) === 1;
    } catch (error) {
      logger.error('❌ Erreur Redis EXPIRE', { key, error });
      return false;
    }
  }
}

// Instance unique de la connexion Redis (Singleton)
export const redisConnection = new RedisConnection();

// Export par défaut
export default redisConnection;
