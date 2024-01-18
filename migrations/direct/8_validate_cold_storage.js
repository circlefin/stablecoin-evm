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

const BigNumber = require("bignumber.js");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");
const MasterMinter = artifacts.require("MasterMinter.sol");

let env = "";
let proxyContractAddress = "";
let masterMinterContractAddress = "";
let minter = "";
let burner = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "..", "config.js"))) {
  ({
    ENV: env,
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
    MASTER_MINTER_CONTRACT_ADDRESS: masterMinterContractAddress,
  } = require("../../config.js"));

  if (fs.existsSync(path.join(__dirname, "..", "..", `config.${env}.js`))) {
    ({ MINTER: minter, BURNER: burner } = require(`../../config.${env}.js`));
  }
}

// Prints out current roles on important contracts, for validation
module.exports = async function (_) {
  proxyContractAddress =
    proxyContractAddress || (await FiatTokenProxy.deployed()).address;
  const proxyAsV2_2 = await FiatTokenV2_2.at(proxyContractAddress);
  const proxyContract = await FiatTokenProxy.at(proxyContractAddress);

  masterMinterContractAddress =
    masterMinterContractAddress || (await MasterMinter.deployed()).address;
  const masterMinter = await MasterMinter.at(masterMinterContractAddress);

  const tokenOwner = await proxyAsV2_2.owner();
  const proxyAdmin = await proxyContract.admin();
  const masterMinterOwner = await masterMinter.owner();
  const masterMinterRole = await proxyAsV2_2.masterMinter();
  const blacklisterRole = await proxyAsV2_2.blacklister();
  const pauserRole = await proxyAsV2_2.pauser();

  console.log(`>>>>>>> Validate the following roles are as expected: <<<<<<<`);
  console.log(`Token Owner:        ${tokenOwner}`);
  console.log(`Proxy Admin:        ${proxyAdmin}`);
  console.log(`MasterMinter Owner: ${masterMinterOwner}`);
  console.log(`MasterMinter Role:  ${masterMinterRole}`);
  console.log(`Blacklister Role:   ${blacklisterRole}`);
  console.log(`Pauser Role:        ${pauserRole}`);

  console.log(
    `>>>>>>> Configuring Minter and Burner allowance on ${env} <<<<<<<`
  );
  const minterAllowance = new BigNumber(
    await proxyAsV2_2.minterAllowance(minter)
  ).shiftedBy(-6);

  const burnerAllowance = new BigNumber(
    await proxyAsV2_2.minterAllowance(burner)
  ).shiftedBy(-6);

  console.log(
    `\n>>>>>>> Validate the minter/burner allowances (in major units) are as expected: <<<<<<<`
  );
  console.log(`Minter Allowance:  ${minterAllowance}`);
  console.log(`Burner Allowance:  ${burnerAllowance}`);
};
