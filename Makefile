.PHONY: help build up down logs restart clean test dev prod

# Variables
COMPOSE := docker-compose
COMPOSE_DEV := docker-compose -f docker-compose.dev.yml
COMPOSE_PROD := docker-compose -f docker-compose.yml

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Lance l'environnement de développement
	$(COMPOSE_DEV) up -d
	@echo "✅ Environnement de développement démarré"
	@echo "API: http://localhost:3000"
	@echo "MongoDB: localhost:27017"
	@echo "Redis: localhost:6379"

dev-build: ## Build et lance l'environnement de développement
	$(COMPOSE_DEV) up -d --build
	@echo "✅ Environnement de développement construit et démarré"

dev-logs: ## Affiche les logs du développement
	$(COMPOSE_DEV) logs -f

dev-down: ## Arrête l'environnement de développement
	$(COMPOSE_DEV) down
	@echo "✅ Environnement de développement arrêté"

dev-restart: ## Redémarre l'environnement de développement
	$(COMPOSE_DEV) restart
	@echo "✅ Environnement de développement redémarré"

dev-admin: ## Lance les interfaces d'administration
	$(COMPOSE_DEV) --profile with-admin-ui up -d
	@echo "✅ Interfaces d'administration disponibles:"
	@echo "MongoDB Express: http://localhost:8081 (admin/admin)"
	@echo "Redis Commander: http://localhost:8082"

# Production commands
prod: ## Lance l'environnement de production
	$(COMPOSE_PROD) up -d
	@echo "✅ Environnement de production démarré"

prod-build: ## Build et lance l'environnement de production
	$(COMPOSE_PROD) up -d --build
	@echo "✅ Environnement de production construit et démarré"

prod-logs: ## Affiche les logs de la production
	$(COMPOSE_PROD) logs -f

prod-down: ## Arrête l'environnement de production
	$(COMPOSE_PROD) down
	@echo "✅ Environnement de production arrêté"

prod-nginx: ## Lance la production avec Nginx
	$(COMPOSE_PROD) --profile with-nginx up -d
	@echo "✅ Production avec Nginx démarré"

# Common commands
build: ## Build les images Docker
	$(COMPOSE_PROD) build
	@echo "✅ Images Docker construites"

up: dev ## Alias pour 'make dev'

down: ## Arrête tous les conteneurs
	$(COMPOSE_DEV) down
	$(COMPOSE_PROD) down
	@echo "✅ Tous les conteneurs arrêtés"

logs: ## Affiche les logs
	$(COMPOSE_DEV) logs -f || $(COMPOSE_PROD) logs -f

restart: ## Redémarre les conteneurs
	$(COMPOSE_DEV) restart || $(COMPOSE_PROD) restart
	@echo "✅ Conteneurs redémarrés"

ps: ## Liste les conteneurs en cours d'exécution
	@echo "=== Développement ==="
	@$(COMPOSE_DEV) ps 2>/dev/null || echo "Aucun conteneur de développement"
	@echo "\n=== Production ==="
	@$(COMPOSE_PROD) ps 2>/dev/null || echo "Aucun conteneur de production"

# Database commands
db-backup: ## Sauvegarde la base de données MongoDB
	@mkdir -p backups
	docker exec devfest-mongodb mongodump --db devfest_studio --out /tmp/backup
	docker cp devfest-mongodb:/tmp/backup ./backups/mongodb-$(shell date +%Y%m%d-%H%M%S)
	@echo "✅ Sauvegarde créée dans ./backups/"

db-restore: ## Restaure la dernière sauvegarde MongoDB
	@LATEST_BACKUP=$$(ls -t backups/ | head -1); \
	if [ -z "$$LATEST_BACKUP" ]; then \
		echo "❌ Aucune sauvegarde trouvée"; \
		exit 1; \
	fi; \
	docker cp backups/$$LATEST_BACKUP devfest-mongodb:/tmp/restore; \
	docker exec devfest-mongodb mongorestore --db devfest_studio /tmp/restore/devfest_studio --drop; \
	echo "✅ Base de données restaurée depuis $$LATEST_BACKUP"

db-shell: ## Ouvre un shell MongoDB
	docker exec -it devfest-mongodb mongosh devfest_studio

redis-cli: ## Ouvre le CLI Redis
	docker exec -it devfest-redis redis-cli

# Testing commands
test: ## Lance les tests unitaires
	npm test

test-watch: ## Lance les tests en mode watch
	npm run test:watch

test-coverage: ## Lance les tests avec couverture
	npm run test:coverage

# Cleanup commands
clean: ## Nettoie les conteneurs, volumes et images
	$(COMPOSE_DEV) down -v
	$(COMPOSE_PROD) down -v
	@echo "✅ Conteneurs et volumes supprimés"

clean-all: clean ## Nettoie tout (conteneurs, volumes, images)
	docker system prune -af --volumes
	@echo "✅ Nettoyage complet effectué"

clean-logs: ## Supprime les fichiers de logs
	rm -rf logs/*.log
	@echo "✅ Logs supprimés"

# Utility commands
shell: ## Ouvre un shell dans le conteneur API
	docker exec -it devfest-studio-api sh || docker exec -it devfest-studio-api-dev sh

install: ## Installe les dépendances
	npm install

setup: ## Configuration initiale du projet
	@echo "🚀 Configuration du projet..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Fichier .env créé"; \
	fi
	@mkdir -p data/mongodb data/redis uploads logs
	@echo "✅ Dossiers créés"
	npm install
	@echo "✅ Dépendances installées"
	@echo "🎉 Configuration terminée! Lancez 'make dev' pour démarrer"

health: ## Vérifie la santé des services
	@echo "=== Vérification de la santé des services ==="
	@curl -s http://localhost:3000/api/v1/health | jq '.' || echo "❌ API non accessible"
	@docker exec devfest-mongodb mongosh --eval "db.adminCommand('ping')" 2>/dev/null && echo "✅ MongoDB OK" || echo "❌ MongoDB KO"
	@docker exec devfest-redis redis-cli ping 2>/dev/null && echo "✅ Redis OK" || echo "❌ Redis KO"

.DEFAULT_GOAL := help
