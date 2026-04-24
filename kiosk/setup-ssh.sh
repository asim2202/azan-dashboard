#!/bin/bash
#
# Setup SSH on the N100 kiosk so Claude (or anyone with the paired key)
# can connect without a password.
#
# Usage:
#   chmod +x setup-ssh.sh
#   ./setup-ssh.sh
#
# You'll be asked for your sudo password once.

set -e

echo "=== Azan Kiosk: SSH setup ==="
echo

# --- Install OpenSSH server ---
if ! command -v sshd >/dev/null 2>&1; then
  echo "[1/4] Installing openssh-server..."
  sudo apt update
  sudo apt install -y openssh-server
  echo "  ✓ Installed"
else
  echo "[1/4] openssh-server already installed — skipping"
fi
echo

# --- Enable + start the service ---
echo "[2/4] Enabling and starting ssh.service..."
sudo systemctl enable --now ssh
echo "  ✓ Running"
echo

# --- Firewall (if ufw is active) ---
echo "[3/4] Opening firewall port 22..."
if command -v ufw >/dev/null 2>&1 && sudo ufw status | grep -q "Status: active"; then
  sudo ufw allow ssh >/dev/null
  echo "  ✓ ufw rule added"
else
  echo "  ✓ ufw not active or not installed — nothing to do"
fi
echo

# --- Install authorized key so Claude can connect ---
echo "[4/4] Installing authorized SSH key..."
CLAUDE_KEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMPuFEo/86my9675gw6xWWAqxT7RXJeErAsaL813UsAu asima@Asim-WS'

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
touch "$HOME/.ssh/authorized_keys"
chmod 600 "$HOME/.ssh/authorized_keys"

# Add the key only if it's not already present (idempotent)
if ! grep -Fq "$CLAUDE_KEY" "$HOME/.ssh/authorized_keys"; then
  echo "$CLAUDE_KEY" >> "$HOME/.ssh/authorized_keys"
  echo "  ✓ Key added to ~/.ssh/authorized_keys"
else
  echo "  ✓ Key already present — skipping"
fi
echo

# --- Report status ---
echo "=== Verification ==="
echo "SSH listening on:"
sudo ss -tlnp | grep -E ":22\b" || echo "  (no output — sshd may not be running)"
echo
echo "Your username (for SSH): $(whoami)"
echo "Your IP address(es):"
ip -4 -o addr show scope global | awk '{print "  " $2 ": " $4}' | cut -d/ -f1
echo
echo "=== Done. ==="
echo
echo "Tell Claude: ssh $(whoami)@$(hostname -I | awk '{print $1}')"
