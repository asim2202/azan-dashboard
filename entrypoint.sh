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

# Pick the ICE candidate IP for WebRTC.
# Priority: WEBRTC_IP env var (host LAN IP, set this on bridge networks)
# Fallback: container's own IP (works on macvlan / host networking).
CONTAINER_IP=$(ip -4 -o addr show scope global 2>/dev/null \
  | awk '{print $4}' | cut -d/ -f1 | head -n1)
if [ -n "$WEBRTC_IP" ]; then
  ICE_IP="$WEBRTC_IP"
  echo "[entrypoint] WebRTC candidate IP: $ICE_IP (from WEBRTC_IP env)"
else
  ICE_IP="$CONTAINER_IP"
  echo "[entrypoint] WebRTC candidate IP: $ICE_IP (container IP — set WEBRTC_IP to your host LAN IP if clients can't reach this)"
fi

# Write go2rtc config
{
  echo "api:"
  echo '  listen: ":1984"'
  # Allow cross-origin requests from the Next.js app on another port
  echo '  origin: "*"'
  echo "rtsp:"
  echo '  listen: ":8554"'
  echo "webrtc:"
  echo '  listen: ":8555"'
  echo "  candidates:"
  if [ -n "$ICE_IP" ]; then
    # Single candidate — go2rtc automatically listens on both TCP and UDP
    # and will emit candidates for both protocols from this one entry.
    echo "    - ${ICE_IP}:8555"
  fi
  if [ -n "$GO2RTC_URL" ] && [ "$CAMERA_ENABLED" = "true" ]; then
    echo "streams:"
    echo "  frontdoor: $GO2RTC_URL"
  else
    echo "streams: {}"
  fi
} > /tmp/go2rtc.yaml
echo "[entrypoint] go2rtc config:"
cat /tmp/go2rtc.yaml

# Start go2rtc
go2rtc -config /tmp/go2rtc.yaml &
sleep 1

# Start Next.js
exec node server.js
