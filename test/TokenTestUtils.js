const util = require('util');
const abi = require('ethereumjs-abi')
var _ = require('lodash');
var clone = require('clone');
var name = 'Sample Fiat Token';
var symbol = 'C-USD';
var currency = 'USD';
var BN = require('bn.js');
var BigNumber = require('bignumber.js');
var trueInStorageFormat = "0x01";
var decimals = newBigNumber(10);
var bigZero = newBigNumber(0);
var zeroAddress = '0x' + bigZero.toString(16, 40);
var bigHundred = newBigNumber(100);
var maxAmount = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;
var Q = require('q');
var FiatToken = artifacts.require('FiatTokenV1');
var UpgradedFiatToken = artifacts.require('FiatTokenV2');
var UpgradedFiatTokenNewFields = artifacts.require('FiatTokenV2NewFieldsTest');
var UpgradedFiatTokenNewFieldsNewLogic = artifacts.require('FiatTokenV2NewFieldsNewLogicTest');
var FiatTokenProxy = artifacts.require('FiatTokenProxy');

var AccountUtils = require('./AccountUtils');
var Accounts = AccountUtils.Accounts;
var setAccountDefault = AccountUtils.setAccountDefault;
var recursiveSetAccountDefault = AccountUtils.recursiveSetAccountDefault;
var checkState = AccountUtils.checkState;
var getAccountState = AccountUtils.getAccountState;
var upperCaseAddress = AccountUtils.upperCaseAddress;

// TODO: test really big numbers  Does this still have to be done??

var adminSlot = "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b";
var implSlot = "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3";

// set to true to enable verbose logging in the tests
var debugLogging = false;

// Returns a new BN object
function newBigNumber(value) {
    var hex = new BigNumber(value).toString(16);
    return new BN(hex, 16);
}


function calculateFeeAmount(amount) {
    return Math.floor((fee / feeBase) * amount);
}

function checkMinterConfiguredEvent(configureMinterEvent, minter, minterAllowedAmount) {
    assert.equal(configureMinterEvent.logs[0].event, 'MinterConfigured')
    assert.equal(upperCaseAddress(configureMinterEvent.logs[0].args.minter), upperCaseAddress(minter));
    assert.equal(configureMinterEvent.logs[0].args.minterAllowedAmount, minterAllowedAmount)
}

function checkMinterRemovedEvent(minterRemovedEvent, minter) {
    assert.equal(minterRemovedEvent.logs[0].event, 'MinterRemoved')
    assert.equal(upperCaseAddress(minterRemovedEvent.logs[0].args.oldMinter), upperCaseAddress(minter));
}

function checkTransferEventsWithFee(transferEvent, from, to, value, feeAmount) {
    assert.equal(transferEvent.logs[0].event, 'Fee');
    assert.equal(transferEvent.logs[0].args.from, from);
    assert.equal(transferEvent.logs[0].args.feeAccount, feeAccount);
    assert.equal(transferEvent.logs[0].args.feeAmount, feeAmount);
    assert.equal(transferEvent.logs[1].event, 'Transfer');
    assert.equal(upperCaseAddress(transferEvent.logs[1].args.from), upperCaseAddress(from));
    assert.equal(upperCaseAddress(transferEvent.logs[1].args.to), upperCaseAddress(to));
    assert.equal(transferEvent.logs[1].args.value, value);
}

function checkTransferEvents(transferEvent, from, to, value) {
    assert.equal(transferEvent.logs[0].event, 'Transfer');
    assert.equal(upperCaseAddress(transferEvent.logs[0].args.from), upperCaseAddress(from));
    assert.equal(upperCaseAddress(transferEvent.logs[0].args.to), upperCaseAddress(to));
    assert.equal(transferEvent.logs[0].args.value, value);
}

function checkApprovalEvent(approvalEvent, approver, spender, value) {
    assert.equal(approvalEvent.logs[0].event, 'Approval');
    assert.equal(upperCaseAddress(approvalEvent.logs[0].args.owner), upperCaseAddress(approver));
    assert.equal(upperCaseAddress(approvalEvent.logs[0].args.spender), upperCaseAddress(spender));
    assert.equal(approvalEvent.logs[0].args.value, value);
}

