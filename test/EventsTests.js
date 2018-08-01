var tokenUtils = require('./TokenTestUtils')
var FiatToken = artifacts.require('FiatTokenV1')
var FiatTokenProxy = artifacts.require('FiatTokenProxy')
var checkMintEvent = tokenUtils.checkMintEvent
var checkTransferEvents = tokenUtils.checkTransferEvents
var checkMinterConfiguredEvent = tokenUtils.checkMinterConfiguredEvent
var minterAccount = tokenUtils.minterAccount
var masterMinterAccount = tokenUtils.masterMinterAccount
var arbitraryAccount = tokenUtils.arbitraryAccount
var arbitraryAccount2 = tokenUtils.arbitraryAccount2
var burnerAccount = tokenUtils.burnerAccount
var blacklisterAccount = tokenUtils.blacklisterAccount
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount
var pauserAccount = tokenUtils.pauserAccount
var proxyOwnerAccount = tokenUtils.proxyOwnerAccount
var name = tokenUtils.name
var symbol = tokenUtils.symbol
var currency = tokenUtils.currency
var decimals = tokenUtils.decimals


var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy
var encodeCall = tokenUtils.encodeCall

var checkApprovalEvent = tokenUtils.checkApprovalEvent
var checkBurnEvent = tokenUtils.checkBurnEvent
var checkMinterRemovedEvent = tokenUtils.checkMinterRemovedEvent
var checkBlacklistEvent = tokenUtils.checkBlacklistEvent
var checkUnblacklistEvent = tokenUtils.checkUnblacklistEvent
var checkPauserChangedEvent = tokenUtils.checkPauserChangedEvent
var checkUnpauseEvent = tokenUtils.checkUnpauseEvent
var checkTransferOwnershipEvent = tokenUtils.checkTransferOwnershipEvent
var checkUpdateMasterMinterEvent = tokenUtils.checkUpdateMasterMinterEvent
var checkBlacklisterChangedEvent = tokenUtils.checkBlacklisterChangedEvent
var checkUpgradeEvent = tokenUtils.checkUpgradeEvent
var checkAdminChangedEvent = tokenUtils.checkAdminChangedEvent
var UpgradedFiatTokenNewFields = tokenUtils.UpgradedFiatTokenNewFields;

var amount = 100

async function run_tests(newToken) {
  
  beforeEach('Make fresh token contract', async function () {
      rawToken = await FiatToken.new();
      var tokenConfig = await initializeTokenWithProxy(rawToken);
      proxy = tokenConfig.proxy;
      token = tokenConfig.token;
      assert.equal(proxy.address, token.address);
  })

  it('should check MinterConfigured, Mint, and Transfer events', async function () {
    let configureMinter = await token.configureMinter(minterAccount, amount, { from: masterMinterAccount })
    checkMinterConfiguredEvent(configureMinter, minterAccount, amount)
    let mint = await token.mint(arbitraryAccount, amount, {from: minterAccount})
    checkMintEvent(mint, arbitraryAccount, amount, minterAccount)
  })

  it('should check Burn event', async function () {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount })
    await token.mint(minterAccount, amount, { from: minterAccount })
    let burn = await token.burn(amount, {from: minterAccount})
    checkBurnEvent(burn, minterAccount, amount)
  })

  it('should check MinterRemoved event', async function () {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount })
    let minterRemovedEvent = await token.removeMinter(minterAccount, {from: masterMinterAccount})
    checkMinterRemovedEvent(minterRemovedEvent, minterAccount)
  })

  it('should check MasterMinterChanged event', async function () {
    let updateMasterMinter = await token.updateMasterMinter(arbitraryAccount, {from: tokenOwnerAccount})
    checkUpdateMasterMinterEvent(updateMasterMinter, arbitraryAccount)
  })

  it('should check blacklist event', async function () {
      let blacklist = await token.blacklist(arbitraryAccount, { from: blacklisterAccount })
      checkBlacklistEvent(blacklist, arbitraryAccount)
  })

  it('should check unblacklist event', async function () {
    let unblacklist = await token.unBlacklist(arbitraryAccount, { from: blacklisterAccount })
      checkUnblacklistEvent(unblacklist, arbitraryAccount)
  })

  it('should check BlacklisterChanged event', async function () {
    let blacklisterChanged = await token.updateBlacklister(arbitraryAccount, {from: tokenOwnerAccount})
    checkBlacklisterChangedEvent(blacklisterChanged, arbitraryAccount)
  })

  it('should check Upgraded event', async function () {
    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall('initialize', ['bool', 'address', 'uint256'], [true, pauserAccount, 12]);
    let upgrade = await proxy.upgradeToAndCall(upgradedToken.address, initializeData, { from: proxyOwnerAccount })
    checkUpgradeEvent(upgrade, upgradedToken.address)
  })

  it('should check AdminChanged event', async function () {
    let adminChanged = await proxy.changeAdmin(arbitraryAccount, {from: proxyOwnerAccount})
    checkAdminChangedEvent(adminChanged, proxyOwnerAccount, arbitraryAccount)
  })

  it('should check OwnershipTransferred event', async function () {
    let transferOwnership = await token.transferOwnership(arbitraryAccount, {from: tokenOwnerAccount})
    checkTransferOwnershipEvent(transferOwnership, tokenOwnerAccount, arbitraryAccount)
  })

  it('should check Approval event', async function () {
    let approval = await token.approve(arbitraryAccount2, amount, {from: arbitraryAccount})
    checkApprovalEvent(approval, arbitraryAccount, arbitraryAccount2, amount)
  })

  it('should check Unpause event', async function () {
    let unpause = await token.unpause({from: pauserAccount})
    checkUnpauseEvent(unpause)
  })

  it('should check PauserChanged event', async function () {
    let updatePauser = await token.updatePauser(arbitraryAccount, {from: tokenOwnerAccount})
    checkPauserChangedEvent(updatePauser, arbitraryAccount)
  })
}

module.exports = {
  run_tests: run_tests,
}