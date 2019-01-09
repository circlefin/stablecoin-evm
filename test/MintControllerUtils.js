var BigNumber = require('bignumber.js');
var bigZero = new BigNumber(0);

var tokenUtils = require('./TokenTestUtils.js');
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;

var MintController = artifacts.require('./minting/MintController');
var AccountUtils = require('./AccountUtils.js');
var Accounts = AccountUtils.Accounts;
var checkState = AccountUtils.checkState;
var getAccountState = AccountUtils.getAccountState;

var ControllerUtils = require('./ControllerTestUtils.js');
var checkControllerState = ControllerUtils.checkControllerState;

function MintControllerState(owner, controllers, minterManager) {
    this.owner = owner;
    this.controllers = controllers;
    this.minterManager = minterManager;
    this.checkState = async function(mintController) {await checkMintControllerState(mintController, this)};
}

// Default state of MintController when it is deployed
var mintControllerEmptyState = new MintControllerState(null, {}, bigZero);

// Checks the state of the mintController contract
async function checkMintControllerState(mintController, customState) {
    await checkControllerState(mintController, customState);
    await checkState(mintController, customState, mintControllerEmptyState, getActualMintControllerState, Accounts, true);
}


// Gets the actual state of the mintController contract.
// Evaluates all mappings on the provided accounts.
async function getActualMintControllerState(mintController, accounts) {
    var minterManager = await mintController.minterManager.call();
    return new MintControllerState(null, {}, minterManager);
}

// Deploys a FiatTokenV1 with a MintController contract as the masterMinter.
// Uses the same workflow we would do in production - first deploy FiatToken then set the masterMinter.
async function initializeTokenWithProxyAndMintController(rawToken, MintControllerArtifact) {
   var tokenConfig = await initializeTokenWithProxy(rawToken);
   var mintController = await MintControllerArtifact.new(tokenConfig.token.address, {from:Accounts.mintOwnerAccount});
   await tokenConfig.token.updateMasterMinter(mintController.address, {from:Accounts.tokenOwnerAccount});
    var tokenConfigWithMinter = {
        proxy: tokenConfig.proxy,
        token: tokenConfig.token,
        mintController: mintController,
        customState: new MintControllerState(null, {}, tokenConfig.token.address)
    };
    return tokenConfigWithMinter;
}

module.exports = {
    initializeTokenWithProxyAndMintController: initializeTokenWithProxyAndMintController,
    checkMintControllerState: checkMintControllerState,
    MintControllerState: MintControllerState
}