function checkBurnEvent(burnEvent, burner, amount) {
    assert.equal(burnEvent.logs[0].event, 'Burn');
    assert.equal(upperCaseAddress(burnEvent.logs[0].args.burner), upperCaseAddress(burner));
    assert.equal(upperCaseAddress(burnEvent.logs[0].args.amount), upperCaseAddress(amount));
}

function checkBlacklistEvent(blacklistEvent, account) {
    assert.equal(blacklistEvent.logs[0].event, 'Blacklisted');
    assert.equal(upperCaseAddress(blacklistEvent.logs[0].args._account), upperCaseAddress(account));
}

function checkUnblacklistEvent(unblacklistEvent, account) {
    assert.equal(unblacklistEvent.logs[0].event, 'UnBlacklisted');
    assert.equal(upperCaseAddress(unblacklistEvent.logs[0].args._account), upperCaseAddress(account));
}

function checkBlacklisterChangedEvent(blacklisterChangedEvent, blacklister) {
    assert.equal(blacklisterChangedEvent.logs[0].event, 'BlacklisterChanged');
    assert.equal(upperCaseAddress(blacklisterChangedEvent.logs[0].args.newBlacklister), upperCaseAddress(blacklister));
}

function checkPauserChangedEvent(pauserChangedEvent, pauser) {
    assert.equal(pauserChangedEvent.logs[0].event, 'PauserChanged');
    assert.equal(upperCaseAddress(pauserChangedEvent.logs[0].args.newAddress), upperCaseAddress(pauser));
}

function checkTransferOwnershipEvent(transferOwnershipEvent, previousOwner, newOwner) {
    assert.equal(transferOwnershipEvent.logs[0].event, 'OwnershipTransferred');
    assert.equal(upperCaseAddress(transferOwnershipEvent.logs[0].args.previousOwner), upperCaseAddress(previousOwner))
    assert.equal(upperCaseAddress(transferOwnershipEvent.logs[0].args.newOwner), upperCaseAddress(newOwner));
}

function checkUpdateMasterMinterEvent(checkUpdateMasterMinterEvent, newMasterMinter) {
    assert.equal(checkUpdateMasterMinterEvent.logs[0].event, 'MasterMinterChanged');
    assert.equal(upperCaseAddress(checkUpdateMasterMinterEvent.logs[0].args.newMasterMinter), upperCaseAddress
    (newMasterMinter));
}

function checkAdminChangedEvent(adminChangedEvent, previousAdmin, newAdmin) {
    assert.equal(adminChangedEvent.logs[0].event, 'AdminChanged')
    assert.equal(upperCaseAddress(adminChangedEvent.logs[0].args.previousAdmin), upperCaseAddress(previousAdmin));
    assert.equal(upperCaseAddress(adminChangedEvent.logs[0].args.newAdmin), upperCaseAddress(newAdmin));
}

function checkUpgradeEvent(upgradeEvent, implementation) {
    assert.equal(upgradeEvent.logs[0].event, 'Upgraded');
    assert.equal(upperCaseAddress(upgradeEvent.logs[0].args.implementation), upperCaseAddress(implementation));
}

function checkTransferProxyOwnershipEvent(transferProxyOwnershipEvent, previousOwner, newOwner) {
    assert.equal(transferProxyOwnershipEvent.logs[0].event, 'ProxyOwnershipTransferred');
    assert.equal(upperCaseAddress(transferProxyOwnershipEvent.logs[0].args.previousOwner), upperCaseAddress
    (previousOwner));
    assert.equal(upperCaseAddress(transferProxyOwnershipEvent.logs[0].args.newOwner), upperCaseAddress(newOwner));
}

function checkPauseEvent(pause) {
  assert.equal(pause.logs[0].event, 'Pause');
}

function checkUnpauseEvent(unpause) {
    assert.equal(unpause.logs[0].event, 'Unpause');
}

