# ============================================
# ZI Premium Services — Frontend Dockerfile
# Coolify + Traefik Optimized
# ============================================

# ===== Build Stage =====
FROM node:22-alpine AS builder

ARG VITE_API_URL=""
ARG VITE_GOOGLE_CLIENT_ID=""

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build Vite app (VITE_ prefixed env vars are baked into the static bundle)
RUN VITE_API_URL="$VITE_API_URL" \
    VITE_GOOGLE_CLIENT_ID="$VITE_GOOGLE_CLIENT_ID" \
    npm run build

# ===== Production Stage =====
FROM nginx:1.27-alpine

# Remove default config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy dist build
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose internal port only
EXPOSE 80

# Fixed healthcheck (IPv4)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -q --spider http://127.0.0.1:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]