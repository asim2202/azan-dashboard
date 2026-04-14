FROM node:20-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: Build the app
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Config and data directories (mountable volumes)
RUN mkdir -p /app/config /app/data /app/public/audio
COPY --from=builder /app/config ./config

EXPOSE 3000

# Run as root so volume-mounted directories are writable
# (Docker volume mounts inherit host permissions which may not match a non-root user)
CMD ["node", "server.js"]
