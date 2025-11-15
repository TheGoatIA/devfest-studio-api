# 🔒 Guide Apache + Certbot - DevFest Studio API

Guide rapide pour configurer Apache comme reverse proxy avec SSL/TLS via Certbot.

## 📋 Vue d'ensemble

Cette configuration place Apache en reverse proxy devant Docker :

```
Internet (HTTPS) → Apache (Port 443) → Docker (localhost:3000)
```

**Avantages** :
- ✅ SSL/TLS géré par Certbot (gratuit, auto-renouvelé)
- ✅ Apache optimisé pour servir les fichiers statiques
- ✅ Docker reste isolé et sécurisé
- ✅ Facile à maintenir et à mettre à jour

## ⚡ Installation rapide

### 1. Installer Apache et Certbot

```bash
# Installer Apache
sudo apt update
sudo apt install -y apache2

# Activer les modules nécessaires
sudo a2enmod proxy proxy_http headers rewrite ssl

# Installer Certbot
sudo apt install -y certbot python3-certbot-apache
```

### 2. Configurer Apache

```bash
# Copier la configuration
sudo cp apache/devfest-studio.conf /etc/apache2/sites-available/

# Éditer pour votre domaine
sudo nano /etc/apache2/sites-available/devfest-studio.conf
# Changez: ServerName api.devfest-studio.com
# Par:     ServerName votre-domaine.com

# Activer le site
sudo a2ensite devfest-studio.conf
sudo a2dissite 000-default.conf

# Tester et redémarrer
sudo apache2ctl configtest
sudo systemctl restart apache2
```

### 3. Obtenir le certificat SSL

```bash
# Lancer Certbot
sudo certbot --apache

# Suivre les instructions:
# 1. Entrez votre email
# 2. Acceptez les conditions
# 3. Sélectionnez votre domaine
# 4. Choisissez de rediriger HTTP → HTTPS
```

C'est tout ! 🎉 Certbot configure automatiquement Apache pour HTTPS.

## 🔧 Configuration détaillée

### Structure de la configuration

Le fichier `apache/devfest-studio.conf` contient :

#### VirtualHost HTTP (Port 80)
```apache
<VirtualHost *:80>
    ServerName api.devfest-studio.com

    # Proxy vers Docker
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # Support WebSocket (dashboard temps réel)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)  ws://localhost:3000/$1 [P,L]
</VirtualHost>
```

#### VirtualHost HTTPS (Port 443)
Après l'exécution de Certbot, il sera automatiquement configuré avec :
- Certificat SSL Let's Encrypt
- Redirection HTTP → HTTPS
- Headers de sécurité (HSTS, etc.)

### Options de configuration

#### Option 1 : Laisser Docker servir les uploads

```apache
<Location /uploads>
    ProxyPass http://localhost:3000/uploads
    ProxyPassReverse http://localhost:3000/uploads
</Location>
```

**Avantages** : Simple, pas de configuration supplémentaire
**Inconvénients** : Moins performant pour beaucoup de fichiers

#### Option 2 : Apache sert les uploads directement

```apache
Alias /uploads /var/www/devfest-studio/uploads
<Directory /var/www/devfest-studio/uploads>
    Require all granted
    Options -Indexes +FollowSymLinks
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresDefault "access plus 7 days"
    </IfModule>
</Directory>
```

**Avantages** : Très performant, cache activé
**Inconvénients** : Doit monter le volume uploads sur l'hôte

Pour utiliser l'option 2 :
```bash
# Créer le lien symbolique
sudo ln -s /var/www/devfest-studio/uploads /var/www/devfest-studio/uploads

# Donner les permissions
sudo chown -R www-data:www-data /var/www/devfest-studio/uploads
```

## 🔐 Sécurité

### Headers de sécurité

Apache ajoute automatiquement ces headers :

```apache
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "no-referrer-when-downgrade"
Header always set Strict-Transport-Security "max-age=31536000" (HTTPS)
```

### Firewall

