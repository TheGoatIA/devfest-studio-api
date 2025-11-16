# Redis - Mode Optionnel

## Vue d'ensemble

Redis est **complètement optionnel** dans DevFest Studio API. L'application fonctionne normalement même si Redis n'est pas disponible ou configuré.

## Comportement sans Redis

### ✅ Fonctionnalités conservées (100% fonctionnel)

Toutes les fonctionnalités principales de l'application continuent à fonctionner :

- ✅ Authentification et sessions (stockées dans MongoDB)
- ✅ Upload de photos
- ✅ Transformations d'images avec Gemini AI
- ✅ Gestion des styles
- ✅ Galerie et favoris
- ✅ API REST complète

### ⚠️ Fonctionnalités désactivées en mode dégradé

Seules les optimisations basées sur le cache sont désactivées :

- ⚠️ **Cache de sessions** : Les sessions sont toujours validées mais directement depuis MongoDB (légèrement plus lent)
- ⚠️ **Rate limiting** : Le middleware de limitation de requêtes est désactivé (pas de protection contre les abus)

## Configuration

### Avec Redis (mode optimal)

```env
REDIS_URL=redis://localhost:6379
```

L'application utilise Redis pour :
- Cache des sessions (validation ultra-rapide)
- Rate limiting par utilisateur/IP
- Statistiques en temps réel

### Sans Redis (mode dégradé)

```env
# REDIS_URL=redis://localhost:6379  # Commenté ou absent
```

Ou si Redis n'est pas disponible, l'application :
- ✅ Démarre normalement
- ⚠️ Log un avertissement : "Redis non disponible - L'application continuera sans cache"
- ✅ Continue à fonctionner avec MongoDB uniquement

## Logs en mode dégradé

Quand Redis n'est pas disponible, vous verrez ces logs :

```
⚠️  Erreur de connexion à Redis
⚠️  Redis non disponible - L'application continuera sans cache
ℹ️  Les fonctionnalités suivantes seront désactivées: cache de sessions, rate limiting
✅ Initialisation des bases de données terminée
```

## Impact sur les performances

### Avec Redis
- Validation de session : ~1-5ms (cache)
- Rate limiting : actif

### Sans Redis
- Validation de session : ~10-50ms (MongoDB directement)
- Rate limiting : désactivé

**Note** : La différence de performance est négligeable pour la plupart des cas d'usage.

## Health Check

Le endpoint `/health` indique l'état de Redis :

```json
{
  "status": "healthy",
  "timestamp": "...",
  "databases": {
    "mongodb": true,    // ✅ Critique
    "redis": false,     // ⚠️ Optionnel
    "overall": true     // ✅ Basé uniquement sur MongoDB
  }
}
```

**Important** : Le statut `overall` est basé uniquement sur MongoDB. Redis peut être `false` sans affecter le statut global de l'application.

## Recommandations

### En développement
Redis est **optionnel**. Vous pouvez développer sans Redis installé.

### En production
Redis est **fortement recommandé** pour :
- Meilleures performances (cache de sessions)
- Protection contre les abus (rate limiting)
- Statistiques en temps réel

### Comment installer Redis

#### Docker (recommandé)
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

#### macOS
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
sudo apt install redis-server
sudo systemctl start redis
```

## Architecture technique

### Mode avec Redis
```
Client → API → Redis (cache) → MongoDB
                  ↓
            (si cache miss)
                  ↓
               MongoDB
```

### Mode sans Redis
```
Client → API → MongoDB (direct)
```

## Code - Gestion gracieuse des erreurs

Tous les appels Redis sont protégés :

```typescript
// Exemple : Cache de session
async cacheSession(sessionId: string, data: any): Promise<void> {
  try {
    await redisConnection.set(cacheKey, data, ttl);
    logger.debug('Session mise en cache');
  } catch (error) {
    // ✅ Ne bloque pas l'application
    logger.warn('Impossible de mettre en cache', { error });
  }
}
```

Toutes les méthodes Redis retournent des valeurs par défaut si non disponible :
- `get()` → `null`
- `set()` → `false`
- `del()` → `false`
- `exists()` → `false`
- `increment()` → `0`

## Questions fréquentes

### L'application démarre-t-elle sans Redis ?
✅ Oui, complètement. Seul MongoDB est requis.

### Les sessions fonctionnent-elles sans Redis ?
✅ Oui, elles sont stockées dans MongoDB.

### Les performances sont-elles affectées ?
⚠️ Légèrement (quelques millisecondes par requête), mais négligeable pour la plupart des cas.

### Le rate limiting fonctionne-t-il sans Redis ?
❌ Non, il est automatiquement désactivé en mode dégradé.

### Puis-je ajouter Redis plus tard ?
✅ Oui, il suffit de configurer `REDIS_URL` et redémarrer l'application.

## Support

Si vous rencontrez des problèmes avec Redis :
1. Vérifiez que `REDIS_URL` est correct dans `.env`
2. Vérifiez que Redis est démarré : `redis-cli ping` (devrait retourner `PONG`)
3. Consultez les logs de l'application pour plus de détails

Si Redis n'est pas critique pour vous, vous pouvez simplement l'ignorer et utiliser l'application en mode dégradé.
