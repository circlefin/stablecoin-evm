# Injective Integration Tests

Integration tests for USDC on Injective blockchain using a local Injective node.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20.18.0
- Yarn

## Running Tests Locally

```bash
# Start the Injective localnet
yarn test:injective:start

# Run the integration tests
yarn test:injective

# Stop the localnet when done
yarn test:injective:stop
```

## Docker Image

Using `injectivelabs/injective-core:v1.16.5-usdc` which includes USDC-specific
features.
