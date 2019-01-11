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

    it('bt001 Constructor - owner is msg.sender', async function () {
        var newMintController = await MintController.new(token.address, {from: Accounts.arbitraryAccount});
        var owner = await newMintController.owner();
        assert.isTrue(addressEquals(owner, Accounts.arbitraryAccount));
    });

    it('bt002 transferOwnership works when owner is msg.sender', async function () {
        await mintController.transferOwnership(Accounts.arbitraryAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.owner = Accounts.arbitraryAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt003 transferOwnership reverts when owner is not msg.sender', async function () {
        await expectRevert(mintController.transferOwnership(Accounts.arbitraryAccount, {from: Accounts.arbitraryAccount}));
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

    it('bt006 setMinterManager works when owner is msg.sender', async function () {
        await mintController.setMinterManager(Accounts.arbitraryAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt007 setMinterManager reverts when owner is not msg.sender', async function () {
        await expectRevert(mintController.setMinterManager(Accounts.arbitraryAccount, {from: Accounts.arbitraryAccount}));
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

    it('bt010 removeMinter reverts when msg.sender is not a controller', async function () {
        await expectError(mintController.removeMinter({from: Accounts.controller1Account}), "Sender must be a controller");
    });

    it('bt011 removeMinter sets minters[M] to 0', async function () {
        // add a minter
        var amount = 789;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(amount, {from: Accounts.controller1Account});

        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        // remove minter
        await mintController.removeMinter({from: Accounts.controller1Account});
        expectedTokenState.pop();
        expectedTokenState.pop();
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt012 configureMinter reverts when msg.sender is not a controller', async function () {
        await expectError(mintController.configureMinter(50, {from: Accounts.controller1Account}), "Sender must be a controller");
    });

    it('bt013 configureMinter works when controllers[msg.sender]=M', async function () {
        // add a controller
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});

        // now configure minter
        var amount = 6789;
        await mintController.configureMinter(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt014 incrementMinterAllowance reverts if msg.sender is not a controller', async function () {
        await expectError(mintController.incrementMinterAllowance(50, {from: Accounts.controller1Account}), "Sender must be a controller");
    });

    it('bt015 incrementMinterAllowance works when controllers[msg.sender]=M', async function () {
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(0, {from: Accounts.controller1Account});

        // now configure minter
        var amount = 6789;
        await mintController.incrementMinterAllowance(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
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

         // now set controllers[controller1Account]=minterAccount
         await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
         await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt024 Constructor sets minterManager', async function () {
        var minterManagerAddress = await mintController.minterManager();
        assert.isTrue(addressEquals(token.address, minterManagerAddress));
    });

    it('bt026 setMinterManager(x) works when existing minterManager != 0', async function () {
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        await mintController.setMinterManager(Accounts.arbitraryAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt027 setMinterManager(x) works when x = msg.sender', async function () {
        await mintController.setMinterManager(Accounts.mintOwnerAccount, {from: Accounts.mintOwnerAccount});
        expectedMintControllerState.minterManager = Accounts.mintOwnerAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt028 setMinterManager(x) works when x = minterManager', async function () {
        var minterManagerAddress = await mintController.minterManager();
        await mintController.setMinterManager(minterManagerAddress, {from: Accounts.mintOwnerAccount});
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt030 removeMinter reverts when minterManager is 0', async function () {
         // set minterManager
         var minterManagerAddress = await mintController.minterManager();
         await mintController.setMinterManager(minterManagerAddress, {from:Accounts.mintOwnerAccount});
         expectedMintControllerState.minterManager = minterManagerAddress;
         await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

         // configure minter will fail with any args
         await(expectRevert(mintController.removeMinter({from: Accounts.controller1Account})));
    });

    it('bt031 removeMinter reverts when minterManager is a user account', async function () {
         // set minterManager to user account
         await mintController.setMinterManager(Accounts.arbitraryAccount, {from:Accounts.mintOwnerAccount});
         expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
         await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

         // configure minter will fail with any args
         await(expectRevert(mintController.removeMinter({from: Accounts.controller1Account})));
    });

    it('bt032 removeMinter works when minterManager is ok', async function () {
        // add a minter
        var amount = 3;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(amount, {from: Accounts.controller1Account});

        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        // remove minter
        await mintController.removeMinter({from: Accounts.controller1Account});
        expectedTokenState.pop();
        expectedTokenState.pop();
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt034 configureMinter reverts when minterManager is a user account', async function () {
         // set minterManager to user account
         await mintController.setMinterManager(Accounts.arbitraryAccount, {from:Accounts.mintOwnerAccount});
         expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
         await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

         // configure minter will fail with any args
         await(expectRevert(mintController.configureMinter(50, {from: Accounts.controller1Account})));
    });

    it('bt035 configureMinter works when minterManager is ok', async function () {
        var amount = 456;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt037 incrementMinterAllowance reverts when minterManager is a user account', async function () {
         // set minterManager to user account
         await mintController.setMinterManager(Accounts.arbitraryAccount, {from:Accounts.mintOwnerAccount});
         expectedMintControllerState.minterManager = Accounts.arbitraryAccount;
         await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

         // incrementMinterAllowance will fail with any args
         await(expectRevert(mintController.incrementMinterAllowance(50, {from: Accounts.controller1Account})));
    });

    it('bt038 incrementMinterAllowance works when minterManager is ok', async function () {
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(0, {from: Accounts.controller1Account});

        // now incrementMinterAllowance
        var amount = 45;
        await mintController.incrementMinterAllowance(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt039 configureMinter(M, amt) works when minterManager.isMinter(M)=false', async function () {
        var amount = 64;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});

        var minterManager = await FiatToken.at(await mintController.minterManager());
        var isMinter = await minterManager.isMinter(Accounts.minterAccount);
        assert.isFalse(isMinter);

        await mintController.configureMinter(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt040 configureMinter(M, amt) works when minterManager.isMinter(M)=true', async function () {
        var amount = 64;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(0, {from: Accounts.controller1Account});

        var minterManager = await FiatToken.at(await mintController.minterManager());
        var isMinter = await minterManager.isMinter(Accounts.minterAccount);
        assert.isTrue(isMinter);

        await mintController.configureMinter(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt041 removeMinter(M) works when minterManager.isMinter(M)=false', async function () {
        var amount = 64;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});

        var minterManager = await FiatToken.at(await mintController.minterManager());
        var isMinter = await minterManager.isMinter(Accounts.minterAccount);
        assert.isFalse(isMinter);

        await mintController.removeMinter({from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt042 removeMinter(M) works when minterManager.isMinter(M)=true', async function () {
        var amount = 64;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(0, {from: Accounts.controller1Account});

        var minterManager = await FiatToken.at(await mintController.minterManager());
        var isMinter = await minterManager.isMinter(Accounts.minterAccount);
        assert.isTrue(isMinter);

        await mintController.removeMinter({from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt043 incrementMinterAllowance(M, amt) reverts when minterManager.isMinter(M)=false', async function () {
        var amount = 64;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});

        var minterManager = await FiatToken.at(await mintController.minterManager());
        var isMinter = await minterManager.isMinter(Accounts.minterAccount);
        assert.isFalse(isMinter);

        await expectError(mintController.incrementMinterAllowance(amount, {from: Accounts.controller1Account}), "Can only increment allowance for enabled minter");
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt044 incrementMinterAllowance(M, amt) works when minterManager.isMinter(M)=true', async function () {
        var amount = 65424;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(0, {from: Accounts.controller1Account});

        var minterManager = await FiatToken.at(await mintController.minterManager());
        var isMinter = await minterManager.isMinter(Accounts.minterAccount);
        assert.isTrue(isMinter);

        await mintController.incrementMinterAllowance(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt045 constructor - minterManager.isMinter[ALL] is false', async function () {
        var minterManager = await FiatToken.at(await mintController.minterManager());

        var isMinterMappingEval = async function(accountAddress) {
            return await minterManager.isMinter(accountAddress);
        };

        var isMinterResults = await getAccountState(isMinterMappingEval, Accounts);
        for(var account in Accounts) {
            assert.isFalse(isMinterResults[account]);
        }
    });

    it('bt046 constructor - minterManager.minterAllowance[ALL] = 0', async function () {
        var minterManager = await FiatToken.at(await mintController.minterManager());

        var minterAllowanceMapping = async function(accountAddress) {
            return await minterManager.minterAllowance(accountAddress);
        };

        var minterAllowanceResults = await getAccountState(minterAllowanceMapping, Accounts);
        for(var account in Accounts) {
            assert(minterAllowanceResults[account].isZero());
        }
    });

    it('bt047 incrementMinterAllowance(M,amt) works when minterAllowance is 0', async function () {
        var amount = 64;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(0, {from: Accounts.controller1Account});

        var minterManager = await FiatToken.at(await mintController.minterManager());
        var minterAllowance = await minterManager.minterAllowance(Accounts.minterAccount);
        assert(minterAllowance.isZero());

        await mintController.incrementMinterAllowance(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt048 incrementMinterAllowance(M, amt) works when minterAllowance > 0', async function () {
        var initialAmount = 987341;
        var incrementAmount = 64;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(initialAmount, {from: Accounts.controller1Account});

        var minterManager = await FiatToken.at(await mintController.minterManager());
        var minterAllowance = await minterManager.minterAllowance(Accounts.minterAccount);
        assert(minterAllowance.cmp(newBigNumber(initialAmount))==0);

        await mintController.incrementMinterAllowance(incrementAmount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(initialAmount + incrementAmount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

   it('bt049 incrementMinterAllowance(M,amt) reverts when minterAllowance[M] + amt > 2^256', async function () {
        var initialAmount = "0x" + newBigNumber(maxAmount).sub(newBigNumber(45)).toString(16,64);
        var incrementAmount = 64;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(initialAmount, {from: Accounts.controller1Account});

        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(initialAmount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);

        await expectJump(mintController.incrementMinterAllowance(incrementAmount, {from: Accounts.controller1Account}));

    });

   it('bt050 configureMinter(M,amt) works when minterAllowance=0', async function () {
        var amount = 64;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(0, {from: Accounts.controller1Account});

        var minterManager = await FiatToken.at(await mintController.minterManager());
        var minterAllowance = await minterManager.minterAllowance(Accounts.minterAccount);
        assert(minterAllowance.cmp(newBigNumber(0))==0);

        await mintController.configureMinter(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt051 configureMinter(M,amt) works when minterAllowance>0', async function () {
        var amount = 64;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(amount, {from: Accounts.controller1Account});

        var minterManager = await FiatToken.at(await mintController.minterManager());
        var minterAllowance = await minterManager.minterAllowance(Accounts.minterAccount);
        assert(minterAllowance.cmp(newBigNumber(amount))==0);

        await mintController.configureMinter(2* amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(2*amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt052 configureMinter(M,amt) works when amt+minterAllowance > 2^256', async function () {
        var amount = 64;
        var minterAllowance = maxAmount;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(maxAmount, {from: Accounts.controller1Account});

        await mintController.configureMinter(amount, {from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        expectedTokenState.push(
            { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
            { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) }
        );
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt053 removeMinter works when the minterAllowance is 0', async function () {
        var amount = 64;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(0, {from: Accounts.controller1Account});

        var minterManager = await FiatToken.at(await mintController.minterManager());
        var minterAllowance = await minterManager.minterAllowance(Accounts.minterAccount);
        assert(minterAllowance.isZero());

        await mintController.removeMinter({from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt054 removeMinter works when the minterAllowance is not zero', async function () {
        var amount = 64;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(amount, {from: Accounts.controller1Account});

        var minterManager = await FiatToken.at(await mintController.minterManager());
        var minterAllowance = await minterManager.minterAllowance(Accounts.minterAccount);
        assert(minterAllowance.cmp(newBigNumber(amount))==0);

        await mintController.removeMinter({from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });

    it('bt055 removeMinter works when the minterAllowance is big', async function () {
        var amount = maxAmount;
        await mintController.configureController(Accounts.controller1Account, Accounts.minterAccount, {from: Accounts.mintOwnerAccount});
        await mintController.configureMinter(maxAmount, {from: Accounts.controller1Account});

        await mintController.removeMinter({from: Accounts.controller1Account});
        expectedMintControllerState.controllers['controller1Account'] = Accounts.minterAccount;
        await checkMINTp0([token, mintController], [expectedTokenState, expectedMintControllerState]);
    });
}

var testWrapper = require('./../TestWrapper');
testWrapper.execute('MINTp0_BasicTests MintController', run_tests_MintController);
testWrapper.execute('MINTp0_BasicTests MasterMinter', run_tests_MasterMinter);
