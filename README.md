# 🎨 DevFest Studio API

API REST complète pour l'application mobile DevFest Studio avec transformation d'images via IA Google Gemini.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Stack Technique](#stack-technique)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Endpoints API](#endpoints-api)
- [Déploiement](#déploiement)
- [Architecture](#architecture)

## ✨ Fonctionnalités

- ✅ **Authentification JWT** avec sessions multi-appareils
- ✅ **Upload de photos** vers Google Cloud Storage
- ✅ **Styles de transformation** prédéfinis (Professional, Artistic, Tech, Creative, Thematic)
- ✅ **Transformation d'images** via Google Gemini AI
- ✅ **Galerie publique et privée** des transformations
- ✅ **Gestion des favoris** et partage social
- ✅ **Cache Redis** pour les performances _(optionnel)_
- ✅ **Rate limiting** et sécurité _(nécessite Redis)_
- ✅ **Logs structurés** avec Winston
- ✅ **Prêt pour production** sur Google Cloud Run

## 🛠 Stack Technique

- **Runtime**: Node.js 20+
- **Langage**: TypeScript 5+
- **Framework**: Express.js
- **Base de données**: MongoDB avec Mongoose
- **Cache**: Redis _(optionnel - améliore les performances)_
- **Storage**: Google Cloud Storage
- **IA**: Google Gemini API
- **Déploiement**: Google Cloud Run (Docker)

## 📦 Installation

### Prérequis

- Node.js 20+
- MongoDB 6+
- Redis 7+ _(optionnel - recommandé pour la production)_
- Compte Google Cloud avec:
  - Cloud Storage activé
  - Gemini API activée

> **Note** : Redis est optionnel. L'application fonctionne sans Redis mais avec des performances légèrement réduites et sans rate limiting. Voir [REDIS_OPTIONAL.md](./REDIS_OPTIONAL.md) pour plus de détails.

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/votre-username/devfest-studio-api.git
cd devfest-studio-api

# Installer les dépendances
npm install

# Copier le fichier d'exemple d'environnement
cp .env.example .env

# Éditer .env avec vos configurations
nano .env

# Lancer MongoDB localement (requis)
# Lancer Redis localement (optionnel mais recommandé)
# (via Docker ou installation locale)

# Build TypeScript
npm run build

# Démarrer en mode développement
npm run dev

# Ou démarrer en production
npm start
```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du projet :

```env
# Serveur
NODE_ENV=development
PORT=8080
HOST=0.0.0.0

# MongoDB
MONGODB_URI=mongodb://localhost:27017/devfest_studio
MONGODB_DB_NAME=devfest_studio

# Redis (OPTIONNEL - améliore les performances)
REDIS_URL=redis://localhost:6379

# Sécurité JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
ENCRYPTION_KEY=your-32-character-encryption-key

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=./config/google-cloud-key.json
STORAGE_BUCKET=devfest-studio-storage

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-pro-vision
GEMINI_BASE_URL=https://generativelanguage.googleapis.com

# Logs
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

## 🚀 Utilisation

### Seed des styles prédéfinis

```bash
npm run seed
```

### Lancer l'API

```bash
# Mode développement avec hot-reload
npm run dev

# Mode production
npm start

# Tests
npm test

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
```

## 📡 Endpoints API

### Authentification

- `POST /api/v1/auth/session` - Créer une session
- `POST /api/v1/auth/validate` - Valider une session
- `POST /api/v1/auth/refresh` - Rafraîchir le token
- `DELETE /api/v1/auth/revoke` - Révoquer une session

### Photos

- `POST /api/v1/upload` - Upload une photo
- `GET /api/v1/photos` - Lister les photos
- `GET /api/v1/photos/:photoId` - Récupérer une photo
- `DELETE /api/v1/photos/:photoId` - Supprimer une photo

### Styles

- `GET /api/v1/styles` - Lister les styles
- `GET /api/v1/styles/popular` - Styles populaires
- `GET /api/v1/styles/category/:category` - Styles par catégorie
- `GET /api/v1/styles/:styleId` - Détails d'un style

### Transformations

- `POST /api/v1/transform` - Lancer une transformation
- `GET /api/v1/transformation/:id/status` - Statut de transformation
- `GET /api/v1/transformation/:id` - Résultat de transformation
- `DELETE /api/v1/transformation/:id` - Annuler une transformation

### Galerie

- `GET /api/v1/gallery` - Galerie utilisateur
- `GET /api/v1/gallery/public` - Galerie publique
- `POST /api/v1/favorites` - Ajouter aux favoris
- `DELETE /api/v1/favorites/:id` - Retirer des favoris

### Système

- `GET /api/v1/health` - Health check
- `GET /api/v1/config` - Configuration système
- `GET /api/v1/info` - Informations API

Documentation complète : [Voir le cahier des charges](./docs/CAHIER_DES_CHARGES.md)

## 🚢 Déploiement

### Google Cloud Run

```bash
# Build et push de l'image Docker
./scripts/deploy.sh

# Ou manuellement:
docker build -t gcr.io/YOUR_PROJECT_ID/devfest-studio-api:latest .
docker push gcr.io/YOUR_PROJECT_ID/devfest-studio-api:latest

gcloud run deploy devfest-studio-api \
  --image gcr.io/YOUR_PROJECT_ID/devfest-studio-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2
```

## 🏗 Architecture

```
src/
├── core/               # Domaine métier (entities, interfaces)
├── application/        # Use cases et services applicatifs
├── infrastructure/     # Implémentations techniques (DB, external APIs)
├── presentation/       # Couche HTTP (controllers, routes, middleware)
└── shared/            # Utilitaires partagés

Clean Architecture + Hexagonal Architecture
```

## 📝 Scripts disponibles

```bash
npm run dev           # Mode développement
npm run build         # Build TypeScript
npm start            # Démarrer en production
npm test             # Lancer les tests
npm run lint         # Linter le code
npm run seed         # Seed la base de données
npm run deploy       # Déployer sur Cloud Run
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 Licence

MIT © DevFest Douala 2024

## 👥 Auteurs

- **Boris** - Développeur principal - DevFest Douala

## 🙏 Remerciements

- Google Developer Groups Douala
- DevFest Douala 2024
- Google Gemini Team
- Communauté open-source

---

**Made with ❤️ for DevFest Douala 2024**
