#!/bin/bash

#############################################
# Script de déploiement sur Google Cloud Run
# Usage: ./scripts/deploy.sh
#############################################

set -e

echo "🚀 Démarrage du déploiement DevFest Studio API..."

# Variables
PROJECT_ID=${GOOGLE_CLOUD_PROJECT_ID:-"your-project-id"}
REGION=${REGION:-"us-central1"}
SERVICE_NAME="devfest-studio-api"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

# 1. Build Docker image
echo "📦 Build de l'image Docker..."
docker build -t ${IMAGE_NAME} .

# 2. Push vers Google Container Registry
echo "📤 Push vers GCR..."
docker push ${IMAGE_NAME}

# 3. Deploy sur Cloud Run
echo "🌐 Déploiement sur Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 100 \
  --min-instances 1

echo "✅ Déploiement terminé!"
echo "🔗 URL du service:"
gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)'
