# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install minimal build dependencies (for native modules like bcrypt)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (devDependencies needed for build)
RUN npm ci --legacy-peer-deps

# Copy application source
COPY . .

# Create minimal .env for build if it doesn't exist
RUN test -f .env || touch .env

# Build-time env for Next.js (NEXT_PUBLIC_* are inlined at build)
ARG NEXT_PUBLIC_SHOW_DEV_CREDENTIALS=0
ENV NEXT_PUBLIC_SHOW_DEV_CREDENTIALS=${NEXT_PUBLIC_SHOW_DEV_CREDENTIALS}

# Generate Prisma client (DATABASE_URL not needed for generate)
ENV DATABASE_URL="postgresql://localhost:5432/dummy"
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built application and node_modules from builder
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./

# Copy and set up entrypoint (runs migrations before start)
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Entrypoint runs migrations, then starts the app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
