#!/bin/bash
# Copyright 2024 Circle Internet Group, Inc. All rights reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# Script to flatten generated TypeChain types into a single directory so that
# import paths remain stable for downstream tooling.

set -euo pipefail

DIR="@types/generated"

echo "Flattening TypeChain output in: $DIR"

# Move all generated files from nested folders into the root directory
find "$DIR" -type f -mindepth 2 -exec mv {} "$DIR" \;

# Remove now-empty directories
find "$DIR" -type d -mindepth 1 -empty -delete

echo "Done."
