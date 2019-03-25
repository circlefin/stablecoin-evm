var MintController = artifacts.require('minting/MintController');
var MasterMinter = artifacts.require('minting/MasterMinter');
var MintController = artifacts.require('minting/MintController');
var MasterMinter = artifacts.require('minting/MasterMinter');
var FiatToken = artifacts.require('FiatTokenV1');

var tokenUtils = require('../TokenTestUtils.js');
var newBigNumber = tokenUtils.newBigNumber;
var checkMINTp0 = tokenUtils.checkMINTp0;
var expectRevert = tokenUtils.expectRevert;
var expectJump = tokenUtils.expectJump;
var expectError = tokenUtils.expectError;
var bigZero = tokenUtils.bigZero;
var maxAmount = tokenUtils.maxAmount;

var clone = require('clone');

var mintUtils = require('../MintControllerUtils.js');
var AccountUtils = require('../AccountUtils.js');
var Accounts = AccountUtils.Accounts;
var getAccountState = AccountUtils.getAccountState;
var MintControllerState = AccountUtils.MintControllerState;
var addressEquals = AccountUtils.addressEquals;
var initializeTokenWithProxyAndMintController = mintUtils.initializeTokenWithProxyAndMintController;
var checkMintControllerState = mintUtils.checkMintControllerState;

var zeroAddress = "0x0000000000000000000000000000000000000000";
var maxAmount = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

