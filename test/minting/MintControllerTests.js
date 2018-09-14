var MintController = artifacts.require('minting/MintController');

var BigNumber = require('bignumber.js');
var tokenUtils = require('./../TokenTestUtils');
var checkVariables = tokenUtils.checkVariables;

var mintUtils = require('./MintControllerUtils.js');
var AccountUtils = require('./../AccountUtils.js');
var A = AccountUtils.Accounts;
var initializeTokenWithProxyAndMintController = mintUtils.initializeTokenWithProxyAndMintController;
var checkMintControllerState = mintUtils.checkMintControllerState;

async function run_tests(newToken, accounts) {

    beforeEach('Make fresh token contract', async function () {
        rawToken = await newToken();
        var tokenConfig = await initializeTokenWithProxyAndMintController(rawToken);
        token = tokenConfig.token;
        mintController = tokenConfig.mintController;
    });

    it('should mint through mint controller', async function () {

        var amount = 5000;
        await mintController.configureController(A.controller1Account, A.minterAccount, {from: A.mintOwnerAccount});
        await mintController.configureMinter(amount, {from: A.controller1Account});
        customState = {
            'token': token.address,
            'controllers': {'controller1Account': A.minterAccount }
        }
        await checkMintControllerState([mintController], [customState]);

        await token.mint(A.arbitraryAccount, amount, {from: A.minterAccount});
        customVars = [
             { 'variable': 'masterMinter', 'expectedValue': mintController.address },
             { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
             { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount) },
             { 'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)}
        ];
        await checkVariables([token], [customVars]);
    });

   it('initial state', async function () {
        customState = {
             'token': token.address,
        };

        await checkMintControllerState([mintController], [customState]);
    });

}

var testWrapper = require('./../TestWrapper');
testWrapper.execute('MintController_Tests', run_tests);

module.exports = {
  run_tests: run_tests,
}