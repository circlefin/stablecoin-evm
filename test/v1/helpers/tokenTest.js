/**
 * Copyright 2023 Circle Internet Group, Inc. All rights reserved.
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
const abi = require("ethereumjs-abi");
const _ = require("lodash");
const BN = require("bn.js");
const BigNumber = require("bignumber.js");
const Q = require("q");

const {
  accounts,
  accountPrivateKeys,
  ZERO_ADDRESS,
  ZERO_BYTES32,
} = require("../../helpers/constants");
const { linkLibraryToTokenContract } = require("../../helpers");

const FiatTokenV1 = artifacts.require("FiatTokenV1");
const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");
const UpgradedFiatTokenNewFields = artifacts.require(
  "UpgradedFiatTokenNewFieldsTest"
);
const UpgradedFiatTokenV2_2NewFields = artifacts.require(
  "UpgradedFiatTokenV2_2NewFieldsTest"
);
const UpgradedFiatTokenNewFieldsNewLogic = artifacts.require(
  "UpgradedFiatTokenNewFieldsNewLogicTest"
);
const FiatTokenProxy = artifacts.require("FiatTokenProxy");

const name = "Sample Fiat Token";
const symbol = "C-USD";
const currency = "USD";
const decimals = 2;
const trueInStorageFormat = "0x01";
const bigZero = new BN(0);
const bigHundred = new BN(100);

const {
  deployerAccount,
  arbitraryAccount,
  tokenOwnerAccount,
  blacklisterAccount,
  arbitraryAccount2,
  masterMinterAccount,
  minterAccount,
  pauserAccount,
  proxyOwnerAccount,
  rescuerAccount,
  lostAndFoundAccount,
} = accounts;
const {
  deployerAccount: deployerAccountPrivateKey,
  arbitraryAccount: arbitraryAccountPrivateKey,
  tokenOwnerAccount: tokenOwnerPrivateKey,
  blacklisterAccount: blacklisterAccountPrivateKey,
  arbitraryAccount2: arbitraryAccount2PrivateKey,
  masterMinterAccount: masterMinterAccountPrivateKey,
  minterAccount: minterAccountPrivateKey,
  pauserAccount: pauserAccountPrivateKey,
  proxyOwnerAccount: proxyOwnerAccountPrivateKey,
  rescuerAccount: rescuerAccountPrivateKey,
  lostAndFoundAccount: lostAndFoundAccountPrivateKey,
} = accountPrivateKeys;
const upgraderAccount = proxyOwnerAccount;
const upgraderAccountPrivateKey = proxyOwnerAccountPrivateKey;

const adminSlot =
  "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b";
const implSlot =
  "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3";

// set to true to enable verbose logging in the tests
const debugLogging = false;

function calculateFeeAmount(amount, fee, feeBase) {
  return Math.floor((fee / feeBase) * amount);
}

function checkMinterConfiguredEvent(
  configureMinterEvent,
  minter,
  minterAllowedAmount
) {
  assert.strictEqual(configureMinterEvent.logs[0].event, "MinterConfigured");
  assert.strictEqual(configureMinterEvent.logs[0].args.minter, minter);
  assert.isTrue(
    configureMinterEvent.logs[0].args.minterAllowedAmount.eq(
      new BN(minterAllowedAmount)
    )
  );
}

function checkMinterRemovedEvent(minterRemovedEvent, minter) {
  assert.strictEqual(minterRemovedEvent.logs[0].event, "MinterRemoved");
  assert.strictEqual(minterRemovedEvent.logs[0].args.oldMinter, minter);
}

function checkTransferEvents(transferEvent, from, to, value) {
  assert.strictEqual(transferEvent.logs[0].event, "Transfer");
  assert.strictEqual(transferEvent.logs[0].args.from, from);
  assert.strictEqual(transferEvent.logs[0].args.to, to);
  assert.isTrue(transferEvent.logs[0].args.value.eq(new BN(value)));
}

function checkApprovalEvent(approvalEvent, approver, spender, value) {
  assert.strictEqual(approvalEvent.logs[0].event, "Approval");
  assert.strictEqual(approvalEvent.logs[0].args.owner, approver);
  assert.strictEqual(approvalEvent.logs[0].args.spender, spender);
  assert.isTrue(approvalEvent.logs[0].args.value.eq(new BN(value)));
}

function checkBurnEvent(burnEvent, burner, amount) {
  assert.strictEqual(burnEvent.logs[0].event, "Burn");
  assert.strictEqual(burnEvent.logs[0].args.burner, burner);
  assert.isTrue(burnEvent.logs[0].args.amount.eq(new BN(amount)));
}

function checkBlacklistEvent(blacklistEvent, account) {
  assert.strictEqual(blacklistEvent.logs[0].event, "Blacklisted");
  assert.strictEqual(blacklistEvent.logs[0].args._account, account);
}

function checkUnblacklistEvent(unblacklistEvent, account) {
  assert.strictEqual(unblacklistEvent.logs[0].event, "UnBlacklisted");
  assert.strictEqual(unblacklistEvent.logs[0].args._account, account);
}

function checkBlacklisterChangedEvent(blacklisterChangedEvent, blacklister) {
  assert.strictEqual(
    blacklisterChangedEvent.logs[0].event,
    "BlacklisterChanged"
  );
  assert.strictEqual(
    blacklisterChangedEvent.logs[0].args.newBlacklister,
    blacklister
  );
}

function checkPauserChangedEvent(pauserChangedEvent, pauser) {
  assert.strictEqual(pauserChangedEvent.logs[0].event, "PauserChanged");
  assert.strictEqual(pauserChangedEvent.logs[0].args.newAddress, pauser);
}

function checkTransferOwnershipEvent(
  transferOwnershipEvent,
  previousOwner,
  newOwner
) {
  assert.strictEqual(
    transferOwnershipEvent.logs[0].event,
    "OwnershipTransferred"
  );
  assert.strictEqual(
    transferOwnershipEvent.logs[0].args.previousOwner,
    previousOwner
  );
  assert.strictEqual(transferOwnershipEvent.logs[0].args.newOwner, newOwner);
}

function checkUpdateMasterMinterEvent(updateMasterMinter, newMasterMinter) {
  assert.strictEqual(updateMasterMinter.logs[0].event, "MasterMinterChanged");
  assert.strictEqual(
    updateMasterMinter.logs[0].args.newMasterMinter,
    newMasterMinter
  );
}

function checkAdminChangedEvent(adminChangedEvent, previousAdmin, newAdmin) {
  assert.strictEqual(adminChangedEvent.logs[0].event, "AdminChanged");
  assert.strictEqual(
    adminChangedEvent.logs[0].args.previousAdmin,
    previousAdmin
  );
  assert.strictEqual(adminChangedEvent.logs[0].args.newAdmin, newAdmin);
}

function checkUpgradeEvent(upgradeEvent, implementation) {
  assert.strictEqual(upgradeEvent.logs[0].event, "Upgraded");
  assert.strictEqual(upgradeEvent.logs[0].args.implementation, implementation);
}

function checkPauseEvent(pause) {
  assert.strictEqual(pause.logs[0].event, "Pause");
}

function checkUnpauseEvent(unpause) {
  assert.strictEqual(unpause.logs[0].event, "Unpause");
}

function checkMintEvent(minting, to, amount, minter) {
  // Mint Event
  assert.strictEqual(minting.logs[0].event, "Mint");
  assert.strictEqual(minting.logs[0].args.minter, minter);
  assert.strictEqual(minting.logs[0].args.to, to);
  assert.isTrue(minting.logs[0].args.amount.eq(new BN(amount)));

  // Transfer from 0 Event
  assert.strictEqual(minting.logs[1].event, "Transfer");
  assert.strictEqual(minting.logs[1].args.from, ZERO_ADDRESS);
  assert.strictEqual(minting.logs[1].args.to, to);
  assert.isTrue(minting.logs[1].args.value.eq(new BN(amount)));
}

function checkBurnEvents(burning, amount, burner) {
  // Burn Event
  assert.strictEqual(burning.logs[0].event, "Burn");
  assert.strictEqual(burning.logs[0].args.burner, burner);
  assert.isTrue(burning.logs[0].args.amount.eq(new BN(amount)));

  // Transfer to 0 Event
  assert.strictEqual(burning.logs[1].event, "Transfer");
  assert.strictEqual(burning.logs[1].args.from, burner);
  assert.strictEqual(burning.logs[1].args.to, ZERO_ADDRESS);
  assert.isTrue(burning.logs[1].args.value.eq(new BN(amount)));
}

/**
 * Creates a state object, with default values replaced
 * by customVars where appropriate.
 */
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

