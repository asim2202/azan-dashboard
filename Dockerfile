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

# Install go2rtc + ffmpeg (needed to transcode H264 to MJPEG)
RUN apk add --no-cache curl ffmpeg && \
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

# Install jq for JSON parsing in entrypoint
RUN apk add --no-cache jq

# Create entrypoint script - using heredoc to avoid escaping hell
RUN cat > /app/entrypoint.sh << 'ENTRY'
#!/bin/sh

# Read camera URL from saved config
CAMERA_URL=""
CAMERA_ENABLED="false"
if [ -f /app/config/default.json ]; then
  CAMERA_URL=$(jq -r '.camera.url // empty' /app/config/default.json 2>/dev/null)
  CAMERA_ENABLED=$(jq -r '.camera.enabled // false' /app/config/default.json 2>/dev/null)
fi

# Convert rtsps:// to rtspx:// for go2rtc
GO2RTC_URL="$CAMERA_URL"
case "$GO2RTC_URL" in
  rtsps://*) GO2RTC_URL="rtspx://$(echo "$GO2RTC_URL" | sed 's|^rtsps://||')" ;;
esac
GO2RTC_URL=$(echo "$GO2RTC_URL" | sed 's/[?&]enableSrtp//g')

echo "[entrypoint] Camera URL: $CAMERA_URL"
echo "[entrypoint] go2rtc URL: $GO2RTC_URL"

# Write go2rtc config
if [ -n "$GO2RTC_URL" ] && [ "$CAMERA_ENABLED" = "true" ]; then
  cat > /tmp/go2rtc.yaml << YAML
api:
  listen: ":1984"
rtsp:
  listen: ":8554"
streams:
  frontdoor: $GO2RTC_URL
YAML
  echo "[entrypoint] go2rtc config written"
  cat /tmp/go2rtc.yaml
else
  cat > /tmp/go2rtc.yaml << YAML
api:
  listen: ":1984"
rtsp:
  listen: ":8554"
streams: {}
YAML
  echo "[entrypoint] No camera configured"
fi

# Start go2rtc
go2rtc -config /tmp/go2rtc.yaml &
sleep 1

# Start Next.js
exec node server.js
ENTRY
chmod +x /app/entrypoint.sh

EXPOSE 3000 1984

CMD ["/app/entrypoint.sh"]
