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

const FiatTokenProxy = artifacts.require("FiatTokenProxy");

async function main(proxyAddress) {
  const endBlock = await web3.eth.getBlockNumber();
  const creationBlock = await getProxyCreationBlock(proxyAddress, 0, endBlock);
  if (await isContractCreatedAtBlock(proxyAddress, creationBlock)) {
    console.log(
      `Contract '${proxyAddress}' was created in block number ${creationBlock}`
    );
  } else {
    console.log(
      `Could not find contract creation block for contract '${proxyAddress}'`
    );
  }
}

/**
 * Searches for the creation block for a given contract using binary search.
 * Adapted from https://levelup.gitconnected.com/how-to-get-smart-contract-creation-block-number-7f22f8952be0.
 * @param {string} proxyAddress the address of the FiatTokenProxy contract
 * @param {number} startBlock the start block of the range
 * @param {number} endBlock the end block of the range
 * @returns the block number at recursion termination
 */
async function getProxyCreationBlock(proxyAddress, startBlock, endBlock) {
  await sleep(500);
  console.log(`Searching in [${startBlock}, ${endBlock}]`);
  if (startBlock === endBlock) {
    return startBlock;
  }
  const midBlock = Math.floor((startBlock + endBlock) / 2);
  if (await isContractCreatedAtBlock(proxyAddress, midBlock)) {
    return getProxyCreationBlock(proxyAddress, startBlock, midBlock);
  } else {
    return getProxyCreationBlock(proxyAddress, midBlock + 1, endBlock);
  }
}

/**
 * Checks if a given contract is created at a given block number
 * @param {string} proxyAddress the address of the FiatTokenProxy contract
 * @param {number} block the block number to check
 * @returns true if the contract is created at the provided block number, false otherwise
 */
async function isContractCreatedAtBlock(proxyAddress, block) {
  const code = await web3.eth.getCode(proxyAddress, block);
  return code.length > 2;
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
    "Usage: yarn truffle exec scripts/getContractCreationBlock.js [<0x-stripped Proxy address>] [--network=<NETWORK>]"
  );

  // Truffle exec seems to auto parse a hex string passed in arguments into decimals.
  // We need to strip the 0x in arguments to prevent this from happening.
  const rawProxyAddress = argv[1];
  const proxyAddress =
    network === "development" && !rawProxyAddress
      ? (await FiatTokenProxy.deployed()).address
      : `0x${rawProxyAddress}`;

  console.log(`network: ${network}`);
  console.log(`proxyAddress: ${proxyAddress}`);

  if (!web3.utils.isAddress(proxyAddress)) {
    callback(usageError);
  } else {
    try {
      await main(proxyAddress);
      callback();
    } catch (e) {
      callback(e);
    }
  }
};
