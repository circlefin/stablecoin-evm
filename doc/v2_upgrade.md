# V2 Upgrade

### Prerequisites

1. Truffle Deployer Key ("Deployer Key")
2. Proxy Admin Key ("Admin Key")

### Steps

1. Run Truffle migrations using the Deployer Key, and get the address of the
   newly deployed `V2Upgrader` contract. The address is highlighted (`>>><<<`)
   to prevent accidental copying-and-pasting of an incorrect address.

   ```
   >>>>>>> Deployed V2Upgrader at 0x12345678 <<<<<<<
   ```

2. Using the Admin Key, transfer the proxy admin role to the `V2Upgrader`
   contract address by calling `changeAdmin(address)` method on the
   `FiatTokenProxy` contract.

3. Send 0.20 USDC to the `V2Upgrader` contract address. (200,000 tokens)

4. Using the Deployer Key, call `upgrade(string,address)` method on the
   `V2Upgrader` contract with a new token name (e.g. "USD Coin") and an address
   to which the proxy admin role will be transferred (provide Admin Key's
   address to transfer it back to the original address).

#### IF TRANSACTION SUCCEEDS

- No further action needed.

#### IF TRANSACTION FAILS

- If the transaction fails, any state change that happened during the `upgrade`
  function call will be reverted.
- Call `abortUpgrade(address newProxyAdmin)` method on the `V2Upgrader` contract
  with an address to which the proxy admin role will be transferred (provide
  Admin Key's address to transfer it back to the original address).
