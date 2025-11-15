/**
 * Documentation Swagger pour tous les endpoints
 * Ce fichier contient toutes les annotations JSDoc pour générer la documentation OpenAPI
 *
 * IMPORTANT: Tous les schemas correspondent exactement aux validators Joi pour éviter les erreurs de validation
 */

/**
 * @swagger
 * /auth/session:
 *   post:
 *     tags: [Auth]
 *     summary: Créer une nouvelle session utilisateur
 *     description: Crée une nouvelle session et retourne les tokens JWT pour l'authentification
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - device_id
 *               - device_info
 *             properties:
 *               device_id:
 *                 type: string
 *                 format: uuid
 *                 description: UUID unique de l'appareil
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               device_info:
 *                 type: object
 *                 required:
 *                   - platform
 *                   - version
 *                   - model
 *                   - app_version
 *                 properties:
 *                   platform:
 *                     type: string
 *                     enum: [android, ios]
 *                     example: "ios"
 *                   version:
 *                     type: string
 *                     description: Version de l'OS
 *                     example: "17.0"
 *                   model:
 *                     type: string
 *                     description: Modèle de l'appareil
 *                     example: "iPhone 15 Pro"
 *                   app_version:
 *                     type: string
 *                     pattern: '^\d+\.\d+\.\d+$'
 *                     description: Version de l'app au format X.Y.Z
 *                     example: "1.0.0"
 *                   fcm_token:
 *                     type: string
 *                     description: Token Firebase Cloud Messaging (optionnel)
 *                     example: "fcm_token_abc123..."
 *     responses:
 *       201:
 *         description: Session créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     session_token:
 *                       type: string
 *                       description: Access token JWT
 *                     refresh_token:
 *                       type: string
 *                       description: Refresh token JWT
 *                     user_id:
 *                       type: string
 *                       example: "user_123456"
 *                     session_id:
 *                       type: string
 *                       example: "session_789abc"
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *                     user:
 *                       type: object
 *                       properties:
 *                         is_new:
 *                           type: boolean
 *                         preferences:
 *                           type: object
 *                         quota:
 *                           type: object
 *       400:
 *         description: Requête invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/validate:
 *   post:
 *     tags: [Auth]
 *     summary: Valider un token de session
 *     description: Vérifie la validité d'un token de session via l'header Authorization
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     user_id:
 *                       type: string
 *                       example: "user_123456"
 *                     session_id:
 *                       type: string
 *                     device_id:
 *                       type: string
 *       401:
 *         description: Token invalide
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rafraîchir le token d'accès
 *     description: Génère un nouveau token d'accès à partir d'un refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Refresh token JWT obtenu lors de la création de session
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token rafraîchi avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     session_token:
 *                       type: string
 *                       description: Nouveau access token
 *                     refresh_token:
 *                       type: string
 *                       description: Nouveau refresh token
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Refresh token invalide ou expiré
 */

/**
 * @swagger
 * /auth/logout:
 *   delete:
 *     tags: [Auth]
 *     summary: Déconnexion / Révoquer une session
 *     description: Révoque la session active et invalide les tokens
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *         description: Si 'true', révoque toutes les sessions de l'utilisateur
 *     responses:
 *       200:
 *         description: Session révoquée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     revoked_count:
 *                       type: integer
 */

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     tags: [Auth]
 *     summary: Lister les sessions actives
 *     description: Récupère toutes les sessions actives de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           session_id:
 *                             type: string
 *                           device:
 *                             type: object
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           last_active:
 *                             type: string
 *                             format: date-time
 *                           is_current:
 *                             type: boolean
 *                     total:
 *                       type: integer
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     tags: [Photos]
 *     summary: Upload une photo
 *     description: Upload une image pour transformation (max 10MB)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPG, PNG, HEIC, WebP)
 *     responses:
 *       201:
 *         description: Photo uploadée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Photo'
 *       400:
 *         description: Fichier invalide ou trop volumineux
 */

/**
 * @swagger
 * /photos:
 *   get:
 *     tags: [Photos]
 *     summary: Lister les photos de l'utilisateur
 *     description: Récupère toutes les photos uploadées par l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Décalage pour la pagination
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [uploaded, processing, ready, failed]
 *         description: Filtrer par statut
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, fileSize]
 *           default: createdAt
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Liste des photos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     photos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Photo'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 */

/**
 * @swagger
 * /photos/{photoId}:
 *   get:
 *     tags: [Photos]
 *     summary: Obtenir les détails d'une photo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la photo
 *     responses:
 *       200:
 *         description: Détails de la photo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Photo'
 *       404:
 *         description: Photo non trouvée
 *   delete:
 *     tags: [Photos]
 *     summary: Supprimer une photo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Photo supprimée
 *       404:
 *         description: Photo non trouvée
 */

/**
 * @swagger
 * /styles:
 *   get:
 *     tags: [Styles]
 *     summary: Lister tous les styles disponibles
 *     description: Récupère tous les styles de transformation avec filtres optionnels
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [professional, artistic, tech, creative, thematic]
 *         description: Filtrer par catégorie
 *       - in: query
 *         name: isPremium
 *         schema:
 *           type: boolean
 *         description: Filtrer les styles premium
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par nom ou tags
 *     responses:
 *       200:
 *         description: Liste des styles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Style'
 */

/**
 * @swagger
 * /styles/popular:
 *   get:
 *     tags: [Styles]
 *     summary: Obtenir les styles populaires
 *     description: Récupère les styles les plus utilisés
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Styles populaires
 */

