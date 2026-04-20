# Deploy Checklist

This checklist is meant to be used before deploying the stablecoin
contracts to any live network (testnet or mainnet).

## 1. Configuration

- [ ] Network configuration is correct (chain ID, RPC URL, gas settings).
- [ ] Etherscan (or equivalent) API key is configured for verification.
- [ ] Blacklist configuration (if used) has been validated.

## 2. Contracts

- [ ] `yarn compile` succeeds without errors.
- [ ] `yarn test` passes for all test suites.
- [ ] Contract sizes are within the limits (`yarn contract-size`).

## 3. Security and reviews

- [ ] All security-sensitive changes have been peer-reviewed.
- [ ] External audits (if applicable) have been completed and issues addressed.
- [ ] Admin and role addresses have been double-checked.

## 4. Deployment dry-run

- [ ] A deployment dry-run has been executed on a testnet with the same settings.
- [ ] Post-deploy scripts (initialization, role assignments) have been tested.

## 5. Post-deploy steps

- [ ] Contracts are verified on the corresponding block explorer.
- [ ] Monitoring/alerting is configured for key events.
- [ ] Operational documentation has been updated with the new deployment details.
