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

const util = require("util");
const _ = require("lodash");
const BN = require("bn.js");
const Q = require("q");
const BigNumber = require("bignumber.js");
const {
  arbitraryAccount,
  tokenOwnerAccount,
  masterMinterAccount,
  minterAccount,
  pauserAccount,
  blacklisterAccount,
  proxyOwnerAccount,
  upgraderAccount,
} = require("./helpers/tokenTest");
const { ZERO_BYTES32 } = require("../helpers/constants");

const FiatTokenV1 = artifacts.require("FiatTokenV1");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");

const name = "Sample Fiat Token";
const symbol = "C-USD";
const currency = "USD";
const decimals = 2;
const trueInStorageFormat = "0x01";
const bigZero = new BN(0);

const adminSlot =
  "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b";
const implSlot =
  "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3";

// set to true to enable verbose logging in the tests
const debugLogging = false;

// Returns a new BN object
function newBigNumber(value) {
  const hex = new BigNumber(value).toString(16);
  return new BN(hex, 16);
}

async function expectError(contractPromise, errorMsg) {
  try {
    await contractPromise;
    assert.fail("Expected error " + errorMsg + ", but no error received");
  } catch (error) {
    const correctErrorMsgReceived = error.message.includes(errorMsg);
    assert(
      correctErrorMsgReceived,
      `Expected ${errorMsg}, got ${error.message} instead`
    );
  }
}

// Creates a state object, with default values replaced by
// customVars where appropriate.
function buildExpectedState(token, customVars) {
  // set each variable's default value
  const expectedState = {
    name,
    symbol,
    currency,
    decimals: new BN(decimals),
    masterMinter: masterMinterAccount,
    pauser: pauserAccount,
    blacklister: blacklisterAccount,
    tokenOwner: tokenOwnerAccount,
    proxiedTokenAddress: token.proxiedTokenAddress,
    initializedV1: trueInStorageFormat,
    upgrader: proxyOwnerAccount,
    balanceAndBlacklistStates: {
      arbitraryAccount: bigZero,
      masterMinterAccount: bigZero,
      minterAccount: bigZero,
      pauserAccount: bigZero,
      blacklisterAccount: bigZero,
      tokenOwnerAccount: bigZero,
      upgraderAccount: bigZero,
    },
    allowance: {
      arbitraryAccount: {
        masterMinterAccount: bigZero,
        minterAccount: bigZero,
        pauserAccount: bigZero,
        blacklisterAccount: bigZero,
        tokenOwnerAccount: bigZero,
        arbitraryAccount: bigZero,
        upgraderAccount: bigZero,
      },
      masterMinterAccount: {
        arbitraryAccount: bigZero,
        minterAccount: bigZero,
        pauserAccount: bigZero,
        blacklisterAccount: bigZero,
        tokenOwnerAccount: bigZero,
        masterMinterAccount: bigZero,
        upgraderAccount: bigZero,
      },
      minterAccount: {
        arbitraryAccount: bigZero,
        masterMinterAccount: bigZero,
        pauserAccount: bigZero,
        blacklisterAccount: bigZero,
        tokenOwnerAccount: bigZero,
        minterAccount: bigZero,
        upgraderAccount: bigZero,
      },
      pauserAccount: {
        arbitraryAccount: bigZero,
        masterMinterAccount: bigZero,
        minterAccount: bigZero,
        blacklisterAccount: bigZero,
        tokenOwnerAccount: bigZero,
        pauserAccount: bigZero,
        upgraderAccount: bigZero,
      },
      blacklisterAccount: {
        arbitraryAccount: bigZero,
        masterMinterAccount: bigZero,
        minterAccount: bigZero,
        pauserAccount: bigZero,
        tokenOwnerAccount: bigZero,
        blacklisterAccount: bigZero,
        upgraderAccount: bigZero,
      },
      tokenOwnerAccount: {
        arbitraryAccount: bigZero,
        masterMinterAccount: bigZero,
        minterAccount: bigZero,
        pauserAccount: bigZero,
        blacklisterAccount: bigZero,
        tokenOwnerAccount: bigZero,
        upgraderAccount: bigZero,
      },
      upgraderAccount: {
        arbitraryAccount: bigZero,
        masterMinterAccount: bigZero,
        minterAccount: bigZero,
        pauserAccount: bigZero,
        blacklisterAccount: bigZero,
        tokenOwnerAccount: bigZero,
        upgraderAccount: bigZero,
      },
    },
    totalSupply: bigZero,
    isAccountBlacklisted: {
      arbitraryAccount: false,
      masterMinterAccount: false,
      minterAccount: false,
      pauserAccount: false,
      blacklisterAccount: false,
      tokenOwnerAccount: false,
      upgraderAccount: false,
    },
    isAccountMinter: {
      arbitraryAccount: false,
      masterMinterAccount: false,
      minterAccount: false,
      pauserAccount: false,
      blacklisterAccount: false,
      tokenOwnerAccount: false,
      upgraderAccount: false,
    },
    minterAllowance: {
      arbitraryAccount: bigZero,
      masterMinterAccount: bigZero,
      minterAccount: bigZero,
      pauserAccount: bigZero,
      blacklisterAccount: bigZero,
      tokenOwnerAccount: bigZero,
      upgraderAccount: bigZero,
    },
    paused: false,
  };

  // for each item in customVars, set the item in expectedState
  let i;
  for (i = 0; i < customVars.length; ++i) {
    if (_.has(expectedState, customVars[i].variable)) {
      if (
        expectedState[customVars[i].variable] === customVars[i].expectedValue
      ) {
        throw new Error(
          "variable " +
            customVars[i].variable +
            " to test has same default state as expected state"
        );
      } else {
        _.set(
          expectedState,
          customVars[i].variable,
          customVars[i].expectedValue
        );
      }
    } else {
      throw new Error(
        "variable " + customVars[i].variable + " not found in expectedState"
      );
    }
  }
  return expectedState;
}

