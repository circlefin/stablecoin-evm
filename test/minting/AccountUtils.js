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

// set to true to enable verbose logging in the tests
const debugLogging = false;
const assertDiff = require("assert-diff");
assertDiff.options.strict = true;

const Q = require("q");
const { cloneDeep } = require("lodash");
const util = require("util");

const { accounts, accountPrivateKeys } = require("../helpers/constants");

function addressEquals(address1, address2) {
  if (address1.toUpperCase() === address2.toUpperCase()) {
    return true;
  } else {
    assert.isFalse("expect " + address1 + " to equal " + address2);
  }
}

// Returns an object with all named account values set to the default value
// e.g sets {owner: 0, minter: 0,...}
function setAccountDefault(accounts, defaultValue) {
  const result = {};
  for (const accountName in accounts) {
    result[accountName] = defaultValue;
  }
  return result;
}

// return an expectedState that combines customState with the emptyState
function buildExpectedPartialState(
  emptyState,
  customState,
  ignoreExtraCustomVars
) {
  // for each item in customVars, set the item in expectedState
  const expectedState = cloneDeep(emptyState);

  for (const variableName in customState) {
    // do I ignore extra values
    if (Object.prototype.hasOwnProperty.call(expectedState, variableName)) {
      const variableValue = customState[variableName];
      if (isLiteral(variableValue)) {
        expectedState[variableName] = variableValue;
      } else {
        // assume variableValue is a mapping evaluated on 1 or more accounts
        for (const accountName in variableValue) {
          expectedState[variableName][accountName] = variableValue[accountName];
        }
      }
    } else if (!ignoreExtraCustomVars) {
      throw new Error(
        "variable " + variableName + " not found in expectedState"
      );
    }
  }
  return expectedState;
}

// For testing variance of specific variables from their default values.
// customVars is an array of objects of the form,
// {'variable': <name of variable>, 'expectedValue': <expected value after modification>}
// to reference nested variables, name variable using dot syntax, e.g. 'allowance.arbitraryAccount.minterAccount'
// emptyState: is the ideal empty state
// getActualState: async function(token, accounts) => state
// accounts: list of accounts on which to evaluate mappings
// ignoreExtraCustomVars: ignore _customVars names that are not in the emptyState
async function checkState(
  _tokens,
  _customVars,
  emptyState,
  getActualState,
  accounts,
  ignoreExtraCustomVars
) {
  // Iterate over array of tokens.
  const numTokens = _tokens.length;
  assert.equal(numTokens, _customVars.length);
  let n;
  for (n = 0; n < numTokens; n++) {
    const token = _tokens[n];
    const customVars = _customVars[n];
    const expectedState = buildExpectedPartialState(
      emptyState,
      customVars,
      ignoreExtraCustomVars
    );

    if (debugLogging) {
      console.log(
        util.inspect(expectedState, { showHidden: false, depth: null })
      );
    }

    const actualState = await getActualState(token, accounts);
    assertDiff.deepEqual(
      actualState,
      expectedState,
      "difference between expected and actual state"
    );
  }
}

// accountQuery: an async function that takes as input an address and
//       queries the blockchain for a result
// accounts: an object containing account addresses.  Eg: {owner: 0xffad9033, minter: 0x45289432}
// returns an object containing the results of calling accountQuery on each account
//        E.g. {owner: value1, minter: value2}
async function getAccountState(accountQuery, _accounts) {
  // create an array of promises
  const promises = [];
  for (const account in _accounts) {
    const promiseQuery = accountQuery(accounts[account]);
    promises.push(promiseQuery);
  }
  const results = await Q.allSettled(promises);
  const state = {};
  let u = 0;
  for (const account in _accounts) {
    state[account] = results[u].value;
    ++u;
  }
  return state;
}

function isLiteral(object) {
  if (typeof object === "object" && !object._isBigNumber) return false;
  return true;
}

module.exports = {
  Accounts: accounts,
  AccountPrivateKeys: accountPrivateKeys,
  setAccountDefault: setAccountDefault,
  checkState: checkState,
  getAccountState: getAccountState,
  addressEquals: addressEquals,
};
