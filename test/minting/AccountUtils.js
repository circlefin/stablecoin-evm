// set to true to enable verbose logging in the tests
const debugLogging = false;
const assertDiff = require("assert-diff");
assertDiff.options.strict = true;

const Q = require("q");
const clone = require("clone");
const util = require("util");

// named list of all accounts
const Accounts = {
  deployerAccount: "0x90F8BF6A479F320EAD074411A4B0E7944EA8C9C1", // accounts[0]
  arbitraryAccount: "0xFFCF8FDEE72AC11B5C542428B35EEF5769C409F0", // accounts[1]
  tokenOwnerAccount: "0xE11BA2B4D45EAED5996CD0823791E0C93114882D", // Accounts.arbitraryAccount
  blacklisterAccount: "0xD03EA8624C8C5987235048901FB614FDCA89B117", // accounts[4]
  arbitraryAccount2: "0x95CED938F7991CD0DFCB48F0A06A40FA1AF46EBC", // accounts[5]
  masterMinterAccount: "0x3E5E9111AE8EB78FE1CC3BB8915D5D461F3EF9A9", // accounts[6]
  minterAccount: "0x28A8746E75304C0780E011BED21C72CD78CD535E", // accounts[7]
  pauserAccount: "0xACA94EF8BD5FFEE41947B4585A84BDA5A3D3DA6E", // accounts[8]
  mintOwnerAccount: "0x1DF62F291B2E969FB0849D99D9CE41E2F137006E", // accounts[9]
  controller1Account: "0x855FA758C77D68A04990E992AA4DCDEF899F654A", // accounts[11]
  proxyOwnerAccount: "0x2F560290FEF1B3ADA194B6AA9C40AA71F8E95598", // accounts[14]
};

// named list of known private keys
const AccountPrivateKeys = {
  deployerPrivateKey:
    "4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d", // accounts[0]
  arbitraryPrivateKey:
    "6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1", // accounts[1]
  issuerControllerPrivateKey:
    "6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c", // accounts[2]
  tokenOwnerPrivateKey:
    "646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913", // Accounts.arbitraryAccount
  blacklisterPrivateKey:
    "add53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743", // accounts[4]
  arbitrary2PrivateKey:
    "395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd", // accounts[5]
  masterMinterPrivateKey:
    "e485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52", // accounts[6]
  minterPrivateKeyt:
    "a453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3", // accounts[7]
  pauserPrivateKey:
    "829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4", // accounts[8]
  mintOwnerPrivateKey:
    "b0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773", // accounts[9]
  mintProtectorPrivateKey:
    "77c5495fbb039eed474fc940f29955ed0531693cc9212911efd35dff0373153f", // accounts[10]
  controller1PrivateKey:
    "d99b5b29e6da2528bf458b26237a6cf8655a3e3276c1cdc0de1f98cefee81c01", // accounts[11]
  controller2PrivateKey:
    "9b9c613a36396172eab2d34d72331c8ca83a358781883a535d2941f66db07b24", // accounts[12]
  issuerOwnerPrivateKey:
    "0874049f95d55fb76916262dc70571701b5c4cc5900c0691af75f1a8a52c8268", // accounts[13]
  proxyOwnerAccount:
    "21d7212f3b4e5332fd465877b64926e3532653e2798a11255a46f533852dfe46", // accounts[14]
};

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
  const expectedState = clone(emptyState);

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
async function getAccountState(accountQuery, accounts) {
  // create an array of promises
  const promises = [];
  for (const account in accounts) {
    const promiseQuery = accountQuery(Accounts[account]);
    promises.push(promiseQuery);
  }
  const results = await Q.allSettled(promises);
  const state = {};
  let u = 0;
  for (const account in accounts) {
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
  Accounts: Accounts,
  AccountPrivateKeys: AccountPrivateKeys,
  setAccountDefault: setAccountDefault,
  checkState: checkState,
  getAccountState: getAccountState,
  addressEquals: addressEquals,
};
