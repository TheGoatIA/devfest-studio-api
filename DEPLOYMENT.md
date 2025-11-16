# 🚀 Guide de Déploiement - DevFest Studio API

Ce guide explique comment déployer l'API DevFest Studio en production avec Docker, Apache et Certbot pour HTTPS.

## Table des matières

- [Architecture de déploiement](#architecture-de-déploiement)
- [Prérequis](#prérequis)
- [Installation du serveur](#installation-du-serveur)
- [Configuration Apache](#configuration-apache)
- [Configuration Certbot (HTTPS)](#configuration-certbot-https)
- [Déploiement Docker](#déploiement-docker)
- [Configuration DNS](#configuration-dns)
- [Monitoring et Maintenance](#monitoring-et-maintenance)
- [Dépannage](#dépannage)

## Architecture de déploiement

```
Internet (HTTPS)
       ↓
   Port 443 (SSL)
       ↓
    Apache2 (Reverse Proxy)
       ↓
   localhost:3000
       ↓
  Docker Container (API)
       ↓
  MongoDB + Redis (Docker)
```

**Pourquoi cette architecture ?**
- ✅ Apache gère le SSL/TLS (Certbot)
- ✅ Apache sert les fichiers statiques efficacement
- ✅ Docker isole l'application
- ✅ Facile à mettre à jour et à scaler

## Prérequis

### Serveur
- Ubuntu 20.04+ ou Debian 11+ (recommandé)
- 2GB RAM minimum (4GB recommandé)
- 20GB d'espace disque
- Accès root ou sudo

### Domaine
- Un nom de domaine pointant vers votre serveur
- Exemple : `api.devfest-studio.com`

### Logiciels
```bash
sudo apt update
sudo apt install -y git curl
```

## Installation du serveur

### 1. Installer Docker

```bash
# Installation Docker
curl -fsSL https://get.docker.com | sh

# Ajouter votre utilisateur au groupe docker
sudo usermod -aG docker $USER

# Redémarrer la session ou exécuter
newgrp docker

# Vérifier l'installation
docker --version
docker-compose --version
```

### 2. Installer Apache

```bash
# Installer Apache2
sudo apt install -y apache2

# Activer les modules nécessaires
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod rewrite
sudo a2enmod ssl

# Vérifier qu'Apache fonctionne
sudo systemctl status apache2
```

### 3. Installer Certbot

```bash
# Installer Certbot pour Apache
sudo apt install -y certbot python3-certbot-apache

# Vérifier l'installation
certbot --version
```

## Configuration Apache

### 1. Copier la configuration

```bash
# Aller dans le dossier du projet
cd /path/to/devfest-studio-api

# Copier la configuration Apache
sudo cp apache/devfest-studio.conf /etc/apache2/sites-available/

# Éditer le fichier pour adapter à votre domaine
sudo nano /etc/apache2/sites-available/devfest-studio.conf
```

### 2. Modifier le ServerName

Dans `/etc/apache2/sites-available/devfest-studio.conf`, changez :

```apache
ServerName api.devfest-studio.com
ServerAlias www.api.devfest-studio.com
```

Par votre vrai domaine :

```apache
ServerName votre-domaine.com
ServerAlias www.votre-domaine.com
```

### 3. Activer le site

```bash
# Désactiver le site par défaut
sudo a2dissite 000-default.conf

# Activer votre site
sudo a2ensite devfest-studio.conf

# Tester la configuration
sudo apache2ctl configtest

# Si OK, redémarrer Apache
sudo systemctl restart apache2
```

### 4. Vérifier

```bash
# Vérifier qu'Apache écoute sur le port 80
sudo netstat -tlnp | grep :80

# Ou avec ss
sudo ss -tlnp | grep :80
```

## Configuration Certbot (HTTPS)

### 1. Obtenir un certificat SSL

```bash
# Lancer Certbot en mode interactif
sudo certbot --apache

# Suivre les instructions:
# 1. Entrer votre email
# 2. Accepter les conditions
# 3. Choisir votre domaine (api.devfest-studio.com)
# 4. Choisir de rediriger HTTP vers HTTPS (recommandé)
```

### 2. Configuration automatique

Certbot va automatiquement :
- ✅ Obtenir un certificat Let's Encrypt
- ✅ Configurer Apache pour HTTPS
- ✅ Créer une redirection HTTP → HTTPS
- ✅ Configurer le renouvellement automatique

### 3. Vérifier le certificat

```bash
# Tester le certificat
sudo certbot certificates

# Tester le renouvellement
sudo certbot renew --dry-run
```

### 4. Renouvellement automatique

Certbot installe automatiquement un cron job pour renouveler les certificats. Vérifier :

```bash
# Voir les timers systemd
sudo systemctl list-timers | grep certbot

# Ou voir le cron
cat /etc/cron.d/certbot
```

## Déploiement Docker

### 1. Cloner le projet

```bash
# Créer le dossier de déploiement
sudo mkdir -p /var/www/devfest-studio
cd /var/www/devfest-studio

# Cloner le repository
git clone https://github.com/TheGoatIA/devfest-studio-api.git .

# Ou si déjà cloné, pull les dernières modifications
git pull origin main
```

### 2. Configurer les variables d'environnement

```bash
# Copier l'exemple
cp .env.example .env

# Éditer les variables
nano .env
```

**Important** : Configurez ces variables :

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# MongoDB (Docker va utiliser le nom de service)
MONGODB_URI=mongodb://mongodb:27017/devfest_studio
MONGODB_DB_NAME=devfest_studio

# Redis
REDIS_URL=redis://redis:6379

# JWT & Security - CHANGEZ CES VALEURS !
JWT_SECRET=votre-secret-jwt-tres-long-et-complexe-en-production
ENCRYPTION_KEY=exactement-32-caracteres-ici!!

# Gemini AI - VOTRE CLÉ
GEMINI_API_KEY=votre-vraie-cle-gemini-api

# Autres...
MAX_FILE_SIZE=10485760
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
ENABLE_RATE_LIMIT=true
ALLOWED_ORIGINS=https://votre-domaine.com
```

### 3. Créer les dossiers nécessaires

```bash
# Créer les dossiers pour les volumes Docker
mkdir -p data/mongodb data/redis uploads logs

# Permissions
sudo chown -R $USER:$USER data/ uploads/ logs/
chmod -R 755 data/ uploads/ logs/
```

### 4. Lancer l'application

```bash
# Build et lancer
docker-compose up -d --build

# Vérifier que tout fonctionne
docker-compose ps
docker-compose logs -f
```

### 5. Vérifier le déploiement

```bash
# Tester localement
curl http://localhost:3000/api/v1/health

# Tester via Apache (HTTP)
curl http://votre-domaine.com/api/v1/health

# Tester via HTTPS
curl https://votre-domaine.com/api/v1/health
```

## Configuration DNS

Configurez vos enregistrements DNS :

### Enregistrements A

```
Type: A
Nom: @
Valeur: <IP_DE_VOTRE_SERVEUR>
TTL: 3600

Type: A
Nom: api
Valeur: <IP_DE_VOTRE_SERVEUR>
TTL: 3600
```

### Enregistrements CNAME (optionnel)

```
Type: CNAME
Nom: www.api
Valeur: api.votre-domaine.com
TTL: 3600
```

### Vérifier la propagation DNS

```bash
# Vérifier que le DNS pointe vers votre serveur
dig api.devfest-studio.com

# Ou avec nslookup
nslookup api.devfest-studio.com
```

## Monitoring et Maintenance

### Logs

```bash
# Logs Docker
docker-compose logs -f api
docker-compose logs -f mongodb
docker-compose logs -f redis

# Logs Apache
sudo tail -f /var/log/apache2/devfest-studio-access.log
sudo tail -f /var/log/apache2/devfest-studio-error.log

# Logs de l'application
tail -f logs/app.log
```

### Monitoring des services

```bash
# Statut des conteneurs
docker-compose ps

# Utilisation des ressources
docker stats

# Santé de l'application
curl https://votre-domaine.com/api/v1/health
```

### Sauvegardes

#### Sauvegarder MongoDB

```bash
# Sauvegarde manuelle
docker exec devfest-mongodb mongodump --out /tmp/backup
docker cp devfest-mongodb:/tmp/backup ./backups/$(date +%Y%m%d-%H%M%S)

# Ou utiliser le Makefile
make db-backup
```

#### Script de sauvegarde automatique

Créer `/etc/cron.daily/backup-devfest-studio` :

```bash
#!/bin/bash
cd /var/www/devfest-studio
docker exec devfest-mongodb mongodump --out /tmp/backup
docker cp devfest-mongodb:/tmp/backup ./backups/$(date +%Y%m%d)
# Garder seulement les 7 derniers jours
find ./backups -type d -mtime +7 -exec rm -rf {} \;
```

Rendre exécutable :

```bash
sudo chmod +x /etc/cron.daily/backup-devfest-studio
```

### Mises à jour

```bash
# Aller dans le dossier du projet
cd /var/www/devfest-studio

# Pull les dernières modifications
git pull origin main

# Reconstruire et redémarrer
docker-compose down
docker-compose up -d --build

# Vérifier
docker-compose ps
curl https://votre-domaine.com/api/v1/health
```

### Redémarrage des services

```bash
# Redémarrer l'application Docker
docker-compose restart api

# Redémarrer tous les services
docker-compose restart

# Redémarrer Apache
sudo systemctl restart apache2
```

## Sécurité

### Firewall (UFW)

```bash
# Installer UFW si pas déjà fait
sudo apt install -y ufw

# Autoriser SSH (IMPORTANT avant d'activer UFW!)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le firewall
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

### Fail2Ban (Protection contre les attaques)

```bash
# Installer Fail2Ban
sudo apt install -y fail2ban

# Copier la configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Éditer la configuration
sudo nano /etc/fail2ban/jail.local

# Démarrer Fail2Ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Mises à jour de sécurité

```bash
# Activer les mises à jour automatiques
sudo apt install -y unattended-upgrades

# Configurer
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Dépannage

### L'API ne répond pas

```bash
# Vérifier que Docker tourne
docker-compose ps

# Vérifier les logs
docker-compose logs api

# Vérifier qu'Apache tourne
sudo systemctl status apache2

# Tester en local
curl http://localhost:3000/api/v1/health
```

### Erreur 502 Bad Gateway

```bash
# L'API Docker n'est probablement pas accessible
# Vérifier que le conteneur tourne
docker-compose ps

# Vérifier les logs
docker-compose logs api

# Redémarrer
docker-compose restart api
```

### Certificat SSL expiré

```bash
# Renouveler manuellement
sudo certbot renew

# Redémarrer Apache
sudo systemctl restart apache2
```

### MongoDB plein

```bash
# Vérifier l'espace disque
df -h

# Nettoyer les anciennes sauvegardes
rm -rf backups/*

# Ou garder seulement les 7 derniers jours
find ./backups -type d -mtime +7 -exec rm -rf {} \;
```

### Performance lente

```bash
# Vérifier les ressources
docker stats

# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h

# Vérifier les logs pour erreurs
docker-compose logs api | grep -i error
```

## Checklist de déploiement

### Avant le déploiement

- [ ] DNS configuré et propagé
- [ ] Serveur accessible (SSH)
- [ ] Docker installé
- [ ] Apache installé
- [ ] Certbot installé
- [ ] Firewall configuré

### Configuration

- [ ] `.env` créé et configuré
- [ ] Secrets changés (JWT_SECRET, ENCRYPTION_KEY)
- [ ] GEMINI_API_KEY configuré
- [ ] Apache configuré avec le bon domaine
- [ ] SSL obtenu avec Certbot

### Déploiement

- [ ] Code pull depuis Git
- [ ] Docker Compose lancé
- [ ] Services en ligne (`docker-compose ps`)
- [ ] Health check OK (`/api/v1/health`)
- [ ] HTTPS fonctionne
- [ ] Dashboard accessible
- [ ] API documentée accessible (`/api/v1/docs`)

### Post-déploiement

- [ ] Logs vérifiés (pas d'erreurs)
- [ ] Sauvegardes configurées
- [ ] Monitoring en place
- [ ] Tests fonctionnels OK
- [ ] Performance acceptable

## Support

Pour toute question :

- 📖 Documentation : [README.md](README.md)
- 🐳 Docker : [DOCKER.md](DOCKER.md)
- 🐛 Issues : [GitHub Issues](https://github.com/TheGoatIA/devfest-studio-api/issues)
