# Extracting Metadata

Important note: please separately extract the metadata into their own JSON files
for the FiatTokenProxy, FiatToken2_2 (at the time of writing), and
SignatureChecker contracts.

Depending on the development framework you are using, there are different ways
to find the artifact metadata. The steps and general information are documented
below.

## Foundry

Foundry automatically stores build information for each `.sol` file in a
directory, typically the `out` directory unless specified otherwise in the
`foundry.toml` file. For the contract `example.sol`, the metadata is stored in
`out/example.sol/example.json` under the `rawMetadata` field, depending on the
version of Foundry you're using. To retrieve the metadata, you can run the
following command:

```sh
cat path/to/example.sol/example.json | jq -jr '.rawMetadata' > example.metadata.json
```

## Hardhat

Hardhat stores the compiled output in the `artifacts` directory (or in the
artifacts path specified in `hardhat.config.ts`), which includes two
subdirectories, both of which are needed to extract metadata: `build-info` and
`contracts`. The `build-info` directory contains files with hex IDs. You can
output the metadata of `example.sol` to `example.metadata.json` by running the
following command from root directory:

```sh
cat "$(jq -r '.buildInfo' path/to/artifacts/contracts/path/to/example.sol/example.dbg.json | sed 's|^\.\./\.\./\.\./|path/to/artifacts/|')" | jq -jr '.output.contracts["contracts/path/to/example.sol"].example.metadata' > example.json
```