// BN-aware deep comparison
function checkState(actual, expected, prefix) {
  for (const k in actual) {
    if (Object.prototype.hasOwnProperty.call(actual, k)) {
      const path = prefix ? prefix + "." + k : k;
      const actualV = actual[k];
      const expectedV = expected[k];
      if (typeof actualV === "object" && !BN.isBN(actualV)) {
        checkState(actualV, expectedV, path);
      } else {
        const msg = `expected ${path} to equal ${expectedV}, got ${actualV}`;
        if (BN.isBN(actualV)) {
          assert.isTrue(actualV.eq(expectedV), msg);
        } else {
          assert.strictEqual(actualV, expectedV, msg);
        }
      }
    }
  }
}

// For testing variance of specific variables from their default values.
// customVars is an array of objects of the form,
// {'variable': <name of variable>, 'expectedValue': <expected value after modification>}
// to reference nested variables, name variable using dot syntax, e.g. 'allowance.arbitraryAccount.minterAccount'
async function checkVariables(_tokens, _customVars) {
  // Iterate over array of tokens.
  const numTokens = _tokens.length;
  assert.strictEqual(numTokens, _customVars.length);
  let n;
  for (n = 0; n < numTokens; n++) {
    const token = _tokens[n];
    const customVars = _customVars[n];
    const expectedState = buildExpectedState(token, customVars);
    if (debugLogging) {
      console.log(
        util.inspect(expectedState, { showHidden: false, depth: null })
      );
    }

    const actualState = await getActualState(token);
    checkState(actualState, expectedState);

    // Check that sum of individual balances equals totalSupply
    const accounts = [
      arbitraryAccount,
      masterMinterAccount,
      minterAccount,
      pauserAccount,
      blacklisterAccount,
      tokenOwnerAccount,
      upgraderAccount,
    ];
    let balanceSum = bigZero;
    for (let i = 0; i < accounts.length; i++) {
      balanceSum = balanceSum.add(await token.balanceOf(accounts[i]));
    }
    const totalSupply = await token.totalSupply();
    assert.isTrue(balanceSum.eq(totalSupply));
  }
}

