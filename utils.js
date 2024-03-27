/**
 * Copyright 2023 Circle Internet Financial, LTD. All rights reserved.
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

const _ = require("lodash");
const fs = require("fs");
const web3 = require("web3");

/**
 * Helper function to read the blacklist file.
 * @param {string} blacklistFilePath the filepath to the blacklist file.
 * @returns {string[]} the list of addresses in the file.
 */
function readBlacklistFile(blacklistFilePath) {
  if (!fs.existsSync(blacklistFilePath)) {
    throw new Error(`'${blacklistFilePath}' does not exist!`);
  }
  let addresses = JSON.parse(fs.readFileSync(blacklistFilePath));
  addresses = _.uniqBy(addresses, (a) => a.toLowerCase()); // Deduplicate any addresses in the file

  // Validate that addresses' integrity
  for (const address of addresses) {
    if (!web3.utils.isAddress(address)) {
      throw new Error(
        `Address '${address}' in '${blacklistFilePath}' is not valid address!`
      );
    }
  }
  return addresses;
}

module.exports = { readBlacklistFile };
