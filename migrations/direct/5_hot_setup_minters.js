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

let env = "";
let proxyContractAddress = "";
let minter = "";
let burner = "";
let mintAllowanceUnits = 0;

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "..", "config.js"))) {
  ({
    ENV: env,
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
  } = require("../../config.js"));

  if (fs.existsSync(path.join(__dirname, "..", "..", `config.${env}.js`))) {
    ({
      MINTER: minter,
      BURNER: burner,
      MINT_ALLOWANCE_UNITS: mintAllowanceUnits,
    } = require(`../../config.${env}.js`));
  }
}

// Configure some minters with hot keys before converting to cold storage
// to avoid needing a run to even get our products started.
module.exports = async function (_) {
  console.log(
    `>>>>>>> Configuring Known Minters and Burners on ${env} <<<<<<<`
  );
  proxyContractAddress =
    proxyContractAddress || (await FiatTokenProxy.deployed()).address;

  const proxyAsV2_2 = await FiatTokenV2_2.at(proxyContractAddress);
  const masterMinterAddress = await proxyAsV2_2.masterMinter();

  const mintAllowance = new BigNumber(mintAllowanceUnits).shiftedBy(6);
  await proxyAsV2_2.configureMinter(minter, mintAllowance, {
    from: masterMinterAddress,
  });
  await proxyAsV2_2.configureMinter(burner, 0, {
    from: masterMinterAddress,
  });
};
