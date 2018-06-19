# centre-tokens
Fiat tokens of the CENTRE network. 

# Setup
Tests need node v8.0.0 or higher, as they depend on async/await functionality. Interacting with eth is very async-y so await makes it much easier to write tests.
Depends on truffle and testrpc for testing.

install truffle:
```npm install -g truffle```

install ganache-cli:
```npm install -g ganache-cli```

install project npm dependencies:
```npm install```

install submodules:
```git submodule update --init```

# Testing
ganache-cli (Ethereum RPC client) must be running first
```ganache-cli --defaultBalanceEther 1000000 --deterministic```

then run the tests via truffle:
```truffle test```

or run a specific file of tests with:
```truffle test [file]```

to generate test coverage run:
```npm test```


# Submodules
Open Zeppelin is included as a submodule, however AWS codebuild doesn't play nice with submodules so we have to include the specific commit in `buildspec.yaml` as well. Whenever we update the sumbodule we also have to update the hash in `buildspec.yaml` for the build to pick it up. Hopeully amazon will support submodules at some point in the near future.


# Contracts
The implementation of the FiatToken is broken up into 2 separate contracts - a logic contract (`FiatToken.sol`)and a data storage contract (`EternalStorage.sol`).
A separate data contract is used so that the logic contract can be upgraded.

## FiatToken
The FiatToken offers a number of capabilities
### ERC20 compatible
The FiatToken implements the ERC20 interface.

### Pausable
The entire contract can be frozen, such as if a serious bug is found. No transfers can take place while the contract is paused.
Access to the pause functionality is controlled by a `pauser` address.

### Upgradable
The logic contract can be upgraded to a new contract, and the old contract will forward calls to the new contract making migration less disruptive.
Access to the upgrade functionality is guarded by an `upgrader` address. Only the `upgrader` can change the `upgrader` address.

### Blacklist
The contract can blacklist certain addresses which will prevent those addresses from transferring or receiving tokens.
Access to the blacklist functionality is controlled by a `blacklister` address.

### Minting/Burning
Tokens can be minted or burned on demand. The contract supports having multiple minters simultaneously. There is a 
`masterMinter` address which controls the list of minters and how much each is allowed to mint. The mint allowance is 
similar to the ERC20 allowance - as each minter mints new tokens their allowance decreases. When it is low they will
need the allowance increased again by the `masterMinter`.

### Ownable
The contract has an Owner, who can change the `owner`, `pauser`, `blacklister`, or `masterMinter` addresses. The `owner` can not change
the `upgrader` address.

## EternalStorage
This is the data storage for the logic contract. All balances, allowances, blacklists, etc are stored here so that the logic contract can be upgraded.

### getters/setters
The storage contract provides getters/setters for all the data we want to persist through an upgrade. In some cases we have
written getters/setters which operate on multiple values to decrease gas costs.

### Ownable
The storage contract is Ownable, and its owner will be the FiatToken contract. In the event of an upgrade the FiatToken
will call the `transferOwnership` method to switch ownership to the new, upgraded contract.


# OpenZeppelin
Contracts from OpenZeppelin version 1.10 are used where possible, with some modifications. These contracts are located
in `contracts/thirdparty/openzepplin`. `Ownable` and `Pausable` have been modified. The other contacts are unmodified.

## `Ownable` has been modified to:
1. Remove renounceOwnership function and OwnershipdRenounced event.
## `Pausable` has been modified to:
1. Add a pauser role, which controlls `pause`/`unpause`
2. Remove `whenPaused`/`whenNotPaused` modifiers on `unpause`/`pause` methods
3. Remove `whenPaused` as is is no longer used

