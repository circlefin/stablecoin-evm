# Bridged Asset Automated Verification

This documentation is a step-by-step guide on using the automated workflow for
bytecode verification for bridged token deployments. It also includes some
common mistakes that have caused unsuccessful verification, and how to fix them.

## Setup

1. Clone the latest version of Circle's repo and set up as instructed
   [here](../README.md).

2. Copy the [template](../verification_artifacts/input.template.json) by running
   the following command

   ```sh
   $ cp verification_artifacts/input.template.json verification_artifacts/input.json
   ```

## Providing Input

We require you provide the input for latest FiatToken implementation contract
(`FiatTokenV2_2` as of writing), `FiatTokenProxy`, and the `SignatureChecker`
library contract, all at once. Please

1. Fill in the `input.json` file that you created. For each contract, required
   inputs fields are listed below

   - contractAddress
   - contractCreationTxHash

   And you also need to provide a standard EVM-compatible node URL in the field

   - rpcUrl

2. Follow the steps [here](./metadata_extraction.md) to extract the
   FiatTokenV2_2 metadata to `verification_artifacts/FiatTokenV2_2.json`

3. Follow the steps [here](./metadata_extraction.md) to extract the
   FiatTokenProxy metadata to `verification_artifacts/FiatTokenProxy.json`

4. Follow the steps [here](./metadata_extraction.md) to extract the
   SignatureChecker metadata to `verification_artifacts/SignatureChecker.json`

   After this step, your local directory should look like

   ```
   stablecoin-evm
   ├── verification_artifacts
   │   ├── FiatTokenV2_2.json
   │   ├── FiatTokenProxy.json
   │   ├── SignatureChecker.json
   │   └── input.json
   ├── ...
   ```

   Note that the namings are strictly enforced by the verification script.

## Steps for Verification

1. Create a PR to Circle's public repo with the title prefixed with "**[B2N]**."
2. Inform your point of contact at Circle that you have made a PR and wait for
   an approval from them.
3. Automated bytecode verification will run once the PR is checked and the
   workflow is approved. From there, you can verify your results by seeing the
   Checks section on the PR page. If verification fails, you may request for
   another verification by submitting another commit to the same PR.
4. Inform your point of contact at Circle once verification has succeeded.

## Common Issues

### Compiler Settings

Please check your compiler settings and make sure everything, including
optimizer runs, matches ours.

### Metadata mismatch

Remember to not format the metadata file, leave them as extracted. Otherwise it
will result in a mismatching hash.
