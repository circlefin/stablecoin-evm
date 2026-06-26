# Bytecode Verification

This guide explains how to verify that a USDC deployment's on-chain bytecode
matches Circle's reference implementation in this repository.

## Prerequisites

Set up the repository by following the instructions in the
[README](../README.md). All steps in this guide assume the repository is fully
set up.

## Setup

Copy the [template](../verification_artifacts/input.template.json) by running
the following command:

```sh
cp verification_artifacts/input.template.json verification_artifacts/input.json
```

## Providing Input

Fill in `verification_artifacts/input.json` with details for the latest
FiatToken implementation contract (FiatTokenV2_2 as of writing), FiatTokenProxy,
and the SignatureChecker library contract.

1. Fill in the `input.json` file that you created. For each contract, the
   required fields are:

   - `contractAddress`
   - `contractCreationTxHash`

   You must also provide a standard EVM-compatible node URL in the field:

   - `rpcUrl`

   There are additional optional parameters for each contract that should only
   be used if a contract cannot be verified using the required parameters alone.
   The purpose of each optional parameter is described below:

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
     [alternativeArtifacts.ts](../scripts/hardhat/alternativeArtifacts.ts).
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

## Running Verification

Compile the contracts and run the verification script locally:

```sh
yarn compile
yarn hardhat run scripts/verifyMainnetTokenBytecode.ts --network mainnet
```

The script will print a comparison result for each contract. It exits with a
non-zero code if any verification fails.

## Common Issues

### Compiler Settings

Please check your compiler settings and make sure everything, including
optimizer runs, matches ours.

### Metadata mismatch

Do not format the metadata files--leave them as extracted. Formatting the file
will result in a mismatching hash.
