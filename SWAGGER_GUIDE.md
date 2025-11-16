# 📚 Guide Swagger - DevFest Studio API

## 🎯 Accès à la Documentation

### Local Development
```
http://localhost:8080/api/v1/docs
```

### Production
```
https://your-domain.com/api/v1/docs
```

### Export JSON
```
http://localhost:8080/api/v1/docs.json
```

---

## 🚀 Démarrage Rapide

### 1. Lancer le Serveur

```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

### 2. Ouvrir Swagger UI

Naviguer vers `http://localhost:8080/api/v1/docs` dans votre navigateur.

---

## 🔐 Authentification dans Swagger

### Étape 1: Créer une Session

1. Aller à la section **Auth**
2. Cliquer sur `POST /auth/session`
3. Cliquer sur "Try it out"
4. Entrer les données:

```json
{
  "device_id": "test-device-123",
  "device_info": {
    "platform": "android",
    "version": "13",
    "model": "Test Device",
    "appVersion": "1.0.0"
  }
}
```

5. Cliquer sur "Execute"
6. **Copier le `sessionToken`** de la réponse

### Étape 2: Autoriser Swagger

1. Cliquer sur le bouton **"Authorize" 🔓** en haut à droite
2. Dans le champ "Value", entrer:
   ```
   Bearer votre_session_token_ici
   ```
   (Exemple: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
3. Cliquer sur "Authorize"
4. Fermer le dialogue

✅ Vous êtes maintenant authentifié! Tous les endpoints protégés sont accessibles.

---

## 📸 Guide de Test des Endpoints

### 1. Upload une Photo

**Endpoint:** `POST /upload`

1. Cliquer sur "Try it out"
2. Cliquer sur "Choose File"
3. Sélectionner une image (JPG, PNG, HEIC, WebP, max 10MB)
4. Cliquer sur "Execute"
5. **Noter le `photoId`** retourné

### 2. Lister les Styles Disponibles

**Endpoint:** `GET /styles`

1. Cliquer sur "Try it out"
2. (Optionnel) Filtrer par catégorie: `tech`, `artistic`, `professional`, `creative`
3. Cliquer sur "Execute"
4. **Noter un `styleId`** (ex: `style_cyberpunk`)

### 3. Lancer une Transformation

**Endpoint:** `POST /transform`

1. Utiliser les IDs obtenus précédemment
2. Entrer le body:

```json
{
  "photoId": "photo_123456",
  "styleId": "style_cyberpunk",
  "quality": "standard"
}
```

3. Cliquer sur "Execute"
4. **Noter le `transformationId`** retourné

### 4. Vérifier le Statut

**Endpoint:** `GET /transformation/{id}/status`

1. Entrer le `transformationId`
2. Cliquer sur "Execute"
3. Vérifier le `status`: `queued` → `processing` → `completed`

### 5. Obtenir le Résultat

**Endpoint:** `GET /transformation/{id}`

1. Entrer le `transformationId`
2. Cliquer sur "Execute"
3. Récupérer les URLs des images transformées

---

## 📋 Liste Complète des Endpoints

### 🔐 Auth
- `POST /auth/session` - Créer session *(public)*
- `POST /auth/validate` - Valider token
- `POST /auth/refresh` - Rafraîchir token
- `DELETE /auth/revoke` - Révoquer session

### 📸 Photos
- `POST /upload` - Upload photo
- `GET /photos` - Lister photos
- `GET /photos/{id}` - Détails photo
- `DELETE /photos/{id}` - Supprimer photo

### 🎭 Styles
- `GET /styles` - Tous les styles *(public)*
- `GET /styles/popular` - Styles populaires *(public)*
- `GET /styles/category/{category}` - Par catégorie *(public)*
- `GET /styles/{id}` - Détails style *(public)*

### 🎨 Transformations
- `POST /transform` - Lancer transformation
- `GET /transformation/{id}/status` - Vérifier statut
- `GET /transformation/{id}` - Obtenir résultat
- `DELETE /transformation/{id}` - Annuler transformation

### 🖼️ Gallery
- `GET /gallery` - Galerie utilisateur
- `POST /favorites` - Ajouter favoris
- `DELETE /favorites/{id}` - Retirer favoris

### ⚙️ System
- `GET /health` - Health check *(public)*
- `GET /info` - Info API *(public)*
- `GET /ping` - Ping test *(public)*

---

## 🎨 Styles Disponibles

### 1. **Cyberpunk** 🌃
- **ID:** `style_cyberpunk`
- **Category:** tech
- **Tier:** premium (3 credits)
- **Description:** Neon-drenched cityscapes and futuristic vibes

### 2. **Fantasy Art** 🧙
- **ID:** `style_fantasy`
- **Category:** artistic
- **Tier:** premium (3 credits)
- **Description:** Epic fantasy worlds with magic and wonder

### 3. **Watercolor** 🎨
- **ID:** `style_watercolor`
- **Category:** artistic
- **Tier:** free
- **Description:** Soft, flowing watercolor painting style

### 4. **Pixel Art** 👾
- **ID:** `style_pixel`
- **Category:** creative
- **Tier:** free
- **Description:** Retro 8-bit and 16-bit pixel art style

### 5. **Pro Headshot** 👔
- **ID:** `style_headshot`
- **Category:** professional
- **Tier:** free
- **Description:** Studio-quality professional headshots

### 6. **Film Noir** 🎬
- **ID:** `style_noir`
- **Category:** creative
- **Tier:** free
- **Description:** Classic black and white detective movie aesthetic

### 7. **Vintage Photo** 📷
- **ID:** `style_vintage`
- **Category:** creative
- **Tier:** free
- **Description:** Nostalgic aged photograph with retro tones

### 8. **Product Shot** 📦
- **ID:** `style_product`
- **Category:** professional
- **Tier:** free
- **Description:** Clean commercial product photography style

---

## 🔍 Filtres et Paramètres

### Pagination

```
GET /photos?page=1&limit=20
GET /gallery?page=2&limit=10
```

### Filtres de Galerie

```
GET /gallery?status=completed
GET /gallery?category=artistic
GET /gallery?isFavorite=true
GET /gallery?sortBy=createdAt&sortOrder=desc
```

### Filtres de Styles

```
GET /styles?category=tech
GET /styles?isPremium=true
GET /styles?search=cyber
```

---

## 🧪 Tests avec Curl

### Créer une Session

```bash
curl -X POST http://localhost:8080/api/v1/auth/session \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-123",
    "device_info": {
      "platform": "android",
      "version": "13",
      "model": "Test",
      "appVersion": "1.0.0"
    }
  }'
```

### Upload une Photo

```bash
curl -X POST http://localhost:8080/api/v1/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@/path/to/image.jpg"
```

### Lancer une Transformation

```bash
curl -X POST http://localhost:8080/api/v1/transform \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "photoId": "photo_123",
    "styleId": "style_cyberpunk",
    "quality": "standard"
  }'
```

---

## 📊 Codes de Statut HTTP

| Code | Signification | Description |
|------|---------------|-------------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée |
| 202 | Accepted | Traitement accepté (async) |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Token manquant/invalide |
| 402 | Payment Required | Quota épuisé |
| 403 | Forbidden | Accès refusé |
| 404 | Not Found | Ressource introuvable |
| 429 | Too Many Requests | Rate limit dépassé |
| 500 | Internal Error | Erreur serveur |

---

## 🛠️ Intégration dans votre App

### JavaScript/TypeScript

```typescript
const API_BASE_URL = 'http://localhost:8080/api/v1';

// Créer une session
const createSession = async (deviceId: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_id: deviceId,
      device_info: {
        platform: 'web',
        version: '1.0',
        model: 'Browser',
        appVersion: '1.0.0',
      },
    }),
  });

  const data = await response.json();
  return data.data.sessionToken;
};

// Lancer une transformation
const transformImage = async (token: string, photoId: string, styleId: string) => {
  const response = await fetch(`${API_BASE_URL}/transform`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photoId, styleId, quality: 'standard' }),
  });

  return await response.json();
};
```

### Python

```python
import requests

API_BASE_URL = 'http://localhost:8080/api/v1'

# Créer une session
def create_session(device_id):
    response = requests.post(f'{API_BASE_URL}/auth/session', json={
        'device_id': device_id,
        'device_info': {
            'platform': 'python',
            'version': '3.9',
            'model': 'Script',
            'appVersion': '1.0.0'
        }
    })
    return response.json()['data']['sessionToken']

# Lancer une transformation
def transform_image(token, photo_id, style_id):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(f'{API_BASE_URL}/transform',
        headers=headers,
        json={'photoId': photo_id, 'styleId': style_id, 'quality': 'standard'}
    )
    return response.json()
```

---

## 🎓 Tips & Best Practices

### ✅ DO
- Toujours vérifier le `status` avant de récupérer le résultat
- Utiliser la pagination pour les listes
- Gérer les erreurs 429 avec retry + backoff
- Stocker le `refreshToken` en sécurité
- Valider les uploads (format, taille)

### ❌ DON'T
- Ne jamais exposer les tokens dans les logs
- Ne pas faire de polling trop fréquent (max 1 req/sec)
- Ne pas uploader d'images > 10MB
- Ne pas oublier d'annuler les transformations inutilisées

---

## 📞 Support

- **Documentation complète:** `/api/v1/docs`
- **Swagger JSON:** `/api/v1/docs.json`
- **Health Check:** `/api/v1/health`
- **Issues:** GitHub Issues

---

**Développé avec ❤️ pour DevFest Douala 2024**