/**
 * @swagger
 * /styles/category/{category}:
 *   get:
 *     tags: [Styles]
 *     summary: Obtenir les styles par catégorie
 *     security: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [professional, artistic, tech, creative, thematic]
 *     responses:
 *       200:
 *         description: Styles de la catégorie
 */

/**
 * @swagger
 * /styles/{id}:
 *   get:
 *     tags: [Styles]
 *     summary: Obtenir les détails d'un style
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Détails du style
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Style'
 */

/**
 * @swagger
 * /transform:
 *   post:
 *     tags: [Transformations]
 *     summary: Lancer une transformation d'image
 *     description: |
 *       Démarre une transformation d'image avec IA Gemini 2.5 Flash.
 *       Vous devez fournir soit un style_id (style prédéfini) soit un custom_description (style personnalisé), mais pas les deux.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photo_id
 *             properties:
 *               photo_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la photo à transformer
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               style_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID du style prédéfini (requis si custom_description absent)
 *                 example: "650e8400-e29b-41d4-a716-446655440001"
 *               custom_description:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 500
 *                 description: Description personnalisée du style (requis si style_id absent)
 *                 example: "Transform this image into a vibrant sunset scene with warm orange and purple tones"
 *               quality:
 *                 type: string
 *                 enum: [standard, high, ultra]
 *                 default: standard
 *                 description: Qualité de la transformation
 *               options:
 *                 type: object
 *                 properties:
 *                   enable_notifications:
 *                     type: boolean
 *                     default: true
 *                   auto_save:
 *                     type: boolean
 *                     default: true
 *                   public_sharing:
 *                     type: boolean
 *                     default: false
 *                   preserve_metadata:
 *                     type: boolean
 *                     default: true
 *               priority:
 *                 type: string
 *                 enum: [normal, high]
 *                 default: normal
 *                 description: Priorité de la transformation
 *           examples:
 *             avec_style_predefini:
 *               summary: Avec un style prédéfini
 *               value:
 *                 photo_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 style_id: "650e8400-e29b-41d4-a716-446655440001"
 *                 quality: "high"
 *             avec_description_personnalisee:
 *               summary: Avec une description personnalisée
 *               value:
 *                 photo_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 custom_description: "Transform this image into a vibrant cyberpunk cityscape with neon lights and futuristic elements"
 *                 quality: "standard"
 *     responses:
 *       202:
 *         description: Transformation en cours
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transformation'
 *       400:
 *         description: Paramètres invalides (style_id ET custom_description fournis, ou aucun des deux)
 *       402:
 *         description: Quota épuisé
 */

/**
 * @swagger
 * /transformation/{id}/status:
 *   get:
 *     tags: [Transformations]
 *     summary: Obtenir le statut d'une transformation
 *     description: Récupère l'état actuel d'une transformation en cours
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Statut de la transformation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [queued, processing, completed, failed, cancelled]
 *                     progress:
 *                       type: number
 *                       example: 75
 *                     queuePosition:
 *                       type: integer
 *                       example: 3
 *                     estimatedTimeRemaining:
 *                       type: integer
 *                       example: 45
 */

/**
 * @swagger
 * /transformation/{id}:
 *   get:
 *     tags: [Transformations]
 *     summary: Obtenir le résultat d'une transformation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transformation complétée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transformation'
 *       404:
 *         description: Transformation non trouvée
 *   delete:
 *     tags: [Transformations]
 *     summary: Annuler une transformation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transformation annulée
 */

/**
 * @swagger
 * /gallery:
 *   get:
 *     tags: [Gallery]
 *     summary: Obtenir la galerie de l'utilisateur
 *     description: Récupère toutes les transformations de l'utilisateur avec filtres
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [queued, processing, completed, failed, cancelled]
 *         description: Filtrer par statut
 *       - in: query
 *         name: style_category
 *         schema:
 *           type: string
 *           enum: [professional, artistic, tech, creative, thematic]
 *         description: Filtrer par catégorie de style
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de début (ISO 8601)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de fin (ISO 8601)
 *       - in: query
 *         name: favorites_only
 *         schema:
 *           type: boolean
 *         description: Afficher uniquement les favoris
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [createdAt, completedAt, likeCount, viewCount]
 *           default: createdAt
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Galerie de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     transformations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transformation'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */

/**
 * @swagger
 * /favorites:
 *   post:
 *     tags: [Gallery]
 *     summary: Ajouter aux favoris
 *     description: Marque une transformation comme favorite
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transformation_id
 *             properties:
 *               transformation_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la transformation à ajouter aux favoris
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Ajouté aux favoris
 */

/**
 * @swagger
 * /favorites/{transformationId}:
 *   delete:
 *     tags: [Gallery]
 *     summary: Retirer des favoris
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transformationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Retiré des favoris
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check de l'API
 *     description: Vérifie l'état de santé de l'API et ses dépendances
 *     security: []
 *     responses:
 *       200:
 *         description: API en bonne santé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     services:
 *                       type: object
 *                       properties:
 *                         mongodb:
 *                           type: string
 *                           example: connected
 *                         redis:
 *                           type: string
 *                           example: connected
 */

/**
 * @swagger
 * /info:
 *   get:
 *     tags: [System]
 *     summary: Informations sur l'API
 *     description: Récupère les informations générales de l'API
 *     security: []
 *     responses:
 *       200:
 *         description: Informations de l'API
 */

/**
 * @swagger
 * /ping:
 *   get:
 *     tags: [System]
 *     summary: Ping test
 *     description: Test simple de connectivité
 *     security: []
 *     responses:
 *       200:
 *         description: Pong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: pong
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
