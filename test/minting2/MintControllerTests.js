var MintController = artifacts.require('minting/MintController');

var BigNumber = require('bignumber.js');
var tokenUtils = require('./../TokenTestUtils');
var checkMINTp0 = tokenUtils.checkMINTp0;
var expectRevert = tokenUtils.expectRevert;
var bigZero = tokenUtils.bigZero;

var clone = require('clone');

var mintUtils = require('./../MintControllerUtils.js');
var AccountUtils = require('./../AccountUtils.js');
var Accounts = AccountUtils.Accounts;
var MintControllerState = AccountUtils.MintControllerState;
var initializeTokenWithProxyAndMintController = mintUtils.initializeTokenWithProxyAndMintController;
var checkMintControllerState = mintUtils.checkMintControllerState;

async function run_tests(newToken, accounts) {

    beforeEach('Make fresh token contract', async function () {
        rawToken = await newToken();
        tokenConfig = await initializeTokenWithProxyAndMintController(rawToken, MintController);
        token = tokenConfig.token;
        mintController = tokenConfig.mintController;
        expectedMintControllerState = clone(tokenConfig.customState);
        expectedTokenState = [{ 'variable': 'masterMinter', 'expectedValue': mintController.address }];
    });

    it('should mint through mint controller', async function () {
        var amount = 5000;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;

        await token.mint(Accounts.arbitraryAccount, amount, {from: Accounts.minterAccount});
        expectedTokenState.push(
             { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
             { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount) },
             { 'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)}
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

   it('initial state', async function () {
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

   it('only owner configures controller', async function () {
        await expectRevert(mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.minterAccount}));
   });

    it('remove controller', async function () {
        var amount = 5000;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        await mintController.removeController(Accounts.controller1Account, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = bigZero;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('only owner can remove controller', async function () {
         await expectRevert(mintController.removeController(Accounts.controller1Account, {from: Accounts.minterAccount}));
    });

   it('sets token', async function () {
        await mintController.setMinterManager(mintController.address, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.minterManager = mintController.address;
        checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
   });

   it('only owner sets token', async function () {
        await expectRevert(mintController.setMinterManager(mintController.address, {from: Accounts.minterAccount}));
   });

   it('remove minter', async function() {
        // create a minter
        var amount = 500;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
             { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
             { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        // remove minter
        await mintController.removeMinter({from: Accounts.controller1Account});
        expectedTokenState = [
             { 'variable': 'masterMinter', 'expectedValue': mintController.address },
        ];
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
   });

   it('only controller removes a minter', async function () {
        await expectRevert(mintController.removeMinter({from: Accounts.controller1Account}));
   });

   it('only controller configures a minter', async function () {
        await expectRevert(mintController.configureMinter(0, {from: Accounts.controller1Account}));
   });

   it('increment minter allowance', async function () {
        // configure controller & minter
        var amount = 500;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
             { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
             { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        // increment minter allowance
        await mintController.incrementMinterAllowance(amount, {from: Accounts.controller1Account});
        expectedTokenState = [
             { 'variable': 'masterMinter', 'expectedValue': mintController.address },
             { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
             { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount*2) },
        ];
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
   });

   it('only controller increments allowance', async function () {
        await expectRevert(mintController.incrementMinterAllowance(0, {from: Accounts.controller1Account}));
   });

   it('only active minters can have allowance incremented', async function () {
       // configure controller but not minter
        var amount = 500;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account']= Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        // increment minter allowance
        await expectRevert(mintController.incrementMinterAllowance(amount, {from: Accounts.controller1Account}));
   });
}

var testWrapper = require('./../TestWrapper');
testWrapper.execute('MintController_Tests', run_tests);

module.exports = {
  run_tests: run_tests,
}