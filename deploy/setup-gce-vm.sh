#!/usr/bin/env bash
# Run this script on a fresh Debian/Ubuntu GCE VM (as root or with sudo).
set -euo pipefail

APP_NAME="tax-calculator"
REPO_URL="${REPO_URL:-https://github.com/SamBadham1/SecondaryTaxCalculator.git}"
APP_DIR="/opt/${APP_NAME}"
CONTAINER_NAME="${APP_NAME}"

echo "Installing Docker..."
apt-get update
apt-get install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "Cloning app..."
rm -rf "${APP_DIR}"
git clone "${REPO_URL}" "${APP_DIR}"
cd "${APP_DIR}"

echo "Building and starting container..."
docker build -t "${APP_NAME}:latest" .
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -p 80:8080 \
  -e PORT=8080 \
  "${APP_NAME}:latest"

echo "Done. App should be available on port 80."
docker ps --filter "name=${CONTAINER_NAME}"
