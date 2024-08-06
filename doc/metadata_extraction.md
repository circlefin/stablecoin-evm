# Extracting Metadata

Depending on the development framework you are using, there are different ways
to find the artifact metadata. The steps and general information are documented
below.

## Foundry

Foundry automatically stores build information for each `.sol` file in a
directory, typically the `out` directory unless specified otherwise in the
`foundry.toml` file. For the contract `example.sol`, the metadata is stored in
`out/example.sol/example.json` under the `rawMetadata` field, depending on the
Foundry version. To retrieve the metadata, you can run the following command:

```sh
cat out/example.sol/example.json | jq -jr '.rawMetadata' > example.metadata.json
```

## Hardhat

Hardhat stores the compiled output in the `artifacts` directory (or to the
artifacts path specified in `hardhat.config.ts`), which includes two
subdirectories we need to interact with: `build-info` and `contracts`. The
`build-info` directory contains files with hex IDs. You can retrieve the
metadata of `example.sol` to `example.metadata.json` by running the following
command from root directory:

```sh
cat "$(jq -r '.buildInfo' path/to/artifacts/contracts/path/to/example.sol/example.dbg.json | sed 's|^\.\./\.\./\.\./|path/to/artifacts/|')" | jq -jr '.output.contracts["contracts/path/to/example.sol"].example.metadata' > example.json
```

## Truffle

Truffle stores the exact path to the contract you compile as a part of metadata,
which means that it essentially stores some of your personal information and
others will never be able to verify unless their personal information matches
exactly with the one that gets included when you compile the code. For a
detailed discussion, see
[here](https://github.com/trufflesuite/truffle/issues/4119).
