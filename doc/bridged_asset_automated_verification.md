# Bridged Asset Automated Verification

This documentation is a step-by-step guide on using the automated workflow for
bytecode verification for bridged token deployments. It also includes some
common mistakes that have caused unsuccessful verification, and how to fix them.

## Setup

1. Clone the latest version of Circle's repo and set it up as instructed
   [here](../README.md).

2. Copy the [template](../verification_artifacts/input.template.json) by running
   the following command

   ```sh
   $ cp verification_artifacts/input.template.json verification_artifacts/input.json
   ```

## Providing Input

Please follow the instructions below on filling the file. It is required to
provide the input for the latest FiatToken implementation contract
(FiatTokenV2_2 as of writing), FiatTokenProxy, and the SignatureChecker library
contract, all at once.

1. Fill in the `input.json` file that you created. For each contract, the
   required fields are:

   - `contractAddress`
   - `contractCreationTxHash`

   You must also provide a standard EVM-compatible node URL in the field:

   - `rpcUrl`

   There are additional optional parameters for each contract that should only
   be used if a contract cannot be verified using the required parameters alone.
   The purpose of each optional parameter is described below::

   - `verificationType`: by default, the verification type will be "partial".
     This means that the metadata hash at the end of the runtime bytecode will
     be verified separately via the metadata files generated below.
     Alternatively, this field can be set to "full", but in that case, your
     contract's metadata must match the metadata in this repo exactly. If this
     parameter is set to "full", you may skip the metadata extraction described
     in step 2.
   - `useTracesForCreationBytecode`: a boolean value for whether or not to use
     traces for pulling contract creation code. Setting this parameter to `true`
     is only necessary if the contract was deployed _within_ a transaction, i.e.
     it was deployed from another contract. Note that if this parameter is set
     to `true`, the provided `rpcUrl` must support the `debug_traceTransaction`
     JSON RPC method.
   - `artifactType`: a string to indicate what artifact to use for verification
     if the contract deployment does not match the current artifacts in the
     repo. The options for this value can be found in
     [alternativeArtficacts.ts](../scripts/hardhat/alternativeArtifacts.ts).
   - `optimizerRuns`: an integer indicating the number of optimizer runs
     specified when compiling the contract. This is only necessary to include if
     your value does not match the one in [foundry.toml](../foundry.toml).

2. Follow the steps [here](./metadata_extraction.md) to extract metadata for
   each of the following contracts:

   1. extract FiatTokenV2_2 metadata to
      `verification_artifacts/FiatTokenV2_2.json`
   2. extract FiatTokenProxy metadata to
      `verification_artifacts/FiatTokenProxy.json`
   3. extract SignatureChecker metadata to
      `verification_artifacts/SignatureChecker.json`

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
   an approval from Circle to run the GitHub action.
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

Do not format the metadata files--leave them as extracted. Formatting the file
will result in a mismatching hash.
