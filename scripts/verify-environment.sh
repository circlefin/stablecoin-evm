#!/bin/bash
set -e

echo "Verifying integrity"
yarn check --integrity
echo "Verifying tree"
yarn check --verify-tree
