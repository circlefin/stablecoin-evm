# Initial Deployment

This is the process for deploying a new proxy and implementation (as opposed to
upgrading an existing proxy).

Since the proxy uses `delegatecall` to forward calls to the implementation
initialization of the contracts becomes a little tricky because we can not
initialize fields in the implementation contract via the constructor. Instead
there is an initialize method in the implementation contract, which is publicly
available, but can only be called once per proxy.

## Deploying the implementation contract

1. Deploy [FiatTokenV1](../contracts/FiatTokenV1.sol)
2. Initialize the fields in FiatToken via the `initialize` method. The values
   are not important, but this will stop anyone else initializing the roles and
   trying to use it as a token or pass it off as a real CENTRE token.
   ```
   initialize(
          "",
          "",
          "",
          0,
          throwawayAddress,
          throwawayAddress,
          throwawayAddress,
          throwawayAddress
          )
   ```
3. Verify that all fields in the FiatToken have been initialized correctly and
   have the expected values. See [README.validate.md](../validate/validate.js).

## Deploying a Proxy:

1. Obtain addresses for the various contract roles from CENTRE ops. The keys for
   these addresses will be stored offline. The address needed are:

   ```
   admin
   masterMinter
   pauser
   blacklister
   owner
   ```

   For details on what these roles can do, see the
   [Token Design Doc](tokendesign.md)

2. Deploy [FiatTokenProxy](../contracts/FiatTokenProxy.sol), passing the address
   of the deployed implementation contract to the constructor, which will
   initialize the `_implementation` field.

3. The `admin` of the proxy contract defaults to msg.sender. You must either
   change the `admin` now, or send the remaining transactions from a different
   address. The `admin` can only see methods in the Proxy, any method calls from
   `admin` will not be forwarded to the implementation contract. The `admin`
   address can be changed by calling `changeAdmin`. Note that change admin must
   be called by the current admin.

   ```
   changeAdmin(adminAddress)

   ```

4. Initialize the proxy, via the `initialize` method. This call will get
   forwarded to the implementation contract, but since it is via `delegatecall`
   it will run in the context of the Proxy contract, so the fields it is
   initializing will be stored it the storage of the Proxy. The values passed
   here are important, especially for the roles that will control the contract.
   These addresses should be obtained from CENTRE ops, and the keys will be
   stored offline.

   ```
   initialize(
          "USD//C",
          "USDC",
          "USD",
          6,
          masterMinterAddress,
          pauserAddress,
          blacklisterAddress,
          ownerAddress
          )
   ```

5. Verify the fields have been properly initialized. Verification should be
   performed independently by multiple people to make sure that the contract has
   been deployed correctly. The following fields should be verified:

   - name, symbol, and currency are as expected
   - `decimals` is 6
   - `masterMinter` is the expected address
   - `pauser` is the expected address
   - `blacklister` is the expected address
   - `owner` is the expected address
   - `admin` is the expected address. Note that `admin` is not callable by
     anyone other than the admin, so this can be verified by calling
     `eth.getStorageAt(proxyAddress, 0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b)`
   - `_implementation` is the address of the implementation contract. Note that
     `implementation` is not callable by anyone other than the admin, so this
     can be verified by calling
     `eth.getStorageAt(proxyAddress, 0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3)`
   - `totalSupply` is 0
   - `initialized` is `true`

6. If all verification is successful, the contract is deployed and ready to go.
   If any verification steps failed, restart the process.
