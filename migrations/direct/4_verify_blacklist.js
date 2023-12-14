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

/*
 * Use this script to verify that the proxy contract has all items it should blacklist
 *  Make sure your config.js file has the PROXY_CONTRACT_ADDRESS set and the
 *  blacklist.remote.json file filled.
 *
 * The script is read-only
 */

const fs = require("fs");
const path = require("path");
const some = require("lodash/some");
const { readBlacklistFile } = require("../../utils");

const Blacklistable = artifacts.require("Blacklistable");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");

let proxyContractAddress = "";

const configFile = "config.js";
const configFileResolved = path.join(__dirname, "..", "..", configFile);

// Attempt to fetch the values needed for blacklisting.
if (fs.existsSync(configFileResolved)) {
  ({
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
  } = require(`../../${configFile}`));
}

if (!proxyContractAddress) {
  throw new Error(
    "PROXY_CONTRACT_ADDRESS must be provided in config.js to validate blacklisting!"
  );
}

// Prints out current roles on important contracts, for validation
module.exports = async function (_, network) {
  proxyContractAddress =
    proxyContractAddress || (await FiatTokenProxy.deployed()).address;
  const proxyAsBlacklistable = await Blacklistable.at(proxyContractAddress);
  const blacklisterRole = await proxyAsBlacklistable.blacklister();

  const isTestEnvironment = some(["development", "coverage"], (v) =>
    network.includes(v)
  );
  const blacklistFile = isTestEnvironment
    ? "blacklist.test.json"
    : "blacklist.remote.json";
  const addressesToBlacklist = readBlacklistFile(
    path.join(__dirname, "..", "..", blacklistFile)
  );

  console.log(`>>>>>>> Starting Validation <<<<<<<`);
  console.log(`Proxy Contract Addr:   ${proxyContractAddress}`);
  console.log(`Blacklister Role:   ${blacklisterRole}`);
  console.log(
    `# of items in ${blacklistFile}:   ${addressesToBlacklist.length}\n\n`
  );

  if (!(await proxyAsBlacklistable.isBlacklisted(proxyContractAddress))) {
    throw new Error(
      `Proxy Contract @ ${proxyContractAddress} should be blacklisted but is not.`
    );
  }

  let success = 0;
  for (const addr of addressesToBlacklist) {
    if (!(await proxyAsBlacklistable.isBlacklisted(addr))) {
      throw new Error(`Address: ${addr} is missing from the blacklist.`);
    } else {
      success += 1;
    }
    process.stdout.write(`- ${addr} ... blacklisted`); // Just to show activity
  }
  console.log(`Validated ${success} addresses. No missing addresses found.`);
};
