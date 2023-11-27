<!-- prettier-ignore-start -->
<!-- omit in toc -->
# Circle's Stablecoin Smart Contracts on EVM-compatible blockchains
<!-- prettier-ignore-end -->

This repository contains the smart contracts used by
[Circle's](https://www.circle.com/) stablecoins on EVM-compatible blockchains.
All contracts are written in [Solidity](https://soliditylang.org/) and managed
by the [Truffle](https://trufflesuite.com/) framework.

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

```sh
$ git clone git@github.com:circlefin/stablecoin-evm.git
$ cd stablecoin-evm
$ nvm use
$ npm i -g yarn@1.22.19 # Install yarn if you don't already have it
$ yarn install          # Install dependencies
```

### IDE

We recommend using VSCode for the project here with these
[extensions](./.vscode/extensions.json) installed.

## Development

### TypeScript type definition files for the contracts

To generate type definitions:

```sh
$ yarn typechain
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
$ yarn slither        # Run Slither
```

To auto-format code:

```sh
$ yarn fmt
```

### Testing

First, make sure Ganache is running.

```sh
$ yarn ganache
```

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
$ yarn contract-size:all # Includes all contracts
```

## Deployment

Create a copy of the file `config.js.example`, and name it `config.js`. Enter
the BIP39 mnemonic phrase, the INFURA API key to use for deployment, and the
addresses of proxy admin, owner, master minter, blacklister, and pauser in
`config.js`. This file must not be checked into the repository. To prevent
accidental check-ins, `config.js` is in `.gitignore`.

Create a copy of the file `blacklist.test.json`, and name it
`blacklist.remote.json`. Fill in `blacklist.remote.json` with the list addresses
to blacklist. This file must not be checked into the repository. To prevent
accidental check-ins, `blacklist.remote.json` is in `.gitignore`.

Run `yarn migrate --network NETWORK`, where NETWORK is either `mainnet` or
`ropsten`.

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
- [Deployment process](./doc/deployment.md)
- [Preparing an upgrade](./doc/upgrade.md)
- [Upgrading from v1 to v2](./doc/v2_upgrade.md)
- [Upgrading from v2 to v2.1](./doc/v2.1_upgrade.md)
- [Upgrading from v2.1 to v2.2](./doc/v2.2_upgrade.md)
- [Bridged USDC Standard](./doc/bridged_USDC_standard.md)
