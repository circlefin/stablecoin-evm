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

const path = require("path");
const { readBlacklistFile } = require("../utils");
const { toLower } = require("lodash");

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const V2_2Upgrader = artifacts.require("V2_2Upgrader");

/**
 * A utility script to validate that
 * 1. V2_2Upgrader.accountsToBlacklist() values match with the list of addresses in blacklist.remote.json
 * 2. The list of addresses in blacklist.remote.json are currently blacklisted.
 * @param {string} proxyAddress the contract address of FiatTokenProxy
 * @param {string} v2_2UpgraderAddress the contract address of V2_2Upgrader
 */
async function main(proxyAddress, v2_2UpgraderAddress) {
  console.log("Comparing local state with deployed V2_2Upgrader...");
  const expectedAccountsToBlacklist = readBlacklistFile(
    path.join(__dirname, "..", "blacklist.remote.json")
  ).map(toLower);
  console.log(
    `>> Expecting ${expectedAccountsToBlacklist.length} accounts to blacklist`
  );

  const v2_2Upgrader = await V2_2Upgrader.at(v2_2UpgraderAddress);
  const actualAccountsToBlacklist = (
    await v2_2Upgrader.accountsToBlacklist()
  ).map(toLower);
  console.log(
    `>> Retrieved ${actualAccountsToBlacklist.length} accounts to blacklist from v2_2Upgrader`
  );

  console.log(">> Verifying accounts to blacklist...");
  for (const expectedAccount of expectedAccountsToBlacklist) {
    if (!actualAccountsToBlacklist.includes(expectedAccount)) {
      throw new Error(
        `Expected account '${expectedAccount}' not found in v2_2Upgrader accountsToBlacklist`
      );
    }
  }

  for (const actualAccount of actualAccountsToBlacklist) {
    if (!expectedAccountsToBlacklist.includes(actualAccount)) {
      throw new Error(
        `Actual account '${actualAccount}' not found in blacklist.remote.json`
      );
    }
  }
  console.log(">> All accounts verified!");

  console.log("Comparing local state with deployed FiatTokenProxy...");
  console.log(">> Validating that all accountsToBlacklist are blacklisted");
  const proxyAsV2_1 = await FiatTokenV2_1.at(proxyAddress);

  for (const account of expectedAccountsToBlacklist) {
    if (!(await proxyAsV2_1.isBlacklisted(account))) {
      throw new Error(`Account '${account}' is not currently blacklisted!`);
    }
  }
  console.log(">> All accounts verified!");
}

module.exports = async (callback) => {
  /* eslint-disable no-undef -- Config is a global variable in a truffle exec script https://github.com/trufflesuite/truffle/pull/3233 */
  const network = config.network;
  const argv = config._;
  /* eslint-enable no-undef */
  const usageError = new Error(
    "Usage: yarn truffle exec scripts/validateAccountsToBlacklist.js [<0x-stripped Proxy address>] [<0x-stripped V2_2Upgrader address>] [--network=<NETWORK>]"
  );

  // Truffle exec seems to auto parse a hex string passed in arguments into decimals.
  // We need to strip the 0x in arguments to prevent this from happening.
  const rawProxyAddress = argv[1];
  const rawV2_2UpgraderAddress = argv[2];
  const proxyAddress =
    network === "development" && !rawProxyAddress
      ? (await FiatTokenProxy.deployed()).address
      : `0x${rawProxyAddress}`;
  const v2_2UpgraderAddress =
    network === "development" && !rawV2_2UpgraderAddress
      ? (await V2_2Upgrader.deployed()).address
      : `0x${rawV2_2UpgraderAddress}`;

  console.log(`network: ${network}`);
  console.log(`proxyAddress: ${proxyAddress}`);
  console.log(`v2_2UpgraderAddress: ${v2_2UpgraderAddress}`);

  if (
    !web3.utils.isAddress(proxyAddress) ||
    !web3.utils.isAddress(v2_2UpgraderAddress)
  ) {
    callback(usageError);
  } else {
    try {
      await main(proxyAddress, v2_2UpgraderAddress);
      callback();
    } catch (e) {
      callback(e);
    }
  }
};
