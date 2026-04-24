#!/bin/bash
#
# Reverse disable-sleep.sh — restore default suspend/blanking behavior.
# Use this if you decide to stop using this machine as a 24/7 kiosk.

set -e

echo "=== Azan Kiosk: restore default sleep behavior ==="
echo

if command -v gsettings >/dev/null 2>&1; then
  echo "[1/2] Restoring GNOME defaults..."
  gsettings reset org.gnome.desktop.session idle-delay
  gsettings reset org.gnome.desktop.screensaver lock-enabled
  gsettings reset org.gnome.desktop.screensaver idle-activation-enabled
  gsettings reset org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type
  gsettings reset org.gnome.settings-daemon.plugins.power sleep-inactive-battery-type
  gsettings reset org.gnome.settings-daemon.plugins.power power-button-action
  gsettings reset org.gnome.settings-daemon.plugins.power idle-dim 2>/dev/null || true
  echo "  ✓ GNOME settings restored to defaults"
fi
echo

echo "[2/2] Unmasking systemd sleep targets..."
sudo systemctl unmask sleep.target suspend.target hibernate.target hybrid-sleep.target >/dev/null 2>&1 || true
echo "  ✓ System-level sleep re-enabled"
echo

echo "=== Done. Reboot to fully apply. ==="
