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

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

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