function checkMintEvent(minting, to, amount, minter) {
    // Mint Event
    assert.equal(minting.logs[0].event, 'Mint');
    assert.equal(upperCaseAddress(minting.logs[0].args.minter), upperCaseAddress(minter));
    assert.equal(upperCaseAddress(minting.logs[0].args.to), upperCaseAddress(to));
    assert.equal(minting.logs[0].args.amount, amount);

    // Transfer from 0 Event
    assert.equal(minting.logs[1].event, 'Transfer');
    assert.equal(upperCaseAddress(minting.logs[1].args.from), upperCaseAddress(zeroAddress));
    assert.equal(upperCaseAddress(minting.logs[1].args.to), upperCaseAddress(to));
    assert.equal(minting.logs[1].args.value, amount);

}

function checkBurnEvents(burning, amount, burner) {
    // Burn Event
    assert.equal(burning.logs[0].event, 'Burn');
    assert.equal(upperCaseAddress(burning.logs[0].args.burner), upperCaseAddress(burner));
    assert.equal(burning.logs[0].args.amount, amount);

    // Transfer to 0 Event
    assert.equal(burning.logs[1].event, 'Transfer');
    assert.equal(upperCaseAddress(burning.logs[1].args.from), upperCaseAddress(burner));
    assert.equal(upperCaseAddress(burning.logs[1].args.to), upperCaseAddress(zeroAddress));
    assert.equal(burning.logs[1].args.value, amount);

}

var fiatTokenEmptyState = {
    "name": name,
    "symbol": symbol,
    "currency": currency,
    "decimals": decimals,
    "masterMinter": Accounts.masterMinterAccount,
    "pauser": Accounts.pauserAccount,
    "blacklister" : Accounts.blacklisterAccount,
    "tokenOwner": Accounts.tokenOwnerAccount,
    "proxiedTokenAddress": bigZero,
    "initializedV1": trueInStorageFormat,
    "proxyOwner": Accounts.proxyOwnerAccount,
    "balances": setAccountDefault(Accounts, bigZero),
    "allowance": recursiveSetAccountDefault(Accounts, bigZero),
    "totalSupply": bigZero,
    "isAccountBlacklisted": setAccountDefault(Accounts, false),
    "isAccountMinter": setAccountDefault(Accounts, false),
    "minterAllowance": setAccountDefault(Accounts, bigZero),
    "paused": false,
};

// Creates a state object, with default values replaced by
// customVars where appropriate.
function buildExpectedState(token, customVars) {
    // for each item in customVars, set the item in expectedState
    var expectedState = clone(fiatTokenEmptyState);
    expectedState.proxiedTokenAddress = upperCaseAddress(token.proxiedTokenAddress);

    var i;
    for (i = 0; i < customVars.length; ++i) {
        if (_.has(expectedState, customVars[i].variable)) {
            if (expectedState[customVars[i].variable] == customVars[i].expectedValue) {
                throw new Error("variable " + customVars[i].variable + " to test has same default state as expected state");
            } else {
                _.set(expectedState, customVars[i].variable, customVars[i].expectedValue);
            }
        } else {
            // TODO: test the error
            throw new Error("variable " + customVars[i].variable + " not found in expectedState");
        }
    }
    return expectedState;
}

// Replaces all BN objects with 32 character hex strings
function mapBNToHex(state) {
    var result = {};
    for (var name in state) {
        if(BN.isBN(state[name])) {
            result[name] = state[name].toString(16,32);
        } else if(typeof state[name] == 'object') {
            result[name] = mapBNToHex(state[name]);
        } else if(typeof state[name] == 'string' && state[name].substring(0,2)=='0x') {
            result[name] = upperCaseAddress(state[name]);
        } else {
            result[name] = state[name];
        }
    }
    return result;
}