function hexToAddress(hex) {
  return web3.utils.toChecksumAddress(
    "0x" + hex.replace(/^0x/, "").padStart(40, "0")
  );
}

// build up actualState object to compare to expectedState object
async function getActualState(token) {
  return Q.all([
    await token.name.call(),
    await token.symbol.call(),
    await token.currency.call(),
    await token.decimals.call(),
    await token.masterMinter.call(),
    await token.pauser.call(),
    await token.blacklister.call(),
    await token.owner.call(),
    await getImplementation(token),
    await getAdmin(token),
    await getInitializedV1(token),
    await token.balanceOf(arbitraryAccount),
    await token.balanceOf(masterMinterAccount),
    await token.balanceOf(minterAccount),
    await token.balanceOf(pauserAccount),
    await token.balanceOf(blacklisterAccount),
    await token.balanceOf(tokenOwnerAccount),
    await token.balanceOf(upgraderAccount),
    await token.allowance(arbitraryAccount, masterMinterAccount),
    await token.allowance(arbitraryAccount, minterAccount),
    await token.allowance(arbitraryAccount, pauserAccount),
    await token.allowance(arbitraryAccount, blacklisterAccount),
    await token.allowance(arbitraryAccount, tokenOwnerAccount),
    await token.allowance(arbitraryAccount, arbitraryAccount),
    await token.allowance(arbitraryAccount, upgraderAccount),
    await token.allowance(masterMinterAccount, arbitraryAccount),
    await token.allowance(masterMinterAccount, minterAccount),
    await token.allowance(masterMinterAccount, pauserAccount),
    await token.allowance(masterMinterAccount, blacklisterAccount),
    await token.allowance(masterMinterAccount, tokenOwnerAccount),
    await token.allowance(masterMinterAccount, masterMinterAccount),
    await token.allowance(masterMinterAccount, upgraderAccount),
    await token.allowance(minterAccount, arbitraryAccount),
    await token.allowance(minterAccount, masterMinterAccount),
    await token.allowance(minterAccount, pauserAccount),
    await token.allowance(minterAccount, blacklisterAccount),
    await token.allowance(minterAccount, tokenOwnerAccount),
    await token.allowance(minterAccount, minterAccount),
    await token.allowance(minterAccount, upgraderAccount),
    await token.allowance(pauserAccount, arbitraryAccount),
    await token.allowance(pauserAccount, masterMinterAccount),
    await token.allowance(pauserAccount, minterAccount),
    await token.allowance(pauserAccount, blacklisterAccount),
    await token.allowance(pauserAccount, tokenOwnerAccount),
    await token.allowance(pauserAccount, pauserAccount),
    await token.allowance(pauserAccount, upgraderAccount),
    await token.allowance(blacklisterAccount, arbitraryAccount),
    await token.allowance(blacklisterAccount, masterMinterAccount),
    await token.allowance(blacklisterAccount, minterAccount),
    await token.allowance(blacklisterAccount, pauserAccount),
    await token.allowance(blacklisterAccount, tokenOwnerAccount),
    await token.allowance(blacklisterAccount, blacklisterAccount),
    await token.allowance(blacklisterAccount, upgraderAccount),
    await token.allowance(tokenOwnerAccount, arbitraryAccount),
    await token.allowance(tokenOwnerAccount, masterMinterAccount),
    await token.allowance(tokenOwnerAccount, minterAccount),
    await token.allowance(tokenOwnerAccount, pauserAccount),
    await token.allowance(tokenOwnerAccount, blacklisterAccount),
    await token.allowance(tokenOwnerAccount, tokenOwnerAccount),
    await token.allowance(tokenOwnerAccount, upgraderAccount),
    await token.allowance(upgraderAccount, arbitraryAccount),
    await token.allowance(upgraderAccount, masterMinterAccount),
    await token.allowance(upgraderAccount, minterAccount),
    await token.allowance(upgraderAccount, pauserAccount),
    await token.allowance(upgraderAccount, blacklisterAccount),
    await token.allowance(upgraderAccount, tokenOwnerAccount),
    await token.allowance(upgraderAccount, upgraderAccount),
    await token.totalSupply(),
    await token.isBlacklisted(arbitraryAccount),
    await token.isBlacklisted(masterMinterAccount),
    await token.isBlacklisted(minterAccount),
    await token.isBlacklisted(pauserAccount),
    await token.isBlacklisted(blacklisterAccount),
    await token.isBlacklisted(tokenOwnerAccount),
    await token.isBlacklisted(upgraderAccount),
    await token.isMinter(arbitraryAccount),
    await token.isMinter(masterMinterAccount),
    await token.isMinter(minterAccount),
    await token.isMinter(pauserAccount),
    await token.isMinter(blacklisterAccount),
    await token.isMinter(tokenOwnerAccount),
    await token.isMinter(upgraderAccount),
    await token.minterAllowance(arbitraryAccount),
    await token.minterAllowance(masterMinterAccount),
    await token.minterAllowance(minterAccount),
    await token.minterAllowance(pauserAccount),
    await token.minterAllowance(blacklisterAccount),
    await token.minterAllowance(tokenOwnerAccount),
    await token.minterAllowance(upgraderAccount),
    await token.paused(),
  ]).spread(
    (
      name,
      symbol,
      currency,
      decimals,
      masterMinter,
      pauser,
      blacklister,
      tokenOwner,
      proxiedTokenAddress,
      upgrader,
      initializedV1,
      balancesA,
      balancesMM,
      balancesM,
      balancesP,
      balancesB,
      balancesRAC,
      balancesU,
      allowanceAtoMM,
      allowanceAtoM,
      allowanceAtoP,
      allowanceAtoB,
      allowanceAtoRAC,
      allowanceAtoA,
      allowanceAtoU,
      allowanceMMtoA,
      allowanceMMtoM,
      allowanceMMtoP,
      allowanceMMtoB,
      allowanceMMtoRAC,
      allowanceMMtoMM,
      allowanceMMtoU,
      allowanceMtoA,
      allowanceMtoMM,
      allowanceMtoP,
      allowanceMtoB,
      allowanceMtoRAC,
      allowanceMtoM,
      allowanceMtoU,
      allowancePtoA,
      allowancePtoMM,
      allowancePtoM,
      allowancePtoB,
      allowancePtoRAC,
      allowancePtoP,
      allowancePtoU,
      allowanceBtoA,
      allowanceBtoMM,
      allowanceBtoM,
      allowanceBtoP,
      allowanceBtoRAC,
      allowanceBtoB,
      allowanceBtoU,
      allowanceRACtoA,
      allowanceRACtoMM,
      allowanceRACtoM,
      allowanceRACtoP,
      allowanceRACtoB,
      allowanceRACtoRAC,
      allowanceRACtoU,
      allowanceUtoA,
      allowanceUtoMM,
      allowanceUtoM,
      allowanceUtoP,
      allowanceUtoB,
      allowanceUtoRAC,
      allowanceUtoU,
      totalSupply,
      isAccountBlacklistedA,
      isAccountBlacklistedMM,
      isAccountBlacklistedM,
      isAccountBlacklistedP,
      isAccountBlacklistedB,
      isAccountBlacklistedRAC,
      isAccountBlacklistedU,
      isAccountMinterA,
      isAccountMinterMM,
      isAccountMinterM,
      isAccountMinterP,
      isAccountMinterB,
      isAccountMinterRAC,
      isAccountMinterU,
      minterAllowanceA,
      minterAllowanceMM,
      minterAllowanceM,
      minterAllowanceP,
      minterAllowanceB,
      minterAllowanceRAC,
      minterAllowanceU,
      paused
    ) => {
      const actualState = {
        name,
        symbol,
        currency,
        decimals,
        masterMinter: hexToAddress(masterMinter),
        pauser: hexToAddress(pauser),
        blacklister: hexToAddress(blacklister),
        tokenOwner: hexToAddress(tokenOwner),
        proxiedTokenAddress: hexToAddress(proxiedTokenAddress),
        upgrader: hexToAddress(upgrader),
        initializedV1,
        balanceAndBlacklistStates: {
          arbitraryAccount: balancesA,
          masterMinterAccount: balancesMM,
          minterAccount: balancesM,
          pauserAccount: balancesP,
          blacklisterAccount: balancesB,
          tokenOwnerAccount: balancesRAC,
          upgraderAccount: balancesU,
        },
        allowance: {
          arbitraryAccount: {
            masterMinterAccount: allowanceAtoMM,
            minterAccount: allowanceAtoM,
            pauserAccount: allowanceAtoP,
            blacklisterAccount: allowanceAtoB,
            tokenOwnerAccount: allowanceAtoRAC,
            arbitraryAccount: allowanceAtoA,
            upgraderAccount: allowanceAtoU,
          },
          masterMinterAccount: {
            arbitraryAccount: allowanceMMtoA,
            minterAccount: allowanceMMtoM,
            pauserAccount: allowanceMMtoP,
            blacklisterAccount: allowanceMMtoB,
            tokenOwnerAccount: allowanceMMtoRAC,
            masterMinterAccount: allowanceMMtoMM,
            upgraderAccount: allowanceMMtoU,
          },
          minterAccount: {
            arbitraryAccount: allowanceMtoA,
            masterMinterAccount: allowanceMtoMM,
            pauserAccount: allowanceMtoP,
            blacklisterAccount: allowanceMtoB,
            tokenOwnerAccount: allowanceMtoRAC,
            minterAccount: allowanceMtoM,
            upgraderAccount: allowanceMtoU,
          },
          pauserAccount: {
            arbitraryAccount: allowancePtoA,
            masterMinterAccount: allowancePtoMM,
            minterAccount: allowancePtoM,
            blacklisterAccount: allowancePtoB,
            tokenOwnerAccount: allowancePtoRAC,
            pauserAccount: allowancePtoP,
            upgraderAccount: allowancePtoU,
          },
          blacklisterAccount: {
            arbitraryAccount: allowanceBtoA,
            masterMinterAccount: allowanceBtoMM,
            minterAccount: allowanceBtoM,
            pauserAccount: allowanceBtoP,
            tokenOwnerAccount: allowanceBtoRAC,
            blacklisterAccount: allowanceBtoB,
            upgraderAccount: allowanceBtoU,
          },
          tokenOwnerAccount: {
            arbitraryAccount: allowanceRACtoA,
            masterMinterAccount: allowanceRACtoMM,
            minterAccount: allowanceRACtoM,
            pauserAccount: allowanceRACtoP,
            blacklisterAccount: allowanceRACtoB,
            tokenOwnerAccount: allowanceRACtoRAC,
            upgraderAccount: allowanceRACtoU,
          },
          upgraderAccount: {
            arbitraryAccount: allowanceUtoA,
            masterMinterAccount: allowanceUtoMM,
            minterAccount: allowanceUtoM,
            pauserAccount: allowanceUtoP,
            blacklisterAccount: allowanceUtoB,
            tokenOwnerAccount: allowanceUtoRAC,
            upgraderAccount: allowanceUtoU,
          },
        },
        totalSupply,
        isAccountBlacklisted: {
          arbitraryAccount: isAccountBlacklistedA,
          masterMinterAccount: isAccountBlacklistedMM,
          minterAccount: isAccountBlacklistedM,
          pauserAccount: isAccountBlacklistedP,
          blacklisterAccount: isAccountBlacklistedB,
          tokenOwnerAccount: isAccountBlacklistedRAC,
          upgraderAccount: isAccountBlacklistedU,
        },
        isAccountMinter: {
          arbitraryAccount: isAccountMinterA,
          masterMinterAccount: isAccountMinterMM,
          minterAccount: isAccountMinterM,
          pauserAccount: isAccountMinterP,
          blacklisterAccount: isAccountMinterB,
          tokenOwnerAccount: isAccountMinterRAC,
          upgraderAccount: isAccountMinterU,
        },
        minterAllowance: {
          arbitraryAccount: minterAllowanceA,
          masterMinterAccount: minterAllowanceMM,
          minterAccount: minterAllowanceM,
          pauserAccount: minterAllowanceP,
          blacklisterAccount: minterAllowanceB,
          tokenOwnerAccount: minterAllowanceRAC,
          upgraderAccount: minterAllowanceU,
        },
        paused,
      };
      return actualState;
    }
  );
}

