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

const FiatTokenV2_2 = artifacts.require("FiatTokenV2_Circle");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const SignatureChecker = artifacts.require("SignatureChecker");

const THROWAWAY_ADDRESS = "0x0000000000000000000000000000000000000001";

let proxyAdminAddress = "";
let ownerAddress = "";
let pauserAddress = "";
let blacklisterAddress = "";
let lostAndFoundAddress = "";
let masterMinterOwnerAddress = "";
let fiatTokenImplementationAddress = "";
let tokenName = "";
let tokenSymbol = "";
let tokenCurrency = "";
let tokenDecimals = "";
let l1TokenAddress = "";
let l2BridgeAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "..", "config.js"))) {
  ({
    PROXY_ADMIN_ADDRESS: proxyAdminAddress,
    OWNER_ADDRESS: ownerAddress,
    PAUSER_ADDRESS: pauserAddress,
    BLACKLISTER_ADDRESS: blacklisterAddress,
    LOST_AND_FOUND_ADDRESS: lostAndFoundAddress,
    MASTERMINTER_OWNER_ADDRESS: masterMinterOwnerAddress,
    FIAT_TOKEN_IMPLEMENTATION_ADDRESS: fiatTokenImplementationAddress,
    TOKEN_NAME: tokenName,
    TOKEN_SYMBOL: tokenSymbol,
    TOKEN_CURRENCY: tokenCurrency,
    TOKEN_DECIMALS: tokenDecimals,
    L1_TOKEN_ADDRESS: l1TokenAddress,
    L2_BRIDGE_ADDRESS: l2BridgeAddress,
  } = require("../../config.js"));
}

/**
 * A utility script to directly deploy Fiat Token contract with the latest implementation
 *
 * Note: The proxy needs to be deployed before the master minter; the proxy cannot
 * be initialized until the master minter is deployed.
 */
module.exports = async (deployer, network) => {
  if (!proxyAdminAddress || !ownerAddress || !masterMinterOwnerAddress) {
    throw new Error(
      "PROXY_ADMIN_ADDRESS, OWNER_ADDRESS, and MASTERMINTER_OWNER_ADDRESS must be provided in config.js"
    );
  }

  if (!pauserAddress || !blacklisterAddress || !lostAndFoundAddress) {
    if (network === "mainnet") {
      throw new Error(
        "PAUSER_ADDRESS, BLACKLISTER_ADDRESS and LOST_AND_FOUND_ADDRESS must be provided in config.js"
      );
    } else {
      // If we're not on mainnet, let the user values dictate this.
      pauserAddress = pauserAddress || ownerAddress;
      blacklisterAddress = blacklisterAddress || ownerAddress;
      lostAndFoundAddress = lostAndFoundAddress || ownerAddress;
    }
  }

  console.log(`Proxy Admin:                ${proxyAdminAddress}`);
  console.log(`Owner:                      ${ownerAddress}`);
  console.log(`Pauser:                     ${pauserAddress}`);
  console.log(`Blacklister:                ${blacklisterAddress}`);
  console.log(`Lost and Found:             ${lostAndFoundAddress}`);
  console.log(`Master Minter Owner:        ${masterMinterOwnerAddress}`);
  console.log(
    `FiatTokenImplementationAddress: ${fiatTokenImplementationAddress}`
  );

  // If there is an existing implementation contract,
  // we can simply point the newly deployed proxy contract to it.
  // Otherwise, deploy the latest implementation contract code to the network.
  if (!fiatTokenImplementationAddress) {
    console.log("Deploying and linking SignatureChecker library contract...");
    await deployer.deploy(SignatureChecker);
    await deployer.link(SignatureChecker, FiatTokenV2_2);

    console.log("Deploying implementation contract...");
    await deployer.deploy(FiatTokenV2_2);
    const fiatTokenV2_2 = await FiatTokenV2_2.deployed();
    console.log("Deployed implementation contract at", FiatTokenV2_2.address);

    console.log("Initializing implementation contract with dummy values...");
    // These values are dummy values because we only rely on the implementation
    // deployment for delegatecall logic, not for actual state storage.
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
    await fiatTokenV2_2.initializeV2_Circle(
      THROWAWAY_ADDRESS,
      THROWAWAY_ADDRESS
    );
    fiatTokenImplementationAddress = FiatTokenV2_2.address;
  }

  console.log("Deploying proxy contract...");
  await deployer.deploy(FiatTokenProxy, fiatTokenImplementationAddress);
  const fiatTokenProxy = await FiatTokenProxy.deployed();
  console.log("Deployed proxy contract at", FiatTokenProxy.address);

  // Now that the master minter is set up, we can go back to setting up the proxy and
  // implementation contracts.
  console.log("Reassigning proxy contract admin...");
  // Need to change admin first, or the call to initialize won't work
  // since admin can only call methods in the proxy, and not forwarded methods
  await fiatTokenProxy.changeAdmin(proxyAdminAddress);

  console.log("Initializing proxy contract...");

  // Do the initial (V1) initialization.
  // Note that this takes in the master minter contract's address as the master minter.
  // The master minter contract's owner is a separate address.
  const proxyAsV2_2 = await FiatTokenV2_2.at(FiatTokenProxy.address);
  await proxyAsV2_2.initialize(
    tokenName,
    tokenSymbol,
    tokenCurrency,
    tokenDecimals,
    masterMinterOwnerAddress,
    pauserAddress,
    blacklisterAddress,
    ownerAddress
  );

  // Do the V2 initialization
  console.log("Initializing V2...");
  await proxyAsV2_2.initializeV2(tokenName);

  // Do the V2_1 initialization
  console.log("Initializing V2.1...");
  await proxyAsV2_2.initializeV2_1(lostAndFoundAddress);

  // Do the V2_2 initialization
  console.log("Initializing V2.2...");
  await proxyAsV2_2.initializeV2_2([], tokenSymbol);

  console.log("Initializing V2.Circle...");
  await proxyAsV2_2.initializeV2_Circle(l1TokenAddress, l2BridgeAddress);

  console.log("Deployment step 2 finished");
};
