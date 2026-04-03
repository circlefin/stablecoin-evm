# Localnet Playbook

This playbook describes a minimal flow for running and testing the stablecoin contracts locally.

## 1. Install dependencies

    forge --version
    npm --version

Make sure Foundry and Node.js are installed and match the versions recommended in the main README.

## 2. Configure environment

Copy the template and edit your values:

    cp .env.template .env

Set `RPC_URL` and `DEPLOYER_PRIVATE_KEY` before continuing.

## 3. Run tests

Use Foundry to run the Solidity tests:

    forge test

If you add new tests, please keep them fast and deterministic.

## 4. Next steps

- Extend existing test suites before changing core contracts.
- Use `.env` for any local keys instead of hardcoding secrets.
- Keep this playbook updated whenever the local workflow changes.