async function initializeTokenWithProxy(rawToken) {
  return customInitializeTokenWithProxy(
    rawToken,
    masterMinterAccount,
    pauserAccount,
    blacklisterAccount,
    tokenOwnerAccount
  );
}

async function customInitializeTokenWithProxy(
  rawToken,
  _masterMinter,
  _pauser,
  _blacklister,
  _owner
) {
  const proxy = await FiatTokenProxy.new(rawToken.address, {
    from: proxyOwnerAccount,
  });
  const proxiedToken = await FiatTokenV1.at(proxy.address);
  await proxiedToken.initialize(
    name,
    symbol,
    currency,
    decimals,
    _masterMinter,
    _pauser,
    _blacklister,
    _owner
  );
  proxiedToken.proxiedTokenAddress = rawToken.address;
  assert.strictEqual(proxiedToken.address, proxy.address);
  assert.notEqual(proxiedToken.address, rawToken.address);
  const tokenConfig = {
    proxy,
    token: proxiedToken,
  };
  return tokenConfig;
}

async function expectRevert(contractPromise) {
  try {
    await contractPromise;
  } catch (error) {
    assert.isTrue(
      error.message.includes("revert"),
      "Expected error of type revert, got '" + error + "' instead"
    );
    return;
  }
  assert.fail("Expected error of type revert, but no error was received");
}

