#!/bin/bash
#
# Disable every form of sleep / screen blanking on this machine so the kiosk
# stays on 24/7. Safe to re-run — every command is idempotent.
#
# Usage (from the N100):
#   chmod +x disable-sleep.sh
#   ./disable-sleep.sh
#
# You may be prompted for your sudo password once for the systemctl step.

set -e

echo "=== Azan Kiosk: disable sleep + screen blanking ==="
echo

# --- GNOME / user session settings (no sudo — must run as the logged-in user) ---
if command -v gsettings >/dev/null 2>&1; then
  echo "[1/3] GNOME session settings..."

  gsettings set org.gnome.desktop.session idle-delay 0
  gsettings set org.gnome.desktop.screensaver lock-enabled false
  gsettings set org.gnome.desktop.screensaver idle-activation-enabled false

  gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing'
  gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-type 'nothing'
  gsettings set org.gnome.settings-daemon.plugins.power power-button-action 'nothing'

  # Never dim the screen
  gsettings set org.gnome.settings-daemon.plugins.power idle-dim false 2>/dev/null || true

  echo "  ✓ GNOME idle/suspend disabled"
else
  echo "[1/3] gsettings not found — skipping (OK if you're on a non-GNOME desktop)"
fi
echo

# --- Systemd sleep targets (needs sudo) ---
echo "[2/3] Masking systemd sleep/suspend/hibernate targets..."
echo "     (you may be asked for your sudo password)"
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target >/dev/null 2>&1 || true
echo "  ✓ System-level sleep disabled"
echo

# --- X11 display settings (for this session — the kiosk launcher also sets these) ---
if [ -n "$DISPLAY" ] && command -v xset >/dev/null 2>&1; then
  echo "[3/3] X11 display never-blank..."
  xset s off          # disable screen saver
  xset -dpms          # disable DPMS (Display Power Management)
  xset s noblank      # don't blank on idle
  echo "  ✓ Display blanking disabled for this session"
else
  echo "[3/3] X11 not detected — skipping (kiosk launcher applies this too)"
fi

echo
echo "=== Done. ==="
echo
echo "Recommended: reboot once so systemd picks up the masked sleep targets,"
echo "then launch the Azan Kiosk and leave it running."
echo
echo "To reverse everything later, run:  ./enable-sleep.sh"
