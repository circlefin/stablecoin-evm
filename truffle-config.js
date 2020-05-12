// INFURA Setup - see validate/README.validate.md for more info
var HDWalletProvider = require("truffle-hdwallet-provider"); // These keys will be used only for CALL
var mnemonic = "talisman";
var fs = require("fs");
var access_token = "none";
try {
  access_token = fs.readFileSync("./validate/apikey.infura", "utf8");
} catch (err) {
  console.log(
    "No Infura access token detected. Unit tests will still work.  See ./validate/README.validate.md for more details."
  );
}

module.exports = {
  compilers: {
    solc: {
      version: "^0.4.24",
    },
  },
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
    },
    // network to refer to ganache by name so it works with truffle/ganache in separate docker containers
    localTestNet: {
      host: "ganache",
      port: 8545,
      network_id: "*", // Match any network id
    },
    // INFURA Setup
    infura_mainnet: {
      provider: function () {
        return new HDWalletProvider(
          mnemonic,
          "https://mainnet.infura.io/" + access_token
        );
      },
      network_id: 1,
    },
  },
  mocha: {
    /*
     * To disable the spreadsheet verification tool ensure that
     * the reporter is set to 'Spec' by commenting/uncommenting the lines below.
     */
    reporter: "Spec",
    //reporter: './verification/verification_reporter.js',
  },
  plugins: ["solidity-coverage"],
};
