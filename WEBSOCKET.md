# 🔌 Documentation WebSocket/SSE - DevFest Studio API

Guide complet pour intégrer les événements temps réel dans votre application mobile ou web.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Événements disponibles](#événements-disponibles)
- [Connexion au flux](#connexion-au-flux)
- [Exemples d'intégration](#exemples-dintégration)
- [Authentification](#authentification)
- [Gestion des erreurs](#gestion-des-erreurs)
- [Bonnes pratiques](#bonnes-pratiques)
- [Tests](#tests)

## Vue d'ensemble

L'API DevFest Studio utilise **Server-Sent Events (SSE)** pour envoyer des notifications en temps réel aux clients. Les SSE sont parfaits pour les notifications unidirectionnelles (serveur → client) comme :

- ✅ Notification quand une photo est uploadée
- ✅ Notification quand une transformation démarre
- ✅ Notification quand une transformation est terminée
- ✅ Notification d'erreur de transformation

**SSE vs WebSocket** :
- SSE : Unidirectionnel (serveur → client), plus simple, reconnexion auto
- WebSocket : Bidirectionnel (serveur ↔ client), plus complexe

Pour DevFest Studio, SSE est idéal car on n'a besoin que de notifications du serveur vers le client.

## Architecture

```
Client (Mobile/Web)
       ↓
  Connexion SSE
       ↓
  GET /api/v1/events/stream
       ↓
  Serveur écoute les événements
       ↓
  Envoie les événements au client
  (format: event: nom\ndata: JSON\n\n)
```

### Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/v1/events/stream` | GET | Flux SSE des événements temps réel |
| `/api/v1/events/stats` | GET | Statistiques des événements récents |
| `/api/v1/transformations/recent` | GET | Liste des transformations récentes |

## Événements disponibles

### 1. `photo.uploaded`

Émis quand une photo est uploadée avec succès.

**Données** :
```json
{
  "event": "photo.uploaded",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "userId": "user123",
  "data": {
    "photoId": "photo-abc123",
    "userId": "user123",
    "photoUrl": "https://api.devfest-studio.com/uploads/photos/photo-abc123.jpg",
    "thumbnailUrl": "https://api.devfest-studio.com/uploads/photos/thumbnails/photo-abc123.jpg"
  }
}
```

### 2. `photo.deleted`

Émis quand une photo est supprimée.

**Données** :
```json
{
  "event": "photo.deleted",
  "timestamp": "2024-01-15T10:35:00.000Z",
  "userId": "user123",
  "data": {
    "photoId": "photo-abc123",
    "userId": "user123"
  }
}
```

### 3. `transformation.started`

Émis quand une transformation d'image commence.

**Données** :
```json
{
  "event": "transformation.started",
  "timestamp": "2024-01-15T10:40:00.000Z",
  "userId": "user123",
  "data": {
    "transformationId": "trans-xyz789",
    "userId": "user123",
    "photoId": "photo-abc123",
    "styleId": "vintage"
  }
}
```

### 4. `transformation.completed`

Émis quand une transformation est terminée avec succès.

**Données** :
```json
{
  "event": "transformation.completed",
  "timestamp": "2024-01-15T10:42:00.000Z",
  "userId": "user123",
  "data": {
    "transformationId": "trans-xyz789",
    "userId": "user123",
    "photoId": "photo-abc123",
    "styleId": "vintage",
    "resultUrl": "https://api.devfest-studio.com/uploads/transformations/trans-xyz789.jpg"
  }
}
```

### 5. `transformation.failed`

Émis quand une transformation échoue.

**Données** :
```json
{
  "event": "transformation.failed",
  "timestamp": "2024-01-15T10:42:00.000Z",
  "userId": "user123",
  "data": {
    "transformationId": "trans-xyz789",
    "userId": "user123",
    "error": "AI service unavailable"
  }
}
```

## Connexion au flux

### Format de la connexion

```http
GET /api/v1/events/stream HTTP/1.1
Host: api.devfest-studio.com
Accept: text/event-stream
Cache-Control: no-cache
Authorization: Bearer YOUR_JWT_TOKEN
```

### Format des messages SSE

```
event: transformation.completed
data: {"transformationId":"trans-xyz789","userId":"user123","photoId":"photo-abc123","styleId":"vintage","resultUrl":"https://..."}

event: transformation.started
data: {"transformationId":"trans-abc456","userId":"user123","photoId":"photo-def456","styleId":"modern"}
```

## Exemples d'intégration

### JavaScript Vanilla

```javascript
// Connexion au flux SSE
const eventSource = new EventSource('https://api.devfest-studio.com/api/v1/events/stream');

// Écouter tous les événements
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Événement reçu:', data);
};

// Écouter un événement spécifique
eventSource.addEventListener('transformation.completed', (event) => {
  const data = JSON.parse(event.data);
  console.log('Transformation terminée:', data);

  // Afficher une notification
  showNotification({
    title: 'Transformation terminée!',
    message: 'Votre image est prête',
    image: data.data.resultUrl
  });
});

// Gestion des erreurs
eventSource.onerror = (error) => {
  console.error('Erreur SSE:', error);

  // Reconnexion automatique après 5 secondes
  setTimeout(() => {
    eventSource.close();
    // Recréer la connexion
  }, 5000);
};

// Fermer la connexion quand l'utilisateur quitte
window.addEventListener('beforeunload', () => {
  eventSource.close();
});
```

### React

```jsx
import { useEffect, useState } from 'react';

function useRealtimeEvents() {
  const [events, setEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('https://api.devfest-studio.com/api/v1/events/stream');

    eventSource.onopen = () => {
      console.log('✅ Connexion SSE établie');
      setIsConnected(true);
    };

    // Écouter les transformations terminées
    eventSource.addEventListener('transformation.completed', (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [data, ...prev]);

      // Afficher une notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Transformation terminée!', {
          body: 'Votre image est prête',
          icon: data.data.resultUrl
        });
      }
    });

    eventSource.onerror = (error) => {
      console.error('❌ Erreur SSE:', error);
      setIsConnected(false);
    };

    // Cleanup
    return () => {
      eventSource.close();
    };
  }, []);

  return { events, isConnected };
}

// Utilisation dans un composant
function TransformationsPage() {
  const { events, isConnected } = useRealtimeEvents();

  return (
    <div>
      <div className="status">
        {isConnected ? '🟢 Connecté' : '🔴 Déconnecté'}
      </div>

      <div className="events">
        {events.map((event, index) => (
          <div key={index} className="event">
            <img src={event.data.resultUrl} alt="Transformation" />
            <p>{event.event}</p>
            <span>{new Date(event.timestamp).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### React Native

```javascript
// Utiliser react-native-sse
import EventSource from 'react-native-sse';

function useRealtimeEvents() {
  const [events, setEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource('https://api.devfest-studio.com/api/v1/events/stream', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    es.addEventListener('open', () => {
      console.log('✅ Connexion SSE établie');
      setIsConnected(true);
    });

    es.addEventListener('transformation.completed', (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [data, ...prev]);

      // Notification push
      PushNotification.localNotification({
        title: 'Transformation terminée!',
        message: 'Votre image est prête',
        picture: data.data.resultUrl
      });
    });

    es.addEventListener('error', (error) => {
      console.error('❌ Erreur SSE:', error);
      setIsConnected(false);
    });

    return () => {
      es.close();
    };
  }, [authToken]);

  return { events, isConnected };
}
```

### Vue.js

```vue
<template>
  <div>
    <div class="status">
      <span v-if="isConnected">🟢 Connecté</span>
      <span v-else>🔴 Déconnecté</span>
    </div>

    <div class="events">
      <div v-for="event in events" :key="event.timestamp" class="event">
        <img :src="event.data.resultUrl" alt="Transformation" />
        <p>{{ event.event }}</p>
        <span>{{ formatDate(event.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      events: [],
      isConnected: false,
      eventSource: null
    };
  },

  mounted() {
    this.connectSSE();
  },

  beforeUnmount() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  },

  methods: {
    connectSSE() {
      this.eventSource = new EventSource('https://api.devfest-studio.com/api/v1/events/stream');

      this.eventSource.onopen = () => {
        console.log('✅ Connexion SSE établie');
        this.isConnected = true;
      };

      this.eventSource.addEventListener('transformation.completed', (event) => {
        const data = JSON.parse(event.data);
        this.events.unshift(data);
        this.$notify({
          title: 'Transformation terminée!',
          message: 'Votre image est prête'
        });
      });

      this.eventSource.onerror = (error) => {
        console.error('❌ Erreur SSE:', error);
        this.isConnected = false;

        // Reconnexion après 5 secondes
        setTimeout(() => {
          this.connectSSE();
        }, 5000);
      };
    },

    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString();
    }
  }
};
</script>
```

### iOS (Swift)

```swift
import Foundation

class RealtimeEventsManager {
    private var eventSource: EventSource?
    private let baseURL = "https://api.devfest-studio.com"

    func connect(token: String) {
        let url = URL(string: "\(baseURL)/api/v1/events/stream")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        eventSource = EventSource(request: request)

        eventSource?.onOpen {
            print("✅ Connexion SSE établie")
        }

        eventSource?.addEventListener("transformation.completed") { (id, event, data) in
            guard let data = data,
                  let jsonData = data.data(using: .utf8),
                  let json = try? JSONDecoder().decode(TransformationEvent.self, from: jsonData) else {
                return
            }

            // Afficher une notification
            self.showNotification(
                title: "Transformation terminée!",
                body: "Votre image est prête",
                imageUrl: json.data.resultUrl
            )
        }

        eventSource?.onError { error in
            print("❌ Erreur SSE: \(error)")
        }
    }

    func disconnect() {
        eventSource?.disconnect()
    }

    private func showNotification(title: String, body: String, imageUrl: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body

        // Télécharger et attacher l'image
        if let url = URL(string: imageUrl) {
            URLSession.shared.dataTask(with: url) { data, response, error in
                guard let data = data else { return }

                let attachment = try? UNNotificationAttachment(
                    identifier: "image",
                    url: self.saveImageToTempDirectory(data),
                    options: nil
                )

                if let attachment = attachment {
                    content.attachments = [attachment]
                }

                let request = UNNotificationRequest(
                    identifier: UUID().uuidString,
                    content: content,
                    trigger: nil
                )

                UNUserNotificationCenter.current().add(request)
            }.resume()
        }
    }
}

// Modèles
struct TransformationEvent: Codable {
    let event: String
    let timestamp: String
    let userId: String
    let data: TransformationData
}

struct TransformationData: Codable {
    let transformationId: String
    let photoId: String
    let styleId: String
    let resultUrl: String
}
```

### Android (Kotlin)

```kotlin
import okhttp3.*
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import com.google.gson.Gson

class RealtimeEventsManager(private val token: String) {
    private val baseUrl = "https://api.devfest-studio.com"
    private val client = OkHttpClient()
    private var eventSource: EventSource? = null

    fun connect() {
        val request = Request.Builder()
            .url("$baseUrl/api/v1/events/stream")
            .header("Authorization", "Bearer $token")
            .build()

        eventSource = EventSources.createFactory(client)
            .newEventSource(request, object : EventSourceListener() {
                override fun onOpen(eventSource: EventSource, response: Response) {
                    println("✅ Connexion SSE établie")
                }

                override fun onEvent(
                    eventSource: EventSource,
                    id: String?,
                    type: String?,
                    data: String
                ) {
                    when (type) {
                        "transformation.completed" -> {
                            val event = Gson().fromJson(data, TransformationEvent::class.java)
                            showNotification(
                                title = "Transformation terminée!",
                                message = "Votre image est prête",
                                imageUrl = event.data.resultUrl
                            )
                        }

                        "transformation.failed" -> {
                            val event = Gson().fromJson(data, TransformationEvent::class.java)
                            showNotification(
                                title = "Erreur de transformation",
                                message = event.data.error ?: "Une erreur est survenue"
                            )
                        }
                    }
                }

                override fun onFailure(
                    eventSource: EventSource,
                    t: Throwable?,
                    response: Response?
                ) {
                    println("❌ Erreur SSE: ${t?.message}")

                    // Reconnexion après 5 secondes
                    Handler(Looper.getMainLooper()).postDelayed({
                        connect()
                    }, 5000)
                }
            })
    }

    fun disconnect() {
        eventSource?.cancel()
    }

    private fun showNotification(title: String, message: String, imageUrl: String? = null) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE)
            as NotificationManager

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        // Charger l'image si fournie
        imageUrl?.let { url ->
            val bitmap = Glide.with(context)
                .asBitmap()
                .load(url)
                .submit()
                .get()

            builder.setLargeIcon(bitmap)
                .setStyle(NotificationCompat.BigPictureStyle()
                    .bigPicture(bitmap))
        }

        notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
    }
}

// Modèles
data class TransformationEvent(
    val event: String,
    val timestamp: String,
    val userId: String,
    val data: TransformationData
)

data class TransformationData(
    val transformationId: String,
    val photoId: String,
    val styleId: String,
    val resultUrl: String?,
    val error: String?
)
```

### Flutter

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class RealtimeEventsManager {
  final String baseUrl = 'https://api.devfest-studio.com';
  final String token;
  http.Client? _client;

  RealtimeEventsManager(this.token);

  Stream<Map<String, dynamic>> connect() async* {
    _client = http.Client();

    final request = http.Request(
      'GET',
      Uri.parse('$baseUrl/api/v1/events/stream'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    request.headers['Accept'] = 'text/event-stream';

    final response = await _client!.send(request);

    await for (var chunk in response.stream.transform(utf8.decoder)) {
      final lines = chunk.split('\n');

      for (var line in lines) {
        if (line.startsWith('data: ')) {
          final data = line.substring(6);
          try {
            final json = jsonDecode(data);
            yield json;
          } catch (e) {
            print('Erreur parsing JSON: $e');
          }
        }
      }
    }
  }

  void disconnect() {
    _client?.close();
  }
}

// Utilisation
class TransformationsPage extends StatefulWidget {
  @override
  _TransformationsPageState createState() => _TransformationsPageState();
}

class _TransformationsPageState extends State<TransformationsPage> {
  late RealtimeEventsManager _eventsManager;
  List<Map<String, dynamic>> _events = [];

  @override
  void initState() {
    super.initState();
    _eventsManager = RealtimeEventsManager(token);
    _listenToEvents();
  }

  void _listenToEvents() {
    _eventsManager.connect().listen((event) {
      setState(() {
        _events.insert(0, event);
      });

      if (event['event'] == 'transformation.completed') {
        _showNotification(
          title: 'Transformation terminée!',
          body: 'Votre image est prête',
          imageUrl: event['data']['resultUrl'],
        );
      }
    });
  }

  @override
  void dispose() {
    _eventsManager.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: _events.length,
      itemBuilder: (context, index) {
        final event = _events[index];
        return ListTile(
          leading: Image.network(event['data']['resultUrl']),
          title: Text(event['event']),
          subtitle: Text(event['timestamp']),
        );
      },
    );
  }
}
```

## Authentification

### Avec JWT Token

Si votre API nécessite une authentification, ajoutez le token JWT dans les headers :

#### JavaScript (non supporté par défaut)

EventSource ne supporte pas les headers personnalisés. Utilisez une bibliothèque :

```bash
npm install eventsource
```

```javascript
const EventSource = require('eventsource');

const eventSource = new EventSource('https://api.devfest-studio.com/api/v1/events/stream', {
  headers: {
    'Authorization': `Bearer ${yourJwtToken}`
  }
});
```

#### Alternative : Token dans l'URL (moins sécurisé)

```javascript
const token = 'your-jwt-token';
const eventSource = new EventSource(`https://api.devfest-studio.com/api/v1/events/stream?token=${token}`);
```

⚠️ **Note** : L'API actuelle accepte les connexions sans authentification. Vérifiez avec votre backend si l'authentification est requise.

## Gestion des erreurs

### Reconnexion automatique

```javascript
class SSEManager {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
  }

  connect() {
    this.eventSource = new EventSource(this.url);

    this.eventSource.onopen = () => {
      console.log('✅ Connexion établie');
      this.reconnectDelay = 1000; // Reset delay
    };

    this.eventSource.onerror = (error) => {
      console.error('❌ Erreur SSE:', error);
      this.eventSource.close();
      this.reconnect();
    };

    // Écouter les événements
    this.eventSource.addEventListener('transformation.completed', (event) => {
      const data = JSON.parse(event.data);
      this.handleEvent(data);
    });
  }

  reconnect() {
    console.log(`🔄 Reconnexion dans ${this.reconnectDelay}ms...`);

    setTimeout(() => {
      this.connect();

      // Exponential backoff
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
    }, this.reconnectDelay);
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }

  handleEvent(data) {
    // Traiter l'événement
    console.log('Événement reçu:', data);
  }
}

// Utilisation
const manager = new SSEManager('https://api.devfest-studio.com/api/v1/events/stream');
manager.connect();
```

### Gestion du timeout

```javascript
class SSEManager {
  constructor(url, timeout = 60000) {
    this.url = url;
    this.timeout = timeout;
    this.timeoutId = null;
  }

  connect() {
    this.eventSource = new EventSource(this.url);
    this.resetTimeout();

    this.eventSource.onmessage = (event) => {
      this.resetTimeout(); // Reset timeout à chaque message
      const data = JSON.parse(event.data);
      this.handleEvent(data);
    };

    this.eventSource.onerror = (error) => {
      clearTimeout(this.timeoutId);
      this.reconnect();
    };
  }

  resetTimeout() {
    clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(() => {
      console.warn('⏰ Timeout - Aucun message reçu');
      this.eventSource.close();
      this.reconnect();
    }, this.timeout);
  }
}
```

## Bonnes pratiques

### 1. Filtrer les événements par userId

```javascript
eventSource.addEventListener('transformation.completed', (event) => {
  const data = JSON.parse(event.data);

  // Ne traiter que les événements de l'utilisateur connecté
  if (data.userId === currentUserId) {
    handleTransformationCompleted(data);
  }
});
```

### 2. Gérer le cycle de vie de l'application

```javascript
// React Native
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      // App au premier plan - connecter SSE
      connectSSE();
    } else if (nextAppState === 'background') {
      // App en arrière-plan - déconnecter SSE
      disconnectSSE();
    }
  });

  return () => subscription.remove();
}, []);
```

### 3. Mettre en cache les événements

```javascript
const eventCache = [];
const MAX_CACHE_SIZE = 100;