```bash
# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le firewall
sudo ufw enable
```

## 🔄 Renouvellement automatique

Certbot installe automatiquement un timer systemd :

```bash
# Vérifier le timer
sudo systemctl list-timers | grep certbot

# Tester le renouvellement (dry-run)
sudo certbot renew --dry-run

# Renouveler manuellement si besoin
sudo certbot renew
```

Le renouvellement se fait automatiquement tous les 60 jours.

## 📊 Monitoring

### Vérifier le certificat

```bash
# Via Certbot
sudo certbot certificates

# Via OpenSSL
openssl s_client -connect votre-domaine.com:443 -servername votre-domaine.com

# Via curl
curl -vI https://votre-domaine.com
```

### Logs Apache

```bash
# Logs d'accès
sudo tail -f /var/log/apache2/devfest-studio-access.log

# Logs d'erreur
sudo tail -f /var/log/apache2/devfest-studio-error.log

# Logs SSL
sudo tail -f /var/log/apache2/devfest-studio-ssl-access.log
sudo tail -f /var/log/apache2/devfest-studio-ssl-error.log
```

## 🚨 Dépannage

### Erreur 502 Bad Gateway

**Cause** : Apache ne peut pas joindre Docker

**Solution** :
```bash
# Vérifier que Docker tourne
docker-compose ps

# Vérifier que l'API répond
curl http://localhost:3000/api/v1/health

# Vérifier la config Apache
sudo apache2ctl -t
```

### Certificat non valide

**Cause** : Certbot n'a pas pu obtenir le certificat

**Solutions** :
```bash
# Vérifier que le DNS pointe vers votre serveur
dig votre-domaine.com

# Vérifier qu'Apache écoute sur le port 80
sudo netstat -tlnp | grep :80

# Vérifier les logs Certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log

# Réessayer avec verbose
sudo certbot --apache --verbose
```

### Redirection infinie

**Cause** : Configuration de redirection HTTPS incorrecte

**Solution** :
```bash
# Éditer la config
sudo nano /etc/apache2/sites-available/devfest-studio-le-ssl.conf

# S'assurer qu'il n'y a pas de double redirection
# Redémarrer Apache
sudo systemctl restart apache2
```

## 📝 Commandes utiles

```bash
# Redémarrer Apache
sudo systemctl restart apache2

# Recharger la config (sans downtime)
sudo systemctl reload apache2

# Vérifier la syntaxe
sudo apache2ctl -t
sudo apache2ctl configtest

# Voir les sites activés
ls -la /etc/apache2/sites-enabled/

# Voir les modules activés
apache2ctl -M

# Tester SSL
openssl s_client -connect votre-domaine.com:443

# Forcer le renouvellement Certbot
sudo certbot renew --force-renewal
```

## 🎯 Checklist de déploiement

Avant de passer en production :

- [ ] DNS configuré (A record vers IP du serveur)
- [ ] Apache installé et configuré
- [ ] Modules Apache activés (proxy, ssl, headers, rewrite)
- [ ] Configuration Apache testée (`apache2ctl -t`)
- [ ] Docker lancé (`docker-compose ps`)
- [ ] API accessible localement (`curl localhost:3000/api/v1/health`)
- [ ] Certbot exécuté avec succès
- [ ] HTTPS fonctionne (`curl https://votre-domaine.com`)
- [ ] Redirection HTTP → HTTPS active
- [ ] WebSocket fonctionne (dashboard temps réel)
- [ ] Firewall configuré (UFW)
- [ ] Timer de renouvellement Certbot actif

## 🔗 Ressources

- [Documentation Apache](https://httpd.apache.org/docs/)
- [Documentation Certbot](https://certbot.eff.org/)
- [Let's Encrypt](https://letsencrypt.org/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)

## 📚 Voir aussi

- [DEPLOYMENT.md](DEPLOYMENT.md) - Guide complet de déploiement
- [DOCKER.md](DOCKER.md) - Guide Docker détaillé
- [README.md](README.md) - Documentation principale
