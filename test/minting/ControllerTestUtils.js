var BigNumber = require('bignumber.js');
var Q = require('q');
var clone = require('clone');

// set to true to enable verbose logging in the tests
var debugLogging = false;


var tokenUtils = require('./../TokenTestUtils');

var Controller = artifacts.require('./../minting/Controller');
var AccountUtils = require('./../AccountUtils');
var Accounts = AccountUtils.Accounts;
var setAccountDefault = AccountUtils.setAccountDefault;
var checkState = AccountUtils.checkState;
var getAccountState = AccountUtils.getAccountState;

function ControllerState(owner, controllers) {
    this.owner = owner;
    this.controllers = controllers;
    this.checkState = checkControllerState;
    this.checkState = async function(controllerContract) {await checkControllerState(controllerContract, this)};
//    this.clone = function(){return clone(this);};
    //this.clone = function(){return new ControllerState(this.owner, clone(this.controllers))};
}

// Default state of Controller when it is deployed
var controllerEmptyState = new ControllerState(
    Accounts.mintOwnerAccount,
    setAccountDefault(Accounts, "0x0000000000000000000000000000000000000000")
);

// Checks the state of an array of controller contracts
async function checkControllerState(controller, customState) {
    await checkState(controller, customState, controllerEmptyState, getActualControllerState, Accounts, true);
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
       return new ControllerState(owner, controllerState);
    });
}

module.exports = {
    controllerEmptyState: controllerEmptyState,
    checkControllerState: checkControllerState,
    getActualControllerState: getActualControllerState
}