// For testing variance of specific variables from their default values.
// customVars is an array of objects of the form,
// {'variable': <name of variable>, 'expectedValue': <expected value after modification>}
// to reference nested variables, name variable using dot syntax, e.g. 'allowance.arbitraryAccount.minterAccount'
async function checkVariables(_tokens, _customVars) {
    // Iterate over array of tokens.
    var numTokens = _tokens.length;
    assert.equal(numTokens, _customVars.length);
    var n;
    for (n = 0; n < numTokens; n++) {
        var token = _tokens[n];
        var customVars = _customVars[n];

        let expectedState = mapBNToHex(buildExpectedState(token, customVars));
        let actualState = mapBNToHex(await getActualState(token));
        if (debugLogging) {
           console.log(util.inspect(expectedState, { showHidden: false, depth: null }))
           console.log(util.inspect(actualState, { showHidden: false, depth: null }))
        }

        assertDiff.deepEqual(actualState, expectedState, "difference between expected and actual state");

        // Check that sum of individual balances equals totalSupply
        var accounts = Object.keys(Accounts).map(accountName => Accounts[accountName]);
        var balanceSum = bigZero;
        var x;
        for (x = 0; x < accounts.length; x++) {
            balanceSum = balanceSum.add(await token.balanceOf(accounts[x]));
        }
        var totalSupply = newBigNumber(await token.totalSupply())
        assert(balanceSum.cmp(totalSupply)==0, "sum of balances is not equal to totalSupply");
    }
}

// All MINT p0 tests will call this function.
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

// build up actualState object to compare to expectedState object
async function getActualState(token) {
    // lambda expressions to get allowance mappings in token contract
    var allowanceMappingEval = async function(account1) {
        var myAllowances = async function(account2) {
            return token.allowance(account1, account2);
        }
        return getAccountState(myAllowances, Accounts);
    };

    return Q.all([
        token.name.call(),
         token.symbol.call(),
         token.currency.call(),
         token.decimals.call(),
         token.masterMinter.call(),
         token.pauser.call(),
         token.blacklister.call(),
         token.owner.call(),
         getImplementation(token),
         getAdmin(token),
         getInitializedV1(token),
         getAccountState(token.balanceOf, Accounts),
         getAccountState(allowanceMappingEval, Accounts),
         token.totalSupply(),
         getAccountState(token.isBlacklisted, Accounts),
         getAccountState(token.isMinter, Accounts),
         getAccountState(token.minterAllowance, Accounts),
         token.paused()
    ]).spread(function (
        name,
        symbol,
        currency,
        decimals,
        masterMinter,
        pauser,
        blacklister,
        tokenOwner,
        proxiedTokenAddress,
        proxyOwner,
        initializedV1,
        balances,
        allowances,
        totalSupply,
        isAccountBlacklisted,
        isAccountMinter,
        minterAllowance,
        paused
    ) {
        var actualState = {
            'name': name,
            'symbol': symbol,
            'currency': currency,
            'decimals': decimals,
            'masterMinter': upperCaseAddress(masterMinter),
            'pauser': upperCaseAddress(pauser),
            'blacklister': upperCaseAddress(blacklister),
            'tokenOwner': upperCaseAddress(tokenOwner),
            'proxiedTokenAddress': upperCaseAddress(proxiedTokenAddress),
            'proxyOwner': upperCaseAddress(proxyOwner),
            'initializedV1': initializedV1,
            'balances': balances,
            'allowance': allowances,
            'totalSupply': totalSupply,
            'isAccountBlacklisted': isAccountBlacklisted,
            'isAccountMinter': isAccountMinter,
            'minterAllowance': minterAllowance,
            'paused': paused
        };
        return actualState;
    })
}

async function setMinter(token, minter, amount) {
    let update = await token.configureMinter(minter, amount, { from: Accounts.masterMinterAccount });
    assert.equal(update.logs[0].event, 'MinterConfigured');
    assert.equal(upperCaseAddress(update.logs[0].args.minter), upperCaseAddress(minter));
    assert.equal(update.logs[0].args.minterAllowedAmount, amount);
    let minterAllowance = await token.minterAllowance(minter);

    assert.equal(minterAllowance, amount);
}

async function burn(token, amount, burner) {
    let burning = await token.burn(amount, { from: burner });
    checkBurnEvents(burning, amount, burner);
}

async function mint(token, to, amount, minter) {
    await setMinter(token, minter, amount);
    await mintRaw(token, to, amount, minter);
}