/**
 *  BN-aware deep comparison
 */
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

/**
 * For testing variance of specific variables from their default values
 *
 * @param _tokens is an array of tokens
 * @param _customVars is an array of objects of the form,
 * {'variable': <name of variable>, 'expectedValue': <expected value after modification>}
 *
 * To reference nested variables, name variable using dot syntax, e.g. 'allowance.arbitraryAccount.minterAccount'
 */
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

/**
 * Build up actualState object to compare to expectedState object
 */
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

async function setMinter(token, minter, amount) {
  const update = await token.configureMinter(minter, amount, {
    from: masterMinterAccount,
  });
  assert.strictEqual(update.logs[0].event, "MinterConfigured");
  assert.strictEqual(update.logs[0].args.minter, minter);
  assert.isTrue(update.logs[0].args.minterAllowedAmount.eq(new BN(amount)));
  const minterAllowance = await token.minterAllowance(minter);

  assert.isTrue(minterAllowance.eq(new BN(amount)));
}

async function burn(token, amount, burner) {
  const burning = await token.burn(amount, { from: burner });
  checkBurnEvents(burning, amount, burner);
}

async function mint(token, to, amount, minter) {
  await setMinter(token, minter, amount);
  await mintRaw(token, to, amount, minter);
}

async function mintRaw(token, to, amount, minter) {
  const initialTotalSupply = await token.totalSupply();
  const initialMinterAllowance = await token.minterAllowance(minter);
  const minting = await token.mint(to, amount, { from: minter });
  checkMintEvent(minting, to, amount, minter);

  const totalSupply = await token.totalSupply();
  assert.isTrue(totalSupply.eq(initialTotalSupply.add(new BN(amount))));
  const minterAllowance = await token.minterAllowance(minter);
  assert.isTrue(initialMinterAllowance.sub(new BN(amount)).eq(minterAllowance));
}

