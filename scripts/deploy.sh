#!/bin/bash

# 0gSecura Deployment Script

set -e

echo "🚀 Starting 0gSecura deployment..."

# Check if environment variables are set
if [ -z "$OG_CHAIN_RPC_URL" ]; then
    echo "❌ OG_CHAIN_RPC_URL is not set"
    exit 1
fi

if [ -z "$OG_CHAIN_ID" ]; then
    echo "❌ OG_CHAIN_ID is not set"
    exit 1
fi

echo "✅ Environment variables validated"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build the application
echo "🔨 Building application..."
npm run build

# Run database migrations (if applicable)
if [ -n "$DATABASE_URL" ]; then
    echo "🗄️ Running database setup..."
    # npm run migrate # Uncomment when migrations are added
fi

# Health check
echo "🩺 Running health check..."
timeout 30 bash -c 'until curl -f http://localhost:3000/api/health; do sleep 1; done' || {
    echo "❌ Health check failed"
    exit 1
}

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at http://localhost:3000"
echo "📊 Health endpoint: http://localhost:3000/api/health"
echo "🔍 Chain explorer: ${OG_CHAIN_EXPLORER}"
echo "💾 Storage explorer: ${OG_STORAGE_EXPLORER}"
