process.env.TS_NODE_FILES = "true";
require("ts-node/register/transpile-only");
// Fix Typescript callsite reporting
Object.defineProperty(Error, "prepareStackTrace", { writable: false });

const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require("fs");
const path = require("path");

// Read config file if it exists
let config = { MNEMONIC: "", INFURA_KEY: "" };
if (fs.existsSync(path.join(__dirname, "config.js"))) {
  config = require("./config.js");
}

module.exports = {
  compilers: {
    solc: {
      version: "0.6.12",
      settings: {
        optimizer: {
          enabled: true,
          runs: 10000000,
        },
      },
    },
  },
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
    },
    local_testnet: {
      host: "ganache",
      port: 8545,
      network_id: "*", // Match any network id
    },
    mainnet: {
      provider: infuraProvider("mainnet"),
      network_id: 1,
    },
    ropsten: {
      provider: infuraProvider("ropsten"),
      network_id: 3,
    },
  },
  mocha: {
    timeout: 60000, // prevents tests from failing when pc is under heavy load
    reporter: "Spec",
  },
  plugins: ["solidity-coverage"],
};

function infuraProvider(network) {
  return () => {
    if (!config.MNEMONIC) {
      console.error("A valid MNEMONIC must be provided in config.js");
      process.exit(1);
    }
    if (!config.INFURA_KEY) {
      console.error("A valid INFURA_KEY must be provided in config.js");
      process.exit(1);
    }
    return new HDWalletProvider(
      config.MNEMONIC,
      `https://${network}.infura.io/v3/${config.INFURA_KEY}`
    );
  };
}
