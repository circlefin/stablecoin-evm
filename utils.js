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
const web3 = require("web3");

/**
 * Helper function to read the blacklist file.
 * @param blacklistFilePath {string} the filepath to the blacklist file.
 * @returns {string[]} the list of addresses in the file.
 */
function readBlacklistFile(blacklistFilePath) {
  if (!fs.existsSync(blacklistFilePath)) {
    throw new Error(`'${blacklistFilePath}' does not exist!`);
  }
  let addresses = require(blacklistFilePath);
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
