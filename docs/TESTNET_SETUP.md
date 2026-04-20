```markdown
```

# Testnet deployment guide

This guide explains how to deploy the stablecoin contracts to a testnet.

## Requirements

- Node.js and pnpm
- Hardhat installed globally (`npm install -g hardhat`)
- Testnet RPC endpoint (e.g. Sepolia, Mumbai)

## Steps

1. Copy `.env.example` to `.env` and fill in RPC URLs and private keys.
2. Install dependencies: `pnpm install`.
3. Deploy contracts: `pnpm hardhat deploy --network sepolia`.
4. Verify deployments using `pnpm hardhat verify`.

Always test on a testnet before deploying to mainnet.
