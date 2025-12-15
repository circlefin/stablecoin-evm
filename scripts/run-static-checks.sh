```bash
#!/usr/bin/env bash
set -euo pipefail
```

# Convenience wrapper around existing static checks defined in package.json.
# Usage:
#   ./scripts/run-static-checks.sh

echo "Running TypeScript typecheck…"
yarn typecheck

echo
echo "Running ESLint…"
yarn lint

echo
echo "Running Solidity lint (solhint)…"
yarn solhint || {
  echo "solhint reported issues. Review the output above."
  exit 1
}

echo
echo "✅ All static checks finished."
