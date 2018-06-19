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
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;

var arbitraryAccountPrivateKey = tokenUtils.arbitraryAccountPrivateKey;
var tokenOwnerPrivateKey = tokenUtils.ownerAccountPrivateKey;
var upgraderAccountPrivateKey = tokenUtils.upgraderAccountPrivateKey;
var tokenOwnerPrivateKey = tokenUtils.tokenOwnerPrivateKey;
var blacklisterAccountPrivateKey = tokenUtils.blacklisterAccountPrivateKey;
var arbitraryAccount2PrivateKey = tokenUtils.arbitraryAccount2PrivateKey;
var masterMinterAccountPrivateKey = tokenUtils.masterMinterAccountPrivateKey;
var minterAccountPrivateKey = tokenUtils.minterAccountPrivateKey;
var pauserAccountPrivateKey = tokenUtils.pauserAccountPrivateKey;
var blacklisterAccountPrivateKey = tokenUtils.blacklisterAccountPrivateKey;


function makeRawTransaction(msgData, msgSender, hexPrivateKey, contractAddress) {
    var tx = new Tx({
        nonce: web3.toHex(web3.eth.getTransactionCount(msgSender)),
        gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
        gasLimit: 100000,
        to: contractAddress,
        value: 0,
        data: msgData,
    });
    var privateKey = Buffer.from(hexPrivateKey, 'hex');
    tx.sign(privateKey);
    var raw = '0x' + tx.serialize().toString('hex');
    return raw
}

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

function encodeUint(value) {
    value = value.toString(16);
    while (value.length < 64) value = "0" + value;
    return value;
}

// creates an ABI call for a function methodName(address) and encodes the address.
function msgData0(methodName, value) {
    return functionSignature(methodName) + encodeUint(value);
}

function msgData(methodName, addressValue) {
    return functionSignature(methodName) + encodeAddress(addressValue);
}

function msgData1(methodName, address, value) {
    return functionSignature(methodName) + encodeAddress(address) + encodeUint(value);
}

function msgData2(methodName, address1, address2, value) {
    return functionSignature(methodName) + encodeAddress(address1) + encodeAddress(address2) + encodeUint(value);
}

function msgData3(methodName, address1, value1, address2, value2) {
    return functionSignature(methodName) + encodeAddress(address1) + encodeUint(value1) + encodeAddress(address2) + encodeUint(value2);
}

