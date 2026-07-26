# ============================================
# ZI Premium Services — Frontend Dockerfile
# Production-ready: Node.js 22 LTS + nginx 1.27 (Alpine)
# ============================================

# ===== Build Stage =====
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (Docker layer caching)
COPY package.json package-lock.json ./

# Install deps with fallback (avoids npm ci lockfile errors)
RUN npm install

# Copy source code
COPY . .

# Build Vite/React production bundle
RUN npm run build

# ===== Production Stage =====
FROM nginx:1.27-alpine

# Security: remove default nginx config + unnecessary packages
RUN rm -f /etc/nginx/conf.d/default.conf && \
    apk del --purge apk-tools || true

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 -O /dev/null http://localhost:80/ || exit 1

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
