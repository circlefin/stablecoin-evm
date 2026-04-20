#!/usr/bin/env bash
set -euo pipefail

echo "Stablecoin EVM – developer sanity check"
echo "----------------------------------------"
echo

if ! command -v yarn >/dev/null 2>&1; then
  echo "Error: yarn is not installed or not on PATH."
  echo "See the repository README for the required versions and setup instructions."
  exit 1
fi

echo "[1/2] Running static checks (yarn static-check)..."
yarn static-check

if [ "${SKIP_TESTS:-0}" != "1" ]; then
  echo
  echo "[2/2] Running test suite (yarn test)..."
  yarn test
else
  echo
  echo "SKIP_TESTS=1 is set – skipping 'yarn test'."
fi

echo
echo "All checks completed. If everything passed, you are in a good state to open a PR."
