# =============================================================================
# Gold Factory Inventory - Frontend Dockerfile
# =============================================================================
# Multi-stage build for optimized production image
# Stage 1: Build with Node/Vite
# Stage 2: Serve with Nginx Alpine
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
# Build the React application with Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy source code
COPY . .

# Build arguments for environment variables
# These can be passed at build time: docker build --build-arg VITE_API_URL=...
ARG VITE_API_URL=/api
ARG VITE_WS_URL=/ws
ARG VITE_APP_NAME="Gold Factory Inventory"

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

# Build the application
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production with Nginx
# -----------------------------------------------------------------------------
FROM nginx:alpine AS runner

# Add labels for container metadata
LABEL maintainer="Gold Factory Team"
LABEL description="Gold Factory Inventory Frontend"
LABEL version="1.0.0"

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-group && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-group nginx-user

# Set proper permissions
RUN chown -R nginx-user:nginx-group /usr/share/nginx/html && \
    chown -R nginx-user:nginx-group /var/cache/nginx && \
    chown -R nginx-user:nginx-group /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-group /var/run/nginx.pid

# Expose HTTP port
EXPOSE 80

# Health check - verify nginx is serving content
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Switch to non-root user
USER nginx-user

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
