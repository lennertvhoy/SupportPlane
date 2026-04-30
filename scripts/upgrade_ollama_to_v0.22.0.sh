#!/bin/bash
set -euo pipefail

echo "=== Ollama Upgrade Script ==="
echo "Upgrading Ollama from current version to v0.22.0"
echo ""

# Record current state
CURRENT_VERSION=$(/usr/local/bin/ollama --version 2>/dev/null || echo "unknown")
echo "Current version: $CURRENT_VERSION"
echo "Models before upgrade:"
/usr/local/bin/ollama list || true
echo ""

# Stop service
echo "Stopping ollama.service..."
systemctl stop ollama

# Backup old binary
cp /usr/local/bin/ollama /usr/local/bin/ollama.backup.$(date +%s)

# Install new binary and libs
cp /tmp/ollama-v0.22.0/bin/ollama /usr/local/bin/ollama
cp -r /tmp/ollama-v0.22.0/lib/ollama /usr/local/lib/ollama.new
rm -rf /usr/local/lib/ollama
mv /usr/local/lib/ollama.new /usr/local/lib/ollama

# Ensure permissions
chown root:root /usr/local/bin/ollama
chmod 755 /usr/local/bin/ollama

# Preserve existing systemd overrides (OLLAMA_HOST, OLLAMA_ORIGINS)
# The override at /etc/systemd/system/ollama.service.d/override.conf is kept as-is.

# Restart service
systemctl daemon-reload
systemctl start ollama
sleep 2

echo ""
echo "New version:"
/usr/local/bin/ollama --version
echo ""
echo "Models after upgrade:"
/usr/local/bin/ollama list || true
echo ""
echo "Ollama upgrade complete."
