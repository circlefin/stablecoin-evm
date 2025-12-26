# Hardhat network summary

This document summarises the network configuration names used in this repository and when to use each one.

| Network name  | Description                                       | Typical usage                               |
|---------------|---------------------------------------------------|----------------------------------------------|
| `localhost`   | Default local Hardhat node (hardhat or anvil)     | Running unit tests and development scripts   |
| `sepolia`     | Ethereum Sepolia testnet                          | Pre-production testing and faucet access     |
| `polygon`     | Polygon mainnet or PoS chain                      | Production deployments on Polygon            |
| `mumbai`      | Polygon Mumbai testnet                            | Testing L2 interactions on Polygon           |

**Notes**

- The Hardhat configuration in `hardhat.config.ts` defines the RPC URLs and private keys for each network. Before using testnets or mainnets, ensure that your `.env` contains the required environment variables.
- When adding a new network configuration, please update this table and document the recommended use cases.
