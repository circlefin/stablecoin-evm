#!/bin/bash
set -e

if [[ -z "${TRAVIS}" ]]; then
  echo "Development Environment detected. Checking needed dependencies exist..."
  yarn check --verify-tree 
fi

