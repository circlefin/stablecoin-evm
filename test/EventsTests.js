var tokenUtils = require('./TokenTestUtils');
var FiatToken = tokenUtils.FiatToken;
var FiatTokenProxy = tokenUtils.FiatTokenProxy;
var minterAccount = tokenUtils.minterAccount;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var burnerAccount = tokenUtils.burnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var pauserAccount = tokenUtils.pauserAccount;
var proxyOwnerAccount = tokenUtils.proxyOwnerAccount;
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
    let configureMinter = await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    checkMinterConfiguredEvent(configureMinter, minterAccount, amount);
  });

  it('et001 should check Mint/Transfer events', async function () {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    let mint = await token.mint(arbitraryAccount, amount, {from: minterAccount});
    checkMintEvent(mint, arbitraryAccount, amount, minterAccount);
  });

  it('et002 should check Burn/Transfer events', async function () {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    let burn = await token.burn(amount, {from: minterAccount});
    checkBurnEvents(burn, amount, minterAccount);
  });

  it('et003 should check MinterRemoved event', async function () {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    let minterRemovedEvent = await token.removeMinter(minterAccount, {from: masterMinterAccount});
    checkMinterRemovedEvent(minterRemovedEvent, minterAccount);
  });

  it('et004 should check MasterMinterChanged event', async function () {
    let updateMasterMinter = await token.updateMasterMinter(arbitraryAccount, {from: tokenOwnerAccount});
    checkUpdateMasterMinterEvent(updateMasterMinter, arbitraryAccount);
  });

  it('et005 should check Blacklisted event', async function () {
    let blacklist = await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    checkBlacklistEvent(blacklist, arbitraryAccount);
  });

  it('et006 should check UnBlacklisted event', async function () {
    let unblacklist = await token.unBlacklist(arbitraryAccount, { from: blacklisterAccount });
      checkUnblacklistEvent(unblacklist, arbitraryAccount);
  });

  it('et007 should check BlacklisterChanged event', async function () {
    let blacklisterChanged = await token.updateBlacklister(arbitraryAccount, {from: tokenOwnerAccount});
    checkBlacklisterChangedEvent(blacklisterChanged, arbitraryAccount);
  });

  it('et008 should check Upgraded event', async function () {
    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall('initV2', ['bool', 'address', 'uint256'], [true, pauserAccount, 12]);
    let upgrade = await proxy.upgradeToAndCall(upgradedToken.address, initializeData, { from: proxyOwnerAccount });
    checkUpgradeEvent(upgrade, upgradedToken.address);
  });

  it('et009 should check AdminChanged event', async function () {
    let adminChanged = await proxy.changeAdmin(arbitraryAccount, {from: proxyOwnerAccount});
    checkAdminChangedEvent(adminChanged, proxyOwnerAccount, arbitraryAccount);
  });

  it('et010 should check OwnershipTransferred event', async function () {
    let transferOwnership = await token.transferOwnership(arbitraryAccount, {from: tokenOwnerAccount});
    checkTransferOwnershipEvent(transferOwnership, tokenOwnerAccount, arbitraryAccount);
  });

  it('et011 should check Approval event', async function () {
    let approval = await token.approve(arbitraryAccount2, amount, {from: arbitraryAccount});
    checkApprovalEvent(approval, arbitraryAccount, arbitraryAccount2, amount);
  });

  it('et012 should check Pause event', async function () {
    let pause = await token.pause({from: pauserAccount});
    checkPauseEvent(pause);
  });

  it('et013 should check Unpause event', async function () {
    let unpause = await token.unpause({from: pauserAccount});
    checkUnpauseEvent(unpause);
  });

  it('et014 should check PauserChanged event', async function () {
    let updatePauser = await token.updatePauser(arbitraryAccount, {from: tokenOwnerAccount});
    checkPauserChangedEvent(updatePauser, arbitraryAccount);
  });

  it('et015 should check Transfer event', async function () {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, amount, {from: minterAccount});
    let transfer = await token.transfer(arbitraryAccount2, amount, {from: arbitraryAccount});
    checkTransferEvents(transfer, arbitraryAccount, arbitraryAccount2, amount);
  });

  it('et016 should check Transfer event in transferFrom', async function () {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, amount, {from: minterAccount});
    await token.approve(arbitraryAccount2, amount, {from: arbitraryAccount});
    let transferFrom = await token.transferFrom(arbitraryAccount, blacklisterAccount, amount, {from: arbitraryAccount2});
    checkTransferEvents(transferFrom, arbitraryAccount, blacklisterAccount, amount);
  });
}

var testWrapper = require('./TestWrapper');
testWrapper.execute('FiatToken_EventTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
