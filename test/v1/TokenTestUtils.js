const util = require("util");
const _ = require("lodash");
const BN = require("bn.js");
const Q = require("q");
const BigNumber = require("bignumber.js");

const FiatTokenV1 = artifacts.require("FiatTokenV1");
const UpgradedFiatToken = artifacts.require("UpgradedFiatToken");
const UpgradedFiatTokenNewFields = artifacts.require(
  "UpgradedFiatTokenNewFieldsTest"
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
const maxAmount =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const nullAccount = "0x0000000000000000000000000000000000000000";
const deployerAccount = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"; // accounts[0]
const arbitraryAccount = "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0"; // accounts[1]
const tokenOwnerAccount = "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d"; // accounts[3]
const blacklisterAccount = "0xd03ea8624C8C5987235048901fB614fDcA89b117"; // accounts[4]
const arbitraryAccount2 = "0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC"; // accounts[5]
const masterMinterAccount = "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9"; // accounts[6]
const minterAccount = "0x28a8746e75304c0780E011BEd21C72cD78cd535E"; // accounts[7]
const pauserAccount = "0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E"; // accounts[8]

const proxyOwnerAccount = "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598"; // accounts[14]
const upgraderAccount = proxyOwnerAccount; // accounts[14]

const deployerAccountPrivateKey =
  "4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"; // accounts[0]
const arbitraryAccountPrivateKey =
  "6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1"; // accounts[1];
const tokenOwnerPrivateKey =
  "646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913"; // accounts[3]
const blacklisterAccountPrivateKey =
  "add53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743"; // accounts[4]
const arbitraryAccount2PrivateKey =
  "395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd"; // accounts[5]
const masterMinterAccountPrivateKey =
  "e485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52"; // accounts[6]
const minterAccountPrivateKey =
  "a453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3"; // accounts[7]
const pauserAccountPrivateKey =
  "829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4"; // accounts[9]
const proxyOwnerAccountPrivateKey =
  "21d7212f3b4e5332fd465877b64926e3532653e2798a11255a46f533852dfe46"; // accounts[14]
const upgraderAccountPrivateKey = proxyOwnerAccountPrivateKey;
// var blacklisterAccountPrivateKey = "b0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773"; // accounts[9]

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

function checkBlacklistEvent(blacklistEvent, account) {
  assert.strictEqual(blacklistEvent.logs[0].event, "Blacklisted");
  assert.strictEqual(blacklistEvent.logs[0].args._account, account);
}

function checkUnblacklistEvent(unblacklistEvent, account) {
  assert.strictEqual(unblacklistEvent.logs[0].event, "UnBlacklisted");
  assert.strictEqual(unblacklistEvent.logs[0].args._account, account);
}

function checkMintEvent(minting, to, amount, minter) {
  // Mint Event
  assert.strictEqual(minting.logs[0].event, "Mint");
  assert.strictEqual(minting.logs[0].args.minter, minter);
  assert.strictEqual(minting.logs[0].args.to, to);
  assert.isTrue(minting.logs[0].args.amount.eq(new BN(amount)));

  // Transfer from 0 Event
  assert.strictEqual(minting.logs[1].event, "Transfer");
  assert.strictEqual(minting.logs[1].args.from, nullAccount);
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
  assert.strictEqual(burning.logs[1].args.to, nullAccount);
  assert.isTrue(burning.logs[1].args.value.eq(new BN(amount)));
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
    balances: {
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
      // TODO: test the error
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
        balances: {
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

async function approve(token, to, amount, from) {
  await token.approve(to, amount, { from });
}

async function redeem(token, account, amount) {
  const redeemResult = await token.redeem(amount, { from: account });
  assert.strictEqual(redeemResult.logs[0].event, "Redeem");
  assert.strictEqual(redeemResult.logs[0].args.redeemedAddress, account);
  assert.isTrue(redeemResult.logs[0].args.amount.eq(new BN(amount)));
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

async function getAdmin(proxy) {
  const adm = await web3.eth.getStorageAt(proxy.address, adminSlot);
  return web3.utils.toChecksumAddress("0x" + adm.slice(2).padStart(40, "0"));
}

async function getImplementation(proxy) {
  const impl = await web3.eth.getStorageAt(proxy.address, implSlot);
  return web3.utils.toChecksumAddress("0x" + impl.slice(2).padStart(40, "0"));
}

async function getInitializedV1(token) {
  const slot8Data = await web3.eth.getStorageAt(token.address, 8);
  let initialized;

  if (slot8Data === "0x0") {
    // validate proxy not yet initialized
    for (let i = 0; i <= 20; i++) {
      assert.strictEqual("0x0", await web3.eth.getStorageAt(token.address, i));
    }
    initialized = "0x00";
  } else {
    const slot8DataPadded = slot8Data.slice(2).padStart(42, "0");
    if (slot8DataPadded.length !== 42) {
      assert.fail("slot8Data unexpected size");
    }
    const masterMinterAddress = await token.masterMinter.call();
    assert.isTrue(
      slot8DataPadded.indexOf(masterMinterAddress.slice(2).toLowerCase()) === 2
    );

    initialized = "0x" + slot8DataPadded.slice(0, 2);
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
  FiatTokenV1,
  FiatTokenProxy,
  UpgradedFiatToken,
  UpgradedFiatTokenNewFields,
  UpgradedFiatTokenNewFieldsNewLogic,
  name,
  symbol,
  currency,
  decimals,
  bigZero,
  bigHundred,
  debugLogging,
  maxAmount,
  checkMINTp0,
  mint,
  burn,
  blacklist,
  unBlacklist,
  approve,
  redeem,
  initializeTokenWithProxy,
  upgradeTo,
  expectRevert,
  expectError,
  nullAccount,
  deployerAccount,
  arbitraryAccount,
  tokenOwnerAccount,
  arbitraryAccount2,
  masterMinterAccount,
  minterAccount,
  pauserAccount,
  blacklisterAccount,
  proxyOwnerAccount,
  proxyOwnerAccountPrivateKey,
  upgraderAccount,
  arbitraryAccountPrivateKey,
  upgraderAccountPrivateKey,
  tokenOwnerPrivateKey,
  blacklisterAccountPrivateKey,
  arbitraryAccount2PrivateKey,
  masterMinterAccountPrivateKey,
  minterAccountPrivateKey,
  pauserAccountPrivateKey,
  deployerAccountPrivateKey,
  newBigNumber,
};
