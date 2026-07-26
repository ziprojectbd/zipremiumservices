# ===== Build Stage =====
FROM node:20-alpine AS builder

WORKDIR /app

# Separate layer: install deps first (leveraging Docker cache)
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript (if any); ok if it fails — .js files run directly
RUN npm run build || true

# ===== Production Stage =====
FROM node:20-alpine AS runner

# Security: install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user (uid 1001)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodeuser

# Copy production dependencies
COPY package.json package-lock.json ./

# Install only production deps — smaller image, fewer vulnerabilities
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy built source from builder
COPY --from=builder /app/src ./src

# Expose backend port
EXPOSE 5000

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 -O /dev/null http://localhost:5000/health || exit 1

# Use dumb-init as PID 1 for proper signal forwarding and zombie reaping
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
