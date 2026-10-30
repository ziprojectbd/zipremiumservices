#!/bin/bash
# ============================================
# ZI Premium Services — Production Startup
# ============================================

set -e

echo "=== ZI Premium Services Backend Startup ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Environment: ${NODE_ENV:-production}"

# Validate environment
echo "=== Validating environment ==="
if [ -z "$MONGODB_URI" ]; then
  echo "ERROR: MONGODB_URI is not set"
  exit 1
fi
if [ -z "$JWT_SECRET" ]; then
  echo "ERROR: JWT_SECRET is not set"
  exit 1
fi

# Create log directory
mkdir -p logs

# Run database migrations / setup if needed
# echo "=== Running database setup ==="
# node dist/scripts/setup-db.js

# Start with PM2 in cluster mode
echo "=== Starting application ==="
if [ "${USE_PM2}" = "true" ] || [ "${NODE_ENV}" = "production" ]; then
  npx pm2-runtime ecosystem.config.js
else
  node -r module-alias/register dist/server.js
fi