async function mintRaw(token, to, amount, minter) {
    let initialTotalSupply = await token.totalSupply();
    let initialMinterAllowance = await token.minterAllowance(minter);
    let minting = await token.mint(to, amount, { from: minter });
    checkMintEvent(minting, to, amount, minter);

    // TODO revisit this
    /*  let totalSupply = await token.totalSupply();
      totalSupply.should.be.bignumber.equal(initialTotalSupply);
      let minterAllowance = await token.minterAllowance(minter);
      assert.isTrue(newBigNumber(initialMinterAllowance).minus(newBigNumber(amount)).cmp(newBigNumber(minterAllowance))
      ==0);*/
}

async function blacklist(token, account) {
    let blacklist = await token.blacklist(account, { from: Accounts.blacklisterAccount });
    checkBlacklistEvent(blacklist, account);
}

async function unBlacklist(token, account) {
    let unblacklist = await token.unBlacklist(account, { from: Accounts.blacklisterAccount });
    checkUnblacklistEvent(unblacklist, account);
}

async function setLongDecimalFeesTransferWithFees(token, ownerAccount, arbitraryAccount) {
    fee = 123589;
    feeBase = 1000000;
    await token.updateTransferFee(fee, feeBase);
    let allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
    assert.isTrue(allowed.isZero());
    await mint(token, ownerAccount, 1900);
    let initialBalanceFeeAccount = await token.balanceOf(feeAccount);

    await token.approve(arbitraryAccount, 1500);
    allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
    assert.isTrue(allowed.cmp(newBigNumber(1500))==0);

    let transfer = await token.transfer(arbitraryAccount, 1000, { from: ownerAccount });

    let feeAmount = calculateFeeAmount(1000);
    checkTransferEvents(transfer, ownerAccount, arbitraryAccount, 1000, feeAmount);


    let balance0 = await token.balanceOf(ownerAccount);
    assert.equal(balance0, 1900 - 1000 - feeAmount);
    let balance3 = await token.balanceOf(arbitraryAccount);
    assert.equal(balance3, 1000);
    let balanceFeeAccount = await token.balanceOf(feeAccount);
    assert.isTrue(balanceFeeAccount.sub(initialBalanceFeeAccount).cmp(newBigNumber(feeAmount))==0);
}

async function sampleTransfer(token, ownerAccount, arbitraryAccount, minter) {
    let allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
    assert.isTrue(allowed.isZero());
    await mint(token, ownerAccount, 1900, minter);

    await token.approve(arbitraryAccount, 1500);
    allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
    assert.isTrue(allowed.cmp(newBigNumber(1500))==0);

    let transfer = await token.transfer(arbitraryAccount, 1000, { from: ownerAccount });

    checkTransferEvents(transfer, ownerAccount, arbitraryAccount, 1000);

    let balance0 = await token.balanceOf(ownerAccount);
    assert.equal(balance0, 1900 - 1000);
    let balance3 = await token.balanceOf(arbitraryAccount);
    assert.equal(balance3, 1000);
}

async function transferFromWithFees(token, ownerAccount, arbitraryAccount, minter) {
    fee = 1235;
    feeBase = 10000;
    await token.updateTransferFee(fee, feeBase);
    let allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
    assert.isTrue(allowed.isZero());
    await mint(token, ownerAccount, 900, minter);
    let initialBalanceFeeAccount = await token.balanceOf(feeAccount);
    await token.approve(arbitraryAccount, 634);
    allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
    assert.isTrue(allowed.cmp(newBigNumber(634))==0);

    transfer = await token.transferFrom(ownerAccount, arbitraryAccount, 534, { from: arbitraryAccount });

    let feeAmount = calculateFeeAmount(534);
    checkTransferEvents(transfer, ownerAccount, arbitraryAccount, 534, feeAmount);

    let balance0 = await token.balanceOf(ownerAccount);
    assert.isTrue(balance0.cmp(900 - 534 - feeAmount)==0);
    let balance3 = await token.balanceOf(arbitraryAccount);
    assert.isTrue(balance3.cmp(newBigNumber(534))==0);
    let balanceFeeAccount = await token.balanceOf(feeAccount);
    assert.isTrue(balanceFeeAccount.sub(initialBalanceFeeAccount).cmp(newBigNumber(feeAmount))==0);
}