async function getAdmin(proxy) {
  const adm = await web3.eth.getStorageAt(proxy.address, adminSlot);
  return web3.utils.toChecksumAddress("0x" + adm.slice(26));
}

async function getImplementation(proxy) {
  const impl = await web3.eth.getStorageAt(proxy.address, implSlot);
  return web3.utils.toChecksumAddress("0x" + impl.slice(26));
}

async function getInitializedV1(token) {
  const slot8Data = await web3.eth.getStorageAt(token.address, 8);
  let initialized;

  if (slot8Data === ZERO_BYTES32) {
    // validate proxy not yet initialized
    for (let i = 0; i <= 20; i++) {
      assert.strictEqual(
        ZERO_BYTES32,
        await web3.eth.getStorageAt(token.address, i)
      );
    }
    initialized = ZERO_BYTES32;
  } else {
    if (slot8Data.length !== 66) {
      assert.fail("slot8Data unexpected size");
    }
    // String layout
    // 2 chars - 0x
    // 22 zeroes chars
    // 2 chars - initialized (bool)
    // 40 chars - masterMinter (address)
    initialized = "0x" + slot8Data.slice(24, 26);
    const masterMinterAddress = web3.utils.toChecksumAddress(
      "0x" + slot8Data.slice(26)
    );
    const expectedMasterMinterAddress = await token.masterMinter.call();
    assert.strictEqual(masterMinterAddress, expectedMasterMinterAddress);
  }
  return initialized;
}

// _contracts is an array of exactly two values: a FiatTokenV1 and a MintController
// _customVars is an array of exactly two values: the expected state of the FiatTokenV1
// and the expected state of the MintController
async function checkMINTp0(_contracts, _customVars) {
  assert.equal(_contracts.length, 2);
  assert.equal(_customVars.length, 2);

  // the first is a FiatTokenV1
  await checkVariables([_contracts[0]], [_customVars[0]]);

  // the second is a MintController
  await _customVars[1].checkState(_contracts[1]);
}

module.exports = {
  bigZero,
  checkMINTp0,
  expectRevert,
  expectError,
  initializeTokenWithProxy,
  newBigNumber,
};
