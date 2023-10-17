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

const fs = require("fs");
const path = require("path");
const MasterMinter = artifacts.require("MasterMinter.sol");
const FiatTokenProxy = artifacts.require("FiatTokenProxy.sol");
let masterMinterAddress = "";
let fiatTokenAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    MASTERMINTER_ADDRESS: masterMinterAddress,
    PROXY_CONTRACT_ADDRESS: fiatTokenAddress,
  } = require("../config.js"));
}

module.exports = function (deployer, network) {
  if (network === "development" || network === "coverage") {
    // Change these if deploying for real, these are deterministic
    // address from ganache
    masterMinterAddress = "0x3e5e9111ae8eb78fe1cc3bb8915d5d461f3ef9a9";
    fiatTokenAddress = FiatTokenProxy.address;
  }
  console.log("deploying MasterMinter for fiat token at " + fiatTokenAddress);
  deployer
    .deploy(MasterMinter, fiatTokenAddress)
    .then(function (mm) {
      console.log("master minter deployed at " + mm.address);
      console.log("reassigning owner to " + masterMinterAddress);
      return mm.transferOwnership(masterMinterAddress);
    })
    .then(function () {
      console.log("All done.");
    });
};
