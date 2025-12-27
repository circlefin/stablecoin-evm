# Proxy and upgradability pattern

Stablecoin contracts use the proxy pattern to separate logic and state.

- **Proxy contract** – holds storage and delegates calls.
- **Implementation contract** – contains the logic and can be upgraded.

## Why proxies?

- Allows bug fixes and feature additions without migrating user balances.
- Separates admin controls (proxy admin) from token owner.

## How upgrades happen

1. Deploy new implementation.
2. Proxy admin calls `upgradeTo(newImplementation)`.
3. Initialization functions can be called to set up new state.

Always audit new implementations and understand risks before upgrading.
