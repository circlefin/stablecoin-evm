var Q = require('q');

// set to true to enable verbose logging in the tests
var debugLogging = false;

var Controller = artifacts.require('./../minting/Controller');
var AccountUtils = require('./AccountUtils.js');
var Accounts = AccountUtils.Accounts;
var setAccountDefault = AccountUtils.setAccountDefault;
var checkState = AccountUtils.checkState;
var getAccountState = AccountUtils.getAccountState;

function ControllerState(owner, controllers) {
    this.owner = owner;
    this.controllers = controllers;
    this.checkState = async function(controllerContract) {await checkControllerState(controllerContract, this)};
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
    return Q.all([
        controllerContract.owner.call(),
        getAccountState(controllerContract.controllers, accounts),
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