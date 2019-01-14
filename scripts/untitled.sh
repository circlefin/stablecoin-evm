#!/bin/bash
set -e

if ! [[ -z "${TRAVIS}" ]]; then
  echo "Development Enviornment detected. Checking needed dependencies exist"
  yarn check --verify-tree 
fi





