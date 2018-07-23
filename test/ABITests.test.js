var Tx = require('ethereumjs-tx');

var tokenUtils = require('./TokenTestUtils');
var FiatToken = tokenUtils.FiatToken;
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
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
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

async function run_tests(newToken) {
    beforeEach(async function checkBefore() {
        rawToken = await newToken();
        var tokenConfig = await initializeTokenWithProxy(rawToken);
        proxy = tokenConfig.proxy;
        token = tokenConfig.token;
        assert.equal(proxy.address, token.address);
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
}

module.exports = {
    run_tests: run_tests,
}

