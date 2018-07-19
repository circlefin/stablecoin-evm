# centre-tokens
Fiat tokens on the CENTRE network. 

# Setup
Tests need node v8.0.0 or higher, as they depend on async/await functionality. Interacting with eth is very async-y so await makes it much easier to write tests.
Depends on truffle and testrpc for testing.

install truffle:
```npm install -g truffle```

install ganache-cli:
```npm install -g ganache-cli```

install project npm dependencies:
```npm install```

# Testing
ganache-cli (Ethereum RPC client) must be running first
```ganache-cli --defaultBalanceEther 1000000 --deterministic```

then run the tests via truffle:
```truffle test```

or run a specific file of tests with:
```truffle test [file]```

to generate test coverage run:
```npm test```


# Contracts
The implementation uses 2 separate contracts - a proxy contract (`FiatTokenProxy.sol`)and an implementation contract(`FiatToken.sol`).
This allows upgrading the contract, as a new implentation contact can be deployed and the Proxy updated to point to it.
## FiatToken
The FiatToken offers a number of capabilities, which briefly are described below. There are more 
[detailed design docs](./doc/tokendesign.md) in the `doc` folder.

### ERC20 compatible
The FiatToken implements the ERC20 interface.

### Pausable
The entire contract can be frozen, in case a serious bug is found or there is a serious key compromise. No transfers can take place while the contract is paused.
Access to the pause functionality is controlled by the `pauser` address.

### Upgradable
A new implementation contract can be deployed, and the proxy contract will forward calls to the new contract.
Access to the upgrade functionality is guarded by a `proxyOwner` address. Only the `proxyOwner` address can change the `proxyOwner` address.

### Blacklist
The contract can blacklist certain addresses which will prevent those addresses from transferring or receiving tokens.
Access to the blacklist functionality is controlled by the `blacklister` address.

### Minting/Burning
Tokens can be minted or burned on demand. The contract supports having multiple minters simultaneously. There is a 
`masterMinter` address which controls the list of minters and how much each is allowed to mint. The mint allowance is 
similar to the ERC20 allowance - as each minter mints new tokens their allowance decreases. When it gets too low they will
need the allowance increased again by the `masterMinter`.

### Ownable
The contract has an Owner, who can change the `owner`, `pauser`, `blacklister`, or `masterMinter` addresses. The `owner` can not change
the `proxyOwner` address.

# OpenZeppelin
Contracts from OpenZeppelin version 1.10 are used where possible, with some modifications. These contracts are located
in `contracts/thirdparty/openzepplin`. `Ownable` and `Pausable` have been modified. The other contacts are unmodified.

## `Ownable` has been modified to:
1. Remove the renounceOwnership function and OwnershipdRenounced event.
## `Pausable` has been modified to:
1. Add the pauser role, which controlls `pause`/`unpause`
2. Remove `whenPaused`/`whenNotPaused` modifiers on `unpause`/`pause` methods
3. Remove `whenPaused` as is is no longer used

