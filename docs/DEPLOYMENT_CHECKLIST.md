# Deployment Checklist

Use this checklist to prepare a stablecoin-evm deployment.

## Pre-deployment

- Review contract parameters (name, symbol, decimals).
- Verify admin and role addresses.
- Audit contract code for vulnerabilities.
- Run unit and integration tests.

## Deployment steps

1. Deploy the implementation contract.
2. Deploy the proxy contract pointing to the implementation.
3. Set initial roles (owner, minter, pauser).
4. Mint an initial supply if required.

## Post-deployment

- Verify contracts on Etherscan.
- Configure monitoring and alerting.
- Record transaction hashes for future reference.

Following this checklist helps avoid misconfigurations and ensures a smooth deployment.
