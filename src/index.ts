/**
 * Point d'entrée principal de l'application DevFest Studio API
 * 
 * Ce fichier initialise l'application Express et démarre le serveur
 */

import express, { Application } from 'express';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
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

    // ========== FICHIERS STATIQUES (UPLOADS) ==========

    // Servir les fichiers uploadés (photos et transformations)
    const uploadsPath = path.join(process.cwd(), 'uploads');
    app.use('/uploads', express.static(uploadsPath));

    // Servir le dossier public (pour le dashboard)
    const publicPath = path.join(process.cwd(), 'public');
    app.use('/public', express.static(publicPath));

    logger.info('📁 Fichiers statiques configurés', { uploadsPath, publicPath });

    // ========== SWAGGER DOCUMENTATION ==========

    // Swagger JSON endpoint (avant Swagger UI pour éviter les conflits)
    app.get('/api/v1/docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'inline; filename="devfest-studio-api.json"');
      res.send(swaggerSpec);
    });

    // Swagger UI avec bouton de téléchargement
    app.use(
      '/api/v1/docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: `
          .swagger-ui .topbar { display: none }
          .swagger-ui .info {
            margin-bottom: 20px;
          }
          .download-json-button {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background-color: #4990e2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: background-color 0.2s;
          }
          .download-json-button:hover {
            background-color: #357abd;
          }
        `,
        customSiteTitle: 'DevFest Studio API Docs',
        customfavIcon: '/favicon.ico',
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true,
        },
        customJs: '/api/v1/swagger-custom.js',
      })
    );

    // Script personnalisé pour le bouton de téléchargement
    app.get('/api/v1/swagger-custom.js', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.send(`
        (function() {
          // Attendre que Swagger UI soit chargé
          setTimeout(function() {
            // Créer le bouton de téléchargement
            var downloadButton = document.createElement('a');
            downloadButton.href = '/api/v1/docs.json';
            downloadButton.download = 'devfest-studio-api.json';
            downloadButton.className = 'download-json-button';
            downloadButton.innerHTML = '📥 Télécharger JSON';
            downloadButton.title = 'Télécharger la spécification OpenAPI en JSON';

            // Ajouter le bouton au DOM
            document.body.appendChild(downloadButton);
          }, 500);
        })();
      `);
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
        dashboard: '/dashboard',
      });
    });

    // Route pour le dashboard en temps réel
    app.get('/dashboard', (_req, res) => {
      res.sendFile(path.join(process.cwd(), 'public', 'dashboard.html'));
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
