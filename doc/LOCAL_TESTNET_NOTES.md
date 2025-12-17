# Local Testnet Notes

This document provides a short checklist for running a local testnet
for the stablecoin contracts.

## 1. Start the local node

You can use Anvil or Hardhat to run a local node, for example:

    anvil --port 8545

or:

    npx hardhat node

## 2. Configure Hardhat

Ensure that your Hardhat network configuration matches the local node
settings (RPC URL, chain ID, accounts).

## 3. Deploy contracts

Use the existing deployment scripts or tasks to deploy the contracts
to your local network. For example:

    yarn hardhat deploy --network localhost

## 4. Run tests against the local testnet

Point your tests to the local network and run:

    yarn test

This can help catch issues that do not appear in purely in-memory
test environments.
