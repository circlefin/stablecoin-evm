/**
 * Copyright 2024 Circle Internet Financial, LTD. All rights reserved.
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

import { Contract, ethers } from "ethers";
import fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import _ from "lodash";
import { hardhatArgumentTypes } from "./hardhatArgumentTypes";
import { sleep } from "./helpers";
import path from "path";

const MAX_RETRIES = 5;
const CHUNK_SIZE = 50000;
const SLEEP_MS = 1000;
const OUTPUT_FILE = path.join(__dirname, "..", "..", "blacklist.remote.json");

type TaskArguments = {
  proxyAddress: string;
  startBlockNumber: number;
};

task(
  "downloadBlacklistedAccounts",
  "Downloads the blacklisted accounts on a FiatToken contract onto the local machine"
)
  .addParam(
    "proxyAddress",
    "The proxy address of the FiatToken contract",
    undefined,
    hardhatArgumentTypes.address
  )
  .addParam(
    "startBlockNumber",
    "The block number to start downloading from",
    undefined,
    hardhatArgumentTypes.int
  )
  .setAction(taskAction);

async function taskAction(
  { proxyAddress, startBlockNumber }: TaskArguments,
  hre: HardhatRuntimeEnvironment
) {
  if (fs.existsSync(OUTPUT_FILE)) {
    console.log(
      `NOTE: '${OUTPUT_FILE}' exists. Will continue appending results to the file.`
    );
  }

  const proxyAsBlacklistable = await hre.ethers.getContractAt(
    "Blacklistable",
    proxyAddress
  );

  const latestBlockNumber = await hre.ethers.provider.getBlockNumber();
  let fromBlockNumber = startBlockNumber;
  let toBlockNumber = Math.min(
    latestBlockNumber,
    startBlockNumber + CHUNK_SIZE
  );

  do {
    await saveBlacklistedAccounts(
      proxyAsBlacklistable,
      fromBlockNumber,
      toBlockNumber
    );
    fromBlockNumber = toBlockNumber + 1;
    toBlockNumber = Math.min(latestBlockNumber, toBlockNumber + CHUNK_SIZE);

    // Sleep for a bit to avoid blasting the RPC.
    await sleep(SLEEP_MS);
  } while (
    toBlockNumber <= latestBlockNumber &&
    fromBlockNumber < toBlockNumber
  );
}

/**
 * Saves all accounts that were blacklisted in [fromBlockNumber, toBlockNumber]
 * AND are still blacklisted in storage.
 */
async function saveBlacklistedAccounts(
  proxyAsBlacklistable: Contract,
  fromBlockNumber: number,
  toBlockNumber: number
) {
  console.log(
    `Querying events in range [${fromBlockNumber}, ${toBlockNumber}]`
  );
  const rawBlacklistedEvents = await getBlacklistedEventsRetryWithBackoff(
    proxyAsBlacklistable,
    fromBlockNumber,
    toBlockNumber
  );
  if (rawBlacklistedEvents.length <= 0) {
    return;
  }
  console.log(`>> Found ${rawBlacklistedEvents.length} 'Blacklisted' events!`);

  const maybeBlacklistedAccounts = _.uniq(
    rawBlacklistedEvents.map((event) => {
      const log = proxyAsBlacklistable.interface.parseLog(event);
      return log?.args[0];
    })
  );
  const blacklistedAccounts = [];
  for (const account of maybeBlacklistedAccounts) {
    if (await proxyAsBlacklistable.isBlacklisted(account)) {
      blacklistedAccounts.push(account);
    }
  }

  console.log(
    `>> Found ${blacklistedAccounts.length} unique & currently blacklisted accounts`
  );
  if (blacklistedAccounts.length <= 0) {
    return;
  }

  appendBlacklistedAccounts(blacklistedAccounts);
}

/**
 * Appends blacklisted accounts to a JSON file, deduplicating accounts.
 */
function appendBlacklistedAccounts(blacklistedAccounts: string[]) {
  let previousBlacklistedAccounts = [];
  try {
    previousBlacklistedAccounts = JSON.parse(
      fs.readFileSync(OUTPUT_FILE, "utf-8")
    );
  } catch (e) {
    console.error(
      `Error found while parsing ${OUTPUT_FILE}. Overwriting its contents!`,
      e
    );
  }

  const indent = 2;
  const accountsToWrite = _.chain(previousBlacklistedAccounts)
    .concat(blacklistedAccounts)
    .map(ethers.getAddress)
    .uniq()
    .value();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(accountsToWrite, null, indent));
}

/**
 * Get all blacklisted events that were emitted in [fromBlockNumber, toBlockNumber]
 * @throws error if RPC fails after MAX_RETRIES counts
 */
async function getBlacklistedEventsRetryWithBackoff(
  proxyAsBlacklistable: Contract,
  fromBlockNumber: number,
  toBlockNumber: number
) {
  let tries = 0;
  let error;

  while (tries < MAX_RETRIES) {
    await sleep(tries * SLEEP_MS);
    try {
      return await proxyAsBlacklistable.queryFilter(
        proxyAsBlacklistable.filters.Blacklisted(),
        fromBlockNumber,
        toBlockNumber
      );
    } catch (e) {
      error = e;
      tries += 1;
    }
  }

  throw error;
}
