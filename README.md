# 🎨 DevFest Studio API

API REST complète pour l'application mobile DevFest Studio avec transformation d'images via IA Google Gemini 2.5 Flash Image.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Stack Technique](#-stack-technique)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Démarrage](#-démarrage)
- [Endpoints API](#-endpoints-api)
- [Dashboard Temps Réel](#-dashboard-temps-réel)
- [Webhooks](#-webhooks)
- [Architecture](#-architecture)
- [Stockage Local](#-stockage-local)
- [Documentation API](#-documentation-api)
- [Déploiement](#-déploiement)
- [Scripts Disponibles](#-scripts-disponibles)
- [Exemples d'utilisation](#-exemples-dutilisation)
- [Contribution](#-contribution)
- [Licence](#-licence)

## 🌟 Vue d'ensemble

DevFest Studio API est une API REST moderne et performante qui permet aux utilisateurs de transformer leurs photos avec des styles artistiques via l'intelligence artificielle Google Gemini. L'API offre :

- 🔐 Authentification sécurisée avec JWT et gestion multi-sessions
- 📸 Upload et gestion de photos avec stockage local
- 🎨 Catalogue de styles de transformation prédéfinis
- 🤖 Transformation d'images via Google Gemini 2.5 Flash Image
- 🖼️ Galerie publique et privée avec système de favoris
- 📡 Webhooks en temps réel pour suivre les transformations
- 📊 Dashboard web pour visualiser les transformations en temps réel
- ⚡ Performance optimisée avec cache Redis (optionnel)
- 📝 Documentation Swagger interactive complète

## ✨ Fonctionnalités

### Authentification & Sécurité
- ✅ **Authentification JWT** avec access token et refresh token
- ✅ **Sessions multi-appareils** avec identifiants uniques
- ✅ **Validation et révocation** de sessions
- ✅ **Rate limiting** avec Redis _(optionnel)_
- ✅ **Chiffrement des tokens** pour la sécurité

### Gestion des Photos
- ✅ **Upload de photos** (JPG, PNG, HEIC, WebP)
- ✅ **Stockage local** dans le dossier `/uploads`
- ✅ **Génération automatique** de miniatures (300x300px)
- ✅ **Extraction des métadonnées** (dimensions, format, EXIF)
- ✅ **Gestion complète** (liste, récupération, suppression)

### Styles de Transformation
- ✅ **55+ styles prédéfinis** répartis en 5 catégories :
  - 🏢 **Professional** : Corporate, Business, LinkedIn, etc.
  - 🎨 **Artistic** : Oil Painting, Watercolor, Pop Art, etc.
  - 💻 **Tech** : Cyberpunk, Digital Art, Glitch, etc.
  - 🌈 **Creative** : Anime, Cartoon, Comic, etc.
  - 🎭 **Thematic** : Vintage, Noir, Fantasy, etc.
- ✅ **Styles personnalisés** avec validation IA
- ✅ **Recherche et filtres** par catégorie et popularité

### Transformations IA
- ✅ **Transformation via Gemini 2.5 Flash Image**
- ✅ **Qualité configurable** (standard, high, ultra)
- ✅ **Traitement asynchrone** avec suivi de progression
- ✅ **Analyse IA** des résultats (confiance, éléments détectés)
- ✅ **Gestion des erreurs** avec retry automatique
- ✅ **Annulation** des transformations en cours

### Galerie & Social
- ✅ **Galerie privée** de l'utilisateur
- ✅ **Galerie publique** avec transformations partagées
- ✅ **Système de favoris** avec gestion complète
- ✅ **Filtres avancés** (date, catégorie, favoris)
- ✅ **Pagination** et tri personnalisé

### Temps Réel & Webhooks
- ✅ **Server-Sent Events (SSE)** pour le dashboard
- ✅ **Webhooks HTTP** avec signatures HMAC-SHA256
- ✅ **Événements en temps réel** :
  - `photo.uploaded` - Photo uploadée
  - `photo.deleted` - Photo supprimée
  - `transformation.started` - Transformation démarrée
  - `transformation.completed` - Transformation complétée
  - `transformation.failed` - Transformation échouée
- ✅ **Dashboard web** pour visualisation temps réel

### Système & Performance
- ✅ **Cache Redis** optionnel pour performances accrues
- ✅ **Logs structurés** avec Winston
- ✅ **Health checks** complets
- ✅ **Documentation Swagger** avec bouton téléchargement JSON
- ✅ **Clean Architecture** (Domain-Driven Design)
- ✅ **TypeScript strict** pour la sécurité du code
- ✅ **Gestion d'erreurs** centralisée et cohérente

## 🛠 Stack Technique

### Backend
- **Runtime** : Node.js 20+
- **Langage** : TypeScript 5.9
- **Framework** : Express.js 4.21
- **Validation** : Joi 18.0

### Base de données & Cache
- **Base de données** : MongoDB 8.0 avec Mongoose 8.19
- **Cache** : Redis 7+ _(optionnel - améliore les performances)_

### Stockage & IA
- **Stockage** : Système de fichiers local (`/uploads`)
- **Traitement d'images** : Sharp 0.34
- **IA** : Google Gemini 2.5 Flash Image API

### Sécurité
- **Authentification** : JWT (jsonwebtoken 9.0)
- **Hashing** : Bcrypt 6.0
- **Headers sécurisés** : Helmet 8.1
- **CORS** : cors 2.8.5

### Documentation & Qualité
- **Documentation API** : Swagger (swagger-jsdoc + swagger-ui-express)
- **Tests** : Jest 30.2
- **Linting** : ESLint 9.39
- **Formatting** : Prettier 3.6

### DevOps
- **Containerisation** : Docker
- **Déploiement** : Google Cloud Run
- **CI/CD** : Scripts automatisés

## 📋 Prérequis

### Obligatoires
- **Node.js** 20.0.0 ou supérieur
- **npm** 10.0.0 ou supérieur
- **MongoDB** 6.0 ou supérieur
- **Compte Google Cloud** avec :
  - Gemini API activée
  - Clé API Gemini valide

### Optionnels (mais recommandés)
- **Redis** 7.0 ou supérieur (pour le cache et rate limiting)
- **Docker** (pour déploiement conteneurisé)
- **Git** (pour versioning)

## 📦 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/TheGoatIA/devfest-studio-api.git
cd devfest-studio-api
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration de l'environnement

Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Éditez le fichier `.env` avec vos configurations (voir section [Configuration](#-configuration)).

### 4. Démarrer MongoDB

#### Avec Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Installation locale
Suivez les instructions sur [mongodb.com/docs/manual/installation](https://www.mongodb.com/docs/manual/installation/)

### 5. (Optionnel) Démarrer Redis

#### Avec Docker
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

#### Installation locale
Suivez les instructions sur [redis.io/download](https://redis.io/download/)

### 6. Build du projet

```bash
npm run build
```

### 7. Seed de la base de données

```bash
npm run seed
```

Cette commande va :
- Créer les index MongoDB nécessaires
- Insérer les 55+ styles prédéfinis dans la base
- Initialiser les collections

## ⚙️ Configuration

Créez un fichier `.env` avec les variables suivantes :

```env
# ========== SERVEUR ==========
NODE_ENV=development                    # development | production | test
PORT=3000                              # Port du serveur
HOST=0.0.0.0                           # Host du serveur

# ========== MONGODB ==========
MONGODB_URI=mongodb://localhost:27017/devfest_studio
MONGODB_DB_NAME=devfest_studio

# ========== REDIS (OPTIONNEL) ==========
# Redis améliore les performances mais n'est pas obligatoire
REDIS_URL=redis://localhost:6379
# REDIS_PASSWORD=                      # Si Redis requiert un mot de passe
# REDIS_DB=0                           # Index de la base Redis (0-15)

# ========== SÉCURITÉ JWT ==========
JWT_SECRET=votre-cle-secrete-jwt-tres-longue-et-complexe-a-changer
JWT_ACCESS_EXPIRY=15m                  # Durée de validité du token d'accès
JWT_REFRESH_EXPIRY=7d                  # Durée de validité du refresh token
ENCRYPTION_KEY=votre-cle-de-chiffrement-32-caracteres-minimum

# ========== GEMINI AI ==========
GEMINI_API_KEY=votre-cle-api-gemini
GEMINI_MODEL=gemini-2.0-flash-exp      # Modèle Gemini à utiliser
GEMINI_BASE_URL=https://generativelanguage.googleapis.com

# ========== STOCKAGE ==========
# Les fichiers sont stockés localement dans /uploads
MAX_FILE_SIZE=10485760                 # Taille max des fichiers en bytes (10MB)
STORAGE_BUCKET=devfest-studio-uploads  # Nom du bucket (pour compatibilité)

# ========== GOOGLE CLOUD (pour Gemini uniquement) ==========
GOOGLE_CLOUD_PROJECT_ID=votre-project-id
# GOOGLE_CLOUD_KEY_FILE=./config/google-cloud-key.json  # Optionnel si GEMINI_API_KEY est défini

# ========== LOGS ==========
LOG_LEVEL=info                         # error | warn | info | debug
ENABLE_REQUEST_LOGGING=true            # Activer les logs des requêtes HTTP

# ========== RATE LIMITING (nécessite Redis) ==========
ENABLE_RATE_LIMIT=true                 # Activer le rate limiting
RATE_LIMIT_WINDOW_MS=900000            # Fenêtre de temps (15min)
RATE_LIMIT_MAX_REQUESTS=100            # Nombre max de requêtes par fenêtre

# ========== CORS ==========
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
# Pour autoriser toutes les origines en dev : ALLOWED_ORIGINS=*
```

### Variables d'environnement importantes

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `MONGODB_URI` | URL de connexion MongoDB | ✅ Oui |
| `JWT_SECRET` | Clé secrète pour signer les JWT | ✅ Oui |
| `ENCRYPTION_KEY` | Clé pour chiffrer les tokens | ✅ Oui |
| `GEMINI_API_KEY` | Clé API Google Gemini | ✅ Oui |
| `REDIS_URL` | URL de connexion Redis | ⚠️ Optionnel |
| `PORT` | Port du serveur | ❌ Non (défaut: 3000) |

### Obtenir une clé API Gemini

1. Rendez-vous sur [ai.google.dev](https://ai.google.dev/)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Get API Key"
4. Créez un nouveau projet ou sélectionnez-en un
5. Copiez la clé API générée
6. Ajoutez-la dans votre fichier `.env` : `GEMINI_API_KEY=votre-cle-ici`

> **Note** : Redis est optionnel. Sans Redis :
> - Le cache sera désactivé (requêtes légèrement plus lentes)
> - Le rate limiting sera désactivé
> - Toutes les autres fonctionnalités fonctionnent normalement
>
> Voir [REDIS_OPTIONAL.md](./REDIS_OPTIONAL.md) pour plus de détails.

## 🚀 Démarrage

### Mode Développement

```bash
# Avec hot-reload (nodemon)
npm run dev
```

Le serveur démarre sur `http://localhost:3000` (ou le port configuré dans `.env`)

### Mode Production

```bash
# Build TypeScript
npm run build

# Démarrer le serveur
npm start
```

### Vérifier que tout fonctionne

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Réponse attendue :
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "services": {
      "database": "connected",
      "cache": "connected",
      "storage": "operational",
      "ai": "operational"
    }
  }
}
```

### Accéder à la documentation

- **Swagger UI** : http://localhost:3000/api/v1/docs
- **Swagger JSON** : http://localhost:3000/api/v1/docs.json (avec bouton de téléchargement)
- **Dashboard temps réel** : http://localhost:3000/dashboard

## 📡 Endpoints API

### Base URL
```
http://localhost:3000/api/v1
```

### Authentification

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/auth/session` | Créer une session utilisateur | ❌ |
| `POST` | `/auth/validate` | Valider un token d'accès | ✅ |
| `POST` | `/auth/refresh` | Rafraîchir les tokens | ❌ |
| `DELETE` | `/auth/revoke` | Révoquer une session | ✅ |

**Exemple - Créer une session** :
```bash
curl -X POST http://localhost:3000/api/v1/auth/session \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "device-12345",
    "device_info": {
      "device_type": "smartphone",
      "os": "iOS",
      "os_version": "17.0",
      "app_version": "1.0.0",
      "device_name": "iPhone 15 Pro"
    }
  }'
```

### Photos

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/upload` | Upload une photo | ✅ |
| `GET` | `/photos` | Liste des photos de l'utilisateur | ✅ |
| `GET` | `/photos/:photoId` | Récupérer une photo | ✅ |
| `DELETE` | `/photos/:photoId` | Supprimer une photo | ✅ |

**Exemple - Upload une photo** :
```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/photo.jpg" \
  -F 'metadata={"capturedAt":"2024-01-15T10:00:00Z"}'
```

### Styles

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/styles` | Liste tous les styles | ❌ |
| `GET` | `/styles/popular` | Styles populaires (top 10) | ❌ |
| `GET` | `/styles/category/:category` | Styles par catégorie | ❌ |
| `GET` | `/styles/:styleId` | Détails d'un style | ❌ |

**Exemple - Lister les styles** :
```bash
curl http://localhost:3000/api/v1/styles?category=artistic&limit=20
```

### Transformations

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/transform` | Lancer une transformation | ✅ |
| `GET` | `/transformation/:id/status` | Statut de la transformation | ✅ |
| `GET` | `/transformation/:id` | Résultat complet | ✅ |
| `DELETE` | `/transformation/:id` | Annuler une transformation | ✅ |
| `GET` | `/transformations/recent` | Transformations récentes (dashboard) | ❌ |

**Exemple - Lancer une transformation** :
```bash
curl -X POST http://localhost:3000/api/v1/transform \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "photo_id": "550e8400-e29b-41d4-a716-446655440000",
    "style_id": "660e8400-e29b-41d4-a716-446655440001",
    "quality": "high",
    "options": {
      "enable_notifications": true,
      "auto_save": true
    }
  }'
```

### Galerie

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/gallery` | Galerie de l'utilisateur | ✅ |
| `GET` | `/gallery/public` | Galerie publique | ❌ |
| `POST` | `/favorites` | Ajouter aux favoris | ✅ |
| `DELETE` | `/favorites/:transformationId` | Retirer des favoris | ✅ |

**Exemple - Récupérer la galerie** :
```bash
curl "http://localhost:3000/api/v1/gallery?favorites_only=true&limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Événements Temps Réel

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/events/stream` | Stream SSE d'événements | ❌ |
| `GET` | `/events/stats` | Statistiques des webhooks | ❌ |

**Exemple - Se connecter au stream SSE** :
```bash
curl -N http://localhost:3000/api/v1/events/stream
```

### Système

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/health` | Health check complet | ❌ |
| `GET` | `/config` | Configuration système | ❌ |
| `GET` | `/info` | Informations sur l'API | ❌ |
| `GET` | `/ping` | Simple ping/pong | ❌ |

## 📊 Dashboard Temps Réel

L'API inclut un dashboard web moderne pour visualiser les transformations en temps réel.

### Accès au Dashboard

```
http://localhost:3000/dashboard
```

### Fonctionnalités du Dashboard

- 🔴 **Connexion en temps réel** via Server-Sent Events (SSE)
- 📸 **Affichage des transformations** dès qu'elles sont complétées
- 🎉 **Badge "NEW"** sur les transformations récentes (disparaît après 5s)
- 📊 **Statistiques** : total d'images et nouvelles images (24h)
- 🔌 **Indicateur de connexion** avec pulsation
- 🔄 **Auto-reconnexion** en cas de déconnexion
- 🎨 **Interface moderne** avec dégradé violet/rose
- 🔍 **Filtres** par statut, style et recherche
- 📱 **Responsive** pour tous les écrans

### Événements reçus

Le dashboard écoute les événements suivants en temps réel :

```javascript
// Transformation complétée
{
  "event": "transformation.completed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "transformationId": "uuid-123",
    "photoId": "uuid-456",
    "styleId": "uuid-789",
    "resultUrl": "http://localhost:3000/uploads/transformations/results/transform_123.jpg",
    "userId": "user-123"
  }
}
```

### Intégration dans votre application

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mon Dashboard</title>
</head>
<body>
  <script>
    // Connexion au stream d'événements
    const eventSource = new EventSource('http://localhost:3000/api/v1/events/stream');

    // Écouter les transformations complétées
    eventSource.addEventListener('transformation.completed', (event) => {
      const data = JSON.parse(event.data);
      console.log('Nouvelle transformation:', data);
      // Afficher la transformation dans votre UI
    });

    // Gérer les erreurs
    eventSource.onerror = (error) => {
      console.error('Erreur SSE:', error);
      // Reconnecter automatiquement
      setTimeout(() => {
        location.reload();
      }, 5000);
    };
  </script>
</body>
</html>
```

## 🔔 Webhooks

L'API supporte les webhooks HTTP pour recevoir des notifications en temps réel.

### Événements disponibles

| Événement | Description | Payload |
|-----------|-------------|---------|
| `photo.uploaded` | Une photo a été uploadée | `{ photoId, userId, url, metadata }` |
| `photo.deleted` | Une photo a été supprimée | `{ photoId, userId }` |
| `transformation.started` | Une transformation a démarré | `{ transformationId, userId, photoId, styleId }` |
| `transformation.completed` | Une transformation est terminée | `{ transformationId, userId, photoId, styleId, resultUrl }` |
| `transformation.failed` | Une transformation a échoué | `{ transformationId, userId, error }` |

### S'abonner à un webhook

```javascript
const { webhookService } = require('./src/application/services/WebhookService');

// Ajouter un subscriber
webhookService.addSubscriber({
  url: 'https://your-app.com/webhooks/devfest-studio',
  events: ['transformation.completed', 'photo.uploaded'], // ou ['*'] pour tous
  secret: 'your-webhook-secret' // Optionnel, pour signer les requêtes
});
```

### Vérifier la signature

Les webhooks incluent une signature HMAC-SHA256 dans le header `X-Webhook-Signature` :

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === expectedSignature;
}

// Dans votre endpoint webhook
app.post('/webhooks/devfest-studio', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhook(req.body, signature, 'your-webhook-secret');

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Traiter l'événement
  console.log('Événement reçu:', req.body);
  res.status(200).json({ received: true });
});
```

### Format des événements

```json
{
  "event": "transformation.completed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "transformationId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "photoId": "660e8400-e29b-41d4-a716-446655440001",
    "styleId": "770e8400-e29b-41d4-a716-446655440002",
    "resultUrl": "http://localhost:3000/uploads/transformations/results/transform_123.jpg"
  },
  "userId": "user-123"
}
```

## 🏗 Architecture

### Clean Architecture + Hexagonal Architecture

```
src/
├── core/                          # Couche Domaine (Domain Layer)
│   ├── entities/                 # Entités métier
│   └── interfaces/               # Contrats (Ports)
│       ├── repositories/         # Interfaces des repositories
│       └── services/             # Interfaces des services
│
├── application/                   # Couche Application (Use Cases)
│   ├── usecases/                 # Cas d'utilisation métier
│   │   ├── auth/                # Authentification
│   │   ├── photos/              # Gestion des photos
│   │   ├── transformations/     # Transformations IA
│   │   └── gallery/             # Galerie et favoris
│   └── services/                 # Services applicatifs
│       ├── LocalStorageService.ts    # Stockage local
│       ├── WebhookService.ts         # Webhooks temps réel
│       ├── AIService.ts              # Service IA Gemini
│       ├── JWTService.ts             # Service JWT
│       └── CacheService.ts           # Service de cache Redis
│
├── infrastructure/                # Couche Infrastructure (Adapters)
│   ├── database/                 # Implémentation MongoDB
│   │   ├── mongodb/             # Modèles Mongoose
│   │   └── repositories/        # Repositories concrets
│   └── external/                # APIs externes
│       ├── gemini/              # Client Gemini
│       └── redis/               # Client Redis
│
├── presentation/                  # Couche Présentation (HTTP)
│   └── http/
│       ├── controllers/         # Contrôleurs Express
│       ├── routes/              # Routes Express
│       ├── middleware/          # Middleware (auth, validation, errors)
│       └── validators/          # Schémas de validation Joi
│
├── shared/                       # Code partagé
│   ├── errors/                  # Classes d'erreurs personnalisées
│   └── utils/                   # Utilitaires
│
├── config/                       # Configuration
│   ├── environment.ts           # Variables d'environnement
│   ├── logger.ts                # Configuration Winston
│   └── database.ts              # Configuration MongoDB
│
└── docs/                         # Documentation Swagger
    └── swagger-routes.ts        # Définitions OpenAPI
```

### Principes appliqués

- ✅ **Separation of Concerns** - Chaque couche a une responsabilité claire
- ✅ **Dependency Inversion** - Les couches supérieures dépendent d'abstractions
- ✅ **Single Responsibility** - Chaque classe a une seule raison de changer
- ✅ **Open/Closed** - Ouvert à l'extension, fermé à la modification
- ✅ **Interface Segregation** - Interfaces spécifiques plutôt que générales
- ✅ **Dependency Injection** - Dépendances injectées via constructeur

### Flux de données

```
HTTP Request
    ↓
[Routes] → [Middleware] → [Controllers]
                             ↓
                        [Use Cases] ← [Services]
                             ↓
                       [Repositories]
                             ↓
                         [Database]
```

## 💾 Stockage Local

Les fichiers sont stockés localement dans le dossier `/uploads` du projet.

### Structure des dossiers

```
uploads/
├── photos/                       # Photos uploadées
│   ├── originals/               # Photos originales
│   │   └── photo_1705318800000_abc123.jpg
│   └── thumbnails/              # Miniatures (300x300)
│       └── thumb_photo_1705318800000_abc123.jpg
│
└── transformations/             # Images transformées
    ├── results/                 # Résultats des transformations
    │   └── transform_1705318900000_def456.jpg
    └── thumbnails/              # Miniatures des transformations
        └── thumb_transform_1705318900000_def456.jpg
```

### Accès aux fichiers

Les fichiers sont accessibles via HTTP :

```
# Photo originale
http://localhost:3000/uploads/photos/originals/photo_1705318800000_abc123.jpg

# Miniature de photo
http://localhost:3000/uploads/photos/thumbnails/thumb_photo_1705318800000_abc123.jpg

# Transformation
http://localhost:3000/uploads/transformations/results/transform_1705318900000_def456.jpg
```

### Caractéristiques

- ✅ **Génération automatique** de miniatures (300x300px, JPEG 85%)
- ✅ **Noms uniques** avec timestamp et ID aléatoire
- ✅ **Métadonnées** stockées en base MongoDB
- ✅ **URLs publiques** générées automatiquement
- ✅ **Suppression en cascade** (fichier + miniature)

### LocalStorageService

Le service implémente l'interface `IStorageService` pour la compatibilité :

```typescript
interface IStorageService {
  uploadFile(buffer: Buffer, metadata: FileMetadata): Promise<UploadResult>;
  deleteFile(path: string): Promise<boolean>;
  generateSignedUrl(path: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;
  // ...
}
```

## 📖 Documentation API

### Swagger UI Interactive

Accédez à la documentation interactive complète :

```
http://localhost:3000/api/v1/docs
```

Fonctionnalités :
- 📝 Tous les endpoints documentés
- 🧪 Tester les endpoints directement depuis l'interface
- 📥 **Bouton "Télécharger JSON"** pour récupérer le spec OpenAPI
- 📋 Exemples de requêtes et réponses
- 🔐 Authentification Bearer Token intégrée

### Télécharger la spec JSON

```bash
# Via l'interface : Cliquez sur le bouton "📥 Télécharger JSON"

# Ou via curl :
curl http://localhost:3000/api/v1/docs.json > swagger.json
```

### Exemples de schémas

**Request Body - Transformation** :
```json
{
  "photo_id": "550e8400-e29b-41d4-a716-446655440000",
  "style_id": "660e8400-e29b-41d4-a716-446655440001",
  "custom_description": "Transform this photo into a beautiful watercolor painting",
  "quality": "high",
  "options": {
    "enable_notifications": true,
    "auto_save": true,
    "public_sharing": false
  },
  "priority": "normal"
}
```

**Response - Transformation complétée** :
```json
{
  "success": true,
  "data": {
    "transformation_id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "completed",
    "result": {
      "transformed_image_url": "http://localhost:3000/uploads/transformations/results/transform_123.jpg",
      "thumbnail_url": "http://localhost:3000/uploads/transformations/thumbnails/thumb_transform_123.jpg",
      "ai_analysis": {
        "confidence": 0.92,
        "explanation": "Transformation appliquée avec succès",
        "detected_elements": ["watercolor", "artistic-style"]
      }
    },
    "processing": {
      "started_at": "2024-01-15T10:30:00.000Z",
      "completed_at": "2024-01-15T10:30:45.000Z",
      "processing_time": 45000
    }
  }
}
```

## 🚢 Déploiement

### Déploiement sur Google Cloud Run

1. **Préparer le projet** :
```bash
# Build l'image Docker
docker build -t gcr.io/YOUR_PROJECT_ID/devfest-studio-api:latest .

# Push vers Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/devfest-studio-api:latest
```

2. **Déployer sur Cloud Run** :
```bash
gcloud run deploy devfest-studio-api \
  --image gcr.io/YOUR_PROJECT_ID/devfest-studio-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "MONGODB_URI=mongodb-uri:latest,JWT_SECRET=jwt-secret:latest,GEMINI_API_KEY=gemini-key:latest"
```

3. **Configurer les secrets** :
```bash
# Créer les secrets dans Secret Manager
echo -n "votre-mongodb-uri" | gcloud secrets create mongodb-uri --data-file=-
echo -n "votre-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "votre-gemini-api-key" | gcloud secrets create gemini-key --data-file=-
```

### Variables d'environnement pour production

```env
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# MongoDB (via Secret Manager)
MONGODB_URI=secret://mongodb-uri

# JWT (via Secret Manager)
JWT_SECRET=secret://jwt-secret
ENCRYPTION_KEY=secret://encryption-key

# Gemini (via Secret Manager)
GEMINI_API_KEY=secret://gemini-key

# Redis (Cloud Memorystore)
REDIS_URL=redis://10.0.0.3:6379

# Logs
LOG_LEVEL=warn
ENABLE_REQUEST_LOGGING=false

# CORS
ALLOWED_ORIGINS=https://your-app.com,https://www.your-app.com
```

### Déploiement avec Docker Compose

Pour un déploiement local complet :

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/devfest_studio
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    volumes:
      - ./uploads:/app/uploads

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:latest
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  redis-data:
```

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

## 📜 Scripts Disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| **Développement** | `npm run dev` | Démarre en mode dev avec hot-reload |
| **Build** | `npm run build` | Compile TypeScript → JavaScript |
| **Production** | `npm start` | Démarre en mode production |
| **Tests** | `npm test` | Lance les tests Jest |
| **Tests (watch)** | `npm run test:watch` | Tests en mode watch |
| **Coverage** | `npm run test:coverage` | Rapport de couverture |
| **Linting** | `npm run lint` | Vérifie le code avec ESLint |
| **Lint Fix** | `npm run lint:fix` | Corrige automatiquement |
| **Format** | `npm run format` | Formate le code avec Prettier |
| **Seed** | `npm run seed` | Seed la base de données |
| **Migrate** | `npm run migrate` | Migrations de base de données |
| **Health Check** | `npm run health-check` | Vérifie la santé du système |

## 💡 Exemples d'utilisation

### Workflow complet

```bash
# 1. Créer une session
curl -X POST http://localhost:3000/api/v1/auth/session \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "iphone-15-pro",
    "device_info": {
      "device_type": "smartphone",
      "os": "iOS",
      "os_version": "17.0"
    }
  }'

# Réponse :
{
  "success": true,
  "data": {
    "user_id": "user-123",
    "session_id": "session-456",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 900
  }
}

# 2. Upload une photo
curl -X POST http://localhost:3000/api/v1/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -F "file=@/Users/me/photo.jpg"

# Réponse :
{
  "success": true,
  "data": {
    "photo_id": "photo-789",
    "original_url": "http://localhost:3000/uploads/photos/originals/photo_123.jpg",
    "thumbnail_url": "http://localhost:3000/uploads/photos/thumbnails/thumb_photo_123.jpg",
    "metadata": {
      "width": 4032,
      "height": 3024,
      "file_size": 2456789,
      "format": "jpeg"
    }
  }
}

# 3. Lister les styles disponibles
curl http://localhost:3000/api/v1/styles?category=artistic

# 4. Lancer une transformation
curl -X POST http://localhost:3000/api/v1/transform \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "photo_id": "photo-789",
    "style_id": "style-oil-painting",
    "quality": "high"
  }'

# Réponse :
{
  "success": true,
  "data": {
    "transformation_id": "transform-999",
    "status": "queued",
    "estimated_completion_time": "2024-01-15T10:31:30.000Z",
    "queue_position": 1
  }
}

# 5. Vérifier le statut
curl http://localhost:3000/api/v1/transformation/transform-999/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# 6. Récupérer le résultat
curl http://localhost:3000/api/v1/transformation/transform-999 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# 7. Ajouter aux favoris
curl -X POST http://localhost:3000/api/v1/favorites \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"transformation_id": "transform-999"}'
```

### Utilisation du Dashboard

1. Ouvrez votre navigateur : `http://localhost:3000/dashboard`
2. Le dashboard se connecte automatiquement au stream SSE
3. Uploadez une photo et lancez une transformation
4. Observez la transformation apparaître en temps réel dès qu'elle est complétée
5. Le badge "🎉 NEW" apparaît pendant 5 secondes

### Intégration des Webhooks

```javascript
// Exemple d'application Node.js qui reçoit les webhooks
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Endpoint webhook
app.post('/webhooks/transformations', (req, res) => {
  // 1. Vérifier la signature
  const signature = req.headers['x-webhook-signature'];
  const secret = 'your-webhook-secret';

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Traiter l'événement
  const { event, data } = req.body;

  switch (event) {
    case 'transformation.completed':
      console.log('✅ Transformation terminée:', data.transformationId);
      console.log('   Résultat:', data.resultUrl);
      // Envoyer une notification push, email, etc.
      break;

    case 'transformation.failed':
      console.log('❌ Transformation échouée:', data.transformationId);
      console.log('   Erreur:', data.error);
      break;

    case 'photo.uploaded':
      console.log('📸 Photo uploadée:', data.photoId);
      break;
  }

  res.status(200).json({ received: true });
});

app.listen(4000, () => {
  console.log('Webhook receiver listening on port 4000');
});
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

### 1. Fork le projet

```bash
git clone https://github.com/TheGoatIA/devfest-studio-api.git
cd devfest-studio-api
```

### 2. Créer une branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
```

### 3. Faire les modifications

- Respectez l'architecture Clean Architecture
- Ajoutez des tests pour les nouvelles fonctionnalités
- Mettez à jour la documentation si nécessaire
- Suivez les conventions de code (ESLint + Prettier)

### 4. Tester

```bash
npm run lint
npm run format
npm test
npm run build
```

### 5. Commiter

```bash
git add .
git commit -m "feat: ajouter ma nouvelle fonctionnalité"
```

Utilisez les conventions de commits :
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage
- `refactor:` - Refactoring
- `test:` - Tests
- `chore:` - Maintenance

### 6. Pusher et créer une Pull Request

```bash
git push origin feature/ma-nouvelle-fonctionnalite
```

Puis créez une Pull Request sur GitHub avec :
- Description claire des changements
- Tests ajoutés/mis à jour
- Screenshots si pertinent

## 📄 Licence

Ce projet est sous licence MIT.

```
MIT License

Copyright (c) 2024 DevFest Douala

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 👥 Auteurs

- **Boris TANE** - Développeur Principal - [TheGoatIA](https://github.com/TheGoatIA)
- **Communauté DevFest Douala** - Contributeurs

## 🙏 Remerciements

- **Google Developer Groups Douala** - Organisation de DevFest
- **DevFest Douala 2024** - Événement et communauté
- **Google Gemini Team** - API d'intelligence artificielle
- **Communauté Open Source** - Outils et bibliothèques
- **Contributors** - Tous ceux qui ont contribué au projet

## 📞 Support

- 🐛 **Bugs** : [GitHub Issues](https://github.com/TheGoatIA/devfest-studio-api/issues)
- 💬 **Discussions** : [GitHub Discussions](https://github.com/TheGoatIA/devfest-studio-api/discussions)
- 📧 **Email** : boris@devfest-douala.com
- 🌐 **Site Web** : [devfest-douala.com](https://devfest-douala.com)

## 🔗 Liens utiles

- [Documentation Swagger](http://localhost:3000/api/v1/docs)
- [Dashboard Temps Réel](http://localhost:3000/dashboard)
- [Cahier des Charges](./docs/CAHIER_DES_CHARGES.md)
- [Guide Redis Optionnel](./REDIS_OPTIONAL.md)
- [Changelog](./CHANGELOG.md)

---

**Made with ❤️ for DevFest Douala 2024**

⭐ N'oubliez pas de mettre une étoile si ce projet vous a été utile !
