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

//var checkVariables = tokenUtils.checkVariables;
//var checkFailureIsExpected = tokenUtils.checkFailureIsExpected;
var deployerAccount = tokenUtils.deployerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var upgraderAccount = tokenUtils.upgraderAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;

var arbitraryAccountPrivateKey = tokenUtils.arbitraryAccountPrivateKey;
var storageOwnerPrivateKey = tokenUtils.deployerAccountPrivateKey;

var storageUtils = require('./EternalStorageUtils');
var checkEternalStorageVariables = storageUtils.checkEternalStorageVariables;


const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('Eternal Storage Tests', function (accounts) {
    beforeEach(async function checkBefore() {
        storage = await EternalStorage.new(deployerAccount);
        storageOwner = deployerAccount;
    });

    it('es030 constructor owner', async function () {
        let newStorage = await EternalStorage.new(arbitraryAccount2, { from: arbitraryAccount });
        let actualOwner = await newStorage.owner.call();
        var customVars = [
            { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount } // need to use tokenOwner instead of owner
        ];
        await checkEternalStorageVariables(newStorage, customVars);
    });

    it('es001 constructor owner', async function () {
        await checkEternalStorageVariables(storage, []);
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
        await checkEternalStorageVariables(storage, []);
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
        await checkEternalStorageVariables(storage, []);
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
        await checkEternalStorageVariables(storage, []);
    });

    it('es017 setAllowed called by Mallory', async function () {
        await expectRevert(storage.setAllowed(arbitraryAccount, minterAccount, 433, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, []);
    });

    it('es018 setBalance called by Mallory', async function () {
        await expectRevert(storage.setBalance(arbitraryAccount, 435, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, []);
    });

    it('es019 setBalances called by Mallory', async function () {
        await expectRevert(storage.setBalances(arbitraryAccount, 342, minterAccount, 75483, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, []);
    });

    it('es020 setTotalSupply called by Mallory', async function () {
        await expectRevert(storage.setTotalSupply(7587684752969, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, []);
    });

    it('es021 setBlacklisted called by Mallory', async function () {
        await expectRevert(storage.setBlacklisted(arbitraryAccount, true, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, []);

        await expectRevert(storage.setBlacklisted(arbitraryAccount, false, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, []);
    });

    it('es022 setMinterAllowed called by Mallory', async function () {
        await expectRevert(storage.setMinterAllowed(minterAccount, 6542682969, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, []);
    });

    it('es023 setMinter called by Mallory', async function () {
        await expectRevert(storage.setMinter(minterAccount, true, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, []);

        await expectRevert(storage.setMinter(minterAccount, false, { from: arbitraryAccount }));
        await checkEternalStorageVariables(storage, []);
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
