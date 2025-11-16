/**
 * Configuration du système de logs avec Winston
 *
 * Ce fichier configure Winston pour :
 * - Logger les informations importantes de l'application
 * - Créer des fichiers de logs séparés par niveau (error, combined)
 * - Formater les logs de manière lisible et structurée
 * - Afficher des logs colorés en développement
 */

import winston from 'winston';
import path from 'path';

// Type pour les niveaux de logs
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Définition des niveaux de logs par ordre d'importance
 * error: Erreurs critiques nécessitant une attention immédiate
 * warn: Avertissements sur des situations anormales
 * info: Informations générales sur le fonctionnement
 * debug: Informations détaillées pour le débogage
 */
const levels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Couleurs associées à chaque niveau de log
 * Utilisées uniquement en mode développement pour faciliter la lecture
 */
const colors: Record<LogLevel, string> = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Associer les couleurs à Winston
winston.addColors(colors);

/**
 * Format personnalisé pour les logs
 * Inclut : timestamp, niveau, message, et données additionnelles
 */
const logFormat = winston.format.combine(
  // Ajouter un timestamp au format ISO
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),

  // Capturer les erreurs avec leur stack trace
  winston.format.errors({ stack: true }),

  // Convertir les objets en JSON lisible
  winston.format.json(),

  // Format final du message
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;

    // Message de base avec timestamp et niveau
    let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    // Ajouter les métadonnées s'il y en a
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

/**
 * Format pour la console en mode développement
 * Plus coloré et lisible pour le développeur
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let log = `${timestamp} ${level}: ${message}`;

    // Afficher les métadonnées de manière plus compacte en console
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    return log;
  })
);

/**
 * Création du dossier logs s'il n'existe pas
 */
const logsDir = path.join(process.cwd(), 'logs');

/**
 * Configuration du logger Winston
 */
const logger = winston.createLogger({
  // Niveau de log par défaut (peut être surchargé par la variable d'environnement)
  level: process.env.LOG_LEVEL || 'info',

  // Niveaux personnalisés
  levels,

  // Format des logs
  format: logFormat,

  // Destinations des logs (transports)
  transports: [
    // 1. Fichier pour toutes les erreurs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5, // Garder 5 fichiers maximum
    }),

    // 2. Fichier pour tous les logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],

  // Options supplémentaires
  exitOnError: false, // Ne pas quitter en cas d'erreur de log
});

/**
 * En mode développement, ajouter aussi les logs dans la console
 * avec des couleurs pour faciliter la lecture
 */
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

/**
 * Fonction helper pour logger les requêtes HTTP
 * Utile pour tracer toutes les requêtes entrantes
 */
export const logRequest = (method: string, url: string, statusCode: number, duration: number) => {
  logger.info('Requête HTTP', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
  });
};

/**
 * Fonction helper pour logger les erreurs avec contexte
 */
export const logError = (message: string, error: Error, context?: Record<string, any>) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};

/**
 * Fonction helper pour logger les événements importants
 */
export const logEvent = (event: string, data?: Record<string, any>) => {
  logger.info(`Événement: ${event}`, data);
};

// Export du logger par défaut
export default logger;
