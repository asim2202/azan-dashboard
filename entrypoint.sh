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
  echo "api:" > /tmp/go2rtc.yaml
  echo '  listen: ":1984"' >> /tmp/go2rtc.yaml
  echo "rtsp:" >> /tmp/go2rtc.yaml
  echo '  listen: ":8554"' >> /tmp/go2rtc.yaml
  echo "streams:" >> /tmp/go2rtc.yaml
  echo "  frontdoor: $GO2RTC_URL" >> /tmp/go2rtc.yaml
  echo "[entrypoint] go2rtc config written"
  cat /tmp/go2rtc.yaml
else
  echo "api:" > /tmp/go2rtc.yaml
  echo '  listen: ":1984"' >> /tmp/go2rtc.yaml
  echo "rtsp:" >> /tmp/go2rtc.yaml
  echo '  listen: ":8554"' >> /tmp/go2rtc.yaml
  echo "streams: {}" >> /tmp/go2rtc.yaml
  echo "[entrypoint] No camera configured"
fi

# Start go2rtc
go2rtc -config /tmp/go2rtc.yaml &
sleep 1

# Start Next.js
exec node server.js
