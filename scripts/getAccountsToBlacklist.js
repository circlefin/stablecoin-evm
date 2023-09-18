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

const _ = require("lodash");
const fs = require("fs");
const path = require("path");

const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");

const MAX_RETRIES = 5;
const CHUNK_SIZE = 30000;
const SLEEP_MS = 1000;
const OUTPUT_FILE = path.join(__dirname, "..", "blacklist.json");

async function main(proxyAddress, startBlockNumber) {
  const fiatTokenV2_1 = await FiatTokenV2_1.at(proxyAddress);

  const latestBlockNumber = await web3.eth.getBlockNumber();
  let fromBlockNumber = startBlockNumber;
  let toBlockNumber = startBlockNumber + CHUNK_SIZE;

  do {
    await saveBlacklistedAccounts(
      fiatTokenV2_1,
      fromBlockNumber,
      toBlockNumber
    );
    fromBlockNumber = toBlockNumber + 1;
    toBlockNumber = Math.min(latestBlockNumber, toBlockNumber + CHUNK_SIZE);

    // Sleep for a bit to avoid blasting the RPC.
    await sleep(SLEEP_MS);
  } while (toBlockNumber < latestBlockNumber);
}

/**
 * Saves all accounts that were blacklisted in [fromBlockNumber, toBlockNumber]
 * AND are still blacklisted, in storage.
 * @param {FiatTokenV2_1} fiatTokenV2_1 the FiatTokenProxy contract as v2.1
 * @param {number} fromBlockNumber the start block number
 * @param {number} toBlockNumber the end block number
 */
async function saveBlacklistedAccounts(
  fiatTokenV2_1,
  fromBlockNumber,
  toBlockNumber
) {
  console.log(
    `Querying events in range [${fromBlockNumber}, ${toBlockNumber}]`
  );
  const rawBlacklistedEvents = await getBlacklistedEventsRetryWithBackoff(
    fiatTokenV2_1,
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
    const isCurrentlyBlacklisted = await fiatTokenV2_1.isBlacklisted(account);
    if (isCurrentlyBlacklisted) {
      blacklistedAccounts.push(account);
    }
  }

  console.log(
    `>> Found ${blacklistedAccounts.length} unique & currently blacklisted accounts`
  );
  appendBlacklistedAccounts(blacklistedAccounts);
}

/**
 * Appends blacklisted accounts to a JSON file, deduplicating accounts.
 * @param {string[]} blacklistedAccounts the list of blacklisted accounts
 */
function appendBlacklistedAccounts(blacklistedAccounts) {
  let previousBlacklistedAccounts = [];
  try {
    previousBlacklistedAccounts = require(OUTPUT_FILE);
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
 * @param {FiatTokenV2_1} fiatTokenV2_1 the FiatTokenProxy contract as v2.1
 * @param {number} fromBlockNumber the start block number
 * @param {number} toBlockNumber the end block number
 * @throws error if RPC fails after MAX_RETRIES counts
 */
async function getBlacklistedEventsRetryWithBackoff(
  fiatTokenV2_1,
  fromBlockNumber,
  toBlockNumber
) {
  let tries = 0;
  let error;

  while (tries < MAX_RETRIES) {
    await sleep(tries * SLEEP_MS);
    try {
      return await fiatTokenV2_1.getPastEvents("Blacklisted", {
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
    "Usage: yarn truffle exec scripts/getAccountsToBlacklist.js [<0x-stripped Proxy address>] [startBlockNumber] [--network=<NETWORK>]"
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
