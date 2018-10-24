var tokenUtils = require('./TokenTestUtils');
var FiatToken = tokenUtils.FiatToken;
var FiatTokenProxy = tokenUtils.FiatTokenProxy;

var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;

var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var encodeCall = tokenUtils.encodeCall;

var checkMintEvent = tokenUtils.checkMintEvent;
var checkMinterConfiguredEvent = tokenUtils.checkMinterConfiguredEvent;
var checkApprovalEvent = tokenUtils.checkApprovalEvent;
var checkBurnEvents = tokenUtils.checkBurnEvents;
var checkMinterRemovedEvent = tokenUtils.checkMinterRemovedEvent;
var checkBlacklistEvent = tokenUtils.checkBlacklistEvent;
var checkUnblacklistEvent = tokenUtils.checkUnblacklistEvent;
var checkPauserChangedEvent = tokenUtils.checkPauserChangedEvent;
var checkUnpauseEvent = tokenUtils.checkUnpauseEvent;
var checkTransferOwnershipEvent = tokenUtils.checkTransferOwnershipEvent;
var checkUpdateMasterMinterEvent = tokenUtils.checkUpdateMasterMinterEvent;
var checkBlacklisterChangedEvent = tokenUtils.checkBlacklisterChangedEvent;
var checkUpgradeEvent = tokenUtils.checkUpgradeEvent;
var checkAdminChangedEvent = tokenUtils.checkAdminChangedEvent;
var UpgradedFiatTokenNewFields = tokenUtils.UpgradedFiatTokenNewFields;
var checkPauseEvent = tokenUtils.checkPauseEvent;
var checkTransferEvents = tokenUtils.checkTransferEvents;

var AccountUtils = require('./AccountUtils');
var Accounts = AccountUtils.Accounts;

var amount = 100;

async function run_tests(newToken, accounts) {

  beforeEach('Make fresh token contract', async function () {
      rawToken = await FiatToken.new();
      var tokenConfig = await initializeTokenWithProxy(rawToken);
      proxy = tokenConfig.proxy;
      token = tokenConfig.token;
      assert.equal(proxy.address, token.address);
  });

  it('et000 should check MinterConfigured event', async function() {
    let configureMinter = await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    checkMinterConfiguredEvent(configureMinter, Accounts.minterAccount, amount);
  });

  it('et001 should check Mint/Transfer events', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    let mint = await token.mint(Accounts.arbitraryAccount, amount, {from: Accounts.minterAccount});
    checkMintEvent(mint, Accounts.arbitraryAccount, amount, Accounts.minterAccount);
  });

  it('et002 should check Burn/Transfer events', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.minterAccount, amount, { from: Accounts.minterAccount });
    let burn = await token.burn(amount, {from: Accounts.minterAccount});
    checkBurnEvents(burn, amount, Accounts.minterAccount);
  });

  it('et003 should check MinterRemoved event', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    let minterRemovedEvent = await token.removeMinter(Accounts.minterAccount, {from: Accounts.masterMinterAccount});
    checkMinterRemovedEvent(minterRemovedEvent, Accounts.minterAccount);
  });

  it('et004 should check MasterMinterChanged event', async function () {
    let updateMasterMinter = await token.updateMasterMinter(Accounts.arbitraryAccount, {from: Accounts.tokenOwnerAccount});
    checkUpdateMasterMinterEvent(updateMasterMinter, Accounts.arbitraryAccount);
  });

  it('et005 should check Blacklisted event', async function () {
    let blacklist = await token.blacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
    checkBlacklistEvent(blacklist, Accounts.arbitraryAccount);
  });

  it('et006 should check UnBlacklisted event', async function () {
    let unblacklist = await token.unBlacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
      checkUnblacklistEvent(unblacklist, Accounts.arbitraryAccount);
  });

  it('et007 should check BlacklisterChanged event', async function () {
    let blacklisterChanged = await token.updateBlacklister(Accounts.arbitraryAccount, {from: Accounts.tokenOwnerAccount});
    checkBlacklisterChangedEvent(blacklisterChanged, Accounts.arbitraryAccount);
  });

  it('et008 should check Upgraded event', async function () {
    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall('initV2', ['bool', 'address', 'uint256'], [true, Accounts.pauserAccount, 12]);
    let upgrade = await proxy.upgradeToAndCall(upgradedToken.address, initializeData, { from: Accounts.proxyOwnerAccount });
    checkUpgradeEvent(upgrade, upgradedToken.address);
  });

  it('et009 should check AdminChanged event', async function () {
    let adminChanged = await proxy.changeAdmin(Accounts.arbitraryAccount, {from: Accounts.proxyOwnerAccount});
    checkAdminChangedEvent(adminChanged, Accounts.proxyOwnerAccount, Accounts.arbitraryAccount);
  });

  it('et010 should check OwnershipTransferred event', async function () {
    let transferOwnership = await token.transferOwnership(Accounts.arbitraryAccount, {from: Accounts.tokenOwnerAccount});
    checkTransferOwnershipEvent(transferOwnership, Accounts.tokenOwnerAccount, Accounts.arbitraryAccount);
  });

  it('et011 should check Approval event', async function () {
    let approval = await token.approve(Accounts.arbitraryAccount2, amount, {from: Accounts.arbitraryAccount});
    checkApprovalEvent(approval, Accounts.arbitraryAccount, Accounts.arbitraryAccount2, amount);
  });

  it('et012 should check Pause event', async function () {
    let pause = await token.pause({from: Accounts.pauserAccount});
    checkPauseEvent(pause);
  });

  it('et013 should check Unpause event', async function () {
    let unpause = await token.unpause({from: Accounts.pauserAccount});
    checkUnpauseEvent(unpause);
  });

  it('et014 should check PauserChanged event', async function () {
    let updatePauser = await token.updatePauser(Accounts.arbitraryAccount, {from: Accounts.tokenOwnerAccount});
    checkPauserChangedEvent(updatePauser, Accounts.arbitraryAccount);
  });

  it('et015 should check Transfer event', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.arbitraryAccount, amount, {from: Accounts.minterAccount});
    let transfer = await token.transfer(Accounts.arbitraryAccount2, amount, {from: Accounts.arbitraryAccount});
    checkTransferEvents(transfer, Accounts.arbitraryAccount, Accounts.arbitraryAccount2, amount);
  });

  it('et016 should check Transfer event in transferFrom', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.arbitraryAccount, amount, {from: Accounts.minterAccount});
    await token.approve(Accounts.arbitraryAccount2, amount, {from: Accounts.arbitraryAccount});
    let transferFrom = await token.transferFrom(Accounts.arbitraryAccount, Accounts.blacklisterAccount, amount, {from: Accounts.arbitraryAccount2});
    checkTransferEvents(transferFrom, Accounts.arbitraryAccount, Accounts.blacklisterAccount, amount);
  });
}

var testWrapper = require('./TestWrapper');
testWrapper.execute('FiatToken_EventTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
