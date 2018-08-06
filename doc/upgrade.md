# Upgrading a FiatToken

This is the process for creating an upgraded token, deploying the upgraded token, and pointing an existing proxy to the upgraded token. 

## Upgraded Token Construction
An upgraded token can have:
1) New logic (functions)
2) New fields (data)
3) New logic and new fields

Each situation is addressed in a section below. 

### New Logic Only
A template for the next upgraded contract for new logic is kept in /contracts with the file name FiatTokenV[X].sol where X is the version number. The upgraded contract *must* inherit from the current contract. For example, if upgrading from version 1 to version 2, the contract would have the format:

  ```
  import './FiatTokenV1.sol';

  /**
   \* @title FiatTokenV2
   \* @dev ERC20 Token backed by fiat reserves
   **/
  contract FiatTokenV2 is FiatTokenV1 { 
    ...
  }

  ```

All that remains is to add the new logic (functions) as part of the body (denoted by ... in the code above) of the contract. 
Note that `private` *functions* will not be inherited in subsequent contract versions and should be added with care. 

### New Fields Only
Adding new fields requires inheriting from the prior version of the contract as done in [New Logic](#new-logic-only). In addition, the new contract requires declaring new data fields and initialization logic for the new fields. The new token must add an *initialize* function and a *initV[X]* function, where X is the version of the contract. The initialization function allows the contract to be deployed from scratch and initialize all variables declared in the new contract and in prior contracts. The initV[X] function allows the contract to initialize only the new variables added in the new contract. New variables added *must* be declared as type `internal` or `public`, `private` can never be used. Note that `private` *functions* will also not be inherited in subsequent contract versions and should be added with care. A template is below shown for upgrading from version 1 to version 2. In the example, we add variables newBool, newAddress, and newUint, which would be replaced with the real variables added. 

  ```
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
  *Note the addition of a new initializedV[X] variable that is checked and set in initV[X].*
  *Note the structure of initialized that uses a super call with previously set parameters as well as a call to initV[X].*

### New Logic and New Fields
The case requires the same steps as [New Fields](#new-fields-only) plus the addition of new functions as done in [New Logic](#new-logic-only). 


## Upgraded Token Deployment
Deployment can be done in the following steps:
  1) Write any new logic and new fields in the new contract (as described above)
  2) Test any new fields and logic added to the contract (including positive, negative, and extended tests following the current testing strategy)
  3) Ensure the test suite has run on the final version of the new contract with added tests and that the test suite passes with 100% code coverage
  4) Complete any external audits as deemed necessary 
  5) Go back to step 1 if any prior step is not completed successfully
  6) Deploy the contract by following *Deployment Instructions* in *only* section *Deploying the implementation contract* [instructions](deployment.md#Deploying-the-implementation-contract). If new fields are added, substitute initV[X] for initialize in the instructions. If only new logic is added, no initialization is required. 

## Upgrading the Proxy to point to the UpgradedToken
The proxy must be pointed to the new upgraded token. This is accomplished two ways depending on whether only new logic was added or if new fields (and possibly new logic) were added. 

### Upgrading if *ONLY* New Logic Added
1) Use the centre-token-client to prepare an upgradeTo transaction from the adminAccount parameterized with the address of the new upgraded token (see token-client instructions).
2) Broadcast the transaction
3) Call getImplementation on the proxy (a read call, no signed tx required) and ensure it matches the address of the upgraded token. 
4) If the address in 3) does not match, it is likely a wrong address was used. Repeat the process from step 1).

### Upgrading if New Fields (and possibly new Logic) Added
1) Use the centre-token-client to prepare an upgradeToAndCall transaction from the adminAccount parameterized with the address of the new upgraded token and an internal call to invoke initV[X] with the new data fields. (see token-client instructions).
2) Broadcast the transaction
3) Call getImplementation on the proxy (a read call, no signed tx required) and ensure it matches the address of the upgraded token. 
4) If the address in 3) does not match, it is likely a wrong address was used. Repeat the process from step 1).
5) Verify that the new fields were set correctly as done in *Deployment Instructions* [verification](deployment.md) 
6) If verification fails, restart the process from step 1)

