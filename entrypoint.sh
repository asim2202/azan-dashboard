#!/bin/sh

# Start go2rtc in background (RTSP to MJPEG/WebRTC proxy)
# It will be configured dynamically via its API from the Next.js app
cat > /tmp/go2rtc.yaml << 'EOF'
api:
  listen: ":1984"
rtsp:
  listen: ":8554"
streams: {}
EOF

go2rtc -config /tmp/go2rtc.yaml &

# Start Next.js
exec node server.js
