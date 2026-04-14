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

# Install go2rtc for RTSP to MJPEG conversion
RUN apk add --no-cache curl && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then GO2RTC_ARCH="amd64"; \
    elif [ "$ARCH" = "aarch64" ]; then GO2RTC_ARCH="arm64"; \
    else GO2RTC_ARCH="arm"; fi && \
    curl -L -o /usr/local/bin/go2rtc \
    "https://github.com/AlexxIT/go2rtc/releases/latest/download/go2rtc_linux_${GO2RTC_ARCH}" && \
    chmod +x /usr/local/bin/go2rtc && \
    apk del curl

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Config and data directories (mountable volumes)
RUN mkdir -p /app/config /app/data /app/public/audio
COPY --from=builder /app/config ./config

# Create entrypoint inline to avoid CRLF issues from Windows
RUN printf '#!/bin/sh\n\
# Write default go2rtc config\n\
cat > /tmp/go2rtc.yaml << GOEOF\n\
api:\n\
  listen: ":1984"\n\
rtsp:\n\
  listen: ":8554"\n\
streams: {}\n\
GOEOF\n\
\n\
# Start go2rtc in background\n\
go2rtc -config /tmp/go2rtc.yaml &\n\
\n\
# Wait for go2rtc to start\n\
sleep 1\n\
\n\
# Start Next.js\n\
exec node server.js\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 3000 1984

CMD ["/app/entrypoint.sh"]