contract('ABI Hacking tests', function (accounts) {
    beforeEach(async function checkBefore() {
        token = await FiatToken.new("0x0", name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, tokenOwnerAccount);
        let tokenAddress = token.address;
        let dataContractAddress = await token.getDataContractAddress();
        storage = EternalStorage.at(dataContractAddress);
        assert.equal(await storage.owner.call(), token.address);
    });

    // this test is a sanity check to make sure tests are using ABI correctly
    it('Ownable transferOwnership(address) is public', async function () {
        let badData = msgData('transferOwnership(address)', arbitraryAccount);
        var tx = new Tx({
            nonce: web3.toHex(web3.eth.getTransactionCount(tokenOwnerAccount)),
            gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
            gasLimit: 100000,
            to: token.address,
            value: 0,
            data: badData,
        });
        var privateKey = Buffer.from(tokenOwnerPrivateKey, 'hex');
        tx.sign(privateKey);
        var raw = '0x' + tx.serialize().toString('hex');

        await sendRawTransaction(raw);

        // make sure owner did not change
        var actualOwner = await token.owner.call();
        assert.equal(arbitraryAccount, actualOwner, "owner should change.");
    });

    it('Ownable constructor is not inherited as a function', async function () {
        let badData = functionSignature('Ownable()');
        var tx = new Tx({
            nonce: web3.toHex(web3.eth.getTransactionCount(arbitraryAccount)),
            gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
            gasLimit: 100000,
            to: token.address,
            value: 0,
            data: badData,
        });
        var privateKey = Buffer.from(arbitraryAccountPrivateKey, 'hex');
        tx.sign(privateKey);
        var raw = '0x' + tx.serialize().toString('hex');

        await expectRevert(sendRawTransaction(raw));

        // make sure owner did not change
        var actualOwner = await token.owner.call();
        assert.equal(tokenOwnerAccount, actualOwner, "owner should not change.");
    });

    it('Ownable _transferOwnership(address) is not public', async function () {
        let badData = msgData('_transferOwnership(address)', arbitraryAccount);
        var tx = new Tx({
            nonce: web3.toHex(web3.eth.getTransactionCount(tokenOwnerAccount)),
            gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
            gasLimit: 100000,
            to: token.address,
            value: 0,
            data: badData,
        });
        var privateKey = Buffer.from(tokenOwnerPrivateKey, 'hex');
        tx.sign(privateKey);
        var raw = '0x' + tx.serialize().toString('hex');

        await expectRevert(sendRawTransaction(raw));

        // make sure owner did not change
        var actualOwner = await token.owner.call();
        assert.equal(tokenOwnerAccount, actualOwner, "owner should not change.");
    });

    // sanity check for pausable
    it('Pausable pause() is public', async function () {
        let badData = functionSignature('pause()');
        var tx = new Tx({
            nonce: web3.toHex(web3.eth.getTransactionCount(pauserAccount)),
            gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
            gasLimit: 100000,
            to: token.address,
            value: 0,
            data: badData,
        });
        var privateKey = Buffer.from(pauserAccountPrivateKey, 'hex');
        tx.sign(privateKey);
        var raw = '0x' + tx.serialize().toString('hex');

        await sendRawTransaction(raw);

        // make sure contract paused
        var isPaused = await token.paused.call();
        assert.equal(true, isPaused, "contract should be paused.");
    });

    it('Pausable constructor is not a function', async function () {
        let badData = msgData('Pausable(address)', arbitraryAccount);
        var tx = new Tx({
            nonce: web3.toHex(web3.eth.getTransactionCount(pauserAccount)),
            gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
            gasLimit: 100000,
            to: token.address,
            value: 0,
            data: badData,
        });
        var privateKey = Buffer.from(pauserAccountPrivateKey, 'hex');
        tx.sign(privateKey);
        var raw = '0x' + tx.serialize().toString('hex');

        await expectRevert(sendRawTransaction(raw));

        // make sure owner did not change
        var actualPauser = await token.pauser.call();
        assert.equal(pauserAccount, actualPauser, "pauser should not change.");
    });

    it('BlacklistableTokenByRole blacklist is public', async function () {
        let badData = msgData('blacklist(address)', arbitraryAccount);
        var tx = new Tx({
            nonce: web3.toHex(web3.eth.getTransactionCount(blacklisterAccount)),
            gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
            gasLimit: 100000,
            to: token.address,
            value: 0,
            data: badData,
        });
        var privateKey = Buffer.from(blacklisterAccountPrivateKey, 'hex');
        tx.sign(privateKey);
        var raw = '0x' + tx.serialize().toString('hex');

        await sendRawTransaction(raw);

        // make arbitrary account is blacklisted
        var isBlacklisted = await token.isAccountBlacklisted.call(arbitraryAccount);
        assert.equal(true, isBlacklisted);
    });

    it('BlacklistableTokenByRole constructor is not a function', async function () {
        let badData = msgData('BlacklistableTokenByRole(address)', arbitraryAccount);
        var tx = new Tx({
            nonce: web3.toHex(web3.eth.getTransactionCount(blacklisterAccount)),
            gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
            gasLimit: 100000,
            to: token.address,
            value: 0,
            data: badData,
        });
        var privateKey = Buffer.from(blacklisterAccountPrivateKey, 'hex');
        tx.sign(privateKey);
        var raw = '0x' + tx.serialize().toString('hex');

        await expectRevert(sendRawTransaction(raw));

        // make sure owner did not change
        var actualBlacklister = await token.blacklister.call();
        assert.equal(blacklisterAccount, actualBlacklister, "blacklister should not change.");
    });

    it('EternalStorageUpdater constructor is not a function', async function () {
        let badData = msgData('EternalStorageUpdater(address)', "0x00");
        var tx = new Tx({
            nonce: web3.toHex(web3.eth.getTransactionCount(blacklisterAccount)),
            gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
            gasLimit: 100000,
            to: token.address,
            value: 0,
            data: badData,
        });
        var privateKey = Buffer.from(blacklisterAccountPrivateKey, 'hex');
        tx.sign(privateKey);
        var raw = '0x' + tx.serialize().toString('hex');

        await expectRevert(sendRawTransaction(raw));

        // make sure storage did not change
        var actualStorage = await token.getDataContractAddress.call();
        assert.equal(storage.address, actualStorage, "storage should not change.");
    });

    it('EternalStorageUpdater setAllowed is internal', async function () {
        let badData = msgData2('setAllowed(address,address,uint256)', arbitraryAccount, minterAccount, 100);
        var tx = new Tx({
            nonce: web3.toHex(web3.eth.getTransactionCount(blacklisterAccount)),
            gasPrice: web3.toHex(web3.toWei('20', 'gwei')),
            gasLimit: 100000,
            to: token.address,
            value: 0,
            data: badData,
        });
        var privateKey = Buffer.from(blacklisterAccountPrivateKey, 'hex');
        tx.sign(privateKey);
        var raw = '0x' + tx.serialize().toString('hex');

        await expectRevert(sendRawTransaction(raw));

        // make sure allowance did not change
        let actualAllowed = await token.allowance.call(arbitraryAccount, minterAccount);
        assert.equal(0, actualAllowed.toNumber(), "allowed should not change.");
    });

    it('EternalStorageUpdater setBalance is internal', async function () {
        let badData = msgData1('setBalance(address,uint256)', arbitraryAccount, 100);
        let raw = makeRawTransaction(
            badData,
            blacklisterAccount,
            blacklisterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));

        // make sure allowance did not change
        let actualBalance = await token.balanceOf.call(arbitraryAccount);
        assert.equal(0, actualBalance.toNumber(), "balance should not change.");
    });

    it('EternalStorageUpdater setBalances is internal', async function () {
        let badData = msgData3('setBalances(address,uint256,address,uint256)', arbitraryAccount, 100, minterAccount, 200);
        let raw = makeRawTransaction(
            badData,
            blacklisterAccount,
            blacklisterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));

        // make sure allowance did not change
        let actualBalance1 = await token.balanceOf.call(arbitraryAccount);
        let actualBalance2 = await token.balanceOf.call(minterAccount);
        assert.equal(0, actualBalance1.toNumber(), "balance1 should not change.");
        assert.equal(0, actualBalance2.toNumber(), "balance2 should not change.");
    });

    it('EternalStorageUpdater setTotalSupply is internal', async function () {
        let badData = msgData0('setTotalSupply(uint256)', 10000);
        let raw = makeRawTransaction(
            badData,
            blacklisterAccount,
            blacklisterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));

        // make sure allowance did not change
        let totalSupply = await token.totalSupply.call();
        assert.equal(0, totalSupply.toNumber(), "totalSupply should not change.");
    });

    it('EternalStorageUpdater setBlacklisted(true) is internal', async function () {
        let badData = msgData1('setBlacklisted(address,bool)', arbitraryAccount, 1); // hack - 1 maps to true
        let raw = makeRawTransaction(
            badData,
            blacklisterAccount,
            blacklisterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));

        // make sure allowance did not change
        let isBlacklisted = await token.isAccountBlacklisted.call(arbitraryAccount);
        assert.equal(false, isBlacklisted, "isBlacklisted should not change.");
    });

    it('EternalStorageUpdater setBlacklisted(false) is internal', async function () {
        await token.blacklist(arbitraryAccount, { from: blacklisterAccount });

        let badData = msgData1('setBlacklisted(address,bool)', arbitraryAccount, 0); // hack - 0 maps to false
        let raw = makeRawTransaction(
            badData,
            blacklisterAccount,
            blacklisterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));

        // make sure allowance did not change
        let isBlacklisted = await token.isAccountBlacklisted.call(arbitraryAccount);
        assert.equal(true, isBlacklisted, "isBlacklisted should not change.");
    });

    // todo: setMinter

    // todo: setMinterAllowed

    // todo: refactor code to use makeRawTransaction

});