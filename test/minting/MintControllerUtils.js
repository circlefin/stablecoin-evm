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

const tokenUtils = require("../v1/TokenTestUtils.js");
const bigZero = tokenUtils.bigZero;
const initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;

const AccountUtils = require("./AccountUtils.js");
const Accounts = AccountUtils.Accounts;
const checkState = AccountUtils.checkState;

const ControllerUtils = require("./ControllerTestUtils.js");
const checkControllerState = ControllerUtils.checkControllerState;

function MintControllerState(owner, controllers, minterManager) {
  this.owner = owner;
  this.controllers = controllers;
  this.minterManager = minterManager;
  this.checkState = async function (mintController) {
    await checkMintControllerState(mintController, this);
  };
}

// Default state of MintController when it is deployed
const mintControllerEmptyState = new MintControllerState(null, {}, bigZero);
// Checks the state of the mintController contract
async function checkMintControllerState(mintController, customState) {
  await checkControllerState(mintController, customState);
  await checkState(
    mintController,
    customState,
    mintControllerEmptyState,
    getActualMintControllerState,
    Accounts,
    true
  );
}

// Gets the actual state of the mintController contract.
// Evaluates all mappings on the provided accounts.
async function getActualMintControllerState(mintController) {
  const minterManager = await mintController.minterManager.call();
  return new MintControllerState(null, {}, minterManager);
}

// Deploys a FiatTokenV1 with a MintController contract as the masterMinter.
// Uses the same workflow we would do in production - first deploy FiatToken then set the masterMinter.
async function initializeTokenWithProxyAndMintController(
  rawToken,
  MintControllerArtifact
) {
  const tokenConfig = await initializeTokenWithProxy(rawToken);
  const mintController = await MintControllerArtifact.new(
    tokenConfig.token.address,
    { from: Accounts.mintOwnerAccount }
  );
  await tokenConfig.token.updateMasterMinter(mintController.address, {
    from: Accounts.tokenOwnerAccount,
  });
  const tokenConfigWithMinter = {
    proxy: tokenConfig.proxy,
    token: tokenConfig.token,
    mintController: mintController,
    customState: new MintControllerState(null, {}, tokenConfig.token.address),
  };
  return tokenConfigWithMinter;
}

module.exports = {
  initializeTokenWithProxyAndMintController: initializeTokenWithProxyAndMintController,
  checkMintControllerState: checkMintControllerState,
  MintControllerState: MintControllerState,
};
