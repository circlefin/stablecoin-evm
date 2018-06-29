var Tx = require('ethereumjs-tx');
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;
var Q = require('q');
const util = require('util');

var FiatToken = artifacts.require('FiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var buildExpectedState = tokenUtils.buildExpectedState;
var BigNumber = require('bignumber.js');
var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var expectRevert = tokenUtils.expectRevert;
var masterMinterRole = tokenUtils.masterMinterRole;
var blacklisterRole = tokenUtils.blacklisterRole;
var pauserRole = tokenUtils.pauserRole;

var checkVariables = tokenUtils.checkVariables;
var checkFailureIsExpected = tokenUtils.checkFailureIsExpected;

var ownerAccount = tokenUtils.ownerAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var upgraderAccount = tokenUtils.upgraderAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;

var arbitraryAccountPrivateKey = tokenUtils.arbitraryAccountPrivateKey;
var storageOwnerPrivateKey = tokenUtils.ownerAccountPrivateKey;

var debugLogging = tokenUtils.debugLogging;

function sendRawTransaction(raw) {
    return new Promise(function (resolve, reject) {
        web3.eth.sendRawTransaction(raw, function (err, transactionHash) {
            if (err !== null) return reject(err);
            resolve(transactionHash);
        });
    });
}

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();


function functionSignature(methodName) {
    return web3.sha3(methodName).substr(0, 2 + 8);
}

function encodeAddress(address) {
    address = address.substr(2, address.length - 2);
    while (address.length < 64) address = "0" + address;
    return address;
}

// creates an ABI call for a function methodName(address) and encodes the address.
function msgData(methodName, addressValue) {
    return functionSignature(methodName) + encodeAddress(addressValue);
}

async function checkEternalStorageVariables(storage, customVars) {
    // get default token state
    var expectedTokenState = buildExpectedState(customVars);

    // now copy only the subset relevant to EternalStorage
    var expectedStorageState = {
        'owner': ownerAccount,
        'balances': expectedTokenState['balances'],
        'allowance': expectedTokenState['allowance'],
        'totalSupply': expectedTokenState['totalSupply'],
        'isAccountBlacklisted': expectedTokenState['isAccountBlacklisted'],
        'isAccountMinter': expectedTokenState['isAccountMinter'],
        'minterAllowance': expectedTokenState['minterAllowance'],
    };

    if (debugLogging) {
        console.log(util.inspect(expectedStorageState, { showHidden: false, depth: null }))
    }

    let actualState = await getActualEternalStorageState(storage);
    assertDiff.deepEqual(actualState, expectedStorageState, "difference between expected and actual state");
}

async function getActualEternalStorageState(storage) {
    return Q.all([
        storage.owner.call(),

        storage.getBalance(arbitraryAccount),
        storage.getBalance(masterMinterAccount),
        storage.getBalance(minterAccount),
        storage.getBalance(pauserAccount),
        storage.getBalance(blacklisterAccount),
        storage.getBalance(tokenOwnerAccount),
        storage.getBalance(upgraderAccount),

        storage.getAllowed(arbitraryAccount, masterMinterAccount),
        storage.getAllowed(arbitraryAccount, minterAccount),
        storage.getAllowed(arbitraryAccount, pauserAccount),
        storage.getAllowed(arbitraryAccount, blacklisterAccount),
        storage.getAllowed(arbitraryAccount, tokenOwnerAccount),
        storage.getAllowed(arbitraryAccount, upgraderAccount),
        storage.getAllowed(masterMinterAccount, arbitraryAccount),
        storage.getAllowed(masterMinterAccount, minterAccount),
        storage.getAllowed(masterMinterAccount, pauserAccount),
        storage.getAllowed(masterMinterAccount, blacklisterAccount),
        storage.getAllowed(masterMinterAccount, tokenOwnerAccount),
        storage.getAllowed(masterMinterAccount, upgraderAccount),
        storage.getAllowed(minterAccount, arbitraryAccount),
        storage.getAllowed(minterAccount, masterMinterAccount),
        storage.getAllowed(minterAccount, pauserAccount),
        storage.getAllowed(minterAccount, blacklisterAccount),
        storage.getAllowed(minterAccount, tokenOwnerAccount),
        storage.getAllowed(minterAccount, upgraderAccount),
        storage.getAllowed(pauserAccount, arbitraryAccount),
        storage.getAllowed(pauserAccount, masterMinterAccount),
        storage.getAllowed(pauserAccount, minterAccount),
        storage.getAllowed(pauserAccount, blacklisterAccount),
        storage.getAllowed(pauserAccount, tokenOwnerAccount),
        storage.getAllowed(pauserAccount, upgraderAccount),
        storage.getAllowed(blacklisterAccount, arbitraryAccount),
        storage.getAllowed(blacklisterAccount, masterMinterAccount),
        storage.getAllowed(blacklisterAccount, minterAccount),
        storage.getAllowed(blacklisterAccount, pauserAccount),
        storage.getAllowed(blacklisterAccount, tokenOwnerAccount),
        storage.getAllowed(blacklisterAccount, upgraderAccount),
        storage.getAllowed(tokenOwnerAccount, arbitraryAccount),
        storage.getAllowed(tokenOwnerAccount, masterMinterAccount),
        storage.getAllowed(tokenOwnerAccount, minterAccount),
        storage.getAllowed(tokenOwnerAccount, pauserAccount),
        storage.getAllowed(tokenOwnerAccount, blacklisterAccount),
        storage.getAllowed(tokenOwnerAccount, upgraderAccount),
        storage.getAllowed(upgraderAccount, arbitraryAccount),
        storage.getAllowed(upgraderAccount, masterMinterAccount),
        storage.getAllowed(upgraderAccount, minterAccount),
        storage.getAllowed(upgraderAccount, pauserAccount),
        storage.getAllowed(upgraderAccount, blacklisterAccount),
        storage.getAllowed(upgraderAccount, tokenOwnerAccount),

        storage.getTotalSupply(),

        storage.isBlacklisted(arbitraryAccount),
        storage.isBlacklisted(masterMinterAccount),
        storage.isBlacklisted(minterAccount),
        storage.isBlacklisted(pauserAccount),
        storage.isBlacklisted(blacklisterAccount),
        storage.isBlacklisted(tokenOwnerAccount),
        storage.isBlacklisted(upgraderAccount),

        storage.isMinter(arbitraryAccount),
        storage.isMinter(masterMinterAccount),
        storage.isMinter(minterAccount),
        storage.isMinter(pauserAccount),
        storage.isMinter(blacklisterAccount),
        storage.isMinter(tokenOwnerAccount),
        storage.isMinter(upgraderAccount),

        storage.getMinterAllowed(arbitraryAccount),
        storage.getMinterAllowed(masterMinterAccount),
        storage.getMinterAllowed(minterAccount),
        storage.getMinterAllowed(pauserAccount),
        storage.getMinterAllowed(blacklisterAccount),
        storage.getMinterAllowed(tokenOwnerAccount),
        storage.getMinterAllowed(upgraderAccount),
    ]).spread(function (
        storageOwner,
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
        allowanceAtoU,
        allowanceMMtoA,
        allowanceMMtoM,
        allowanceMMtoP,
        allowanceMMtoB,
        allowanceMMtoRAC,
        allowanceMMtoU,
        allowanceMtoA,
        allowanceMtoMM,
        allowanceMtoP,
        allowanceMtoB,
        allowanceMtoRAC,
        allowanceMtoU,
        allowancePtoA,
        allowancePtoMM,
        allowancePtoM,
        allowancePtoB,
        allowancePtoRAC,
        allowancePtoU,
        allowanceBtoA,
        allowanceBtoMM,
        allowanceBtoM,
        allowanceBtoP,
        allowanceBtoRAC,
        allowanceBtoU,
        allowanceRACtoA,
        allowanceRACtoMM,
        allowanceRACtoM,
        allowanceRACtoP,
        allowanceRACtoB,
        allowanceRACtoU,
        allowanceUtoA,
        allowanceUtoMM,
        allowanceUtoM,
        allowanceUtoP,
        allowanceUtoB,
        allowanceUtoRAC,
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
    ) {
        var actualState = {
            'owner': storageOwner,
            // contractStorage is not deterministic for FiatTokenWithStorage
            //'contractStorage': storageAddress,
            // 'owner': await token.owner.call(),
            'balances': {
                'arbitraryAccount': balancesA,
                'masterMinterAccount': balancesMM,
                'minterAccount': balancesM,
                'pauserAccount': balancesP,
                'blacklisterAccount': balancesB,
                'tokenOwnerAccount': balancesRAC,
                'upgraderAccount': balancesU
            },
            'allowance': {
                'arbitraryAccount': {
                    'masterMinterAccount': allowanceAtoMM,
                    'minterAccount': allowanceAtoM,
                    'pauserAccount': allowanceAtoP,
                    'blacklisterAccount': allowanceAtoB,
                    'tokenOwnerAccount': allowanceAtoRAC,
                    'upgraderAccount': allowanceAtoU
                },
                'masterMinterAccount': {
                    'arbitraryAccount': allowanceMMtoA,
                    'minterAccount': allowanceMMtoM,
                    'pauserAccount': allowanceMMtoP,
                    'blacklisterAccount': allowanceMMtoB,
                    'tokenOwnerAccount': allowanceMMtoRAC,
                    'upgraderAccount': allowanceMMtoU
                },
                'minterAccount': {
                    'arbitraryAccount': allowanceMtoA,
                    'masterMinterAccount': allowanceMtoMM,
                    'pauserAccount': allowanceMtoP,
                    'blacklisterAccount': allowanceMtoB,
                    'tokenOwnerAccount': allowanceMtoRAC,
                    'upgraderAccount': allowanceMtoU
                },
                'pauserAccount': {
                    'arbitraryAccount': allowancePtoA,
                    'masterMinterAccount': allowancePtoMM,
                    'minterAccount': allowancePtoM,
                    'blacklisterAccount': allowancePtoB,
                    'tokenOwnerAccount': allowancePtoRAC,
                    'upgraderAccount': allowancePtoU
                },
                'blacklisterAccount': {
                    'arbitraryAccount': allowanceBtoA,
                    'masterMinterAccount': allowanceBtoMM,
                    'minterAccount': allowanceBtoM,
                    'pauserAccount': allowanceBtoP,
                    'tokenOwnerAccount': allowanceBtoRAC,
                    'upgraderAccount': allowanceBtoU
                },
                'tokenOwnerAccount': {
                    'arbitraryAccount': allowanceRACtoA,
                    'masterMinterAccount': allowanceRACtoMM,
                    'minterAccount': allowanceRACtoM,
                    'pauserAccount': allowanceRACtoP,
                    'blacklisterAccount': allowanceRACtoB,
                    'upgraderAccount': allowanceRACtoU
                },
                'upgraderAccount': {
                    'arbitraryAccount': allowanceUtoA,
                    'masterMinterAccount': allowanceUtoMM,
                    'minterAccount': allowanceUtoM,
                    'pauserAccount': allowanceUtoP,
                    'blacklisterAccount': allowanceUtoB,
                    'tokenOwnerAccount': allowanceUtoRAC
                }
            },
            'totalSupply': totalSupply,
            'isAccountBlacklisted': {
                'arbitraryAccount': isAccountBlacklistedA,
                'masterMinterAccount': isAccountBlacklistedMM,
                'minterAccount': isAccountBlacklistedM,
                'pauserAccount': isAccountBlacklistedP,
                'blacklisterAccount': isAccountBlacklistedB,
                'tokenOwnerAccount': isAccountBlacklistedRAC,
                'upgraderAccount': isAccountBlacklistedU
            },
            'isAccountMinter': {
                'arbitraryAccount': isAccountMinterA,
                'masterMinterAccount': isAccountMinterMM,
                'minterAccount': isAccountMinterM,
                'pauserAccount': isAccountMinterP,
                'blacklisterAccount': isAccountMinterB,
                'tokenOwnerAccount': isAccountMinterRAC,
                'upgraderAccount': isAccountMinterU
            },
            'minterAllowance': {
                'arbitraryAccount': minterAllowanceA,
                'masterMinterAccount': minterAllowanceMM,
                'minterAccount': minterAllowanceM,
                'pauserAccount': minterAllowanceP,
                'blacklisterAccount': minterAllowanceB,
                'tokenOwnerAccount': minterAllowanceRAC,
                'upgraderAccount': minterAllowanceU
            }
        };
        return actualState;
    })
}

contract('Eternal Storage Tests', function (accounts) {
    beforeEach(async function checkBefore() {
        storage = await EternalStorage.new(ownerAccount);
        storageOwner = ownerAccount;
    });

    it('es030 constructor owner', async function () {
        let newStorage = await EternalStorage.new(arbitraryAccount2, { from: arbitraryAccount });
        let actualOwner = await newStorage.owner.call();
        var customVars = [
            { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount } // need to use tokenOwner instead of owner
        ];
        await checkEternalStorageVariables(storage, customVars);
    });

    it('es001 constructor owner', async function () {
        await checkEternalStorageVariables(storage, {});
    });

    it('es002 transfer owner', async function () {
        await storage.transferOwnership(arbitraryAccount, { from: storageOwner });
        var actualOwner = await storage.owner.call();
        assert.equal(arbitraryAccount, actualOwner, "expected owner should be token.");
    });

    ///// SETTER Positive tests /////
    it('es003 setAllowed', async function () {
        var expectedAmount = 867;
        await storage.setAllowed(arbitraryAccount, minterAccount, expectedAmount, { from: storageOwner });
        var customVars = [
            { 'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': new BigNumber(expectedAmount) }
        ];
        await checkEternalStorageVariables(storage, customVars);
    });

    it('es004 setBalance', async function () {
        var expectedAmount = 7589035478901354;
        await storage.setBalance(arbitraryAccount, expectedAmount, { from: storageOwner });
        var customVars = [
            { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(expectedAmount) }
        ];
        await checkEternalStorageVariables(storage, customVars);
    });

    it('es005 setBalances', async function () {
        var expectedAmount1 = 867534278;
        var expectedAmount2 = 342;
        await storage.setBalances(arbitraryAccount, expectedAmount1, minterAccount, expectedAmount2, { from: storageOwner });
        var customVars = [
            { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(expectedAmount1) },
            { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(expectedAmount2) }
        ];
        await checkEternalStorageVariables(storage, customVars);
    });

    it('es006 setTotalSupply', async function () {
        var expectedAmount = 7587684752969;
        await storage.setTotalSupply(expectedAmount, { from: storageOwner });
        var customVars = [
            { 'variable': 'totalSupply', 'expectedValue': new BigNumber(expectedAmount) }
        ];
        await checkEternalStorageVariables(storage, customVars);
    });

    it('es007 setBlacklisted', async function () {
        // blacklist
        await storage.setBlacklisted(arbitraryAccount, true, { from: storageOwner });
        var customVars = [
            { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
        ];
        await checkEternalStorageVariables(storage, customVars);

        // unblacklist
        await storage.setBlacklisted(arbitraryAccount, false, { from: storageOwner });
        await checkEternalStorageVariables(storage, {});
    });

    it('es008 setMinterAllowed', async function () {
        var expectedAmount = 6542682969;
        await storage.setMinterAllowed(minterAccount, expectedAmount, { from: storageOwner });
        var customVars = [
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(expectedAmount) }
        ];
        await checkEternalStorageVariables(storage, customVars);
    });

    it('es009 setMinter', async function () {
        await storage.setMinter(minterAccount, true);
        var customVars = [
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true }
        ];
        await checkEternalStorageVariables(storage, customVars);

        await storage.setMinter(minterAccount, false);
        await checkEternalStorageVariables(storage, {});
    });

    // Need to test the result of these getter functions directly
    // (Can't use checkEternalStorageVariables).

    it('es010 getBalances', async function () {
        var expectedAmount1 = 867534278;
        var expectedAmount2 = 342;
        await storage.setBalances(arbitraryAccount, expectedAmount1, minterAccount, expectedAmount2, { from: storageOwner });

        let amounts = await storage.getBalances(arbitraryAccount, minterAccount);
        let actualAmount1 = amounts[0];
        let actualAmount2 = amounts[1];

        (expectedAmount1).should.be.bignumber.equal(actualAmount1);
        (expectedAmount2).should.be.bignumber.equal(actualAmount2);
    });

    it('es011 getBalances flip args', async function () {
        var expectedAmount1 = 867534278;
        var expectedAmount2 = 342;
        await storage.setBalances(arbitraryAccount, expectedAmount1, minterAccount, expectedAmount2, { from: storageOwner });

        let amounts = await storage.getBalances(minterAccount, arbitraryAccount);
        let actualAmount1 = amounts[1];
        let actualAmount2 = amounts[0];

        (expectedAmount1).should.be.bignumber.equal(actualAmount1);
        (expectedAmount2).should.be.bignumber.equal(actualAmount2);
    });

    it('es012 isAnyBlacklisted (true, true)', async function () {
        await storage.setBlacklisted(arbitraryAccount, true, { from: storageOwner });
        await storage.setBlacklisted(minterAccount, true, { from: storageOwner });

        let result1 = await storage.isAnyBlacklisted(arbitraryAccount, minterAccount);
        let result2 = await storage.isAnyBlacklisted(minterAccount, arbitraryAccount);

        assert.equal(true, result1);
        assert.equal(true, result2);
    });

    it('es013 isAnyBlacklisted (true, false)', async function () {
        await storage.setBlacklisted(arbitraryAccount, true, { from: storageOwner });
        await storage.setBlacklisted(minterAccount, false, { from: storageOwner });

        let result1 = await storage.isAnyBlacklisted(arbitraryAccount, minterAccount);
        let result2 = await storage.isAnyBlacklisted(minterAccount, arbitraryAccount);

        assert.equal(true, result1);
        assert.equal(true, result2);
    });

    it('es014 isAnyBlacklisted (false, true)', async function () {
        await storage.setBlacklisted(arbitraryAccount, false, { from: storageOwner });
        await storage.setBlacklisted(minterAccount, true, { from: storageOwner });

        let result1 = await storage.isAnyBlacklisted(arbitraryAccount, minterAccount);
        let result2 = await storage.isAnyBlacklisted(minterAccount, arbitraryAccount);

        assert.equal(true, result1);
        assert.equal(true, result2);
    });

    it('es015 isAnyBlacklisted (false, false)', async function () {
        await storage.setBlacklisted(arbitraryAccount, false, { from: storageOwner });
        await storage.setBlacklisted(minterAccount, false, { from: storageOwner });

        let result1 = await storage.isAnyBlacklisted(arbitraryAccount, minterAccount);
        let result2 = await storage.isAnyBlacklisted(minterAccount, arbitraryAccount);

        assert.equal(false, result1);
        assert.equal(false, result2);
    });

    ////// Call functions from non-owner account //////////

    it('es016 transferOwnership called by Mallory', async function () {
        await expectRevert(storage.transferOwnership(arbitraryAccount, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, {});
    });

    it('es017 setAllowed called by Mallory', async function () {
        await expectRevert(storage.setAllowed(arbitraryAccount, minterAccount, 433, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, {});
    });

    it('es018 setBalance called by Mallory', async function () {
        await expectRevert(storage.setBalance(arbitraryAccount, 435, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, {});
    });

    it('es019 setBalances called by Mallory', async function () {
        await expectRevert(storage.setBalances(arbitraryAccount, 342, minterAccount, 75483, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, {});
    });

    it('es020 setTotalSupply called by Mallory', async function () {
        await expectRevert(storage.setTotalSupply(7587684752969, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, {});
    });

    it('es021 setBlacklisted called by Mallory', async function () {
        await expectRevert(storage.setBlacklisted(arbitraryAccount, true, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, {});

        await expectRevert(storage.setBlacklisted(arbitraryAccount, false, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, {});
    });

    it('es022 setMinterAllowed called by Mallory', async function () {
        await expectRevert(storage.setMinterAllowed(minterAccount, 6542682969, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, {});
    });

    it('es023 setMinter called by Mallory', async function () {
        await expectRevert(storage.setMinter(minterAccount, true, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, {});

        await expectRevert(storage.setMinter(minterAccount, false, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, {});
    });

    // Try to cause hash function collisions.  These tests are mostly
    // so we are aware of the issues.

    it('es024 setBlacklisted bigInt', async function () {
        await storage.setBlacklisted(arbitraryAccount, 4, { from: storageOwner });
        assert.equal(true, await storage.isBlacklisted(arbitraryAccount));
    });

    it('es025 setBlacklisted long address (right) no collision', async function () {
        let shortAddress = 0xafce3ad7c92f4fd7e1b8fad9f;
        let longAdress = 0xafce3ad7c92f4fd7e1b8fad9f000000000000000;

        await storage.setBlacklisted(shortAddress, true, { from: storageOwner });
        assert.equal(false, await storage.isBlacklisted(longAdress));
    });

    it('es026 setBlacklisted long address (right) no collision', async function () {
        let shortAddress = 0x1212;
        let longAddress = 0x121200000000;

        await storage.setBlacklisted(longAddress, true, { from: storageOwner });
        assert.equal(false, await storage.isBlacklisted(shortAddress));
    });

    it('es027 setBlacklisted long address (left) COLLISION', async function () {
        let longAddress = 0x000000000000000afce3ad7c92f4fd7e1b8fad9f;
        let shortAddress = 0xafce3ad7c92f4fd7e1b8fad9f;

        await storage.setBlacklisted(longAddress, true, { from: storageOwner });
        assert.equal(true, await storage.isBlacklisted(shortAddress));
    });

    it('es028 balances long address (right) no collision', async function () {
        let expectedAmount = 100;
        let shortAddress = 0xbbbbbbbbbbbbbbbbbbbbbbbbb;
        let address = 0xbbbbbbbbbbbbbbbbbbbbbbbbb000000000000000;

        await storage.setBalance(shortAddress, 100, { from: storageOwner });
        let actualAmount = await storage.getBalance(address);
        assert.equal(0, actualAmount.toNumber());
    });

    it('es029 balances long address (right) COLLISION', async function () {
        let expectedAmount = 100;
        let shortAddress = 0xbbbbbbbbbbbbbbbbbbbbbbbbb;
        let address = 0x000000000000000bbbbbbbbbbbbbbbbbbbbbbbbb;

        await storage.setBalance(shortAddress, 100, { from: storageOwner });
        let actualAmount = await storage.getBalance(address);
        assert.equal(expectedAmount, actualAmount.toNumber());
    });

});