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

const _ = require("lodash");
const fs = require("fs");
const path = require("path");

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
let Blacklistable;
try {
  Blacklistable = require("../build/contracts/Blacklistable.json");
} catch (e) {
  console.error("Run `yarn compile` to generate the abi first!");
  console.error(e);
  process.exit(1);
}

const MAX_RETRIES = 5;
const CHUNK_SIZE = 200000;
const SLEEP_MS = 1000;
const OUTPUT_FILE = path.join(__dirname, "..", "blacklist.remote.json");

async function main(proxyAddress, startBlockNumber) {
  if (fs.existsSync(OUTPUT_FILE)) {
    console.log(
      `NOTE: '${OUTPUT_FILE}' exists. Will append results to the file.`
    );
  }
  // A web3 Contract instance is used here as Truffle < v5.4.29 can trigger an
  // insufficient funds error on view functions. @see https://github.com/trufflesuite/truffle/issues/4457
  const proxyAsBlacklistable = new web3.eth.Contract(
    Blacklistable.abi,
    proxyAddress
  );

  const latestBlockNumber = await web3.eth.getBlockNumber();
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
 * AND are still blacklisted, in storage.
 * @param {Blacklistable} proxyAsBlacklistable the FiatTokenProxy contract as Blacklistable
 * @param {number} fromBlockNumber the start block number
 * @param {number} toBlockNumber the end block number
 */
async function saveBlacklistedAccounts(
  proxyAsBlacklistable,
  fromBlockNumber,
  toBlockNumber
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
    rawBlacklistedEvents.map((event) =>
      web3.utils.toChecksumAddress(event.returnValues._account)
    )
  );
  const blacklistedAccounts = [];
  for (const account of maybeBlacklistedAccounts) {
    const isCurrentlyBlacklisted = await proxyAsBlacklistable.methods
      .isBlacklisted(account)
      .call();
    if (isCurrentlyBlacklisted) {
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
 * @param {string[]} blacklistedAccounts the list of blacklisted accounts
 */
function appendBlacklistedAccounts(blacklistedAccounts) {
  let previousBlacklistedAccounts = [];
  try {
    previousBlacklistedAccounts = JSON.parse(fs.readFileSync(OUTPUT_FILE));
  } catch (e) {
    // no-op
  }

  const indent = 2;
  const accountsToWrite = _.chain(previousBlacklistedAccounts)
    .concat(blacklistedAccounts)
    .map(web3.utils.toChecksumAddress)
    .uniq()
    .value();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(accountsToWrite, null, indent));
}

/**
 * Get all blacklisted events that were emitted in [fromBlockNumber, toBlockNumber]
 * @param {Blacklistable} proxyAsBlacklistable the FiatTokenProxy contract as Blacklistable
 * @param {number} fromBlockNumber the start block number
 * @param {number} toBlockNumber the end block number
 * @throws error if RPC fails after MAX_RETRIES counts
 */
async function getBlacklistedEventsRetryWithBackoff(
  proxyAsBlacklistable,
  fromBlockNumber,
  toBlockNumber
) {
  let tries = 0;
  let error;

  while (tries < MAX_RETRIES) {
    await sleep(tries * SLEEP_MS);
    try {
      return await proxyAsBlacklistable.getPastEvents("Blacklisted", {
        fromBlock: fromBlockNumber,
        toBlock: toBlockNumber,
      });
    } catch (e) {
      error = e;
      tries += 1;
    }
  }

  throw error;
}

/**
 * Utility function to trigger a sleep.
 * @param {number} ms the period to sleep for
 */
async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = async (callback) => {
  /* eslint-disable no-undef -- Config is a global variable in a truffle exec script https://github.com/trufflesuite/truffle/pull/3233 */
  const network = config.network;
  const argv = config._;
  /* eslint-enable no-undef */
  const usageError = new Error(
    "Usage: yarn truffle exec scripts/getBlacklistedAccounts.js [<0x-stripped Proxy address>] [startBlockNumber] [--network=<NETWORK>]"
  );

  // Truffle exec seems to auto parse a hex string passed in arguments into decimals.
  // We need to strip the 0x in arguments to prevent this from happening.
  const rawProxyAddress = argv[1];
  const startBlockNumber = Number(argv[2] || 0);
  const proxyAddress =
    network === "development" && !rawProxyAddress
      ? (await FiatTokenProxy.deployed()).address
      : `0x${rawProxyAddress}`;

  console.log(`network: ${network}`);
  console.log(`proxyAddress: ${proxyAddress}`);
  console.log(`startBlockNumber: ${startBlockNumber}`);

  if (!web3.utils.isAddress(proxyAddress)) {
    callback(usageError);
  } else {
    try {
      await main(proxyAddress, startBlockNumber);
      callback();
    } catch (e) {
      callback(e);
    }
  }
};
