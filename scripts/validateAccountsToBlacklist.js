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

const Web3 = require("web3");
const minimist = require("minimist");
const path = require("path");
const { readBlacklistFile } = require("../utils");
const _ = require("lodash");

const {
  abi: FiatTokenV2_1Abi,
} = require("../build/contracts/FiatTokenV2_1.json");
const {
  abi: V2_2UpgraderAbi,
} = require("../build/contracts/V2_2Upgrader.json");

/**
 * A utility script to validate that
 * 1. Addresses retrieved from a datasource match with the list of addresses in blacklist.remote.json
 * 2. V2_2Upgrader.accountsToBlacklist() values match with the list of addresses in blacklist.remote.json
 * 3. The list of addresses in blacklist.remote.json are currently blacklisted.
 * @param {string} rpcUrl url to a valid JSON RPC node
 * @param {string} proxyAddress the contract address of FiatTokenProxy
 * @param {string} v2_2UpgraderAddress the contract address of V2_2Upgrader
 * @param {string} datasourceFilePath the JSON file containing an array of addresses retrieved from a datasource (eg. Dune)
 * @param {boolean} skipDatasourceValidation true if datasource validation should be skipped, false otherwise
 * @param {boolean} skipUpgraderValidation true if upgrader validation should be skipped, false otherwise
 */
async function validateAccountsToBlacklist(
  rpcUrl,
  proxyAddress,
  v2_2UpgraderAddress,
  datasourceFilePath,
  skipDatasourceValidation,
  skipUpgraderValidation
) {
  const web3 = new Web3(rpcUrl);

  const expectedAccountsToBlacklist = readBlacklistFile(
    path.join(__dirname, "..", "blacklist.remote.json")
  );

  // ==== Local state == Datasource's state
  if (!skipDatasourceValidation) {
    console.log("Comparing local state with data source's state...");
    console.log(
      `>> Expecting ${expectedAccountsToBlacklist.length} accounts to blacklist`
    );

    const accountsFromDatasource = readBlacklistFile(datasourceFilePath);
    console.log(
      `>> Retrieved ${accountsFromDatasource.length} accounts from datasource`
    );
    console.log(">> Verifying accounts...");
    verifyAccountsArrays(expectedAccountsToBlacklist, accountsFromDatasource);
    console.log(">> All accounts verified!");
  }

  // ==== Local state == Upgrader state
  if (!skipUpgraderValidation) {
    console.log("\nComparing local state with deployed V2_2Upgrader...");
    const v2_2Upgrader = new web3.eth.Contract(
      V2_2UpgraderAbi,
      v2_2UpgraderAddress
    );
    const accountsFromUpgrader = await v2_2Upgrader.methods
      .accountsToBlacklist()
      .call();
    console.log(
      `>> Retrieved ${accountsFromUpgrader.length} accounts from v2_2Upgrader`
    );

    console.log(">> Verifying accounts...");
    verifyAccountsArrays(expectedAccountsToBlacklist, accountsFromUpgrader);
    console.log(">> All accounts verified!");
  }

  // ==== Every account blacklisted
  console.log("\nComparing local state with deployed FiatTokenProxy...");
  console.log(">> Validating that all accountsToBlacklist are blacklisted");
  const proxyAsV2_1 = new web3.eth.Contract(FiatTokenV2_1Abi, proxyAddress);

  for (let i = 0; i < expectedAccountsToBlacklist.length; i++) {
    if (i % 5 === 0) {
      console.log(
        `>> Verified ${i}/${expectedAccountsToBlacklist.length} accounts`
      );
    }

    const account = expectedAccountsToBlacklist[i];
    if (!(await proxyAsV2_1.methods.isBlacklisted(account).call())) {
      throw new Error(`Account '${account}' is not currently blacklisted!`);
    }
  }
  console.log(">> All accounts verified!");
}

/**
 * Verifies that two accounts array are both unique, and equal to each other.
 * @param {string[]} accountsArray an array of accounts
 * @param {string[]} otherAccountsArray another array of accounts
 */
function verifyAccountsArrays(accountsArray, otherAccountsArray) {
  console.log(`>> Converting to checksum addresses`);
  accountsArray = accountsArray.map(Web3.utils.toChecksumAddress);
  otherAccountsArray = otherAccountsArray.map(Web3.utils.toChecksumAddress);

  // Check for duplicates.
  console.log(`>> Checking for duplicates in accountsArray`);
  verifyUnique(accountsArray);

  console.log(`>> Checking for duplicates in otherAccountsArray`);
  verifyUnique(otherAccountsArray);

  // Check array equality.
  console.log(`>> Checking for array equality`);
  if (accountsArray.length !== otherAccountsArray.length) {
    throw new Error(
      `Arrays have different lengths! Expected: ${accountsArray.length}, Actual: ${otherAccountsArray.length}`
    );
  }
  for (const account of otherAccountsArray) {
    if (!accountsArray.includes(account)) {
      throw new Error(`Account '${account}' not found in accountsArray!`);
    }
  }
}

/**
 * Verifies that an accounts array is unique.
 * @param {string[]} accountsArray an array of accounts
 */
function verifyUnique(accountsArray) {
  const duplicates = _.chain(accountsArray)
    .groupBy((acc) => acc.toLowerCase())
    .pickBy((group) => group.length > 1)
    .keys()
    .value();
  if (duplicates.length !== 0) {
    throw new Error(
      `${duplicates.length} duplicates detected in array! ${JSON.stringify(
        duplicates
      )}`
    );
  }
}

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ["proxy-address", "upgrader-address"],
  });

  const rpcUrl = argv["rpc-url"];
  const proxyAddress = argv["proxy-address"];
  const v2_2UpgraderAddress = argv["upgrader-address"];
  const datasourceFilePath = argv["datasource-file-path"];
  const skipDatasourceValidation = !!argv["skip-datasource-validation"];
  const skipUpgraderValidation = !!argv["skip-upgrader-validation"];

  if (
    !proxyAddress ||
    !rpcUrl ||
    !Web3.utils.isAddress(proxyAddress) ||
    (!skipUpgraderValidation &&
      (!v2_2UpgraderAddress || !Web3.utils.isAddress(v2_2UpgraderAddress)))
  ) {
    throw new Error(
      "Usage: yarn execScript scripts/validateAccountsToBlacklist.js [--datasource-file-path=<path to JSON file>] \n" +
        "[--skip-datasource-validation] \n" +
        "[--skip-upgrader-validation] \n" +
        "--proxy-address=<Proxy address> \n" +
        "--upgrader-address=<V2_2Upgrader address> \n" +
        "--rpc-url=<URL to a valid RPC>"
    );
  }

  console.log(`rpcUrl: ${rpcUrl}`);
  console.log(`proxyAddress: ${proxyAddress}`);
  console.log(`v2_2UpgraderAddress: ${v2_2UpgraderAddress}`);
  console.log(`datasourceFilePath: ${datasourceFilePath}`);
  console.log(`skipDatasourceValidation: ${skipDatasourceValidation}`);
  console.log(`skipUpgraderValidation: ${skipUpgraderValidation}`);

  await validateAccountsToBlacklist(
    rpcUrl,
    proxyAddress,
    v2_2UpgraderAddress,
    datasourceFilePath,
    skipDatasourceValidation,
    skipUpgraderValidation
  );
}

module.exports = main;
module.exports.validateAccountsToBlacklist = validateAccountsToBlacklist;
