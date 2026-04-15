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

# Create entrypoint inline to avoid CRLF issues from Windows
RUN printf '#!/bin/sh\n\
\n\
# Read camera URL from saved config\n\
CAMERA_URL=""\n\
CAMERA_ENABLED="false"\n\
if [ -f /app/config/default.json ]; then\n\
  CAMERA_URL=$(jq -r ".camera.url // empty" /app/config/default.json 2>/dev/null)\n\
  CAMERA_ENABLED=$(jq -r ".camera.enabled // false" /app/config/default.json 2>/dev/null)\n\
fi\n\
\n\
# Write go2rtc config (empty streams - ffmpeg pushes directly)\n\
printf "api:\\n  listen: \\":1984\\"\\nrtsp:\\n  listen: \\":8554\\"\\nstreams: {}\\n" > /tmp/go2rtc.yaml\n\
\n\
# Start go2rtc\n\
go2rtc -config /tmp/go2rtc.yaml &\n\
sleep 2\n\
\n\
# Start ffmpeg to push camera stream to go2rtc RTSP server\n\
if [ -n "$CAMERA_URL" ] && [ "$CAMERA_ENABLED" = "true" ]; then\n\
  echo "[entrypoint] Starting ffmpeg for camera: $CAMERA_URL"\n\
  ffmpeg -hide_banner -loglevel warning -rtsp_transport tcp \\\n\
    -i "$CAMERA_URL" \\\n\
    -c copy -f rtsp \\\n\
    rtsp://127.0.0.1:8554/frontdoor &\n\
  sleep 1\n\
  echo "[entrypoint] ffmpeg started, stream at rtsp://localhost:8554/frontdoor"\n\
else\n\
  echo "[entrypoint] No camera configured"\n\
fi\n\
\n\
# Start Next.js\n\
exec node server.js\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 3000 1984

CMD ["/app/entrypoint.sh"]