var mintControllerEvents = {
    ownershipTransferred: "OwnershipTransferred",
    controllerConfigured: "ControllerConfigured",
    controllerRemoved: "ControllerRemoved",
    minterManagerSet: "MinterManagerSet",
    minterCofigured: "MinterConfigured",
    minterRemoved: "MinterRemoved",
    minterAllowanceIncremented: "MinterAllowanceIncremented",
    minterAllowanceDecremented: "MinterAllowanceDecremented"
};




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

    it('et100 transferOwnership emits OwnershipTransferred event', async function () {
        // get all previous transfer ownership events
        var preEvents = await mintController.getPastEvents(mintControllerEvents.ownershipTransferred,
            {filter: {previousOwner: Accounts.mintOwnerAccount, newOwner: Accounts.arbitraryAccount}});

        // now transfer ownership and test again
        await mintController.transferOwnership(Accounts.arbitraryAccount, {from: Accounts.mintOwnerAccount});
        var postEvents = await mintController.getPastEvents(mintControllerEvents.ownershipTransferred,
            {filter: {previousOwner: Accounts.mintOwnerAccount, newOwner: Accounts.arbitraryAccount}});

        // one new event must have fired
        assert.equal(preEvents.length+1, postEvents.length);
    });

    it('et101 configureController emits ControllerConfigured event', async function () {
        // get all previous configure controller events
        var preEvents = await mintController.getPastEvents(mintControllerEvents.controllerConfigured,
            {filter: {_controller: Accounts.arbitraryAccount, _worker: Accounts.arbitraryAccount2}});

        // now configure controller and test again
        await mintController.configureController(Accounts.arbitraryAccount, Accounts.arbitraryAccount2, {from: Accounts.mintOwnerAccount});
        var postEvents = await mintController.getPastEvents(mintControllerEvents.controllerConfigured,
            {filter: {_controller: Accounts.arbitraryAccount, _worker: Accounts.arbitraryAccount2}});

        // one new event must have fired
        assert.equal(preEvents.length+1, postEvents.length);
    });

    it('et102 removeController emits ControllerRemoved event', async function () {
        // get all previous removeController events
        await mintController.configureController(Accounts.arbitraryAccount, Accounts.arbitraryAccount2, {from: Accounts.mintOwnerAccount});
        var preEvents = await mintController.getPastEvents(mintControllerEvents.controllerRemoved,
            {filter: {_controller: Accounts.arbitraryAccount}});

        // now remove controller and test again
        await mintController.removeController(Accounts.arbitraryAccount, {from: Accounts.mintOwnerAccount});
        var postEvents = await mintController.getPastEvents(mintControllerEvents.controllerRemoved,
            {filter: {_controller: Accounts.arbitraryAccount}});

        // one new event must have fired
        assert.equal(preEvents.length+1, postEvents.length);
    });

    it('et103 setMinterManager emits MinterManagerSet event', async function () {
        // get all previous set minter manager events
        var preEvents = await mintController.getPastEvents(mintControllerEvents.minterManagerSet,
            {filter: {_oldMinterManager: token.address, _newMinterManager: Accounts.arbitraryAccount}});

        // now set minter manager and test again
        await mintController.setMinterManager(Accounts.arbitraryAccount, {from: Accounts.mintOwnerAccount});
        var postEvents = await mintController.getPastEvents(mintControllerEvents.minterManagerSet,
            {filter: {_oldMinterManager: token.address, _newMinterManager: Accounts.arbitraryAccount}});

        // one new event must have fired
        assert.equal(preEvents.length+1, postEvents.length);
    });


    it('et104 removeMinter emits MinterRemoved event', async function () {
        // get all previous remove minter events
        var allowance = 10;
        await mintController.configureController(Accounts.arbitraryAccount, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(allowance, {from: Accounts.arbitraryAccount});
        var preEvents = await mintController.getPastEvents(mintControllerEvents.minterRemoved,
            {filter: {_msgSender: Accounts.arbitraryAccount, _minter: Accounts.minterAccount}});

        // now remove minter and test again
        await mintController.removeMinter({from: Accounts.arbitraryAccount});
        var postEvents = await mintController.getPastEvents(mintControllerEvents.minterRemoved,
            {filter: {_msgSender: Accounts.arbitraryAccount, _minter: Accounts.minterAccount}});

        // one new event must have fired
        assert.equal(preEvents.length+1, postEvents.length);
    });

    it('et105 configureMinter emits MinterConfigured event', async function () {
        // get all previous configureMinter events
        var allowance = 10;
        await mintController.configureController(Accounts.arbitraryAccount, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        var preEvents = await mintController.getPastEvents(mintControllerEvents.minterCofigured,
            {filter: {_msgSender: Accounts.arbitraryAccount, _minter: Accounts.minterAccount, _allowance: allowance}});

        // now transfer ownership and test again
        await mintController.configureMinter(allowance, {from: Accounts.arbitraryAccount});
        var postEvents = await mintController.getPastEvents(mintControllerEvents.minterCofigured,
            {filter: {_msgSender: Accounts.arbitraryAccount, _minter: Accounts.minterAccount, _allowance: allowance}});

        // one new event must have fired
        assert.equal(preEvents.length+1, postEvents.length);
    });

    it('et106 incrementMinterAllowance emits MinterAllowanceIncremented event', async function () {
        // get all previous increment minter allowance events
        var allowance = 10;
        await mintController.configureController(Accounts.arbitraryAccount, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(allowance, {from: Accounts.arbitraryAccount});
        var preEvents = await mintController.getPastEvents(mintControllerEvents.minterAllowanceIncremented,
            {filter: {_msgSender: Accounts.arbitraryAccount, _minter: Accounts.minterAccount, _increment: allowance, _newAllowance: allowance*2}});

        // now increment minter allowance and test again
        await mintController.incrementMinterAllowance(allowance, {from: Accounts.arbitraryAccount});
        var postEvents = await mintController.getPastEvents(mintControllerEvents.minterAllowanceIncremented,
            {filter: {_msgSender: Accounts.arbitraryAccount, _minter: Accounts.minterAccount, _increment: allowance, _newAllowance: allowance*2}});

        // one new event must have fired
        assert.equal(preEvents.length+1, postEvents.length);
    });

    it('et107 decrementMinterAllowance emits MinterAllowanceDecremented event', async function () {
        // get all previous decrement minter allowance events
        var allowance = 10;
        await mintController.configureController(Accounts.arbitraryAccount, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(allowance, {from: Accounts.arbitraryAccount});
        var preEvents = await mintController.getPastEvents(mintControllerEvents.minterAllowanceDecremented,
            {filter: {_msgSender: Accounts.arbitraryAccount, _minter: Accounts.minterAccount, _decrement: allowance, _newAllowance: 0}});

        // now decrement minter allowance and test again
        await mintController.decrementMinterAllowance(allowance, {from: Accounts.arbitraryAccount});
        var postEvents = await mintController.getPastEvents(mintControllerEvents.minterAllowanceDecremented,
            {filter: {_msgSender: Accounts.arbitraryAccount, _minter: Accounts.minterAccount, _decrement: allowance, _newAllowance: 0}});

        // one new event must have fired
        assert.equal(preEvents.length+1, postEvents.length);
    });

}

var testWrapper = require('./../TestWrapper');
testWrapper.execute('MINTp0_EventTests MintController', run_tests_MintController);
testWrapper.execute('MINTp0_EventTests MasterMinter', run_tests_MasterMinter);
