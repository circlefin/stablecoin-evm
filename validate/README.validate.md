# Setup

Note: Infura is a 3rd party provider.

1. Got to https://infura.io/. Click "Get Started For Free" to register an email with Infura.

2. Click on the "Dashboards" icon at the top of the Infura homepage or go to https://infura.io/dashboard to access your personal dashboard.

3. Create a new project - give it any name you want.  Then whitelist the Token Proxy and the current Token Implementation addresses.

4. Create a file ./validate/apikey.infura.  Copy the API Key from your project dashboard into the file and save.

# Validation

Run ```truffle exec ./validate/validate.js --network mainnet```