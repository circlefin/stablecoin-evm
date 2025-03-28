## Steps

- check all env variables are the correct ones (IMPORTANT: double check the
  PROXY_ADMIN_ADDRESS is safe multisig address )
- check makefile instructions
  - run `make simulate` to check everything goes fine
  - run `make deploy-verify` or `make deploy` (if running only deploy will need
    to verify manually later on)
  - check in the block explorer the contract was deployed and verified
- prepare PR on circle to verify the deployment
  - go to main and fill the contracts addresses and creation txs based on
    `verification-artifacts/input.template.json`
  - generate each contract artifact by doing `make gen`