async function sampleTransferFrom(token, ownerAccount, arbitraryAccount, minter) {
    let allowed = await token.allowance.call(ownerAccount, arbitraryAccount); // TODO not this
    assert.isTrue(allowed.isZero());
    await mint(token, ownerAccount, 900, minter); // TODO maybe this
    await token.approve(arbitraryAccount, 634); // TODO not this
    allowed = await token.allowance.call(ownerAccount, arbitraryAccount); // TODO not this
    assert.isTrue(allowed.cmp(newBigNumber(634))==0);

    let transfer = await token.transferFrom(ownerAccount, arbitraryAccount, 534, { from: arbitraryAccount }); // TODO not this

    checkTransferEvents(transfer, ownerAccount, arbitraryAccount, 534);

    let balance0 = await token.balanceOf(ownerAccount);
    assert.isTrue(balance0.cmp(newBigNumber(900-534))==0);
    let balance3 = await token.balanceOf(arbitraryAccount);
    assert.isTrue(balance3.cmp(newBigNumber(534))==0);
}

async function approve(token, to, amount, from) {
    await token.approve(to, amount, { from: from });
}

async function redeem(token, account, amount) {
    let redeemResult = await token.redeem(amount, { from: account });
    assert.equal(redeemResult.logs[0].event, 'Redeem');
    assert.equal(redeemResult.logs[0].args.redeemedAddress, account);
    assert.equal(redeemResult.logs[0].args.amount, amount);
}

function validateTransferEvent(transferEvent, from, to, value) {
    let eventResult = transferEvent.logs[0];
    assert.equal(eventResult.event, 'Transfer');
    assert.equal(upperCaseAddress(eventResult.args.from), upperCaseAddress(from));
    assert.equal(upperCaseAddress(eventResult.args.to), upperCaseAddress(to));
    assert.equal(eventResult.args.value, value);
}

async function initializeTokenWithProxy(rawToken) {
    return customInitializeTokenWithProxy(rawToken, Accounts.masterMinterAccount, Accounts.pauserAccount, Accounts.blacklisterAccount, Accounts.tokenOwnerAccount);
}

async function customInitializeTokenWithProxy(rawToken, _masterMinter, _pauser, _blacklister, _owner) {
    const proxy = await FiatTokenProxy.new(rawToken.address, { from: Accounts.proxyOwnerAccount })
    proxiedToken = await FiatToken.at(proxy.address);
    await proxiedToken.initialize(name, symbol, currency, decimals, _masterMinter, _pauser, _blacklister, _owner);
    proxiedToken.proxiedTokenAddress = rawToken.address;
    assert.equal(proxiedToken.address, proxy.address);
    assert.notEqual(proxiedToken.address, rawToken.address);
    var tokenConfig = {
        proxy: proxy,
        token: proxiedToken
    };
    return tokenConfig;
}


async function upgradeTo(proxy, upgradedToken, proxyUpgraderAccount) {
    if (proxyUpgraderAccount == null) {
        proxyUpgraderAccount = Accounts.proxyOwnerAccount;
    }
    await proxy.upgradeTo(upgradedToken.address, { from: proxyUpgraderAccount });
    proxiedToken = await FiatToken.at(proxy.address);
    assert.equal(proxiedToken.address, proxy.address);
    return tokenConfig = {
        proxy: proxy,
        token: proxiedToken
    }
}

async function expectRevert(contractPromise) {
    await expectError(contractPromise, 'revert');
}

async function expectJump(contractPromise) {
    await expectError(contractPromise, 'invalid opcode');
}

async function expectError(contractPromise, errorMsg) {
    try {
        await contractPromise;
        assert.fail('Expected error ${errorMsg}, but no error received');
    } catch (error) {
        const correctErrorMsgReceived = error.message.includes(errorMsg) >= 0;
        assert(correctErrorMsgReceived, `Expected ${errorMsg}, got ${error} instead`);
    }
}

function encodeCall(name, arguments, values) {
    const methodId = abi.methodID(name, arguments).toString('hex');
    const params = abi.rawEncode(arguments, values).toString('hex');
    return '0x' + methodId + params;
}

async function getAdmin(proxy) {
    var adm = await web3.eth.getStorageAt(proxy.address, adminSlot);
    return upperCaseAddress(adm);
}

