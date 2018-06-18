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
});