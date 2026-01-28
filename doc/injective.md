# Injective

## Integration tests

Integration tests for USDC on Injective blockchain using a local Injective node.

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20.18.0
- Yarn

### Docker Image

Using `injectivelabs/injective-core:v1.17.2-usdc` which includes USDC-specific
features.

### Running Tests Locally

```bash
# Start the Injective localnet
yarn test:injective:start

# Run all tests
yarn test:injective

# Stop the localnet when done
yarn test:injective:stop
```

## Deployment

`FiatTokenInjectiveV2_2`'s deployment process differs from the base
`FiatTokenV2_2` [deployment process](./../README.md) because Injective requires
calling the bank precompile during initialization, which is not supported in
Foundry's simulation environment. Follow the steps below.

### 1. Deploy contracts

Deploy the implementation, proxy, and master minter contracts using the
Injective-specific deployment script. Note that this script does NOT initialize
the contracts.

```sh
yarn forge:broadcast scripts/deploy/injective/deploy-fiat-token-injective.s.sol --rpc-url <testnet OR mainnet>
```

### 2. Initialize contracts

Initialize the implementation and proxy contracts using the TypeScript helper
script. This is required because `FiatTokenInjectiveV2_2.initialize()` calls the
Injective bank precompile which doesn't exist in Foundry's simulation
environment.

```sh
npx tsx scripts/deploy/injective/initialize-injective.ts --network=<testnet OR mainnet>
```

### 3. Create namespace

The namespace must be created by the contract owner. In `.env`, ensure the four
namespace admin addresses and `FIAT_TOKEN_PROXY_ADDRESS` are set. Then create
the namespace:

```sh
npx tsx scripts/injective/createNamespace.ts --network=<testnet OR mainnet>
```

Verify the namespace is configured correctly:

```sh
npx tsx scripts/injective/queryNamespace.ts --network=<testnet OR mainnet>
```

### 4. Fund the proxy contract

The proxy contract needs native INJ tokens to pay for the denom creation fee
during the first mint. Since EVM contract cannot accept INJ, we can convert the
proxy address to Cosmos format and send 1 INJ via Cosmos interface.
