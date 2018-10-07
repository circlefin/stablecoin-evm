var MintController = artifacts.require('minting/MintController');
var FiatToken = artifacts.require('FiatTokenV1');

var BigNumber = require('bignumber.js');
var tokenUtils = require('./../TokenTestUtils');
var checkMINTp0 = tokenUtils.checkMINTp0;
var expectRevert = tokenUtils.expectRevert;
var bigZero = tokenUtils.bigZero;

var clone = require('clone');

var mintUtils = require('./MintControllerUtils.js');
var AccountUtils = require('./../AccountUtils.js');
var Accounts = AccountUtils.Accounts;
var getAccountState = AccountUtils.getAccountState;
var MintControllerState = AccountUtils.MintControllerState;
var initializeTokenWithProxyAndMintController = mintUtils.initializeTokenWithProxyAndMintController;
var checkMintControllerState = mintUtils.checkMintControllerState;

var zeroAddress = "0x0000000000000000000000000000000000000000";

async function run_tests(newToken, accounts) {

    beforeEach('Make fresh token contract', async function () {
        rawToken = await newToken();
        tokenConfig = await initializeTokenWithProxyAndMintController(rawToken);
        token = tokenConfig.token;
        mintController = tokenConfig.mintController;
        expectedMintControllerState = clone(tokenConfig.customState);
        expectedTokenState = [{ 'variable': 'masterMinter', 'expectedValue': mintController.address }];
    });

    it('bt004 configureController works when owner is msg.sender', async function () {
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt005 configureController reverts when owner is not msg.sender', async function () {
        await expectRevert(mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.arbitraryAccount}));
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt008 removeController works when owner is msg.sender', async function () {
        // add a controller
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        // now remove it
        await mintController.removeController(Accounts.controller1Account, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = zeroAddress;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt009 removeController reverts when owner is not msg.sender', async function () {
        // add a controller
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        // fail to remove it
        await expectRevert(mintController.removeController(Accounts.controller1Account, {from: Accounts.arbitraryAccount}));
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt016 Constructor sets all controllers to 0', async function () {
         await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt017 removeController does not revert when controllers[C] is 0', async function () {
        //  "remove" a controller that does not exist
        await mintController.removeController(Accounts.controller1Account, {from: Accounts.mintOwnerAccount});
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt018 removeController removes an arbitrary controller', async function () {
        // add a controller
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        // now remove it
        await mintController.removeController(Accounts.controller1Account, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = zeroAddress;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt019 configureController works when controller[C]=0', async function () {
        // note: this is a duplicate of bt004
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt020 configureController works when controller[C] != 0', async function () {
        // set controllers[controller1Account]=minterAccount
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        // now set controllers[controller1Account]=arbitraryAccount
        await mintController.configureController(Accounts.controller1Account, Accounts.arbitraryAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.arbitraryAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt021 configureController(C,C) works', async function () {
        await mintController.configureController(Accounts.controller1Account, Accounts.controller1Account, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.controller1Account;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt022 configureController works when setting controller[C]=msg.sender', async function () {
        await mintController.configureController(Accounts.mintOwnerAccount, Accounts.controller1Account, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.mintOwnerAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt023 configureController(C, newM) works when controller[C]=newM', async function () {
         // set controllers[controller1Account]=minterAccount
         await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
         expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
         await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

         // now set controllers[controller1Account]=arbitraryAccount
         await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
         await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt045 constructor - minterManager.isMinter[ALL] is false', async function () {
        var minterManager = FiatToken.at(await mintController.minterManager());

        var isMinterMappingEval = async function(accountAddress) {
            return await minterManager.isMinter(accountAddress);
        };

        var isMinterResults = await getAccountState(isMinterMappingEval, Accounts);
        for(var account in Accounts) {
            assert.isFalse(isMinterResults[account]);
        }
    });

    it('bt046 constructor - minterManager.minterAllowance[ALL] = 0', async function () {
        var minterManager = FiatToken.at(await mintController.minterManager());

        var minterAllowanceMapping = async function(accountAddress) {
            return await minterManager.minterAllowance(accountAddress);
        };

        var minterAllowanceResults = await getAccountState(minterAllowanceMapping, Accounts);
        for(var account in Accounts) {
            assert(new BigNumber(minterAllowanceResults[account]).isEqualTo(new BigNumber(0)));
        }
    });

}

var testWrapper = require('./../TestWrapper');
testWrapper.execute('MINTp0_BasicTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
