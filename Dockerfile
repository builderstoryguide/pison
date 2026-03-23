<<<<<<< HEAD
# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-alpine AS deps

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies based on the lockfile present
RUN \
    if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
    npm ci; \
    else \
    npm install; \
    fi

# ================================
# Stage 2: Builder
# ================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
# Next.js collects anonymous telemetry data. Disable it
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
# Note: .env.local is not copied, environment variables should be provided at runtime
RUN \
    if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm run build; \
    else \
    npm run build; \
    fi

# ================================
# Stage 3: Runner (Production)
# ================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct ownership
RUN chown -R nextjs:nodejs /app
=======
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
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh
>>>>>>> c10aaa83c3737af90b384d046150aef9f7900c99

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

<<<<<<< HEAD
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]

# ================================
# Stage 4: Development
# ================================
FROM node:20-alpine AS development
WORKDIR /app

# Install dependencies for development (including devDependencies)
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install all dependencies (including dev)
RUN \
    if [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install; \
    elif [ -f package-lock.json ]; then \
    npm ci; \
    else \
    npm install; \
    fi

# Copy application code
COPY . .

# Expose port for dev server
EXPOSE 3000

# Start development server with hot reload
CMD ["npm", "run", "dev"]
=======
# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Entrypoint runs migrations, then starts the app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
>>>>>>> c10aaa83c3737af90b384d046150aef9f7900c99
