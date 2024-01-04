/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * Copyright (c) 2024, Circle Internet Financial, LLC.
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

/**
 * A utility script to merge abis of proxy and implementation contracts
 * @param {string} contractA name of the first contract
 * @param {string} contractB name of the second contract
 */
async function mergeAbi(contractA, contractB) {
  const { abi: abiA } = require(`../build/contracts/${contractA}.json`);
  const { abi: abiB } = require(`../build/contracts/${contractB}.json`);

  const mergedAbi = abiA.concat(abiB);

  mergedAbi.sort((a, b) => {
    if (a.type === b.type) {
      // when a and b are both events or both functions, sort by name in alphabetical order
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    } else if (a.type === "events") {
      // event interfaces are placed before function interfaces
      return -1;
    } else {
      return 1;
    }
  });

  const outputName = `merged_${contractA}_${contractB}.json`;
  console.log(`Generated merged abi at ${outputName}`);

  fs.writeFile(outputName, JSON.stringify(mergedAbi), null, () => {});
  return mergedAbi;
}

async function main() {
  const argv = process.argv.slice(2);
  const [contractA, contractB] = argv;

  if (!contractA || !contractB) {
    throw new Error(
      "Usage: yarn execScript scripts/mergeAbi.js <CONTRACT_A> <CONTRACT_B> "
    );
  }

  console.log(`contractA: ${contractA}`);
  console.log(`contractB: ${contractB}`);

  await mergeAbi(contractA, contractB);
}

module.exports = main;
