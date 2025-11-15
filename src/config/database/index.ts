/**
 * Index des connexions aux bases de données
 * 
 * Ce fichier centralise l'export de toutes les connexions
 * et fournit une fonction pour initialiser toutes les bases en une fois
 */

import logger from '../logger';
import mongoDBConnection from './mongodb';
import redisConnection from './redis';

/**
 * Initialiser toutes les connexions aux bases de données
 * Cette fonction doit être appelée au démarrage de l'application
 */
export async function initializeDatabases(): Promise<void> {
  try {
    logger.info('🔌 Initialisation des connexions aux bases de données...');

    // Connexion à MongoDB
    await mongoDBConnection.connect();

    // Connexion à Redis
    await redisConnection.connect();

    logger.info('✅ Toutes les bases de données sont connectées');
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation des bases de données', { error });
    throw error;
  }
}

/**
 * Fermer proprement toutes les connexions
 * Cette fonction doit être appelée lors de l'arrêt de l'application
 */
export async function closeDatabases(): Promise<void> {
  try {
    logger.info('🔌 Fermeture des connexions aux bases de données...');

    // Fermer MongoDB
    await mongoDBConnection.disconnect();

    // Fermer Redis
    await redisConnection.disconnect();

    logger.info('✅ Toutes les connexions sont fermées');
  } catch (error) {
    logger.error('❌ Erreur lors de la fermeture des connexions', { error });
    throw error;
  }
}

/**
 * Vérifier la santé de toutes les bases de données
 */
export function checkDatabasesHealth(): {
  mongodb: boolean;
  redis: boolean;
  overall: boolean;
} {
  const mongoHealth = mongoDBConnection.isHealthy();
  const redisHealth = redisConnection.isHealthy();

  return {
    mongodb: mongoHealth,
    redis: redisHealth,
    overall: mongoHealth && redisHealth,
  };
}

/**
 * Obtenir les statistiques de toutes les bases
 */
export async function getDatabasesStats() {
  try {
    const [mongoStats, redisStats] = await Promise.all([
      mongoDBConnection.getStats(),
      redisConnection.getStats(),
    ]);

    return {
      mongodb: mongoStats,
      redis: redisStats,
    };
  } catch (error) {
    logger.error('❌ Erreur lors de la récupération des stats', { error });
    throw error;
  }
}

// Exports individuels
export { mongoDBConnection, redisConnection };

// Export par défaut
export default {
  initialize: initializeDatabases,
  close: closeDatabases,
  checkHealth: checkDatabasesHealth,
  getStats: getDatabasesStats,
  mongodb: {
    connect: mongoDBConnection.connect,
    disconnect: mongoDBConnection.disconnect,
    isHealthy: mongoDBConnection.isHealthy,
    getStats: mongoDBConnection.getStats,
  },
  redis: {
    connect: redisConnection.connect,
    disconnect: redisConnection.disconnect,
    isHealthy: redisConnection.isHealthy,
    getStats: redisConnection.getStats,
  },
};
