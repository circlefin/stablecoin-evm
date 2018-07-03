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
var deployerAccount = tokenUtils.deployerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var upgraderAccount = tokenUtils.upgraderAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;

var deployerAccountPrivateKey = tokenUtils.deployerAccountPrivateKey;
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

var storageUtils = require('./EternalStorageUtils');
var checkEternalStorageVariables = storageUtils.checkEternalStorageVariables;

var abiUtils = require('./ABIUtils');
var makeRawTransaction = abiUtils.makeRawTransaction;
var sendRawTransaction = abiUtils.sendRawTransaction;
var functionSignature = abiUtils.functionSignature;
var encodeAddress = abiUtils.encodeAddress;
var encodeUint = abiUtils.encodeUint;
var msgData0 = abiUtils.msgData0;
var msgData = abiUtils.msgData;
var msgData1 = abiUtils.msgData1;
var msgData2 = abiUtils.msgData2;
var msgData3 = abiUtils.msgData3;

async function newOriginalToken() {
    var token = await FiatToken.new(
        "0x0",
        name,
        symbol,
        currency,
        decimals,
        masterMinterAccount,
        pauserAccount,
        blacklisterAccount,
        upgraderAccount,
        tokenOwnerAccount
    );

    token.default_priorContractAddress = "undefined";
    token.default_storageOwner = token.address;
    token.default_storageAddress = await token.getDataContractAddress();

    return token;
}