async function getImplementation(proxy) {
    let impl = await web3.eth.getStorageAt(proxy.address, implSlot);
    return impl;
}

async function getInitializedV1(token) {
    var slot8Data = await web3.eth.getStorageAt(token.address, 8);
    var slot8DataLength = slot8Data.length;
    var initialized;
    var masterMinterStart;
    var masterMinterAddress;
    if (slot8DataLength == 4) {
        //Validate proxy not yet initialized
        for (var i = 0; i <= 20; i++) {
            assert.equal("0x00", await web3.eth.getStorageAt(token.address, i));
        }
        initialized = slot8Data;
    } else {
        if (slot8DataLength == 44) {
            initialized = "0x" + slot8Data.substring(2,4); // first 2 hex-chars after 0x
            masterMinterStart = 4;
        } else if (slot8DataLength == 40) {
            initialized = "0x00";
            masterMinterStart = 2;
        } else {
            assert.fail("slot8Data incorrect size");
        }
        masterMinterAddress = "0x" + slot8Data.substring(masterMinterStart, masterMinterStart + 40).toUpperCase();
        var tokenMMA = await token.masterMinter.call();
        assert.equal(upperCaseAddress(tokenMMA), upperCaseAddress(masterMinterAddress));
    }
    return initialized;
}

module.exports = {
    newBigNumber: newBigNumber,
    FiatToken: FiatToken,
    FiatTokenProxy: FiatTokenProxy,
    UpgradedFiatToken: UpgradedFiatToken,
    UpgradedFiatTokenNewFields: UpgradedFiatTokenNewFields,
    UpgradedFiatTokenNewFieldsNewLogic: UpgradedFiatTokenNewFieldsNewLogic,
    name: name,
    symbol: symbol,
    currency: currency,
    decimals: decimals,
    bigZero: bigZero,
    bigHundred: bigHundred,
    debugLogging: debugLogging,
    calculateFeeAmount: calculateFeeAmount,
    checkTransferEventsWithFee: checkTransferEventsWithFee,
    checkTransferEvents: checkTransferEvents,
    checkMinterConfiguredEvent: checkMinterConfiguredEvent,
    checkMintEvent: checkMintEvent,
    checkApprovalEvent: checkApprovalEvent,
    checkBurnEvents: checkBurnEvents,
    checkBurnEvent: checkBurnEvent,
    checkMinterRemovedEvent: checkMinterRemovedEvent,
    checkBlacklistEvent: checkBlacklistEvent,
    checkUnblacklistEvent: checkUnblacklistEvent,
    checkPauseEvent: checkPauseEvent,
    checkUnpauseEvent: checkUnpauseEvent,
    checkPauserChangedEvent: checkPauserChangedEvent,
    checkTransferOwnershipEvent: checkTransferOwnershipEvent,
    checkUpdateMasterMinterEvent: checkUpdateMasterMinterEvent,
    checkBlacklisterChangedEvent: checkBlacklisterChangedEvent,
    checkUpgradeEvent: checkUpgradeEvent,
    checkAdminChangedEvent: checkAdminChangedEvent,
    buildExpectedState,
    checkVariables: checkVariables,
    checkMINTp0: checkMINTp0,
    setMinter: setMinter,
    mint: mint,
    burn: burn,
    mintRaw: mintRaw,
    blacklist: blacklist,
    unBlacklist: unBlacklist,
    setLongDecimalFeesTransferWithFees: setLongDecimalFeesTransferWithFees,
    sampleTransfer: sampleTransfer,
    transferFromWithFees: transferFromWithFees,
    sampleTransferFrom: sampleTransferFrom,
    approve: approve,
    redeem: redeem,
    validateTransferEvent: validateTransferEvent,
    initializeTokenWithProxy: initializeTokenWithProxy,
    customInitializeTokenWithProxy: customInitializeTokenWithProxy,
    upgradeTo: upgradeTo,
    expectRevert: expectRevert,
    expectJump: expectJump,
    expectError: expectError,
    encodeCall: encodeCall,
    getInitializedV1: getInitializedV1,
    getAdmin: getAdmin,
    maxAmount: maxAmount,
    fiatTokenEmptyState,
};