async function blacklist(token, account) {
  const blacklist = await token.blacklist(account, {
    from: blacklisterAccount,
  });
  checkBlacklistEvent(blacklist, account);
}

async function unBlacklist(token, account) {
  const unblacklist = await token.unBlacklist(account, {
    from: blacklisterAccount,
  });
  checkUnblacklistEvent(unblacklist, account);
}

async function sampleTransfer(token, ownerAccount, arbitraryAccount, minter) {
  let allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
  assert.isTrue(new BN(allowed).eqn(0));
  await mint(token, ownerAccount, 1900, minter);

  await token.approve(arbitraryAccount, 1500, { from: ownerAccount });
  allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
  assert.isTrue(new BN(allowed).eqn(1500));

  const transfer = await token.transfer(arbitraryAccount, 1000, {
    from: ownerAccount,
  });

  checkTransferEvents(transfer, ownerAccount, arbitraryAccount, 1000);

  const balance0 = await token.balanceOf(ownerAccount);
  assert.isTrue(balance0.eqn(1900 - 1000));
  const balance3 = await token.balanceOf(arbitraryAccount);
  assert.isTrue(balance3.eqn(1000));
}

async function sampleTransferFrom(
  token,
  ownerAccount,
  arbitraryAccount,
  minter
) {
  let allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
  assert.isTrue(new BN(allowed).eqn(0));
  await mint(token, ownerAccount, 900, minter);
  await token.approve(arbitraryAccount, 634, { from: ownerAccount });
  allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
  assert.isTrue(new BN(allowed).eqn(634));

  const transfer = await token.transferFrom(
    ownerAccount,
    arbitraryAccount,
    534,
    { from: arbitraryAccount }
  );

  checkTransferEvents(transfer, ownerAccount, arbitraryAccount, 534);

  const balance0 = await token.balanceOf(ownerAccount);
  assert.isTrue(new BN(balance0).eqn(900 - 534));
  const balance3 = await token.balanceOf(arbitraryAccount);
  assert.isTrue(new BN(balance3).eqn(534));
}

async function approve(token, to, amount, from) {
  await token.approve(to, amount, { from });
}

async function redeem(token, account, amount) {
  const redeemResult = await token.redeem(amount, { from: account });
  assert.strictEqual(redeemResult.logs[0].event, "Redeem");
  assert.strictEqual(redeemResult.logs[0].args.redeemedAddress, account);
  assert.isTrue(redeemResult.logs[0].args.amount.eq(new BN(amount)));
}

