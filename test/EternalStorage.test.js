var Tx = require('ethereumjs-tx');

var FiatToken = artifacts.require('FiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals
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

contract('Eternal Storage Tests', function (accounts) {
    beforeEach(async function checkBefore() {
        storage = await EternalStorage.new(ownerAccount);
        storageOwner = ownerAccount;
        assert.equal(await storage.owner.call(), storageOwner)
    });

    it('constructor owner', async function () {
        var actualOwner = await storage.owner.call();
        assert.equal(storageOwner, actualOwner, "expected owner should be token.");
    });

    it('transfer owner', async function () {
        await storage.transferOwnership(arbitraryAccount, { from: storageOwner });
        var actualOwner = await storage.owner.call();
        assert.equal(arbitraryAccount, actualOwner, "expected owner should be token.");
    });

    ///// SETTER Positive tests /////
    it('setAllowed', async function () {
        var expectedAmount = 867;
        await storage.setAllowed(arbitraryAccount, minterAccount, expectedAmount, { from: storageOwner });
        var actualAmount = await storage.getAllowed(arbitraryAccount, minterAccount);
        (expectedAmount).should.be.bignumber.equal(actualAmount);
    });

    it('setBalance', async function () {
        var expectedAmount = 7589035478901354;
        await storage.setBalance(arbitraryAccount, expectedAmount, { from: storageOwner });

        var actualAmount = await storage.getBalance(arbitraryAccount);
        (expectedAmount).should.be.bignumber.equal(actualAmount);
    });

    it('setBalances', async function () {
        var expectedAmount1 = 867534278;
        var expectedAmount2 = 342;
        await storage.setBalances(arbitraryAccount, expectedAmount1, minterAccount, expectedAmount2, { from: storageOwner });

        var actualAmount1 = await storage.getBalance(arbitraryAccount);
        (expectedAmount1).should.be.bignumber.equal(actualAmount1);
        var actualAmount2 = await storage.getBalance(minterAccount);
        (expectedAmount2).should.be.bignumber.equal(actualAmount2);
    });

    it('setTotalSupply', async function () {
        var expectedAmount = 7587684752969;
        await storage.setTotalSupply(expectedAmount, { from: storageOwner });

        var actualAmount = await storage.getTotalSupply();
        (expectedAmount).should.be.bignumber.equal(actualAmount);
    });

    it('setBlacklisted', async function () {
        await storage.setBlacklisted(arbitraryAccount, true, { from: storageOwner });
        assert.equal(true, await storage.isBlacklisted(arbitraryAccount));

        await storage.setBlacklisted(arbitraryAccount, false);
        assert.equal(false, await storage.isBlacklisted(arbitraryAccount));
    });

    it('setMinterAllowed', async function () {
        var expectedAmount = 6542682969;
        await storage.setMinterAllowed(minterAccount, expectedAmount, { from: storageOwner });

        var actualAmount = await storage.getMinterAllowed(minterAccount);
        (expectedAmount).should.be.bignumber.equal(actualAmount);

        var isMinter = await storage.isMinter(minterAccount);
        assert.equal(false, isMinter);
    });

    it('setMinter', async function () {
        await storage.setMinter(minterAccount, true);
        var isMinter = await storage.isMinter(minterAccount, { from: storageOwner });
        assert.equal(true, isMinter);

        await storage.setMinter(minterAccount, false);
        var notMinter = await storage.isMinter(minterAccount, { from: storageOwner });
        assert.equal(false, notMinter);

    });

    // getter functions (not tested by setter)
    it('getBalances', async function () {
        var expectedAmount1 = 867534278;
        var expectedAmount2 = 342;
        await storage.setBalances(arbitraryAccount, expectedAmount1, minterAccount, expectedAmount2, { from: storageOwner });

        let amounts = await storage.getBalances(arbitraryAccount, minterAccount);
        let actualAmount1 = amounts[0];
        let actualAmount2 = amounts[1];

        (expectedAmount1).should.be.bignumber.equal(actualAmount1);
        (expectedAmount2).should.be.bignumber.equal(actualAmount2);
    });

    it('getBalances flip args', async function () {
        var expectedAmount1 = 867534278;
        var expectedAmount2 = 342;
        await storage.setBalances(arbitraryAccount, expectedAmount1, minterAccount, expectedAmount2, { from: storageOwner });

        let amounts = await storage.getBalances(minterAccount, arbitraryAccount);
        let actualAmount1 = amounts[1];
        let actualAmount2 = amounts[0];

        (expectedAmount1).should.be.bignumber.equal(actualAmount1);
        (expectedAmount2).should.be.bignumber.equal(actualAmount2);
    });

    it('isAnyBlacklisted (true, true)', async function () {
        await storage.setBlacklisted(arbitraryAccount, true, { from: storageOwner });
        await storage.setBlacklisted(minterAccount, true, { from: storageOwner });

        let result1 = await storage.isAnyBlacklisted(arbitraryAccount, minterAccount);
        let result2 = await storage.isAnyBlacklisted(minterAccount, arbitraryAccount);

        assert.equal(true, result1);
        assert.equal(true, result2);
    });

    it('isAnyBlacklisted (true, false)', async function () {
        await storage.setBlacklisted(arbitraryAccount, true, { from: storageOwner });
        await storage.setBlacklisted(minterAccount, false, { from: storageOwner });

        let result1 = await storage.isAnyBlacklisted(arbitraryAccount, minterAccount);
        let result2 = await storage.isAnyBlacklisted(minterAccount, arbitraryAccount);

        assert.equal(true, result1);
        assert.equal(true, result2);
    });

    it('isAnyBlacklisted (false, true)', async function () {
        await storage.setBlacklisted(arbitraryAccount, false, { from: storageOwner });
        await storage.setBlacklisted(minterAccount, true, { from: storageOwner });

        let result1 = await storage.isAnyBlacklisted(arbitraryAccount, minterAccount);
        let result2 = await storage.isAnyBlacklisted(minterAccount, arbitraryAccount);

        assert.equal(true, result1);
        assert.equal(true, result2);
    });

    it('isAnyBlacklisted (false, false)', async function () {
        await storage.setBlacklisted(arbitraryAccount, false, { from: storageOwner });
        await storage.setBlacklisted(minterAccount, false, { from: storageOwner });

        let result1 = await storage.isAnyBlacklisted(arbitraryAccount, minterAccount);
        let result2 = await storage.isAnyBlacklisted(minterAccount, arbitraryAccount);

        assert.equal(false, result1);
        assert.equal(false, result2);
    });

    ////// Call functions from non-owner account //////////

    it('transferOwnership called by Mallory', async function () {
        await expectRevert(storage.transferOwnership(arbitraryAccount, { from: arbitraryAccount }));
        var actualOwner = await storage.owner.call();
        assert.equal(storageOwner, actualOwner, "owner should not change.");
    });

    it('setAllowed called by Mallory', async function () {
        await expectRevert(storage.setAllowed(arbitraryAccount, minterAccount, 433, { from: arbitraryAccount }));
    });

    it('setBalance called by Mallory', async function () {
        await expectRevert(storage.setBalance(arbitraryAccount, 435, { from: arbitraryAccount }));
    });

    it('setBalances called by Mallory', async function () {
        await expectRevert(storage.setBalances(arbitraryAccount, 342, minterAccount, 75483, { from: arbitraryAccount }));
    });

    it('setTotalSupply called by Mallory', async function () {
        await expectRevert(storage.setTotalSupply(7587684752969, { from: arbitraryAccount }));
    });

    it('setBlacklisted called by Mallory', async function () {
        await expectRevert(storage.setBlacklisted(arbitraryAccount, true, { from: arbitraryAccount }));
        await expectRevert(storage.setBlacklisted(arbitraryAccount, false, { from: arbitraryAccount }));
    });

    it('setMinterAllowed called by Mallory', async function () {
        await expectRevert(storage.setMinterAllowed(minterAccount, 6542682969, { from: arbitraryAccount }));
    });

    it('setMinter called by Mallory', async function () {
        await expectRevert(storage.setMinter(minterAccount, true, { from: arbitraryAccount }));
        await expectRevert(storage.setMinter(minterAccount, false, { from: arbitraryAccount }));
    });

    /////// Call functions that are not exposed ////////

    // this test is a sanity check to make sure tests are using ABI correctly
    it('Ownable transferOwnership(address) is public', async function () {
        let badData = msgData('transferOwnership(address)', arbitraryAccount);
        var tx = new Tx({
            nonce: web3.toHex(web3.eth.getTransactionCount(storageOwner)),
            gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
            gasLimit: 100000,
            to: storage.address,
            value: 0,
            data: badData,
        });
        var privateKey = Buffer.from(storageOwnerPrivateKey, 'hex');
        tx.sign(privateKey);
        var raw = '0x' + tx.serialize().toString('hex');

        await sendRawTransaction(raw);

        // make sure owner did not change
        var actualOwner = await storage.owner.call();
        assert.equal(arbitraryAccount, actualOwner, "owner should change.");
    });

    it('Ownable constructor is not inherited as a function', async function () {
        let badData = functionSignature('Ownable()');
        var tx = new Tx({
            nonce: web3.toHex(web3.eth.getTransactionCount(arbitraryAccount)),
            gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
            gasLimit: 100000,
            to: storage.address,
            value: 0,
            data: badData,
        });
        var privateKey = Buffer.from(arbitraryAccountPrivateKey, 'hex');
        tx.sign(privateKey);
        var raw = '0x' + tx.serialize().toString('hex');

        await expectRevert(sendRawTransaction(raw));

        // make sure owner did not change
        var actualOwner = await storage.owner.call();
        assert.equal(storageOwner, actualOwner, "owner should not change.");
    });

    it('Ownable _transferOwnership(address) is not public', async function () {
        let badData = msgData('_transferOwnership(address)', arbitraryAccount);
        var tx = new Tx({
            nonce: web3.toHex(web3.eth.getTransactionCount(storageOwner)),
            gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
            gasLimit: 100000,
            to: storage.address,
            value: 0,
            data: badData,
        });
        var privateKey = Buffer.from(storageOwnerPrivateKey, 'hex');
        tx.sign(privateKey);
        var raw = '0x' + tx.serialize().toString('hex');

        await expectRevert(sendRawTransaction(raw));

        // make sure owner did not change
        var actualOwner = await storage.owner.call();
        assert.equal(storageOwner, actualOwner, "owner should not change.");
    });

    // try to cause collisions

    it('setBlacklisted bigInt', async function () {
        await storage.setBlacklisted(arbitraryAccount, 4, { from: storageOwner });
        assert.equal(true, await storage.isBlacklisted(arbitraryAccount));
    });

    it('setBlacklisted long address (right) no collision', async function () {
        let shortAddress = 0xafce3ad7c92f4fd7e1b8fad9f;
        let longAdress = 0xafce3ad7c92f4fd7e1b8fad9f000000000000000;

        await storage.setBlacklisted(shortAddress, true, { from: storageOwner });
        assert.equal(false, await storage.isBlacklisted(longAdress));
    });

    it('setBlacklisted long address (right) no collision', async function () {
        let shortAddress = 0x1212;
        let longAddress = 0x121200000000;

        await storage.setBlacklisted(longAddress, true, { from: storageOwner });
        assert.equal(false, await storage.isBlacklisted(shortAddress));
    });

    it('setBlacklisted long address (left) COLLISION', async function () {
        let longAddress = 0x000000000000000afce3ad7c92f4fd7e1b8fad9f;
        let shortAddress = 0xafce3ad7c92f4fd7e1b8fad9f;

        await storage.setBlacklisted(longAddress, true, { from: storageOwner });
        assert.equal(true, await storage.isBlacklisted(shortAddress));
    });

    it('balances long address (right) no collision', async function () {
        let expectedAmount = 100;
        let shortAddress = 0xbbbbbbbbbbbbbbbbbbbbbbbbb;
        let address = 0xbbbbbbbbbbbbbbbbbbbbbbbbb000000000000000;

        await storage.setBalance(shortAddress, 100, { from: storageOwner });
        let actualAmount = await storage.getBalance(address);
        assert.equal(0, actualAmount.toNumber());
    });

    it('balances long address (right) COLLISION', async function () {
        let expectedAmount = 100;
        let shortAddress = 0xbbbbbbbbbbbbbbbbbbbbbbbbb;
        let address = 0x000000000000000bbbbbbbbbbbbbbbbbbbbbbbbb;

        await storage.setBalance(shortAddress, 100, { from: storageOwner });
        let actualAmount = await storage.getBalance(address);
        assert.equal(expectedAmount, actualAmount.toNumber());
    });

});