function handleEvent(data) {
  // Ajouter au cache
  eventCache.unshift(data);

  // Limiter la taille du cache
  if (eventCache.length > MAX_CACHE_SIZE) {
    eventCache.pop();
  }

  // Sauvegarder dans le stockage local
  localStorage.setItem('events', JSON.stringify(eventCache));
}
```

### 4. Afficher un indicateur de connexion

```jsx
function ConnectionStatus({ isConnected }) {
  return (
    <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
      <span className="dot" />
      {isConnected ? 'Connecté' : 'Déconnecté'}
    </div>
  );
}
```

## Tests

### Test manuel avec curl

```bash
# Connexion au flux SSE
curl -N -H "Accept: text/event-stream" \
  https://api.devfest-studio.com/api/v1/events/stream

# Avec authentification
curl -N -H "Accept: text/event-stream" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.devfest-studio.com/api/v1/events/stream
```

### Test avec websocat

```bash
# Installer websocat
cargo install websocat

# Se connecter
websocat -H="Accept: text/event-stream" \
  https://api.devfest-studio.com/api/v1/events/stream
```

### Test dans le navigateur

Ouvrez la console du navigateur et exécutez :

```javascript
const es = new EventSource('https://api.devfest-studio.com/api/v1/events/stream');

es.onopen = () => console.log('✅ Connecté');
es.onerror = (e) => console.error('❌ Erreur:', e);
es.onmessage = (e) => console.log('📨 Message:', e.data);

