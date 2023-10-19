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
let masterMinterOwnerAddress = "";
let fiatTokenAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "..", "config.js"))) {
  ({
    MASTERMINTER_OWNER_ADDRESS: masterMinterOwnerAddress,
    PROXY_CONTRACT_ADDRESS: fiatTokenAddress,
  } = require("../../config.js"));
}

module.exports = async (deployer, network) => {
  if (network === "development" || network === "coverage") {
    // Change these if deploying for real, these are deterministic
    // address from ganache
    masterMinterOwnerAddress = "0x3e5e9111ae8eb78fe1cc3bb8915d5d461f3ef9a9";
    fiatTokenAddress = FiatTokenProxy.address;
  }

  console.log(
    `Deploying MasterMinter for fiat token at ${fiatTokenAddress}...`
  );

  await deployer.deploy(MasterMinter, fiatTokenAddress);
  const masterMinter = await MasterMinter.deployed();

  console.log(
    `>>>>>>> Deployed MasterMinter at ${masterMinter.address} <<<<<<<`
  );
  console.log(
    `Reassigning MasterMinter owner to ${masterMinterOwnerAddress}...`
  );

  await masterMinter.transferOwnership(masterMinterOwnerAddress);
  console.log("All done.");
};
