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
const { readBlacklistFile } = require("../../utils");

const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const V2_2Upgrader = artifacts.require("V2_2Upgrader");

let proxyAdminAddress = "";
let proxyContractAddress = "";
let newTokenSymbol = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "..", "config.js"))) {
  ({
    PROXY_ADMIN_ADDRESS: proxyAdminAddress,
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
    TOKEN_SYMBOL: newTokenSymbol,
  } = require("../../config.js"));
}

module.exports = async (deployer, network) => {
  const isTestEnvironment = some(["development", "coverage"], (v) =>
    network.includes(v)
  );

  // Proceed if and only if the blacklist file exists.
  const accountsToBlacklist = readBlacklistFile(
    path.join(
      __dirname,
      "..",
      "..",
      isTestEnvironment ? "blacklist.test.json" : "blacklist.remote.json"
    )
  );

  if (isTestEnvironment) {
    // DO NOT USE THESE ADDRESSES IN PRODUCTION
    proxyAdminAddress = "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598";
    proxyContractAddress = (await FiatTokenProxy.deployed()).address;
  }
  proxyContractAddress =
    proxyContractAddress || (await FiatTokenProxy.deployed()).address;

  if (!proxyAdminAddress) {
    throw new Error("PROXY_ADMIN_ADDRESS must be provided in config.js");
  }

  const fiatTokenV2_2 = await FiatTokenV2_2.deployed();

  console.log(`Proxy Admin:       ${proxyAdminAddress}`);
  console.log(`FiatTokenProxy:    ${proxyContractAddress}`);
  console.log(`FiatTokenV2_2:     ${fiatTokenV2_2.address}`);
  console.log(`New Token Symbol:  ${newTokenSymbol}`);

  console.log("Deploying V2_2Upgrader contract...");

  const v2_2Upgrader = await deployer.deploy(
    V2_2Upgrader,
    proxyContractAddress,
    fiatTokenV2_2.address,
    proxyAdminAddress,
    accountsToBlacklist,
    newTokenSymbol
  );

  console.log(
    `>>>>>>> Deployed V2_2Upgrader at ${v2_2Upgrader.address} <<<<<<<`
  );
};
