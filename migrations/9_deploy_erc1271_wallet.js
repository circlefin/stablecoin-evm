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

const fs = require("fs");
const path = require("path");
const some = require("lodash/some");

const MockERC1271Wallet = artifacts.require("MockERC1271Wallet");

let mockERC1271WalletOwnerAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    MOCK_ERC1271_WALLET_OWNER_ADDRESS: mockERC1271WalletOwnerAddress,
  } = require("../config.js"));
}

module.exports = async (deployer, network, accounts) => {
  const isTestEnvironment = some(["development", "coverage"], (v) =>
    network.includes(v)
  );

  if (isTestEnvironment) {
    mockERC1271WalletOwnerAddress = accounts[0];
  }

  if (!mockERC1271WalletOwnerAddress) {
    throw new Error(
      "MOCK_ERC1271_WALLET_OWNER_ADDRESS must be provided in config.js"
    );
  }

  console.log("Deploying MockERC1271Wallet contract...");

  await deployer.deploy(MockERC1271Wallet, mockERC1271WalletOwnerAddress);
  const walletAddress = (await MockERC1271Wallet.deployed()).address;

  console.log(`>>>>>>> Deployed MockERC1271Wallet at ${walletAddress} <<<<<<<`);
};
