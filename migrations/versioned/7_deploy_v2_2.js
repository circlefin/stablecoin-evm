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
const some = require("lodash/some");

const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const SignatureChecker = artifacts.require("SignatureChecker");

const THROWAWAY_ADDRESS = "0x0000000000000000000000000000000000000001";

let proxyContractAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "..", "config.js"))) {
  ({
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
  } = require("../../config.js"));
}

module.exports = async (deployer, network) => {
  if (
    !proxyContractAddress ||
    some(["development", "coverage"], (v) => network.includes(v))
  ) {
    proxyContractAddress = (await FiatTokenProxy.deployed()).address;
  }

  console.log(`FiatTokenProxy: ${proxyContractAddress}`);

  console.log("Deploying and linking SignatureChecker library contract...");
  await deployer.deploy(SignatureChecker);
  await deployer.link(SignatureChecker, FiatTokenV2_2);

  console.log("Deploying FiatTokenV2_2 implementation contract...");
  await deployer.deploy(FiatTokenV2_2);

  const fiatTokenV2_2 = await FiatTokenV2_2.deployed();
  console.log("Deployed FiatTokenV2_2 at", fiatTokenV2_2.address);

  // Initializing the implementation contract with dummy values here prevents
  // the contract from being reinitialized later on with different values.
  // Dummy values can be used here as the proxy contract will store the actual values
  // for the deployed token.
  console.log(
    "Initializing FiatTokenV2_2 implementation contract with dummy values..."
  );
  await fiatTokenV2_2.initialize(
    "",
    "",
    "",
    0,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS
  );
  await fiatTokenV2_2.initializeV2("");
  await fiatTokenV2_2.initializeV2_1(THROWAWAY_ADDRESS);
  await fiatTokenV2_2.initializeV2_2([], "");
};
