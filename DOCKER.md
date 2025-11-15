# 🐳 Guide Docker - DevFest Studio API

Ce guide explique comment utiliser Docker pour développer, tester et déployer l'API DevFest Studio.

## Table des matières

- [Prérequis](#prérequis)
- [Démarrage rapide](#démarrage-rapide)
- [Environnements](#environnements)
- [Commandes Make](#commandes-make)
- [Configuration](#configuration)
- [Volumes et données](#volumes-et-données)
- [Logs](#logs)
- [Dépannage](#dépannage)

## Prérequis

- Docker >= 24.0
- Docker Compose >= 2.20
- Make (optionnel, pour utiliser le Makefile)

### Installation Docker

#### Linux
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

#### macOS
```bash
brew install --cask docker
```

#### Windows
Téléchargez et installez [Docker Desktop](https://www.docker.com/products/docker-desktop)

## Démarrage rapide

### 1. Configuration initiale

```bash
# Avec Make
make setup

# Sans Make
cp .env.example .env
mkdir -p data/mongodb data/redis uploads logs
npm install
```

### 2. Lancer l'environnement de développement

```bash
# Avec Make
make dev

# Sans Make
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Vérifier que tout fonctionne

```bash
# Avec Make
make health

# Sans Make
curl http://localhost:3000/api/v1/health
```

### 4. Accéder aux services

- **API**: http://localhost:3000
- **Documentation API**: http://localhost:3000/api/v1/docs
- **Dashboard**: http://localhost:3000/dashboard
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## Environnements

### Développement (`docker-compose.dev.yml`)

Environnement avec hot-reload, debug activé, et interfaces d'administration.

```bash
# Démarrer
make dev

# Avec interfaces d'administration (Mongo Express, Redis Commander)
make dev-admin

# Arrêter
make dev-down

# Logs
make dev-logs

# Redémarrer
make dev-restart
```

**Services disponibles**:
- API (port 3000)
- MongoDB (port 27017)
- Redis (port 6379)
- Mongo Express (port 8081) - avec profile `with-admin-ui`
- Redis Commander (port 8082) - avec profile `with-admin-ui`

### Production (`docker-compose.yml`)

Environnement optimisé pour la production avec gestion des ressources.

```bash
# Démarrer
make prod

# Démarrer avec Nginx
make prod-nginx

# Arrêter
make prod-down

# Logs
make prod-logs
```

**Services disponibles**:
- API (port 3000)
- MongoDB (port 27017)
- Redis (port 6379)
- Nginx (ports 80/443) - avec profile `with-nginx`

## Commandes Make

Le Makefile fournit des raccourcis pratiques pour gérer Docker :

```bash
make help           # Affiche toutes les commandes disponibles
make setup          # Configuration initiale du projet
make dev            # Lance l'environnement de développement
make dev-build      # Build et lance le dev
make dev-logs       # Affiche les logs du dev
make dev-down       # Arrête le dev
make dev-admin      # Lance avec interfaces d'administration
make prod           # Lance l'environnement de production
make prod-build     # Build et lance la prod
make prod-logs      # Affiche les logs de la prod
make prod-down      # Arrête la prod
make prod-nginx     # Lance la prod avec Nginx
make build          # Build les images Docker
make logs           # Affiche les logs
make ps             # Liste les conteneurs en cours
make db-backup      # Sauvegarde MongoDB
make db-restore     # Restaure MongoDB
make db-shell       # Ouvre un shell MongoDB
make redis-cli      # Ouvre le CLI Redis
make test           # Lance les tests
make test-coverage  # Tests avec couverture
make clean          # Nettoie conteneurs et volumes
make clean-all      # Nettoyage complet
make shell          # Ouvre un shell dans le conteneur API
make health         # Vérifie la santé des services
```

## Configuration

### Variables d'environnement

Copiez `.env.example` vers `.env` et configurez :

```bash
# Application
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# MongoDB
MONGODB_URI=mongodb://mongodb:27017/devfest_studio
MONGODB_DB_NAME=devfest_studio

# Redis (optionnel)
REDIS_URL=redis://redis:6379

# JWT & Security
JWT_SECRET=votre-secret-jwt-ici
ENCRYPTION_KEY=votre-cle-32-caracteres-exactement

# Gemini AI
GEMINI_API_KEY=votre-cle-gemini-ici
GEMINI_MODEL=gemini-2.0-flash-exp

# Autres...
```

### Gestion des ressources

Dans `docker-compose.yml`, chaque service a des limites de ressources :

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

Ajustez selon vos besoins et capacités système.

## Volumes et données

### Volumes nommés

Le projet utilise des volumes Docker pour persister les données :

```
data/mongodb/     # Données MongoDB
data/redis/       # Données Redis
uploads/          # Fichiers uploadés
logs/             # Logs de l'application
```

### Sauvegarde

```bash
# Sauvegarder MongoDB
make db-backup

# Les sauvegardes sont créées dans ./backups/
```

### Restauration

```bash
# Restaurer la dernière sauvegarde
make db-restore
```

### Nettoyage

```bash
# Supprimer conteneurs et volumes (⚠️ perte de données)
make clean

# Nettoyage complet du système Docker
make clean-all
```

## Logs

### Visualiser les logs

```bash
# Tous les services
make logs

# Service spécifique
docker-compose logs -f api
docker-compose logs -f mongodb
docker-compose logs -f redis

# Dernières N lignes
docker-compose logs --tail=100 api
```

### Configuration des logs

Les logs sont configurés avec rotation automatique :

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"      # Taille max par fichier
    max-file: "3"        # Nombre de fichiers gardés
    labels: "service=api"
```

### Emplacement des logs

- **Application**: `./logs/`
- **Docker**: `/var/lib/docker/containers/`
- **Nginx**: `./nginx/logs/`

## Build

### Build de l'image Docker

```bash
# Build production
docker build -t devfest-studio-api:latest .

# Build développement
docker build -t devfest-studio-api:dev -f Dockerfile.dev .

# Build avec cache
docker build --cache-from devfest-studio-api:latest -t devfest-studio-api:latest .
```

### Multi-stage build

Le Dockerfile utilise le multi-stage build pour optimiser la taille :

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
# ... build de l'application

# Stage 2: Production
FROM node:22-alpine AS production
# ... copie seulement les fichiers nécessaires
```

## Networking

### Réseau personnalisé

Docker Compose crée un réseau `devfest-network` :

```yaml
networks:
  devfest-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Communication entre services

Les services peuvent se référencer par leur nom :

```javascript
// Dans l'application
const mongoUri = 'mongodb://mongodb:27017/devfest_studio';
const redisUrl = 'redis://redis:6379';
```

## Sécurité

### Utilisateur non-root

L'application s'exécute avec un utilisateur non-root :

```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nodejs
USER nodejs
```

### Health checks

Tous les services ont des health checks :

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get(...)"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Dépannage

### Le conteneur ne démarre pas

```bash
# Vérifier les logs
docker-compose logs api

# Vérifier le statut
docker-compose ps

# Reconstruire l'image
docker-compose build --no-cache api
```

### Problèmes de permissions

```bash
# Linux: donner les bonnes permissions
sudo chown -R $USER:$USER data/ uploads/ logs/

# Recréer les volumes
make clean
make dev
```

### Base de données vide

```bash
# Vérifier que MongoDB est démarré
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Vérifier les logs MongoDB
docker-compose logs mongodb
```

### Ports déjà utilisés

```bash
# Vérifier les ports utilisés
sudo lsof -i :3000
sudo lsof -i :27017
sudo lsof -i :6379

# Changer les ports dans docker-compose.yml
ports:
  - "3001:3000"  # Au lieu de 3000:3000
```

### Nettoyage complet

```bash
# Tout supprimer et recommencer
make clean-all
make setup
make dev
```

## Performance

### Optimisations

1. **Cache de build**
   ```bash
   # Utiliser BuildKit pour de meilleurs caches
   DOCKER_BUILDKIT=1 docker build -t devfest-studio-api .
   ```

2. **Volumes montés**
   ```yaml
   # Utiliser delegated sur macOS pour de meilleures performances
   volumes:
     - .:/app:delegated
   ```

3. **Ressources dédiées**
   ```yaml
   # Allouer plus de ressources si nécessaire
   deploy:
     resources:
       limits:
         cpus: '4.0'
         memory: 4G
   ```

## Intégration CI/CD

Les images Docker sont automatiquement construites et testées par GitHub Actions :

- `.github/workflows/ci.yml` - Tests et build
- `.github/workflows/cd.yml` - Déploiement

Les images sont poussées sur GitHub Container Registry :

```bash
docker pull ghcr.io/thegoatia/devfest-studio-api:latest
```

## Production

### Déploiement

```bash
# Sur le serveur de production
git clone https://github.com/TheGoatIA/devfest-studio-api.git
cd devfest-studio-api
cp .env.example .env
# Configurer .env avec les vraies valeurs
make prod-build
```

### Monitoring

```bash
# Vérifier la santé
make health

# Statistiques en temps réel
docker stats

# Logs en continu
make prod-logs
```

### Mises à jour

```bash
git pull
make prod-build
# Les données sont préservées dans les volumes
```

## Support

Pour toute question ou problème :

- 📖 Documentation : [README.md](README.md)
- 🐛 Issues : [GitHub Issues](https://github.com/TheGoatIA/devfest-studio-api/issues)
- 💬 Discussions : [GitHub Discussions](https://github.com/TheGoatIA/devfest-studio-api/discussions)