// Écouter un événement spécifique
es.addEventListener('transformation.completed', (e) => {
  console.log('✨ Transformation terminée:', JSON.parse(e.data));
});
```

### Test du dashboard

L'API fournit un dashboard de test accessible à :

```
https://api.devfest-studio.com/dashboard
```

Ce dashboard montre en temps réel toutes les transformations qui se déroulent.

## Statistiques

### Obtenir les statistiques

```bash
curl https://api.devfest-studio.com/api/v1/events/stats
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "totalEvents": 150,
    "eventsByType": {
      "transformation.completed": 50,
      "transformation.started": 60,
      "transformation.failed": 5,
      "photo.uploaded": 30,
      "photo.deleted": 5
    },
    "activeConnections": 3
  }
}
```

## Dépannage

### Problème : Pas de connexion

**Solutions** :
1. Vérifier que l'API est accessible : `curl https://api.devfest-studio.com/api/v1/health`
2. Vérifier le CORS : le serveur doit autoriser votre domaine
3. Vérifier le firewall : port 443 (HTTPS) doit être ouvert

### Problème : Connexion se ferme immédiatement

**Solutions** :
1. Vérifier les headers : `Accept: text/event-stream`
2. Vérifier l'authentification si requise
3. Regarder les logs du serveur

### Problème : Événements non reçus

**Solutions** :
1. Vérifier que vous écoutez le bon nom d'événement
2. Vérifier le filtrage par userId
3. Tester avec `curl` pour voir si les événements sont envoyés

### Problème : Reconnexion en boucle

**Solutions** :
1. Implémenter un exponential backoff
2. Limiter le nombre de tentatives
3. Vérifier qu'il n'y a pas d'erreur côté serveur

## Ressources

- [MDN - Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [HTML5 Rocks - Stream Updates with SSE](https://www.html5rocks.com/en/tutorials/eventsource/basics/)
- [Can I Use - EventSource](https://caniuse.com/eventsource)

## Support

Pour toute question sur l'intégration :

- 📖 Documentation API : https://api.devfest-studio.com/api/v1/docs
- 🐛 Issues : [GitHub Issues](https://github.com/TheGoatIA/devfest-studio-api/issues)
- 💬 Contact : support@devfest-studio.com
