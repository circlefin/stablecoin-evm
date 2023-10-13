# Upgrading a FiatToken

This is the process for creating an upgraded token, deploying the upgraded
token, and pointing an existing proxy to the upgraded token.

## Upgraded Token Construction

An upgraded token can have:

1. New logic (functions)
2. New state variables (data)
3. New logic and new state variables
4. Renamed state variables
5. Updated logic for existing functions

Each situation is addressed in a section below.

> **_IMPORTANT_**: Do not remove existing state variables or modify the
> inheritance order of contracts. Storage addresses for contract states are
> defined during compilation and follow a sequential order based on the
> declaration of state variables. Removing a state variable may cause other
> variables to read/write from the wrong storage address which is dangerous.
>
> Be cautious when working with storage slots. Before upgrading, ensure that
> storage addresses for existing state variables have not changed. You may rely
> on [storageSlots.behavior.ts](../test/helpers/storageSlots.behavior.ts) to
> validate this behavior.

### New Logic Only

A template for the next upgraded contract for new logic is kept in /contracts
with the file name FiatTokenV[X].sol where X is the version number. The upgraded
contract _must_ inherit from the current contract. For example, if upgrading
from version 1 to version 2, the contract would have the format:

```solidity
import './FiatTokenV1.sol';

/**
 \* @title FiatTokenV2
 \* @dev ERC20 Token backed by fiat reserves
 **/
contract FiatTokenV2 is FiatTokenV1 {
  ...
}

```

All that remains is to add the new logic (functions) as part of the body
(denoted by ... in the code above) of the contract. Note that `private`
_functions_ will not be inherited in subsequent contract versions and should be
added with care.

### New State Variables Only

Adding new state variables requires inheriting from the prior version of the
contract as done in [New Logic](#new-logic-only). In addition, the new contract
requires declaring new state variables and, if the state variables must be
initialized to non-default values, adding initialization logic for the new state
variables. New variables added _must_ be declared as type `internal` or
`public`, `private` can never be used. Note that `private` _functions_ will also
not be inherited in subsequent contract versions and should be added with care.
Also note that inline initialization of variables as part of declaration has no
effect as the proxy never executes this code (for example, bool public newBool =
true is not in fact initialized to true). If possible, new state variables
should be added that can start with default Solidity values and do not need
initialization. However, if any new state variables require initialization to
non-default values, the new token must add an _initialize_ function and a
_initV[X]_ function, where X is the version of the contract. The initialization
function allows the contract to be deployed from scratch and initialize all
variables declared in the new contract and in prior contracts. The initV[X]
function allows the contract to initialize only the new variables added in the
new contract. A template is shown below for upgrading from version 1 to
version 2. In the example, we add variables newBool, newAddress, and newUint,
which would be replaced with the real variables added.

```solidity
import './FiatTokenV1.sol';

/**
 \* @title FiatTokenV2
 \* @dev ERC20 Token backed by fiat reserves
 **/
contract FiatTokenV2 is FiatTokenV1 {

  bool public newBool;
  address public newAddress;
  uint256 public newUint;
  bool internal initializedV2;

  function initialize(
      string _name,
      string _symbol,
      string _currency,
      uint8 _decimals,
      address _masterMinter,
      address _pauser,
      address _blacklister,
      address _owner,
      bool _newBool,
      address _newAddress,
      uint256 _newUint
  ) public {
      super.initialize(_name, _symbol, _currency, _decimals, _masterMinter, _pauser, _blacklister, _owner);
      initV2(_newBool, _newAddress, _newUint);
  }

  function initV2(bool _newBool, address _newAddress, uint256 _newUint) public {
      require(!initializedV2);
      newBool = _newBool;
      newAddress = _newAddress;
      newUint = _newUint;
      initializedV2 = true;
  }
  ...

```

_Note the addition of a new initializedV[X] variable that is checked and set in
initV[X]._ _Note the structure of initialized that uses a super call with
previously set parameters as well as a call to initV[X]._

### New Logic and New State Variables

The case requires the same steps as
[New State Variables](#new-state-variables-only) plus the addition of new
functions as done in [New Logic](#new-logic-only).

### Updated Logic

The logic in existing functions may be updated, but it should be done only if it
does not cause breaking changes to users of the contract and it is absolutely
necessary. This can be done by finding the function declaration in the existing
contracts, marking the function as `virtual`, and `override` the function in the
upgraded contract.

```solidity
contract FiatTokenV1 {
    ...

    function foo() external virtual pure returns (uint256) {
        return 1;
    }
}
```

```solidity
import './FiatTokenV1.sol';

/**
 \* @title FiatTokenV2
 \* @dev ERC20 Token backed by fiat reserves
 **/
contract FiatTokenV2 is FiatTokenV1 {
    ...

    function foo() external override pure returns (uint256) {
        return 2;
    }
}
```

### Renamed State Variables

State variables may be renamed to increase clarity or readability. This may be
useful if there are state variables that have become unused but cannot be safely
removed. Deprecating the variable can be done by finding the variable
declaration in existing contracts, prefixing the variable with `deprecated` and
replacing references to the variable with the new name.

## Upgraded Token Deployment

Deployment can be done in the following steps:

1. Write any new logic and new state variables in the new contract (as described
   above)
2. Test any new state variables and logic added to the contract (including
   positive, negative, and extended tests following the current testing
   strategy)
3. Ensure the test suite has run on the final version of the new contract with
   added tests and that the test suite passes with 100% code coverage
4. Complete any external audits as deemed necessary
5. Go back to step 1 if any prior step is not completed successfully
6. Deploy the contract by following _Deployment Instructions_ in _only_ section
   _Deploying the implementation contract_
   [instructions](deployment.md#Deploying-the-implementation-contract). When
   invoking `initialize` in following deployment instructions, the latest
   version of `initialize` should be called.

## Upgrading the Proxy to point to the UpgradedToken

The proxy must be pointed to the new upgraded token. This is accomplished two
ways depending on whether only new logic was added or if new state variables
(and possibly new logic) were added.

### Upgrading if _ONLY_ New Logic Added

1. Prepare an upgradeTo transaction from the adminAccount parameterized with the
   address of the new upgraded token.
2. Broadcast the transaction
3. Check that the implementation field of the proxy matches the address of the
   upgraded token by calling the `implementation` method
4. If the address in 3) does not match, it is likely a wrong address was used.
   Repeat the process from step 1).

### Upgrading if New State Variables (and possibly new logic) Added

1. Prepare an upgradeToAndCall transaction from the adminAccount parameterized
   with the address of the new upgraded token and an internal call to invoke
   initV[X] with the new data state variables.
2. Broadcast the transaction
3. Check that the implementation field of the proxy matches the address of the
   upgraded token by calling the `implementation` method
4. If the address in 3) does not match, it is likely a wrong address was used.
   Repeat the process from step 1).
5. Verify that the new state variables were set correctly as done in _Deployment
   Instructions_ [verification](deployment.md)
6. If verification fails, restart the process from step 1)
