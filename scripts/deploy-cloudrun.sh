#!/bin/bash
set -euo pipefail

# Script para desplegar en Google Cloud Run
# Uso: ./scripts/deploy-cloudrun.sh [PROJECT_ID]

PROJECT_ID="${1:-gestion-agronare}"
REGION="europe-west1"
SERVICE_NAME="gestionapro"

echo "🚀 Desplegando $SERVICE_NAME en Cloud Run..."
echo "📦 Proyecto: $PROJECT_ID"
echo "🌍 Región: $REGION"

# Verificar que gcloud está autenticado
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
  echo "❌ No estás autenticado en gcloud. Ejecuta: gcloud auth login"
  exit 1
fi

# Configurar proyecto
gcloud config set project "$PROJECT_ID"

# Habilitar APIs necesarias
echo "🔧 Habilitando APIs necesarias..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com

# Construir y desplegar usando Cloud Build
echo "🏗️  Construyendo imagen con Cloud Build..."

# Leer variables de entorno de .env.local
if [[ -f ".env.local" ]]; then
  echo "📄 Leyendo variables de .env.local..."
  
  # Extraer valores (asumiendo formato KEY="value" o KEY=value)
  NEXT_PUBLIC_FIREBASE_API_KEY=$(grep NEXT_PUBLIC_FIREBASE_API_KEY .env.local | cut -d '=' -f2- | tr -d '"')
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$(grep NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN .env.local | cut -d '=' -f2- | tr -d '"')
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=$(grep NEXT_PUBLIC_FIREBASE_PROJECT_ID .env.local | cut -d '=' -f2- | tr -d '"')
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$(grep NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET .env.local | cut -d '=' -f2- | tr -d '"')
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$(grep NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID .env.local | cut -d '=' -f2- | tr -d '"')
  NEXT_PUBLIC_FIREBASE_APP_ID=$(grep NEXT_PUBLIC_FIREBASE_APP_ID .env.local | cut -d '=' -f2- | tr -d '"')
  FIREBASE_CLIENT_EMAIL=$(grep FIREBASE_CLIENT_EMAIL .env.local | cut -d '=' -f2- | tr -d '"')
  FIREBASE_PRIVATE_KEY=$(grep FIREBASE_PRIVATE_KEY .env.local | cut -d '=' -f2- | tr -d '"')
  
  # Generate image tag from timestamp
  IMAGE_TAG=$(date +%Y%m%d-%H%M%S)
  echo "🏷️  Tag de imagen: ${IMAGE_TAG}"
  
  gcloud builds submit \
    --config cloudbuild.yaml \
    --substitutions "SHORT_SHA=$IMAGE_TAG,_NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY,_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,_NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID,_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,_NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID,_FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL,_FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY"
else
  echo "⚠️  .env.local no encontrado. Desplegando sin variables de entorno."
  IMAGE_TAG=$(date +%Y%m%d-%H%M%S)
  gcloud builds submit --config cloudbuild.yaml --substitutions "SHORT_SHA=$IMAGE_TAG"
fi

# Obtener URL del servicio
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --format="value(status.url)")

echo ""
echo "✅ ¡Despliegue completado!"
echo "🌐 URL: $SERVICE_URL"
echo ""
echo "Para ver logs:"
echo "  gcloud run services logs tail $SERVICE_NAME --region=$REGION"
