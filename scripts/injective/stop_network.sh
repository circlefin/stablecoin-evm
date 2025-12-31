#!/bin/bash
# Copyright 2025 Circle Internet Group, Inc. All rights reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# Stop Injective localnet

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Stopping Injective localnet..."
cd "$PROJECT_ROOT"

# Stop and remove containers
docker compose down 2>/dev/null
docker rm -f injective-localnet 2>/dev/null

echo "Injective localnet stopped"

