var BigNumber = require('bignumber.js');
var Q = require('q');

// set to true to enable verbose logging in the tests
var debugLogging = false;


var tokenUtils = require('./../TokenTestUtils');

var Controller = artifacts.require('./../minting/Controller');
var AccountUtils = require('./AccountUtils');
var mcAccounts = AccountUtils.mcAccounts;
var setAccountDefault = AccountUtils.setAccountDefault;
var checkState = AccountUtils.checkState;
var getAccountState = AccountUtils.getAccountState;

// Default state of Controller when it is deployed
var controllerEmptyState = {
    'owner': mcAccounts.mintOwnerAccount,
    'controllers': setAccountDefault(mcAccounts, "0x0000000000000000000000000000000000000000")
};

// Checks the state of an array of controller contracts
async function checkControllerState(controllers, customVars, ignoreExtraStateVariables) {
    await checkState(controllers, customVars, controllerEmptyState, getActualControllerState, mcAccounts, ignoreExtraStateVariables);
}

// Gets the actual state of the controller contract.
// Evaluates all mappings on the provided accounts.
async function getActualControllerState(controllerContract, accounts) {
    // Lambda expressions for retrieving values from mappings
    var controllerMappingEval = async function(accountAddress) {
        return await controllerContract.controllers(accountAddress);
    };

    return Q.all([
        await controllerContract.owner.call(),
        await getAccountState(controllerMappingEval, accounts),
    ]).spread(function (
        owner,
        controllerState,
    ) {
        var actualState = {
            'owner': owner,
            'controllers': controllerState,
       };
       return actualState;
    })
}

module.exports = {
    controllerEmptyState: controllerEmptyState,
    checkControllerState: checkControllerState,
    getActualControllerState: getActualControllerState
}