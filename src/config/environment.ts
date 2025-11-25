/**
 * Configuration et validation des variables d'environnement
 *
 * Ce fichier centralise toutes les variables d'environnement nécessaires
 * et les valide au démarrage de l'application pour éviter les erreurs
 */

import dotenv from 'dotenv';
import path from 'path';
import logger from './logger';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

/**
 * Interface définissant toutes les variables d'environnement nécessaires
 * Cela permet d'avoir de l'autocomplétion et de la vérification de types
 */
export interface EnvironmentConfig {
  // Configuration du serveur
  NODE_ENV: 'development' | 'staging' | 'production';
  PORT: number;
  HOST: string;

  // Base de données MongoDB
  MONGODB_URI: string;
  MONGODB_DB_NAME: string;

  // Cache Redis (OPTIONNEL)
  REDIS_URL?: string;

  // Sécurité JWT
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
  ENCRYPTION_KEY: string;

  // Google Cloud (OPTIONNEL - pour Gemini uniquement si besoin)
  GOOGLE_CLOUD_PROJECT_ID?: string;
  GOOGLE_CLOUD_KEY_FILE?: string;
  STORAGE_BUCKET?: string;

  // Gemini AI
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  GEMINI_BASE_URL: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // Configuration des uploads
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string;

  // Logs
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  ENABLE_REQUEST_LOGGING: boolean;

  // Services externes (optionnels)
  NOTIFICATION_SERVICE_URL?: string;
  WEBHOOK_SECRET?: string;
}

/**
 * Fonction pour récupérer une variable d'environnement obligatoire
 * Lance une erreur si la variable n'existe pas
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    // Log available keys to help debugging (without values for security)
    const availableKeys = Object.keys(process.env).join(', ');
    logger.error(`❌ Variable d'environnement manquante: ${key}`);
    logger.debug(`Variables disponibles: ${availableKeys}`);
    
    throw new Error(
      `❌ Variable d'environnement manquante: ${key}\n` + 
      `Veuillez vérifier votre fichier .env ou la configuration Docker.`
    );
  }
  return value;
}

/**
 * Fonction pour récupérer une variable d'environnement optionnelle
 * Retourne undefined si elle n'existe pas
 */
function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * Fonction pour convertir une chaîne en nombre
 * Lance une erreur si la conversion échoue
 */
function parseNumber(value: string, key: string): number {
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`❌ ${key} doit être un nombre valide. Valeur reçue: ${value}`);
  }
  return num;
}

/**
 * Fonction pour convertir une chaîne en booléen
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Validation et construction de la configuration
 * Cette fonction est appelée au démarrage de l'application
 */
export function validateEnvironment(): EnvironmentConfig {
  try {
    logger.info("🔍 Validation des variables d'environnement...");

    // Construction de la configuration
    const config: EnvironmentConfig = {
      // Serveur
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      PORT: parseNumber(process.env.PORT || '8080', 'PORT'),
      HOST: process.env.HOST || '0.0.0.0',

      // MongoDB
      MONGODB_URI: getRequiredEnv('MONGODB_URI'),
      MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'devfest_studio',

      // Redis (OPTIONNEL)
      REDIS_URL: getOptionalEnv('REDIS_URL'),

      // JWT
      JWT_SECRET: getRequiredEnv('JWT_SECRET'),
      JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
      JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
      ENCRYPTION_KEY: getRequiredEnv('ENCRYPTION_KEY'),

      // Google Cloud (OPTIONNEL - utilisé seulement pour Gemini si clé API pas fournie)
      GOOGLE_CLOUD_PROJECT_ID: getOptionalEnv('GOOGLE_CLOUD_PROJECT_ID'),
      GOOGLE_CLOUD_KEY_FILE: getOptionalEnv('GOOGLE_CLOUD_KEY_FILE'),
      STORAGE_BUCKET: process.env.STORAGE_BUCKET || 'devfest-studio-uploads',

      // Gemini AI
      GEMINI_API_KEY: getRequiredEnv('GEMINI_API_KEY'),
      GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-pro-vision',
      GEMINI_BASE_URL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com',

      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: parseNumber(
        process.env.RATE_LIMIT_WINDOW_MS || '900000',
        'RATE_LIMIT_WINDOW_MS'
      ),
      RATE_LIMIT_MAX_REQUESTS: parseNumber(
        process.env.RATE_LIMIT_MAX_REQUESTS || '100',
        'RATE_LIMIT_MAX_REQUESTS'
      ),

      // Upload
      MAX_FILE_SIZE: parseNumber(process.env.MAX_FILE_SIZE || '10485760', 'MAX_FILE_SIZE'),
      ALLOWED_FILE_TYPES:
        process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/heic,image/webp',

      // Logs
      LOG_LEVEL: (process.env.LOG_LEVEL as any) || 'info',
      ENABLE_REQUEST_LOGGING: parseBoolean(process.env.ENABLE_REQUEST_LOGGING, true),

      // Services externes
      NOTIFICATION_SERVICE_URL: getOptionalEnv('NOTIFICATION_SERVICE_URL'),
      WEBHOOK_SECRET: getOptionalEnv('WEBHOOK_SECRET'),
    };

    // Validations supplémentaires
    validateConfig(config);

    logger.info("✅ Variables d'environnement validées avec succès");
    logger.info(`📍 Environnement: ${config.NODE_ENV}`);
    logger.info(`🚀 Port: ${config.PORT}`);

    return config;
  } catch (error) {
    logger.error("❌ Erreur lors de la validation de l'environnement", { error });
    throw error;
  }
}

/**
 * Validations supplémentaires de cohérence
 */
function validateConfig(config: EnvironmentConfig): void {
  // Vérifier que NODE_ENV est valide
  const validEnvs = ['development', 'staging', 'production'];
  if (!validEnvs.includes(config.NODE_ENV)) {
    throw new Error(
      `NODE_ENV doit être l'un de: ${validEnvs.join(', ')}. Valeur reçue: ${config.NODE_ENV}`
    );
  }

  // Vérifier que le port est dans une plage valide
  if (config.PORT < 1 || config.PORT > 65535) {
    throw new Error(`PORT doit être entre 1 et 65535. Valeur reçue: ${config.PORT}`);
  }

  // Vérifier que JWT_SECRET est assez long en production
  if (config.NODE_ENV === 'production' && config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET doit contenir au moins 32 caractères en production');
  }

  // Vérifier que ENCRYPTION_KEY fait exactement 32 caractères
  if (config.ENCRYPTION_KEY.length !== 32) {
    throw new Error('ENCRYPTION_KEY doit faire exactement 32 caractères');
  }

  // Vérifier le format des URLs
  if (
    !config.MONGODB_URI.startsWith('mongodb://') &&
    !config.MONGODB_URI.startsWith('mongodb+srv://')
  ) {
    throw new Error('MONGODB_URI doit commencer par mongodb:// ou mongodb+srv://');
  }

  // Redis est optionnel, ne vérifier que s'il est fourni
  if (
    config.REDIS_URL &&
    !config.REDIS_URL.startsWith('redis://') &&
    !config.REDIS_URL.startsWith('rediss://')
  ) {
    throw new Error('REDIS_URL doit commencer par redis:// ou rediss://');
  }

  logger.info('✅ Validations de cohérence réussies');
}

/**
 * Export de la configuration validée
 * Cette variable est utilisée partout dans l'application
 */
export const config = validateEnvironment();
