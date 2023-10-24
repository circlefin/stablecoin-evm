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

let env = "";
let masterMinterContractAddress = "";
let masterMinterOwnerAddress = "";
let minter = "";
let burner = "";
let minterControllerIncrementer = "";
let minterControllerRemover = "";
let burnerController = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "..", "config.js"))) {
  ({
    ENV: env,
    MASTER_MINTER_CONTRACT_ADDRESS: masterMinterContractAddress,
    MASTERMINTER_OWNER_ADDRESS: masterMinterOwnerAddress,
  } = require("../../config.js"));

  if (fs.existsSync(path.join(__dirname, "..", "..", `config.${env}.js`))) {
    ({
      MINTER: minter,
      BURNER: burner,
      MINTER_CONTROLLER_INCREMENTER: minterControllerIncrementer,
      MINTER_CONTROLLER_REMOVER: minterControllerRemover,
      BURNER_CONTROLLER: burnerController,
    } = require(`../../config.${env}.js`));
  }
}

module.exports = async function (_) {
  console.log(
    `>>>>>>> Configuring Known Cold Storage Controllers of Minters And Burners on ${env} <<<<<<<`
  );

  masterMinterContractAddress =
    masterMinterContractAddress || (await MasterMinter.deployed()).address;
  const masterMinter = await MasterMinter.at(masterMinterContractAddress);

  await masterMinter.configureController(minterControllerIncrementer, minter, {
    from: masterMinterOwnerAddress,
  });

  await masterMinter.configureController(minterControllerRemover, minter, {
    from: masterMinterOwnerAddress,
  });

  await masterMinter.configureController(burnerController, burner, {
    from: masterMinterOwnerAddress,
  });

  console.log(
    `MINTER_CONTROLLER_INCREMENTER ${minterControllerIncrementer} controls ${await masterMinter.getWorker(
      minterControllerIncrementer
    )}`
  );
  console.log(
    `MINTER_CONTROLLER_REMOVER ${minterControllerRemover} controls ${await masterMinter.getWorker(
      minterControllerRemover
    )}`
  );
  console.log(
    `BURNER_CONTROLLER ${burnerController} controls ${await masterMinter.getWorker(
      burnerController
    )}`
  );
};
