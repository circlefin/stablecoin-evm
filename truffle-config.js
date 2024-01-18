/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copyright (c) 2023, Circle Internet Financial, LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

process.env.TS_NODE_FILES = "true";
require("ts-node/register/transpile-only");
// Fix Typescript callsite reporting
Object.defineProperty(Error, "prepareStackTrace", { writable: false });

const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require("fs");
const path = require("path");

// Read config file if it exists
let config = {
  BLACKLISTER_PRIVATE_KEY: "",
  DEPLOYER_PRIVATE_KEY: "",
  MASTERMINTER_OWNER_PRIVATE_KEY: "",
  OWNER_PRIVATE_KEY: "",
  PROXY_ADMIN_PRIVATE_KEY: "",

  USE_VERSIONED_MIGRATIONS: "",

  LOCAL_RPC_URL: "",
  MAINNET_ID: "",
  MAINNET_RPC_URL: "",
  MAINNET_GAS_PRICE: "",
  MAINNET_GAS: "",
  TESTNET_ID: "",
  TESTNET_RPC_URL: "",
  TESTNET_GAS_PRICE: "",
  TESTNET_GAS: "",

  ETHERSCAN_API_KEY: "",
  ARBISCAN_API_KEY: "",
  OPTIMISTIC_ETHERSCAN_API_KEY: "",
  POLYGONSCAN_API_KEY: "",
  SNOWTRACE_API_KEY: "",
};

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
        metadata: {
          // bytecodeHash value defaults to 'ipfs': https://docs.soliditylang.org/en/develop/metadata.html#contract-metadata
          // Set to 'none' when performing partial verification, to omit appending metadata file hash at the end of compiled bytecode
          bytecodeHash:
            process.env.VERIFICATION_TYPE === "partial" ? "none" : "ipfs",
        },
      },
    },
  },
  networks: {
    development: {
      network_id: "*",
      url: config.LOCAL_RPC_URL,
    },
    mainnet: {
      provider: rpcProvider(config.MAINNET_RPC_URL),
      network_id: config.MAINNET_ID,
      skipDryRun: false,
      confirmations: 1,
      networkCheckTimeout: 100000,
      timeoutBlocks: 20,
      gasPrice: config.MAINNET_GAS_PRICE,
      gas: config.MAINNET_GAS,
    },
    testnet: {
      provider: rpcProvider(config.TESTNET_RPC_URL),
      network_id: config.TESTNET_ID,
      skipDryRun: true,
      confirmations: 1,
      networkCheckTimeout: 100000,
      timeoutBlocks: 20,
      gasPrice: config.TESTNET_GAS_PRICE,
      gas: config.TESTNET_GAS,
    },
  },
  mocha: {
    timeout: 60000, // prevents tests from failing when pc is under heavy load
    reporter: "Spec",
  },
  plugins: [
    "solidity-coverage",
    "truffle-contract-size",
    "truffle-plugin-verify",
  ],
  // https://www.npmjs.com/package/truffle-plugin-verify
  api_keys: {
    etherscan: config.ETHERSCAN_API_KEY,
    arbiscan: config.ARBISCAN_API_KEY,
    optimistic_etherscan: config.OPTIMISTIC_ETHERSCAN_API_KEY,
    polygonscan: config.POLYGONSCAN_API_KEY,
    snowtrace: config.SNOWTRACE_API_KEY,
  },
  // Use default directory if false
  migrations_directory:
    config.USE_VERSIONED_MIGRATIONS ||
    process.env.USE_VERSIONED_MIGRATIONS === "true"
      ? "./migrations/versioned"
      : "./migrations/direct",
};

function rpcProvider(network) {
  return () => {
    return new HDWalletProvider({
      privateKeys: [
        config.DEPLOYER_PRIVATE_KEY,
        config.MASTERMINTER_OWNER_PRIVATE_KEY,
        config.PROXY_ADMIN_PRIVATE_KEY,
        config.OWNER_PRIVATE_KEY,
        config.BLACKLISTER_PRIVATE_KEY,
        config.TEST_ACCOUNT_PRIVATE_KEY,
      ],
      providerOrUrl: network,
    });
  };
}