function validateTransferEvent(transferEvent, from, to, value) {
  const eventResult = transferEvent.logs[0];
  assert.strictEqual(eventResult.event, "Transfer");
  assert.strictEqual(eventResult.args.from, from);
  assert.strictEqual(eventResult.args.to, to);
  assert.isTrue(eventResult.args.value.eq(new BN(value)));
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

async function upgradeTo(proxy, upgradedToken, proxyUpgraderAccount) {
  if (proxyUpgraderAccount == null) {
    proxyUpgraderAccount = proxyOwnerAccount;
  }
  await proxy.upgradeTo(upgradedToken.address, { from: proxyUpgraderAccount });
  const proxiedToken = await FiatTokenV1.at(proxy.address);
  assert.strictEqual(proxiedToken.address, proxy.address);
  return {
    proxy,
    token: proxiedToken,
  };
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

function encodeCall(name, args, values) {
  const methodId = abi.methodID(name, args).toString("hex");
  const params = abi.rawEncode(args, values).toString("hex");
  return "0x" + methodId + params;
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

async function deployUpgradedFiatToken(version) {
  if (version < 2.2) {
    return FiatTokenV1.new();
  } else {
    await linkLibraryToTokenContract(FiatTokenV2_2);
    return FiatTokenV2_2.new();
  }
}

async function deployUpgradedFiatTokenNewFields(version) {
  if (version < 2.2) {
    return UpgradedFiatTokenNewFields.new();
  } else {
    await linkLibraryToTokenContract(UpgradedFiatTokenV2_2NewFields);
    return UpgradedFiatTokenV2_2NewFields.new();
  }
}

/**
 * Returns a new BN object
 */
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

/**
 * Check to ensure correct format of the two inputs
 *
 * @param _contracts is an array of exactly two values: a FiatTokenV1 and a MintController
 * @param _customVars is an array of exactly two values: the expected state of the FiatTokenV1
 * and the expected state of the MintController
 */
async function checkMINTp0(_contracts, _customVars) {
  assert.equal(_contracts.length, 2);
  assert.equal(_customVars.length, 2);

  // the first is a FiatTokenV1
  await checkVariables([_contracts[0]], [_customVars[0]]);

  // the second is a MintController
  await _customVars[1].checkState(_contracts[1]);
}

module.exports = {
  FiatTokenV1,
  FiatTokenProxy,
  UpgradedFiatTokenNewFields,
  UpgradedFiatTokenNewFieldsNewLogic,
  name,
  symbol,
  currency,
  decimals,
  bigZero,
  bigHundred,
  debugLogging,
  newBigNumber,
  checkMINTp0,
  calculateFeeAmount,
  checkTransferEvents,
  checkMinterConfiguredEvent,
  checkMintEvent,
  checkApprovalEvent,
  checkBurnEvents,
  checkBurnEvent,
  checkMinterRemovedEvent,
  checkBlacklistEvent,
  checkUnblacklistEvent,
  checkPauseEvent,
  checkUnpauseEvent,
  checkPauserChangedEvent,
  checkTransferOwnershipEvent,
  checkUpdateMasterMinterEvent,
  checkBlacklisterChangedEvent,
  checkUpgradeEvent,
  checkAdminChangedEvent,
  buildExpectedState,
  checkVariables,
  setMinter,
  deployUpgradedFiatToken,
  deployUpgradedFiatTokenNewFields,
  mint,
  burn,
  mintRaw,
  blacklist,
  unBlacklist,
  sampleTransfer,
  sampleTransferFrom,
  approve,
  redeem,
  validateTransferEvent,
  initializeTokenWithProxy,
  customInitializeTokenWithProxy,
  upgradeTo,
  expectRevert,
  expectError,
  encodeCall,
  getInitializedV1,
  nullAccount: ZERO_ADDRESS,
  deployerAccount,
  arbitraryAccount,
  tokenOwnerAccount,
  arbitraryAccount2,
  masterMinterAccount,
  minterAccount,
  pauserAccount,
  rescuerAccount,
  lostAndFoundAccount,
  blacklisterAccount,
  proxyOwnerAccount,
  proxyOwnerAccountPrivateKey,
  upgraderAccount,
  getAdmin,
  arbitraryAccountPrivateKey,
  upgraderAccountPrivateKey,
  tokenOwnerPrivateKey,
  blacklisterAccountPrivateKey,
  arbitraryAccount2PrivateKey,
  masterMinterAccountPrivateKey,
  minterAccountPrivateKey,
  pauserAccountPrivateKey,
  deployerAccountPrivateKey,
  rescuerAccountPrivateKey,
  lostAndFoundAccountPrivateKey,
};
