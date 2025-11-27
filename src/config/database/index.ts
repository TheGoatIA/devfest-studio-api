/**
 * Index des connexions aux bases de données
 *
 * Ce fichier centralise l'export de toutes les connexions
 * et fournit une fonction pour initialiser toutes les bases en une fois
 */

import logger from '../logger';
import mongoDBConnection from './mongodb';
import redisConnection from './redis';
import { StyleModel } from '../../infrastructure/database/mongodb/models/StyleModel';
import { styles } from '../../infrastructure/database/seeds/styleData';

/**
 * Seed automatique de la base de données si elle est vide
 */
async function seedDatabase() {
  try {
    const count = await StyleModel.countDocuments();
    if (count === 0) {
      logger.info('🌱 Base de données vide, insertion des styles par défaut...');
      await StyleModel.insertMany(styles);
      logger.info(`✅ Seed automatique terminé : ${styles.length} styles insérés`);
    } else {
      logger.debug(`ℹ️  Base de données déjà initialisée (${count} styles)`);
    }
  } catch (error) {
    logger.error('❌ Erreur lors du seed automatique', { error });
    // On ne bloque pas le démarrage pour ça
  }
}

/**
 * Initialiser toutes les connexions aux bases de données
 * Cette fonction doit être appelée au démarrage de l'application
 * Note: Redis est optionnel - l'application continue sans cache si non disponible
 */
export async function initializeDatabases(): Promise<void> {
  try {
    logger.info('🔌 Initialisation des connexions aux bases de données...');

    // Connexion à MongoDB (obligatoire)
    await mongoDBConnection.connect();
    logger.info('✅ MongoDB connecté');

    // Seed automatique si nécessaire
    await seedDatabase();

    // Connexion à Redis (optionnel - ne bloque pas l'application)
    try {
      await redisConnection.connect();
      if (redisConnection.isHealthy()) {
        logger.info('✅ Redis connecté - Cache activé');
      } else {
        logger.warn('⚠️  Redis non disponible - Mode sans cache');
      }
    } catch (redisError) {
      logger.warn("⚠️  Redis non disponible - L'application continuera sans cache", {
        error: redisError instanceof Error ? redisError.message : 'Erreur inconnue',
      });
      // Ne pas propager l'erreur - continuer sans Redis
    }

    logger.info('✅ Initialisation des bases de données terminée');
  } catch (error) {
    logger.error("❌ Erreur critique lors de l'initialisation des bases de données", { error });
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
    logger.info('✅ MongoDB déconnecté');

    // Fermer Redis (si connecté)
    try {
      if (redisConnection.isHealthy()) {
        await redisConnection.disconnect();
        logger.info('✅ Redis déconnecté');
      } else {
        logger.debug("ℹ️  Redis n'était pas connecté");
      }
    } catch (redisError) {
      logger.warn('⚠️  Erreur lors de la fermeture de Redis (ignorée)', {
        error: redisError instanceof Error ? redisError.message : 'Erreur inconnue',
      });
      // Ne pas propager l'erreur
    }

    logger.info('✅ Toutes les connexions sont fermées');
  } catch (error) {
    logger.error('❌ Erreur lors de la fermeture des connexions', { error });
    throw error;
  }
}

/**
 * Vérifier la santé de toutes les bases de données
 * Note: Seul MongoDB est critique pour la santé globale de l'application
 * Redis est optionnel et son indisponibilité n'affecte pas le statut overall
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
    overall: mongoHealth, // Seul MongoDB est critique
  };
}

/**
 * Obtenir les statistiques de toutes les bases
 */
export async function getDatabasesStats() {
  try {
    const mongoStats = await mongoDBConnection.getStats();

    // Récupérer les stats Redis si disponible
    let redisStats;
    try {
      redisStats = await redisConnection.getStats();
    } catch (redisError) {
      logger.debug('⚠️  Impossible de récupérer les stats Redis', { redisError });
      redisStats = { isConnected: false, error: 'Redis non disponible' };
    }

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
