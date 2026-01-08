#!/bin/bash
# Copyright 2025 Circle Internet Group, Inc. All rights reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# Start Injective localnet and wait for it to be ready

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Starting Injective localnet..."
cd "$PROJECT_ROOT"

# Clean up any existing container first
echo "Cleaning up any existing container..."
docker-compose down 2>/dev/null || true
docker rm -f injective-localnet 2>/dev/null || true

# Start the localnet
docker-compose up -d injective-localnet

echo "Waiting for Injective node to be ready..."
MAX_ATTEMPTS=20
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  if curl -s http://localhost:26657/status > /dev/null 2>&1; then
    echo "Injective node is ready!"
    exit 0
  fi

  echo "Attempt $ATTEMPT/$MAX_ATTEMPTS: Node not ready yet, waiting..."
  sleep 2
done

echo "Timeout waiting for Injective node to be ready"
echo "Container logs:"
if command -v docker compose &> /dev/null && docker-compose ps | grep -q injective-localnet; then
  docker-compose logs injective-localnet
else
  docker logs injective-localnet 2>&1 || echo "Could not retrieve logs"
fi
exit 1

