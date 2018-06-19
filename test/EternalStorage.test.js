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

function sendRawTransaction(raw) {
    return new Promise(function (resolve, reject) {
        web3.eth.sendRawTransaction(raw, function (err, transactionHash) {
            if (err !== null) return reject(err);
            resolve(data);
        });
    });
}

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

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

    it('check Ownable constructor is not inherited as a function', async function () {
        // lets make sure this is not callable
        let badData = web3.sha3('Ownable()');
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

    it('check transferOwnership cannot be called', async function () {
        // lets make sure this is not callable
        await expectRevert(storage.transferOwnership(arbitraryAccount, { from: arbitraryAccount }));
        var actualOwner = await storage.owner.call();
        assert.equal(storageOwner, actualOwner, "owner should not change.");
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

    // (check what happens if I sign a big number instread of true/false - will it overwrite anything else in the mapping)
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
        let longAdress = 0x121200000000;

        await storage.setBlacklisted(longAdress, true, { from: storageOwner });
        assert.equal(false, await storage.isBlacklisted(shortAddress));
    });

    it('setBlacklisted long address (left) collision', async function () {
        let longAddress = 0x000000000000000afce3ad7c92f4fd7e1b8fad9f;
        let shortAddress = 0xafce3ad7c92f4fd7e1b8fad9f;

        await storage.setBlacklisted(longAdress, true, { from: storageOwner });
        assert.equal(false, await storage.isBlacklisted(shortAddress));
    });
    /*
        it('setAllowed long address (left) collision', async function () {
            //       let address1 = 0x000000000000000afce3ad7c92f4fd7e1b8fad9f;
            let address1 = 0xbbbbbbbbbbbbbbbbbbbbbbbbb;
            let address2 = 0xccccccccccccccc;
            let address1a = 0xbbbbbbbbbbbbbbbbbbbbbbbbb;
            let address2a = 0xbbbbbbbbbbbbbbbbbbbbbbbbbccccccccccccccc;
            let shortAddress = 0xafce3ad7c92f4fd7e1b8fad9f;
    
            await storage.setAllowed(address1, address2, 100, { from: storageOwner });
    
            let result = await storage.getAllowed(address1a, address2);
            result.equal.
            console.log("result: " + result.toString());
        });
    
        it('setAllowed long address (zero) collision', async function () {
            let address1 = 0xaaaaaaaaaaaaaaabbbbbbbbbbbbbbbbbbbbbbbbb;
            let address2 = 0xccccccccccccccc0000000000000000000000000;
            let address1a = 0x0000000000000000000000000aaaaaaaaaaaaaaa;
            let address2a = 0xbbbbbbbbbbbbbbbbbbbbbbbbbccccccccccccccc;
            let shortAddress = 0xafce3ad7c92f4fd7e1b8fad9f;
    
            await storage.setAllowed(address1, address2, 100, { from: storageOwner });
    
            let result = await storage.getAllowed(address1a, address2);
            console.log("result: " + result.toString());
        });*/


    it('balances long address (zero) collision', async function () {
        let shortAdress1 = 0xbbbbbbbbbbbbbbbbbbbbbbbbb;
        let address1 = 0x000000000000000bbbbbbbbbbbbbbbbbbbbbbbbb;

        let address2 = 0xccccccccccccccc0000000000000000000000000;
        let shortAddress2 = 0xccccccccccccccc;

        await storage.setBalance(shortAdress1, 100, { from: storageOwner });
        await storage.setBalance(shortAddress2, 200, { from: storageOwner });

        let balance1 = await storage.getBalance(address1);
        let balance2 = await storage.getBalance(address2);

        console.log("balance1: " + balance1.toString());
        console.log("balance2: " + balance2.toString());
    });

    it('setBlacklisted test', async function () {
        let longAddress = 0x000000000000000afce3ad7c92f4fd7e1b8fad9f;
        let shortAddress = 0xafce3ad7c92f4fd7e1b8fad9f;

        await storage.setBlacklisted(longAddress, true, { from: storageOwner });
        assert.equal(false, await storage.isBlacklisted(shortAddress));
    });
});