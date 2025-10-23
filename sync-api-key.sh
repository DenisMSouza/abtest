#!/bin/bash

# Script to sync API key from dashboard to Docker environment
# Usage: ./sync-api-key.sh

echo "🔑 Syncing API key from dashboard to Docker..."

# Get the API key from the dashboard
API_KEY=$(curl -s http://localhost:3000/api/settings/api-key | jq -r '.apiKey')

if [ "$API_KEY" = "null" ] || [ -z "$API_KEY" ]; then
    echo "❌ No API key found in dashboard. Please generate one first at http://localhost:3000/settings"
    exit 1
fi

echo "✅ Found API key: ${API_KEY:0:20}..."

# Export the API key for Docker
export ABTEST_API_KEY="$API_KEY"

# Restart Docker containers with the new API key
echo "🔄 Restarting Docker containers with new API key..."
docker compose down
docker compose up -d

echo "✅ Docker containers restarted with API key from dashboard!"
echo "🎯 Your frontend can now use the same API key: $API_KEY"
