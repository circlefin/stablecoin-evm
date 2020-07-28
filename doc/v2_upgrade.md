# V2 Upgrade

### Prerequisites

1. Truffle Deployer Key ("Deployer Key")
2. Proxy Admin Key ("Admin Key")

### Steps

1. Ensure `config.js` file in the project root folder is configured correctly
   with correct values.

2. Run Truffle migrations using the Deployer Key, and get the address of the
   newly deployed `V2Upgrader` contract. The address is highlighted (`>>><<<`)
   to prevent accidental copying-and-pasting of an incorrect address.

   ```
   $ yarn migrate --network mainnet --f 3 --to 4
   ...
   ...
   Dry-run successful. Do you want to proceed with real deployment?  >> (y/n): y
   ...
   ...
   >>>>>>> Deployed V2Upgrader at 0x12345678 <<<<<<<
   ```

3. Verify that the upgrader contract is deployed correctly. Verify that the
   values returned by `proxy()`, `implementation()`, `newProxyAdmin()`, and
   `newName()` on the `V2Upgrader` contract are correct.

4. Using the Admin Key, transfer the proxy admin role to the `V2Upgrader`
   contract address by calling `changeAdmin(address)` method on the
   `FiatTokenProxy` contract.

5. Send 0.20 USDC to the `V2Upgrader` contract address. (200,000 tokens)

6. Using the Deployer Key, call `upgrade()` (`0xd55ec697`) method on the
   `V2Upgrader`.

#### IF THE UPGRADE TRANSACTION SUCCEEDS

- Verify that the proxy admin role is transferred back to the Admin Key.
- No further action needed.

#### IF THE UPGRADE TRANSACTION FAILS

- If the transaction fails, any state change that happened during the `upgrade`
  function call will be reverted.
- Call `abortUpgrade()` (`0xd8f6a8f6`) method on the `V2Upgrader` contract to
  tear it down.
