# Overview

The `validate.js` script connects to the Ethereum blockchain to validate the
values stored in the contract.

# Infura Setup

Note: Infura is a 3rd party provider.

1. Got to [https://infura.io](https://infura.io) and click "Get Started For
   Free" to register an email with Infura.

2. Click on the "Dashboards" icon at the top of the Infura homepage or go to
   https://infura.io/dashboard to access your personal dashboard.

3. Create a new project - give it any name you want. Then whitelist the Token
   Proxy and the current Token Implementation addresses.

4. Follow the instructions under the "Deployment" section in `README.md` to
   configure the mnemonic phrase and the Infura API key in `config.js`.

# Configure Expected Values

Go to ./validate/validate.js and change the addresses at the top of the file, as
well as any other constants.

# Validation

Run `truffle exec ./validate/validate.js --network mainnet`

You can replace `mainnet` with any other network defined in `truffle.js` under
`networks`.
