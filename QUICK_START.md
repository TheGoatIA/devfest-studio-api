# 🚀 QUICK START GUIDE - DevFest Studio API

## 📋 Prérequis

- Node.js 20+
- MongoDB 6+
- Redis 7+
- Compte Google Cloud Platform
- Clé API Google Gemini

---

## ⚡ Démarrage Rapide (5 minutes)

### 1. Installation

```bash
# Cloner le projet
git clone https://github.com/TheGoatIA/devfest-studio-api.git
cd devfest-studio-api

# Installer les dépendances
npm install
```

### 2. Configuration

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer les variables (obligatoire!)
nano .env
```

**Variables OBLIGATOIRES à configurer:**
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/devfest_studio

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=votre-secret-jwt-tres-securise

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=votre-project-id
STORAGE_BUCKET=votre-bucket-name

# Gemini AI
GEMINI_API_KEY=votre-cle-gemini
```

### 3. Démarrer MongoDB et Redis

**Option A: Docker (Recommandé)**
```bash
# MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Redis
docker run -d -p 6379:6379 --name redis redis:latest
```

**Option B: Installation locale**
```bash
# Suivre les instructions d'installation de MongoDB et Redis
```

### 4. Seed de la base de données

```bash
# Seed les styles prédéfinis
npm run seed
```

### 5. Démarrer l'API

```bash
# Mode développement (avec hot-reload)
npm run dev

# Mode production
npm run build
npm start
```

L'API est maintenant accessible sur **http://localhost:8080**

---

## ✅ Vérification

### 1. Health Check
```bash
curl http://localhost:8080/api/v1/health
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "mongodb": "connected",
      "redis": "connected"
    }
  }
}
```

### 2. Info API
```bash
curl http://localhost:8080/api/v1/info
```

### 3. Lister les styles
```bash
# Créer une session d'abord
curl -X POST http://localhost:8080/api/v1/auth/session \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-123",
    "device_info": {
      "platform": "android",
      "version": "13",
      "model": "Test",
      "app_version": "1.0.0"
    }
  }'

# Copier le session_token de la réponse

# Lister les styles
curl http://localhost:8080/api/v1/styles \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## 📚 Endpoints Disponibles

### Authentification
```
POST   /api/v1/auth/session      - Créer session
POST   /api/v1/auth/validate     - Valider session
POST   /api/v1/auth/refresh      - Rafraîchir token
DELETE /api/v1/auth/revoke       - Révoquer session
```

### Photos
```
POST   /api/v1/upload            - Upload photo
GET    /api/v1/photos            - Lister photos
GET    /api/v1/photos/:id        - Détails photo
DELETE /api/v1/photos/:id        - Supprimer photo
```

### Styles
```
GET /api/v1/styles                - Tous les styles
GET /api/v1/styles/popular        - Styles populaires
GET /api/v1/styles/category/:cat  - Par catégorie
GET /api/v1/styles/:id            - Détails style
```

### Transformations
```
POST   /api/v1/transform              - Lancer transformation
GET    /api/v1/transformation/:id/status  - Statut
GET    /api/v1/transformation/:id     - Résultat
DELETE /api/v1/transformation/:id     - Annuler
```

### Galerie
```
GET    /api/v1/gallery               - Galerie utilisateur
POST   /api/v1/favorites             - Ajouter favoris
DELETE /api/v1/favorites/:id         - Retirer favoris
```

### Système
```
GET /api/v1/health  - Health check
GET /api/v1/info    - Info API
GET /api/v1/ping    - Ping test
```

---

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Rapport de coverage
npm run test:coverage
```

---

## 🐛 Dépannage

### MongoDB ne se connecte pas
```bash
# Vérifier que MongoDB est démarré
docker ps | grep mongodb

# Vérifier les logs
docker logs mongodb

# Redémarrer MongoDB
docker restart mongodb
```

### Redis ne se connecte pas
```bash
# Vérifier que Redis est démarré
docker ps | grep redis

# Vérifier les logs
docker logs redis

# Redémarrer Redis
docker restart redis
```

### Erreur "GEMINI_API_KEY required"
```bash
# Obtenir une clé API Gemini:
# 1. Aller sur https://ai.google.dev/
# 2. Créer un projet
# 3. Générer une clé API
# 4. Ajouter dans .env
```

### Erreur Google Cloud Storage
```bash
# Créer un bucket:
# 1. Aller sur Google Cloud Console
# 2. Cloud Storage > Créer un bucket
# 3. Configurer les permissions
# 4. Ajouter le nom dans .env
```

---

## 🔧 Scripts Disponibles

```bash
npm run dev           # Développement avec hot-reload
npm run build         # Build TypeScript
npm start             # Production
npm test              # Lancer tests
npm run test:watch    # Tests en watch mode
npm run test:coverage # Coverage report
npm run lint          # Linter
npm run lint:fix      # Fix lint errors
npm run format        # Formatter le code
npm run seed          # Seed base de données
```

---

## 🚀 Déploiement

### Docker
```bash
# Build image
docker build -t devfest-studio-api .

# Run container
docker run -p 8080:8080 \
  -e MONGODB_URI="..." \
  -e REDIS_URL="..." \
  devfest-studio-api
```

### Google Cloud Run
```bash
# Configurer gcloud
gcloud auth login
gcloud config set project VOTRE_PROJECT_ID

# Déployer
./scripts/deploy.sh
```

---

## 📖 Documentation Complète

- **README.md** - Documentation principale
- **COMPLETE_PROJECT_SUMMARY.md** - Résumé complet
- **PROGRESS_REPORT.md** - Rapport de progression
- **CODEBASE_ANALYSIS.md** - Analyse du code

---

## 🆘 Support

**En cas de problème:**

1. Vérifier les logs: `npm run dev` affiche les logs en temps réel
2. Vérifier MongoDB: `docker logs mongodb`
3. Vérifier Redis: `docker logs redis`
4. Vérifier le fichier `.env`
5. Consulter la documentation complète

---

## 🎉 C'est Parti !

Votre API DevFest Studio est maintenant opérationnelle ! 🚀

**Prochaines étapes:**
1. ✅ Tester les endpoints avec Postman/curl
2. ✅ Uploader des photos
3. ✅ Lancer des transformations
4. ✅ Explorer la galerie
5. ✅ Déployer en production

**Bon développement ! 🎨**

---

**Made with ❤️ for DevFest Douala 2024**
