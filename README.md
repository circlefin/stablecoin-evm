# centre-tokens

Fiat tokens on the [CENTRE](https://centre.io) network.

## Setup

Requirements:

- Node 16.14.0
- Yarn

```
$ git clone git@github.com:centrehq/centre-tokens.git
$ cd centre-tokens
$ nvm use 16.14.0
$ npm i -g yarn       # Install yarn if you don't already have it
$ yarn install        # Install dependencies
```

## Deployment

You will need 4 different hot keys (deployer, proxy admin, master minter, owner), and they should be funded (with 0.5-1 ETH) to pay for tx's.
You can use ./scripts/create-account.js to create the keys

Create a copy of the file `config.js.example`, and name it `config.js`. 
Fill in the empty values.  
This file must not be checked into the repository. To prevent
accidental check-ins, `config.js` is in `.gitignore`.

```
yarn deployContracts --network {development, testnet, mainnet}

// ensure PROXY_CONTRACT_ADDRESS and MINT_ALLOWANCE_UNITS_PROD/STG 
// are properly set in config.js 
yarn minters --network {development, testnet, mainnet}
// make sure you record address of FiatTokenProxy, FiatTokenV2_1, MasterMinter
yarn verify --network {development, testnet, mainnet}

// only needed for mainnet
// ensure you set the address for MASTER_MINTER_CONTRACT_ADDRESS and PROXY_CONTRACT_ADDRESS
yarn coldStorage --network {development, testnet, mainnet}
```

**Remember to save the config.js file in 1PW Wallets Org** 
- include the deployed contract addresses in the config file.

## TypeScript type definition files for the contracts

To generate type definitions:

```
$ yarn compile && yarn typechain
```

## Linting and Formatting

To check code for problems:

```
$ yarn typecheck      # Type-check TypeScript code
$ yarn lint           # Check JavaScript and TypeScript code
$ yarn lint --fix     # Fix problems where possible
$ yarn solhint        # Check Solidity code
$ yarn slither        # Run Slither
```

To auto-format code:

```
$ yarn fmt
```

## Testing

First, make sure Ganache is running.

```
$ yarn ganache
```

Run all tests:

```
$ yarn test
```

To run tests in a specific file, run:

```
$ yarn test [path/to/file]
```

To run tests and generate test coverage, run:

```
$ yarn coverage
```

## Contracts

The implementation uses 2 separate contracts - a proxy contract
(`FiatTokenProxy.sol`) and an implementation contract (`FiatToken.sol`). This
allows upgrading the contract, as a new implementation contact can be deployed
and the Proxy updated to point to it.

### FiatToken

The FiatToken offers a number of capabilities, which briefly are described
below. There are more [detailed design docs](./doc/tokendesign.md) in the `doc`
folder.

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
