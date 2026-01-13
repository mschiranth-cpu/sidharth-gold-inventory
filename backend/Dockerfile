# =============================================================================
# Gold Factory Inventory - Backend Dockerfile
# =============================================================================
# Multi-stage build for optimized production image
# Base: Node 20 LTS Alpine (smallest footprint)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
# Install all dependencies including devDependencies for building
FROM node:20-alpine AS deps

# Install build dependencies for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for building)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
# Compile TypeScript to JavaScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production Dependencies
# -----------------------------------------------------------------------------
# Install only production dependencies
FROM node:20-alpine AS prod-deps

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production --omit=dev

# Generate Prisma client for production
RUN npx prisma generate

# Clean up build dependencies to reduce image size
RUN apk del python3 make g++

# -----------------------------------------------------------------------------
# Stage 4: Production Runner
# -----------------------------------------------------------------------------
# Final minimal production image
FROM node:20-alpine AS runner

# Add labels for container metadata
LABEL maintainer="Gold Factory Team"
LABEL description="Gold Factory Inventory Backend API"
LABEL version="1.0.0"

# Install runtime dependencies only
# - dumb-init: proper signal handling for Node.js
# - curl: for health checks
# - openssl: required by Prisma
RUN apk add --no-cache dumb-init curl openssl

# Set working directory
WORKDIR /app

# Create non-root user for security
# Running as root is a security risk in containers
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy production dependencies
COPY --from=prod-deps --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=expressjs:nodejs /app/package*.json ./

# Copy built application
COPY --from=builder --chown=expressjs:nodejs /app/dist ./dist

# Copy Prisma schema and migrations for runtime migrations
COPY --from=builder --chown=expressjs:nodejs /app/prisma ./prisma

# Create logs directory with proper permissions
RUN mkdir -p logs && chown expressjs:nodejs logs

# Copy entrypoint script and fix line endings before switching user
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && \
    sed -i 's/\r$//' /app/docker-entrypoint.sh && \
    chown expressjs:nodejs /app/docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the API port
EXPOSE 5000

# Switch to non-root user
USER expressjs

# Health check - verify the API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Use dumb-init as PID 1 for proper signal handling
ENTRYPOINT ["/app/docker-entrypoint.sh"]
