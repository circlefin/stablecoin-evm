# Initial Deployment

This is the process for deploying a new proxy and implementation (as opposed to
upgrading an existing proxy).

Since the proxy uses `delegatecall` to forward calls to the implementation,
initialization of the contracts becomes a little tricky because we cannot
initialize fields in the implementation contract via the constructor. Instead
there is an initialize method in the implementation contract, which is publicly
available, but can only be called once per proxy.

## Deploying the implementation contract

1. Deploy [FiatTokenV2_2](../contracts/v2/FiatTokenV2_2.sol)
2. Initialize the fields in FiatTokenV2_2 via the `initialize*` methods. The
   values are not important, but this will stop anyone else initializing the
   roles and trying to use it as a token or pass it off as a real Circle token.

   ```js
   initialize(
     "",
     "",
     "",
     0,
     THROWAWAY_ADDRESS,
     THROWAWAY_ADDRESS,
     THROWAWAY_ADDRESS,
     THROWAWAY_ADDRESS
   );
   initializeV2("");
   initializeV2_1(THROWAWAY_ADDRESS);
   initializeV2_2([], "");
   ```

3. Verify that all fields in the FiatToken have been initialized correctly and
   have the expected values.

## Deploying a Proxy:

1. Obtain addresses for the following contract roles. Ensure that the keys for
   these addresses are securely stored.

   ```
   admin
   masterMinter
   pauser
   blacklister
   owner
   ```

   For details on what these roles can do, see the
   [Token Design Doc](tokendesign.md)

2. Deploy [FiatTokenProxy](../contracts/v1/FiatTokenProxy.sol), passing the
   address of the deployed implementation contract to the constructor, which
   will initialize the `_implementation` field.

3. The `admin` of the proxy contract defaults to `msg.sender`. You must either
   change the `admin` now, or send the remaining transactions from a different
   address. The `admin` can only see methods in the Proxy, any method calls from
   `admin` will not be forwarded to the implementation contract. The `admin`
   address can be changed by calling `changeAdmin`. Note that change admin must
   be called by the current admin.

   ```
   changeAdmin(adminAddress)
   ```

4. Initialize the proxy via the `initialize*` methods. This call will get
   forwarded to the implementation contract, but since it is via `delegatecall`
   it will run in the context of the Proxy contract, so the fields it is
   initializing will be stored in the storage of the Proxy. The values passed
   here are important, especially for the roles that will control the contract.

   ```js
   initialize(
     tokenName,
     tokenSymbol,
     tokenCurrency,
     tokenDecimals,
     masterMinterAddress,
     pauserAddress,
     blacklisterAddress,
     ownerAddress
   );
   initializeV2(newTokenName);
   initializeV2_1(lostAndFoundAddress);
   initializeV2_2(accountsToBlacklist, newTokenSymbol);
   ```

5. Verify the fields have been properly initialized. Verification should be
   performed independently by multiple people to make sure that the contract has
   been deployed correctly. The following fields should be verified:

   - `admin` is the expected address
   - `implementation` is the address of the implementation contract
   - `name`, `symbol`, `currency` and `decimals` are as expected
   - `version` is 2
   - `owner`, `masterMinter`, `pauser`, `blacklister` are the expected addresses
   - `totalSupply` is 0
   - `initialized` is `true`

6. If all verification is successful, the contract is deployed and ready to go.
   If any verification steps failed, restart the process.
