/**
 * Documentation Swagger pour tous les endpoints
 * Ce fichier contient toutes les annotations JSDoc pour générer la documentation OpenAPI
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
 *                 example: "device_abc123"
 *               device_info:
 *                 $ref: '#/components/schemas/DeviceInfo'
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
 *                 message:
 *                   type: string
 *                   example: "Session created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Session'
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
 *     description: Vérifie la validité d'un token de session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 *                     userId:
 *                       type: string
 *                       example: "user_123456"
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "refresh_token_here"
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
 *                     sessionToken:
 *                       type: string
 *                     expiresIn:
 *                       type: number
 */

/**
 * @swagger
 * /auth/revoke:
 *   delete:
 *     tags: [Auth]
 *     summary: Révoquer une session
 *     description: Révoque la session active et invalide les tokens
 *     responses:
 *       200:
 *         description: Session révoquée avec succès
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     tags: [Photos]
 *     summary: Upload une photo
 *     description: Upload une image pour transformation (max 10MB)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photo
 *             properties:
 *               photo:
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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'éléments par page
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
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         pages:
 *                           type: integer
 */

/**
 * @swagger
 * /photos/{id}:
 *   get:
 *     tags: [Photos]
 *     summary: Obtenir les détails d'une photo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *           enum: [professional, artistic, tech, creative]
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
 *           enum: [professional, artistic, tech, creative]
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
 *     description: Démarre une transformation d'image avec IA Gemini 2.5 Flash
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - photoId
 *               - styleId
 *             properties:
 *               photoId:
 *                 type: string
 *                 example: "photo_123456"
 *               styleId:
 *                 type: string
 *                 example: "style_cyberpunk"
 *               quality:
 *                 type: string
 *                 enum: [standard, high, ultra]
 *                 default: standard
 *               customPrompt:
 *                 type: string
 *                 description: Prompt personnalisé (optionnel)
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
 *         description: Paramètres invalides
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, processing, failed]
 *         description: Filtrer par statut
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrer par catégorie de style
 *       - in: query
 *         name: isFavorite
 *         schema:
 *           type: boolean
 *         description: Afficher uniquement les favoris
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, popularity]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transformationId
 *             properties:
 *               transformationId:
 *                 type: string
 *                 example: "transform_123456"
 *     responses:
 *       200:
 *         description: Ajouté aux favoris
 */

/**
 * @swagger
 * /favorites/{id}:
 *   delete:
 *     tags: [Gallery]
 *     summary: Retirer des favoris
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
