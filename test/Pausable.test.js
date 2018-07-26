var Tx = require('ethereumjs-tx');

var Pausable = artifacts.require('Pausable');
var tokenUtils = require('./TokenTestUtils');
var BigNumber = require('bignumber.js');
var expectRevert = tokenUtils.expectRevert;
var deployerAccount = tokenUtils.deployerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var pauserAccount = tokenUtils.pauserAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;


const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

contract('PausableTests', function (accounts) {
    var pause;
    beforeEach(async function checkBefore() {
        pause = await Pausable.new();
        await pause.updatePauser(pauserAccount);
    });

    it('constructor owner', async function () {
        var actualOwner = await pause.owner.call();
        assert.equal(deployerAccount, actualOwner, "wrong owner");
    });

    it('constructor pauser', async function () {
        var actualOwner = await pause.pauser.call();
        assert.equal(pauserAccount, actualOwner, "wrong pauser");
    });

    it('paused after pausing', async function () {
        await checkUnPaused();

        await pause.pause({from: pauserAccount});
        await checkPaused();

        // should stay paused even if we call it again
        await pause.pause({from: pauserAccount});
        await checkPaused();

        await pause.unpause({from: pauserAccount});
        await checkUnPaused();
    });

    it('update pauser', async function() {
        // pause from original pauser
        await pause.pause({from: pauserAccount});
        await checkPaused("should have paused from original pauser account");

        await pause.updatePauser(arbitraryAccount, {from: deployerAccount});
        var newPauser = await pause.pauser.call();
        assert.equal(arbitraryAccount, newPauser);
        // double check we're still paused
        await checkPaused("should still be paused after changing pauser");

        await pause.unpause({from: arbitraryAccount});
        await checkUnPaused();

        //original pauser shouldn't work anymore
        await expectRevert(pause.pause({from:pauserAccount}));
    });

    it('fail to update pauser from wrong account', async function() {
        await expectRevert(pause.updatePauser(arbitraryAccount, {from:arbitraryAccount}));
    });

    it('fail to pause from wrong account', async function() {
        await expectRevert(pause.pause({from:arbitraryAccount}));
    });

    it('fail to unpause from wrong account', async function() {
        await pause.pause({from: pauserAccount});
        await checkPaused();

        await expectRevert(pause.unpause({from:arbitraryAccount}));
    });

    async function checkPaused(msg ) {
        var paused = await pause.paused.call();
        assert.isTrue(paused, msg);
    }

    async function checkUnPaused(msg) {
        var paused = await pause.paused.call();
        assert.isFalse(paused, msg);
    }
});
