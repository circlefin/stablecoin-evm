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

# Run all tests
yarn test:injective

# Query namespace information for a deployed USDC contract
npx tsx scripts/injective/queryNamespace.ts --network local --proxy <proxy_address>

# Stop the localnet when done
yarn test:injective:stop
```

## Docker Image

Using `injectivelabs/injective-core:v1.16.5-usdc` which includes USDC-specific
features.

## Deployment procedure

### 1. Deploy

Use `scripts/deploy/deploy-fiat-token.s.sol` to deploy injective contracts.

### 2. Namespace configuration

**Step 1: Export New Admin Addresses**

WARNING: the namespace must be created before transferring the contract owner to
cold storage address.

Copy the `.env.injective.example` to `.env` file. Make sure the four namespace
admin addresses are set to cold storage EVM addresses.

**Step 2: Create namespace**

WARNING: It's important to verify the address configuration is correct before
creating the namespace. Once the role manager position is set to the cold
storage address, the contract owner won't be able to modify the namespace.

```bash
# Create the namespace
npx tsx scripts/injective/createNamespace.ts <proxy_address>
```

**Step 3: Verify namespace is configured correctly**

### 3. Transfer EVM contract admin to cold storage\*\*

IMPORTANT: do not transfer the contract before the namespace configuration is
finished. Similar to other EVM contracts, use `cold-storage-transfer.s.sol`.

**What gets transferred:**

- **EVM Contracts:** Owner, Proxy Admin, Master Minter Owner (use separate
  process)
