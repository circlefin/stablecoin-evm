# Bridging stablecoin tokens

This guide explains the high-level flow for bridging stablecoin tokens across different networks.

## Overview

- Users lock tokens on the origin chain (e.g. Ethereum mainnet).
- A bridge contract emits an event or message that is relayed to the destination chain.
- A corresponding contract on the destination chain mints or releases an equivalent amount of tokens.

## Key steps for developers

1. **Deploy bridge contracts** on both origin and destination chains.
2. **Configure relayers** or use existing cross-chain messaging providers.
3. **Handle decimals and fees** appropriately; tokens may have different decimals on different chains.
4. **Test thoroughly** on testnets (e.g. Sepolia, Mumbai) before production deployments.

When adding new bridge support, update this document with the new flow and any specific considerations.
