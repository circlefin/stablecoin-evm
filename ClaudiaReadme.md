## Steps

- Download the foundry version to 0.2.0 the latest ones deploy libraries with
  create2 (foundryup -u foundry-rs-commit-156cb13)
- check all env variables are the correct ones (IMPORTANT: double check the
  PROXY_ADMIN_ADDRESS is safe multisig address )
- check makefile instructions
  - run `make d` to check everything goes fine
  - run `make deploy-verify` or `make deploy` (if running only deploy will need
    to verify manually later on)
  - check in the block explorer the contract was deployed and verified
- prepare PR on circle to verify the deployment
  - go to main and fill the contracts addresses and creation txs based on
    `verification-artifacts/input.template.json`
  - generate each contract artifact by doing `make gen`
  - open PR in circle repo
- Upload the deployment to the drive
- Run `make verify-mainnet` this will run:
  - `yarn hardhat run scripts/verifyBridgedTokenBytecode.ts --network mainnet`
    -> Circle's deployment validation in the pipeline.
  - `yarn hardhat run scripts/verifyProxySlotImplementation.ts --network mainnet`
    -> Verifier to check implementation slot and implementation address to avoid
    CPIMP attack.

## Notes:

If foundry not verifying properly try doing it with hh. Example for verifying
the proxy in somnia with the implementation
`0xa6f01ccc347f07256bec0dc7d1a3b62adc3f1a68`

`npx hardhat verify --contract contracts/v1/FiatTokenProxy.sol:FiatTokenProxy --network somnia 0x28bec7e30e6faee657a03e19bf1128aad7632a00 0xa6f01ccc347f07256bec0dc7d1a3b62adc3f1a68 --force`
