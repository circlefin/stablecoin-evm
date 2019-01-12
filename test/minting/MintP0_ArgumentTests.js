var MintController = artifacts.require('minting/MintController');
var MasterMinter = artifacts.require('minting/MasterMinter');
var MintController = artifacts.require('minting/MintController');
var MasterMinter = artifacts.require('minting/MasterMinter');
var FiatToken = artifacts.require('FiatTokenV1');

var tokenUtils = require('./../TokenTestUtils.js');
var newBigNumber = tokenUtils.newBigNumber;
var checkMINTp0 = tokenUtils.checkMINTp0;
var expectRevert = tokenUtils.expectRevert;
var expectJump = tokenUtils.expectJump;
var expectError = tokenUtils.expectError;
var bigZero = tokenUtils.bigZero;
var maxAmount = tokenUtils.maxAmount;

var clone = require('clone');

var mintUtils = require('./../MintControllerUtils.js');
var AccountUtils = require('./../AccountUtils.js');
var Accounts = AccountUtils.Accounts;
var getAccountState = AccountUtils.getAccountState;
var MintControllerState = AccountUtils.MintControllerState;
var addressEquals = AccountUtils.addressEquals;
var initializeTokenWithProxyAndMintController = mintUtils.initializeTokenWithProxyAndMintController;
var checkMintControllerState = mintUtils.checkMintControllerState;

var zeroAddress = "0x0000000000000000000000000000000000000000";
var maxAmount = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

async function run_tests_MintController(newToken, accounts) {
    run_MINT_tests(newToken, MintController, accounts);
}

async function run_tests_MasterMinter(newToken, accounts) {
    run_MINT_tests(newToken, MasterMinter, accounts);
}

async function run_MINT_tests(newToken, MintControllerArtifact, accounts) {

    beforeEach('Make fresh token contract', async function () {
        rawToken = await newToken();
        tokenConfig = await initializeTokenWithProxyAndMintController(rawToken, MintControllerArtifact);
        token = tokenConfig.token;
        mintController = tokenConfig.mintController;
        expectedMintControllerState = clone(tokenConfig.customState);
        expectedTokenState = [{ 'variable': 'masterMinter', 'expectedValue': mintController.address }];
    });

    it('arg000 transferOwnership(msg.sender) works', async function () {
        await mintController.transferOwnership(Accounts.mintOwnerAccount, {from: Accounts.mintOwnerAccount});
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg001 transferOwnership(0) reverts', async function () {
        await expectRevert(mintController.transferOwnership(zeroAddress, {from: Accounts.mintOwnerAccount}));
    });

    it('arg002 transferOwnership(owner) works', async function () {
        await mintController.transferOwnership(Accounts.mintOwnerAccount, {from: Accounts.mintOwnerAccount});
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg003 configureController(0, M) works', async function () {
        await mintController.configureController(zeroAddress, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        // need to manually check mintController.controllers[0] because this is not a predefined account
        var actualMinter = await mintController.controllers(zeroAddress);
        assert.isTrue(addressEquals(Accounts.minterAccount, actualMinter));
    });

    it('arg004 configureController(msg.sender, M) works', async function () {
        await mintController.configureController(Accounts.mintOwnerAccount, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['mintOwnerAccount'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg005 configureController(M, M) works', async function () {
        await mintController.configureController(Accounts.minterAccount, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['minterAccount'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg006 configureController(C, 0) throws', async function () {
        await expectError(mintController.configureController(Accounts.controller1Account, zeroAddress, {from: Accounts
        .mintOwnerAccount}), "Worker must be a non-zero address");
    });

    it('arg007 removeController(0) works', async function () {
        // expect no changes
        await mintController.removeController(zeroAddress, {from: Accounts.mintOwnerAccount});
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        // now make 0 a controller
        await mintController.configureController(zeroAddress, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        var actualMinter = await mintController.controllers(zeroAddress);
        assert.isTrue(addressEquals(Accounts.minterAccount, actualMinter));

        // remove 0
        await mintController.removeController(zeroAddress, {from: Accounts.mintOwnerAccount});
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
        actualMinter = await mintController.controllers(zeroAddress);
        assert.equal(actualMinter, zeroAddress);
    });

    it('arg008 setMinterManager(0) works', async function () {
        await mintController.setMinterManager(zeroAddress, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.minterManager = zeroAddress;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg009 setMinterManager(oldMinterManager) works', async function () {
        await mintController.setMinterManager(token.address, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.minterManager = token.address;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg010 setMinterManager(user_account) works', async function () {
        await mintController.setMinterManager(Accounts.arbitraryAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg011 setMinterManager(newToken) works', async function () {
        var newToken = await FiatToken.new();
        await mintController.setMinterManager(newToken.address, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.minterManager = newToken.address;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg012 configureMinter(0) sets allowance to 0', async function () {
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(0, {from: Accounts.controller1Account});

        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(0) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg013 configureMinter(oldAllowance) makes no changes', async function () {
        var oldAllowance = 64738;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(oldAllowance, {from: Accounts.controller1Account});
        await mintController.configureMinter(oldAllowance, {from: Accounts.controller1Account});

        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(oldAllowance) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg014 configureMinter(MAX) works', async function () {
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(maxAmount, {from: Accounts.controller1Account});

        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(maxAmount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg015 incrementMinterAllowance(0) makes no changes to allowance', async function () {
        var amount = 897;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(amount, {from: Accounts.controller1Account});
        await mintController.incrementMinterAllowance(0, {from: Accounts.controller1Account});

        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg016 incrementMinterAllowance(oldAllowance) doubles the allowance', async function () {
        var amount = 897;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(amount, {from: Accounts.controller1Account});
        await mintController.incrementMinterAllowance(amount, {from: Accounts.controller1Account});

        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(2*amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('arg017 incrementMinterAllowance(MAX) throws', async function () {
        var amount = 1;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(amount, {from: Accounts.controller1Account});
        await expectJump(mintController.incrementMinterAllowance(maxAmount, {from: Accounts.controller1Account}));
    });

    it('arg018 incrementMinterAlllowance(BIG) throws', async function () {
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(maxAmount, {from: Accounts.controller1Account});
        await expectJump(mintController.incrementMinterAllowance(1, {from: Accounts.controller1Account}));
    });

}

var testWrapper = require('./../TestWrapper');
testWrapper.execute('MINTp0_ArgumentTests MintController', run_tests_MintController);
testWrapper.execute('MINTp0_ArgumentTests MasterMinter', run_tests_MasterMinter);
