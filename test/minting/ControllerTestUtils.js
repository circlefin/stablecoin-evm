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

const Q = require("q");

const { ZERO_ADDRESS } = require("../helpers/constants");
const AccountUtils = require("./AccountUtils.js");
const Accounts = AccountUtils.Accounts;
const setAccountDefault = AccountUtils.setAccountDefault;
const checkState = AccountUtils.checkState;
const getAccountState = AccountUtils.getAccountState;

function ControllerState(owner, controllers) {
  this.owner = owner;
  this.controllers = controllers;
  this.checkState = async function (controllerContract) {
    await checkControllerState(controllerContract, this);
  };
}

// Default state of Controller when it is deployed
const controllerEmptyState = new ControllerState(
  Accounts.mintOwnerAccount,
  setAccountDefault(Accounts, ZERO_ADDRESS)
);

// Checks the state of an array of controller contracts
async function checkControllerState(controller, customState) {
  await checkState(
    controller,
    customState,
    controllerEmptyState,
    getActualControllerState,
    Accounts,
    true
  );
}

// Gets the actual state of the controller contract.
// Evaluates all mappings on the provided accounts.
async function getActualControllerState(controllerContract, accounts) {
  return Q.all([
    controllerContract.owner.call(),
    getAccountState(controllerContract.controllers, accounts),
  ]).spread(function (owner, controllerState) {
    return new ControllerState(owner, controllerState);
  });
}

module.exports = {
  controllerEmptyState: controllerEmptyState,
  checkControllerState: checkControllerState,
};
