/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2018-2023 CENTRE SECZ
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

const path = require("path");
const { readBlacklistFile } = require("../utils");
const { toLower } = require("lodash");

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const V2_2Upgrader = artifacts.require("V2_2Upgrader");

/**
 * A utility script to validate that
 * 1. V2_2Upgrader.accountsToBlacklist() values match with the list of addresses in blacklist.remote.js
 * 2. The list of addresses in blacklist.remote.js are currently blacklisted.
 * @param {string} proxyAddress the contract address of FiatTokenProxy
 * @param {string} v2_2UpgraderAddress the contract address of V2_2Upgrader
 */
async function main(proxyAddress, v2_2UpgraderAddress) {
  console.log("Comparing local state with deployed V2_2Upgrader...");
  const expectedAccountsToBlacklist = readBlacklistFile(
    path.join(__dirname, "..", "blacklist.remote.js")
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
        `Actual account '${actualAccount}' not found in blacklist.remote.js`
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
