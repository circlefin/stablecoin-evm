/**
 * Copyright 2024 Circle Internet Group, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { task } from "hardhat/config";
import { hardhatArgumentTypes } from "./hardhatArgumentTypes";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import _ from "lodash";
import path from "path";
import { readBlacklistFile } from "../../utils";
import { ethers } from "ethers";

type TaskArguments = {
  proxyAddress?: string;
  v2_2UpgraderAddress?: string;
  datasourceFilepath?: string;
};

task(
  "validateAccountsToBlacklist",
  "Validates blacklist.remote.json by checking that " +
    "it matches with addresses retrieved from a separate datasource " +
    "and/or it matches with V2_2Upgrader.accountsToBlacklist() " +
    "and/or the list of addresses are currently blacklisted on FiatTokenProxy."
)
  .addOptionalParam(
    "proxyAddress",
    "The proxy address of the FiatToken contract. Runs comparison if set.",
    undefined,
    hardhatArgumentTypes.address
  )
  .addOptionalParam(
    "upgraderAddress",
    "The contract address of the deployed V2_2Upgrader. Runs comparison if set.",
    undefined,
    hardhatArgumentTypes.address
  )
  .addOptionalParam(
    "datasourceFilepath",
    "The JSON file containing an array of addresses retrieved from a separate datasource. Runs comparison if set.",
    undefined,
    hardhatArgumentTypes.inputFile
  )
  .setAction(taskAction);

async function taskAction(
  { proxyAddress, v2_2UpgraderAddress, datasourceFilepath }: TaskArguments,
  hre: HardhatRuntimeEnvironment
) {
  console.log("Validation started");
  const expectedAccountsToBlacklist = readBlacklistFile(
    path.join(__dirname, "..", "..", "blacklist.remote.json")
  );

  // ==== Local state == Datasource's state
  if (datasourceFilepath) {
    console.log("Comparing local state with data source's state...");
    console.log(
      `>> Expecting ${expectedAccountsToBlacklist.length} accounts to blacklist`
    );

    const accountsFromDatasource = readBlacklistFile(datasourceFilepath);
    console.log(
      `>> Retrieved ${accountsFromDatasource.length} accounts from datasource`
    );
    console.log(">> Verifying accounts...");
    verifyAccountsArrays(expectedAccountsToBlacklist, accountsFromDatasource);
    console.log(">> All accounts verified!");
  }

  // ==== Local state == Upgrader state
  if (v2_2UpgraderAddress) {
    console.log("\nComparing local state with deployed V2_2Upgrader...");
    const v2_2Upgrader = await hre.ethers.getContractAt(
      "V2_2Upgrader",
      v2_2UpgraderAddress
    );
    const accountsFromUpgrader = await v2_2Upgrader.accountsToBlacklist();
    console.log(
      `>> Retrieved ${accountsFromUpgrader.length} accounts from v2_2Upgrader`
    );

    console.log(">> Verifying accounts...");
    verifyAccountsArrays(expectedAccountsToBlacklist, accountsFromUpgrader);
    console.log(">> All accounts verified!");
  }

  // ==== Every account blacklisted
  if (proxyAddress) {
    console.log("\nComparing local state with deployed FiatTokenProxy...");
    console.log(">> Validating that all accountsToBlacklist are blacklisted");
    const proxyAsV2_1 = await hre.ethers.getContractAt(
      "FiatTokenV2_1",
      proxyAddress
    );

    for (let i = 0; i < expectedAccountsToBlacklist.length; i++) {
      if (i % 5 === 0) {
        console.log(
          `>> Verified ${i}/${expectedAccountsToBlacklist.length} accounts`
        );
      }

      const account = expectedAccountsToBlacklist[i];
      if (!(await proxyAsV2_1.isBlacklisted(account))) {
        throw new Error(`Account '${account}' is not currently blacklisted!`);
      }
    }
    console.log(">> All accounts verified!");
  }

  console.log("Validation completed");
}

/**
 * Verifies that two accounts array are both unique, and equal to each other.
 */
function verifyAccountsArrays(
  accountsArray: string[],
  otherAccountsArray: string[]
) {
  console.log(`>> Converting to checksum addresses`);
  accountsArray = accountsArray.map(ethers.getAddress);
  otherAccountsArray = otherAccountsArray.map(ethers.getAddress);

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
 */
function verifyUnique(accountsArray: string[]) {
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
