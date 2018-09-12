var BigNumber = require('bignumber.js');
var bigZero = new BigNumber(0);

var tokenUtils = require('./../TokenTestUtils');
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;

var MintController = artifacts.require('./../minting/MintController');
var AccountUtils = require('./AccountUtils');
var mcAccounts = AccountUtils.mcAccounts;
var setAccountDefault = AccountUtils.setAccountDefault;
var checkState = AccountUtils.checkState;
var getAccountState = AccountUtils.getAccountState;

var ControllerUtils = require('./ControllerTestUtils');
var checkControllerState = ControllerUtils.checkControllerState;


// Deploys a FiatTokenV1 with a MintController contract as the masterMinter.
// Uses the same workflow we would do in production - first deploy FiatToken then set the masterMinter.
async function initializeTokenWithProxyAndMintController(rawToken) {
   var tokenConfig = await initializeTokenWithProxy(rawToken);
   var mintController = await MintController.new(tokenConfig.token.address, {from:mcAccounts.mintOwnerAccount});
   await tokenConfig.token.updateMasterMinter(mintController.address, {from:tokenUtils.tokenOwnerAccount});
    var tokenConfigWithMinter = {
        proxy: tokenConfig.proxy,
        token: tokenConfig.token,
        mintController: mintController
    };
    return tokenConfigWithMinter;
}

// Default state of MintController when it is deployed
var mintControllerEmptyState = {
    'token' : bigZero,
};

// Checks the state of the mintController contract
async function checkMintControllerState(mintControllers, customVars) {
    await checkControllerState(mintControllers, customVars, true);
    await checkState(mintControllers, customVars, mintControllerEmptyState, getActualMintControllerState, mcAccounts, true);
}


// Gets the actual state of the mintController contract.
// Evaluates all mappings on the provided accounts.
async function getActualMintControllerState(mintController, accounts) {
    return {
        'token': await mintController.token.call()
    };
}

module.exports = {
    initializeTokenWithProxyAndMintController: initializeTokenWithProxyAndMintController,
    checkMintControllerState: checkMintControllerState
}