<!-- prettier-ignore-start -->
<!-- omit in toc -->
# Circle's Stablecoin Smart Contracts on EVM-compatible blockchains
<!-- prettier-ignore-end -->

This repository contains the smart contracts used by
[Circle's](https://www.circle.com/) stablecoins on EVM-compatible blockchains.
All contracts are written in [Solidity](https://soliditylang.org/) and managed
by the [Hardhat](https://hardhat.org/) framework.

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Table of contents
<!-- prettier-ignore-end -->

- [Setup](#setup)
  - [Development Environment](#development-environment)
  - [IDE](#ide)
- [Development](#development)
  - [TypeScript type definition files for the contracts](#typescript-type-definition-files-for-the-contracts)
  - [Linting and Formatting](#linting-and-formatting)
  - [Testing](#testing)
- [Deployment](#deployment)
- [Contracts](#contracts)
- [FiatToken features](#fiattoken-features)
  - [ERC20 compatible](#erc20-compatible)
  - [Pausable](#pausable)
  - [Upgradable](#upgradable)
  - [Blacklist](#blacklist)
  - [Minting/Burning](#mintingburning)
  - [Ownable](#ownable)
- [Additional Documentations](#additional-documentations)

## Setup

### Development Environment

Requirements:

- Node 16.14.0
- Yarn 1.22.19
- [Foundry@2cf84d9](https://github.com/foundry-rs/foundry/releases/tag/nightly-2cf84d9f3ba7b6f4a9296299e7036ecc24cfa1da)

```sh
$ git clone git@github.com:circlefin/stablecoin-evm.git
$ cd stablecoin-evm
$ nvm use
$ npm i -g yarn@1.22.19 # Install yarn if you don't already have it
$ yarn install          # Install npm packages and other dependencies listed in setup.sh
```

### IDE

We recommend using VSCode for the project here with these
[extensions](./.vscode/extensions.json) installed.

## Development

### TypeScript type definition files for the contracts

Types are automatically generated as a part of contract compilation:

```sh
$ yarn compile
```

To generate typing without re-compiling, run

```sh
$ yarn hardhat typechain
```

### Linting and Formatting

To check code for problems:

```sh
$ yarn static-check   # Runs a static check on the repo.
```

or run the checks individually:

```sh
$ yarn typecheck      # Type-check TypeScript code
$ yarn lint           # Check JavaScript and TypeScript code
$ yarn lint --fix     # Fix problems where possible
$ yarn solhint        # Check Solidity code
```

To auto-format code:

```sh
$ yarn fmt
```

### Testing

Run all tests:

```sh
$ yarn test
```

To run tests in a specific file, run:

```sh
$ yarn test [path/to/file]
```

To run tests and generate test coverage, run:

```sh
$ yarn coverage
```

To check the size of contracts in the repo, run the following command.

```sh
$ yarn contract-size # Ignores tests
```

## Deployment

1. Create a copy of the file `.env.example`, and name it `.env`. Fill in
   appropriate values in the `.env` file. This file must not be checked into the
   repository.

```sh
cp .env.example .env
```

2. Create a `blacklist.remote.json` file and populate it with a list of
   addresses to be blacklisted. This file must not be checked into the
   repository.

```sh
echo "[]" > blacklist.remote.json
```

3. Simulate a deployment by running the following command

```sh
yarn forge:simulate scripts/deploy/deploy-fiat-token.s.sol --rpc-url <testnet OR mainnet>
```

4. Validate that all transactions to be broadcasted are filled in with the
   correct values
5. Deploy the contracts by running the following command

```sh
yarn forge:broadcast scripts/deploy/deploy-fiat-token.s.sol --rpc-url <testnet OR mainnet>
```

6. Verify the contracts on an Etherscan flavored block explorer by running the
   following command. Ensure that `ETHERSCAN_KEY` is set in the `.env` file.

```sh
yarn forge:verify scripts/deploy/deploy-fiat-token.s.sol --rpc-url <testnet OR mainnet>
```

## Contracts

The FiatToken contracts adheres to OpenZeppelin's
[Proxy Upgrade Pattern](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies)
([permalink](https://github.com/OpenZeppelin/openzeppelin-upgrades/blob/65cf285bd36af24570186ca6409341540c67238a/docs/modules/ROOT/pages/proxies.adoc#L1)).
There are 2 main contracts - an implementation contract
([`FiatTokenV2_2.sol`](./contracts/v2/FiatTokenV2_2.sol)) that contains the main
logic for FiatToken's functionalities, and a proxy contract
([`FiatTokenProxy.sol`](./contracts/v1/FiatTokenProxy.sol)) that redirects
function calls to the implementation contract. This allows upgrading FiatToken's
functionalities, as a new implementation contact can be deployed and the Proxy
can be updated to point to it.

## FiatToken features

The FiatToken offers a number of capabilities, which briefly are described
below. There are more [detailed design docs](./doc/tokendesign.md) in the `doc`
directory.

### ERC20 compatible

The FiatToken implements the ERC20 interface.

### Pausable

The entire contract can be frozen, in case a serious bug is found or there is a
serious key compromise. No transfers can take place while the contract is
paused. Access to the pause functionality is controlled by the `pauser` address.

### Upgradable

A new implementation contract can be deployed, and the proxy contract will
forward calls to the new contract. Access to the upgrade functionality is
guarded by a `proxyOwner` address. Only the `proxyOwner` address can change the
`proxyOwner` address.

### Blacklist

The contract can blacklist certain addresses which will prevent those addresses
from transferring or receiving tokens. Access to the blacklist functionality is
controlled by the `blacklister` address.

### Minting/Burning

Tokens can be minted or burned on demand. The contract supports having multiple
minters simultaneously. There is a `masterMinter` address which controls the
list of minters and how much each is allowed to mint. The mint allowance is
similar to the ERC20 allowance - as each minter mints new tokens their allowance
decreases. When it gets too low they will need the allowance increased again by
the `masterMinter`.

### Ownable

The contract has an Owner, who can change the `owner`, `pauser`, `blacklister`,
or `masterMinter` addresses. The `owner` can not change the `proxyOwner`
address.

## Additional Documentations

- [FiatToken design](./doc/tokendesign.md)
- [MasterMinter design](./doc/masterminter.md)
- [Bridged USDC Standard](./doc/bridged_USDC_standard.md)
- [Deployment process](./doc/deployment.md)
- [Preparing an upgrade](./doc/upgrade.md)
- [Upgrading from v2.1 to v2.2](./doc/v2.2_upgrade.md)
- [Celo FiatToken extension](./doc/celo.md)