contract('FiatToken ABI Hacking tests', function (accounts) {
    beforeEach(async function checkBefore() {
        token = await newOriginalToken();/*
        token = await FiatToken.new(
            "0x0",
            name,
            symbol,
            currency,
            decimals,
            masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, tokenOwnerAccount);*/
        let tokenAddress = token.address;
        dataContractAddress = await token.getDataContractAddress();
    });

    // this test is a sanity check to make sure tests are using ABI correctly
    it('ABI001 Ownable transferOwnership(address) is public', async function () {
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

        var customVars = [
            { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount }
        ];
        await checkVariables([token], [customVars]);
    });

    it('ABI002 Ownable constructor is not inherited as a function', async function () {
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
        await checkVariables([token], [[]]);
    });

    it('ABI003 Ownable _transferOwnership(address) is not public', async function () {
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
        await checkVariables([token], [[]]);
    });

    // sanity check for pausable
    it('ABI004 Pausable pause() is public', async function () {
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
        var customVars = [
            { 'variable': 'paused', 'expectedValue': true }
        ];
        await checkVariables([token], [customVars]);
    });

    it('ABI005 Pausable constructor is not a function', async function () {
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
        await checkVariables([token], [[]]);
    });

    it('ABI006 BlacklistableTokenByRole blacklist is public', async function () {
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
        var customVars = [
            { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
        ];
        await checkVariables([token], [customVars]);
    });

    it('ABI007 BlacklistableTokenByRole constructor is not a function', async function () {
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
        await checkVariables([token], [[]]);
    });

    it('ABI008 EternalStorageUpdater constructor is not a function', async function () {
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
        await checkVariables([token], [[]]);
    });

    it('ABI009 EternalStorageUpdater setAllowed is internal', async function () {
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
        await checkVariables([token], [[]]);
    });

    it('ABI010 EternalStorageUpdater setBalance is internal', async function () {
        let badData = msgData1('setBalance(address,uint256)', arbitraryAccount, 100);
        let raw = makeRawTransaction(
            badData,
            blacklisterAccount,
            blacklisterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
        await checkVariables([token], [[]]);
    });

    it('ABI011 EternalStorageUpdater setBalances is internal', async function () {
        let badData = msgData3('setBalances(address,uint256,address,uint256)', arbitraryAccount, 100, minterAccount, 200);
        let raw = makeRawTransaction(
            badData,
            blacklisterAccount,
            blacklisterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
        await checkVariables([token], [[]]);
    });

    it('ABI012 EternalStorageUpdater setTotalSupply is internal', async function () {
        let badData = msgData0('setTotalSupply(uint256)', 10000);
        let raw = makeRawTransaction(
            badData,
            blacklisterAccount,
            blacklisterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
        await checkVariables([token], [[]]);
    });

    it('ABI013 EternalStorageUpdater setBlacklisted(true) is internal', async function () {
        let badData = msgData1('setBlacklisted(address,bool)', arbitraryAccount, 1); // hack - 1 maps to true
        let raw = makeRawTransaction(
            badData,
            blacklisterAccount,
            blacklisterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
        await checkVariables([token], [[]]);
    });

    it('ABI014 EternalStorageUpdater setBlacklisted(false) is internal', async function () {
        await token.blacklist(arbitraryAccount, { from: blacklisterAccount });

        let badData = msgData1('setBlacklisted(address,bool)', arbitraryAccount, 0); // hack - 0 maps to false
        let raw = makeRawTransaction(
            badData,
            blacklisterAccount,
            blacklisterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));

        var customVars = [
            { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
        ];
        await checkVariables([token], [customVars]);
    });

    it('ABI015 EternalStorageUpdater setMinter is internal', async function () {
        let badData = msgData1('setMinter(address,bool)', arbitraryAccount, 1); // hack - 1 maps to true
        let raw = makeRawTransaction(
            badData,
            masterMinterAccount,
            masterMinterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
        await checkVariables([token], [[]]);
    });

    it('ABI026 EternalStorageUpdater setMinter(false) is internal', async function () {
        await token.configureMinter(arbitraryAccount, 100, { from: masterMinterAccount });

        let badData = msgData1('setMinter(address,bool)', arbitraryAccount, 0); // hack - 0 maps to true
        let raw = makeRawTransaction(
            badData,
            masterMinterAccount,
            masterMinterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
        var customVars = [
            { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(100) }
        ];
        await checkVariables([token], [customVars]);
    });

    it('ABI016 EternalStorageUpdater setMinterAllowed is internal', async function () {
        let badData = msgData1('setMinterAllowed(address,uint256)', arbitraryAccount, 300); // hack - 0 maps to false
        let raw = makeRawTransaction(
            badData,
            masterMinterAccount,
            masterMinterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
        await checkVariables([token], [[]]);
    });

    // sanity test
    it('ABI017 Upgradable upgrade is public', async function () {
        let goodData = msgData('upgrade(address)', arbitraryAccount);
        let raw = makeRawTransaction(
            goodData,
            upgraderAccount,
            upgraderAccountPrivateKey,
            token.address);
        await sendRawTransaction(raw);

        var actualUpgradedAddress = await token.upgradedAddress.call();
        assert.equal(arbitraryAccount, actualUpgradedAddress, "upgradedAddress should be changed")
    });

    it('ABI018 Upgradable constructor is not inherited as a function', async function () {
        let badData = msgData('Upgradable(address)', arbitraryAccount);
        let raw = makeRawTransaction(
            badData,
            upgraderAccount,
            upgraderAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
        await checkVariables([token], [[]]);
    });


    it('ABI019 FiatToken pause is public', async function () {
        let goodData = functionSignature('pause()');
        let raw = makeRawTransaction(
            goodData,
            pauserAccount,
            pauserAccountPrivateKey,
            token.address);
        await sendRawTransaction(raw);
        var customVars = [
            { 'variable': 'paused', 'expectedValue': true }
        ];
        await checkVariables([token], [customVars]);
    });

    it('ABI020 FiatToken doTransfer is internal', async function () {
        await token.configureMinter(minterAccount, 1000, { from: masterMinterAccount });
        await token.mint(arbitraryAccount, 50, { from: minterAccount });

        let badData = msgData1('doTransfer(address,address,uint256)', arbitraryAccount, blacklisterAccount, 40);
        let raw = makeRawTransaction(
            badData,
            blacklisterAccount,
            blacklisterAccountPrivateKey,
            token.address);
        await expectRevert(sendRawTransaction(raw));
        var customVars = [
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50) },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(950) },
            { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
        ];
        await checkVariables([token], [customVars]);
    });
});

contract('EternalStorage ABI Hacking tests', function (accounts) {
    beforeEach(async function checkBefore() {
        storage = await EternalStorage.new({ from: deployerAccount });
        storageOwner = deployerAccount;
        assert.equal(await storage.owner.call(), storageOwner)
    });

    // sanity check
    it('ABI021 EternalStorage Ownable transferOwnership(address) is public', async function () {
        let goodData = msgData('transferOwnership(address)', arbitraryAccount);
        let raw = makeRawTransaction(
            goodData,
            deployerAccount,
            deployerAccountPrivateKey,
            storage.address);
        await sendRawTransaction(raw);
        var customVars = [
            { 'variable': 'owner', 'expectedValue': arbitraryAccount }
        ];
        await checkEternalStorageVariables(storage, customVars);
    });

    it('ABI022 EternalStorage Ownable constructor is not inherited as a function', async function () {
        let badData = msgData('Ownable(address)', arbitraryAccount);
        let raw = makeRawTransaction(
            badData,
            deployerAccount,
            deployerAccountPrivateKey,
            storage.address);
        await expectRevert(sendRawTransaction(raw));
        await checkEternalStorageVariables(storage, []);
    });

    it('ABI023 EternalStorage Ownable _transferOwnership(address) is not public', async function () {
        let badData = msgData('_transferOwnership(address)', arbitraryAccount);
        let raw = makeRawTransaction(
            badData,
            deployerAccount,
            deployerAccountPrivateKey,
            storage.address);
        await expectRevert(sendRawTransaction(raw));
        await checkEternalStorageVariables(storage, []);
    });

    // sanity check
    it('ABI024 EternalStorage setMinter is public', async function () {
        let goodData = msgData1('setMinter(address,bool)', minterAccount, 1); //hack - 1=true
        let raw = makeRawTransaction(
            goodData,
            deployerAccount,
            deployerAccountPrivateKey,
            storage.address);
        await sendRawTransaction(raw);
        var customVars = [
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true }
        ];
        await checkEternalStorageVariables(storage, customVars);
    });

    it('ABI025 EternalStorage constructor is not inherited as a function', async function () {
        let badData = msgData('EternalStorage(address)', arbitraryAccount);
        let raw = makeRawTransaction(
            badData,
            deployerAccount,
            deployerAccountPrivateKey,
            storage.address);
        await expectRevert(sendRawTransaction(raw));
        await checkEternalStorageVariables(storage, []);
    });

});