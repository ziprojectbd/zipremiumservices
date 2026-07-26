# ============================================
# ZI Premium Services — Backend Dockerfile
# Production-ready: Node.js 22 LTS (Alpine)
# ============================================

# ===== Build Stage =====
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (Docker layer caching)
COPY package.json package-lock.json ./

# Install all deps including dev for build step
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build (TypeScript → JS, then rewrite path aliases)
RUN npm run build

# ===== Production Stage =====
FROM node:22-alpine AS runner

# Security: proper init system + timezone support
RUN apk add --no-cache dumb-init tzdata

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodeuser

# Copy production dependencies only
COPY package.json package-lock.json ./
RUN npm install --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5000

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 -O /dev/null http://localhost:5000/health || exit 1

# Use dumb-init for signal handling + module-alias for runtime alias resolution
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "-r", "module-alias/register", "dist/server.js"]
