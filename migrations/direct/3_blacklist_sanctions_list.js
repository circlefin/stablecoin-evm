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

const Blacklistable = artifacts.require("Blacklistable");

const configFile = "config.js";
const configFileResolved = path.join(__dirname, "..", "..", configFile);
const blacklistFile = "blacklist.txt";
const blacklistFileResolved = path.join(__dirname, "..", "..", blacklistFile);

let blacklisterPrivateKey = "";
let proxyContractAddress = "";

// Attempt to fetch the values needed for blacklisting.
if (fs.existsSync(configFileResolved)) {
  ({
    BLACKLISTER_PRIVATE_KEY: blacklisterPrivateKey, // This is used in HDWallet setup in truffle-config.js
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
  } = require(`../../${configFile}`));
}
if (!blacklisterPrivateKey || !proxyContractAddress) {
  throw new Error(
    "BLACKLISTER_PRIVATE_KEY & PROXY_CONTRACT_ADDRESS must be provided in config.js for blacklisting!"
  );
}

// Proceed to blacklist if and only if the file exists.
if (!fs.existsSync(blacklistFileResolved)) {
  throw new Error(
    `${blacklistFile} file does not exist with addresses! See ${blacklistFile}.example!`
  );
}

/**
 * This is a task for blacklisting a given text file of addresses
 * split by newlines (0x123\n0x456\n...) in accordance with Compliance
 * requirements at Circle Internet Financial, LLC. It reads blacklist.txt
 * and, one by one, blacklists each with a hot private key for the blacklister.
 * This task assumes that the shift to a cold blacklister address has not yet happened.
 *
 * @param {*} deployer Deployer object from Truffle.
 * @param {*} network  Current network used by Truffle.
 * @param {*} accounts A list of private keys provided through Truffle config (truffle-config.js).
 */
module.exports = async function (_) {
  const proxyAsBlacklistable = await Blacklistable.at(proxyContractAddress);
  const blacklisterAddress = await proxyAsBlacklistable.blacklister();

  console.log(
    "Blacklisting the following addresses using blacklister address",
    await proxyAsBlacklistable.blacklister()
  );

  const addressesToBlacklist = fs
    .readFileSync(blacklistFileResolved, "utf-8")
    .split(/\r?\n/); // Split by newlines (\n).
  for (const addr of addressesToBlacklist) {
    if (addr) {
      await proxyAsBlacklistable.blacklist(addr, {
        from: blacklisterAddress,
      });
      // Log confirmation of this address being blacklisted.
      console.log(addr, await proxyAsBlacklistable.isBlacklisted(addr));
    }
  }
  console.log(
    `Blacklisted ${addressesToBlacklist.length} addresses in total from user-provided ${blacklistFile}.`
  );
};
