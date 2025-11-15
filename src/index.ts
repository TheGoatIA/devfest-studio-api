/**
 * Point d'entrée principal de l'application DevFest Studio API
 * 
 * Ce fichier initialise l'application Express et démarre le serveur
 */

import express, { Application } from 'express';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import logger from './config/logger';
import { config } from './config/environment';
import { swaggerSpec } from './config/swagger';
import { initializeDatabases, closeDatabases, checkDatabasesHealth } from './config/database';
import {
  setupSecurityMiddleware,
  requestLogger,
  requestId,
  errorHandler,
  notFoundHandler,
  setupGlobalErrorHandlers,
} from './presentation/http/middleware';

/**
 * Fonction principale pour démarrer l'application
 */
async function startServer(): Promise<void> {
  try {
    // Afficher le logo de l'application
    console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║         🎨 DEVFEST STUDIO API 🎨                     ║
    ║                                                       ║
    ║         Transformation d'images via IA Gemini         ║
    ║         Version: 1.0.0                                ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
    `);

    logger.info('🚀 Démarrage de l\'application...');

    // ========== INITIALISATION DES BASES DE DONNÉES ==========
    logger.info('📦 Initialisation des bases de données...');
    await initializeDatabases();
    logger.info('✅ Bases de données initialisées');

    // Créer l'application Express
    const app: Application = express();

    // ========== MIDDLEWARES GLOBAUX ==========
    
    // 1. Sécurité (Helmet + CORS)
    setupSecurityMiddleware(app);

    // 2. Compression des réponses
    app.use(compression());

    // 3. Parser le JSON (avec limite de taille)
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 4. ID unique par requête
    app.use(requestId);

    // 5. Logger les requêtes
    app.use(requestLogger);

    // ========== SWAGGER DOCUMENTATION ==========

    // Swagger UI
    app.use(
      '/api/v1/docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'DevFest Studio API Docs',
        customfavIcon: '/favicon.ico',
      })
    );

    // Swagger JSON
    app.get('/api/v1/docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    logger.info('📚 Swagger documentation configuré sur /api/v1/docs');

    // ========== ROUTES API ==========

    // Importer toutes les routes
    const apiRoutes = require('./presentation/http/routes').default;

    // Monter les routes sur /api/v1
    app.use('/api/v1', apiRoutes);

    // Route de test simple
    app.get('/api/v1/health', async (_req, res) => {
      const dbHealth = checkDatabasesHealth();
      
      res.json({
        success: true,
        message: 'DevFest Studio API fonctionne correctement! 🎉',
        data: {
          status: dbHealth.overall ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: config.NODE_ENV,
          services: {
            mongodb: dbHealth.mongodb ? 'connected' : 'disconnected',
            redis: dbHealth.redis ? 'connected' : 'disconnected',
          },
        },
      });
    });

    // Route par défaut
    app.get('/', (_req, res) => {
      res.json({
        message: '🎨 Bienvenue sur DevFest Studio API',
        documentation: '/api/v1/docs',
        health: '/api/v1/health',
      });
    });

    // ========== GESTION DES ERREURS ==========
    
    // Route non trouvée (404) - doit être APRÈS toutes les routes
    app.use(notFoundHandler);

    // Gestionnaire d'erreurs global - doit être en DERNIER
    app.use(errorHandler);

    // Configuration des handlers globaux d'erreurs
    setupGlobalErrorHandlers();

    // Démarrer le serveur
    app.listen(config.PORT, config.HOST, () => {
      logger.info(`✅ Serveur démarré avec succès!`);
      logger.info(`📍 URL: http://${config.HOST}:${config.PORT}`);
      logger.info(`🌍 Environnement: ${config.NODE_ENV}`);
      logger.info(`📝 Health check: http://${config.HOST}:${config.PORT}/api/v1/health`);
      logger.info(`📚 Documentation API: http://${config.HOST}:${config.PORT}/api/v1/docs`);
      
      // Log supplémentaires en développement
      if (config.NODE_ENV === 'development') {
        logger.info('');
        logger.info('💡 Mode développement activé');
        logger.info('💡 Les logs détaillés sont activés');
      }
    });

    // Gestion propre de l'arrêt du serveur
    process.on('SIGTERM', async () => {
      logger.info('⚠️  Signal SIGTERM reçu: fermeture du serveur...');
      await closeDatabases();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('⚠️  Signal SIGINT reçu: fermeture du serveur...');
      await closeDatabases();
      process.exit(0);
    });

    // Gestion des erreurs non capturées
    process.on('unhandledRejection', (reason: Error) => {
      logger.error('❌ Promesse rejetée non gérée', {
        error: reason.message,
        stack: reason.stack,
      });
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('❌ Exception non capturée', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Erreur fatale au démarrage', { error });
    process.exit(1);
  }
}

// Lancer le serveur
startServer();
