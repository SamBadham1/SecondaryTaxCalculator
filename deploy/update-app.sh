#!/usr/bin/env bash
# Re-deploy after pushing changes to git. Run on the GCE VM.
set -euo pipefail

APP_NAME="tax-calculator"
APP_DIR="/opt/${APP_NAME}"
CONTAINER_NAME="${APP_NAME}"

cd "${APP_DIR}"
git pull origin main
docker build -t "${APP_NAME}:latest" .
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -p 80:8080 \
  -e PORT=8080 \
  "${APP_NAME}:latest"

echo "Update complete."
