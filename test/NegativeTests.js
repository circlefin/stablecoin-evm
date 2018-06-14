var FiatToken = artifacts.require('FiatToken');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var helpers = require('./NegativeTestHelpers');
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var bigZero = tokenUtils.bigZero;

var checkVariables = tokenUtils.checkVariables;
var expectRevert = tokenUtils.expectRevert;
var blacklist = tokenUtils.blacklist;
var ownerAccount = tokenUtils.ownerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var upgraderAccount = tokenUtils.upgraderAccount;
var roleAddressChangerAccount = tokenUtils.roleAddressChangerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var roleAddressChangerRole = tokenUtils.roleAddressChangerRole;

contract('FiatToken', function (accounts) {

  beforeEach(async function checkBefore() {
    //var amount = 100;

    token = await FiatToken.new(
      "0x0",
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      roleAddressChangerAccount);

    let tokenAddress = token.address;

    let dataContractAddress = await token.getDataContractAddress();
    let storage = EternalStorage.at(dataContractAddress);
    assert.equal(await storage.owner.call(), tokenAddress);
    var assertDiff = require('assert-diff');
    assertDiff.options.strict = true;

    await checkVariables(token, []);
  });

  //Begin mint tests

  it('should fail to mint when paused', async function () {
    await helpers.fail_mint_paused(token);
  });

  it('should fail to mint when message sender is not a minter', async function () {
    await helpers.fail_mint_senderNotMinter(token);
  });

  it('should fail to mint when message sender is blacklisted', async function () {
    await helpers.fail_mint_senderBlacklisted(token);
  });

  it('should fail to mint when recipient is blacklisted', async function () {
    await helpers.fail_mint_recipientBlacklisted(token);
  });

  it('should fail to mint when allowance of minter is less than amount', async function () {
    await helpers.fail_mint_allowanceLessThanAmount(token);
  });

  it('should fail to mint to 0x0 address', async function () {
    await helpers.fail_mint_toZeroAddress(token);
  });

  it('should fail to mint when contract is not owner', async function () {
    await helpers.fail_mint_contractNotOwner(token);
  });

  //Begin approve tests

  it('should fail to approve when spender is blacklisted', async function () {
    await helpers.fail_approve_spenderBlacklisted(token);
  });

  it('should fail to approve when msg.sender is blacklisted', async function () {
    await helpers.fail_approve_messageSenderBlacklisted(token);
  });

  it('should fail to approve when contract is paused', async function () {
    await helpers.fail_approve_paused(token);
  });

  it('should fail to approve when contract is not owner', async function () {
    await helpers.fail_approve_contractNotOwner(token);
  });

  //Begin transferFrom tests

  it('should fail to transferFrom to 0x0 address', async function () {
    await helpers.fail_transferFrom_toZeroAddress(token);
  });

  it('should fail to transferFrom an amount greater than balance', async function () {
    await helpers.fail_transferFrom_amountGreaterThanBalance(token);
  });

  it('should fail to transferFrom to blacklisted recipient', async function () {
    await helpers.fail_transferFrom_recipientBlacklisted(token);
  });

  it('should fail to transferFrom from blacklisted msg.sender', async function () {
    await helpers.fail_transferFrom_messageSenderBlacklisted(token);
  });

  it('should fail to transferFrom when from is blacklisted', async function () {
    await helpers.fail_transferFrom_fromBlacklisted(token);
  });

  it('should fail to transferFrom an amount greater than allowed for msg.sender', async function () {
    await helpers.fail_transferFrom_amountGreaterThanAllowance(token);
  });

  it('should fail to transferFrom when paused', async function () {
    await helpers.fail_transferFrom_paused(token);
  });

  it('should fail to transferFrom when contract is not owner', async function () {
    await helpers.fail_transferFrom_contractNotOwner(token);
  });


  //Begin transfer tests

  it('should fail to transfer to 0x0 address', async function () {
    await helpers.fail_transfer_toZeroAddress(token);
  });

  it('should fail to transfer an amount greater than balance', async function () {
    await helpers.fail_transfer_amountGreaterThanBalance(token);
  });

  it('should fail to transfer to blacklisted recipient', async function () {
    await helpers.fail_transfer_recipientBlacklisted(token);
  });

  it('should fail to transfer when sender is blacklisted', async function () {
    await helpers.fail_transfer_senderBlacklisted(token);
  });

  it('should fail to transfer when paused', async function () {
    await helpers.fail_transfer_paused(token);
  });

  it('should fail to transfer when contract is not owner', async function () {
    await helpers.fail_transfer_contractNotOwner(token);
  });

  //Begin configureMinter tests

  it('should fail to configureMinter when sender is not masterMinter', async function () {
    await helpers.fail_configureMinter_senderNotMasterMinter(token);
  });

  it('should fail to configureMinter when contract is not owner', async function () {
    await helpers.fail_configureMinter_contractNotOwner(token);
  });

  it('should fail to configureMinter when paused', async function () {
    await helpers.fail_configureMinter_paused(token);
  });

  //Begin removeMinter tests

  it('should fail to removeMinter when sender is not masterMinter', async function () {
    await helpers.fail_removeMinter_senderNotMasterMinter(token);
  });

  it('should fail to removeMinter when contract is not owner', async function () {
    await helpers.fail_removeMinter_contractNotOwner(token);
  });

  //Begin burn tests

  it('should fail to burn when balance is less than amount', async function () {
    await helpers.fail_burn_balanceLessThanAmount(token);
  });

  it('should fail to burn when amount is -1', async function () {
    await helpers.fail_burn_amountNegative(token);
  });

  it('should fail to burn when sender is blacklisted', async function () {
    await helpers.fail_burn_senderBlacklisted(token);
  });

  it('should fail to burn when paused', async function () {
    await helpers.fail_burn_paused(token);
  });

  it('should fail to burn when sender is not minter', async function () {
    await helpers.fail_burn_senderNotMinter(token);
  });

  it('should fail to burn after removeMinter', async function () {
    await helpers.fail_burn_afterRemoverMinter(token);
  });

  it('should fail to burn when contract is not owner', async function () {
    await helpers.fail_burn_contractNotOwner(token);
  });

  //Begin updateRoleAddress/updateUpgraderAddress tests

  it('should fail to updateRoleAddress when sender is not roleAddressChanger', async function () {
    await helpers.fail_updateRoleAddress_senderNotRoleAddressChanger(token);
  });

  it('should fail to updateRoleAddress when sender is old roleAddressChanger', async function () {
    await helpers.fail_updateRoleAddress_senderIsOldRoleAddressChanger(token);
  });

  it('should fail to updateUpgraderAddress when sender is not upgrader', async function () {
    await helpers.fail_updateUpgraderAddress_senderNotUpgrader(token);
  });

  //Begin pause/unpause tests

  it('should fail to pause when sender is not pauser', async function () {
    await helpers.fail_pause_senderNotPauser(token);
  });

  it('should fail to unpause when sender is not pauser', async function () {
    await helpers.fail_unpause_senderNotPauser(token);
  });

  //Begin blacklist/unblacklist tests

  it('should fail to blacklist when sender is not blacklister', async function () {
    await helpers.fail_blacklist_senderNotBlacklister(token);
  });

  it('should fail to unblacklist when sender is not blacklister', async function () {
    await helpers.fail_unblacklist_senderNotBlacklister(token);
  });

  it('should fail to unBlacklist when paused', async function () {
    await helpers.fail_unblacklist_paused(token);
  });

  //Begin upgrade tests

  it('should fail to upgrade when sender is not upgrader', async function () {
    await helpers.fail_upgrade_senderNotUpgrader(token);
  });

  it('should fail to upgrade when upgradedAddress is not 0x0', async function () {
    await helpers.fail_upgrade_upgradedAddressIsNotZeroAddress(token);
  });

  it('should fail to upgrade when newAddress is 0x0', async function () {
    await helpers.fail_upgrade_newAddressIsZeroAddress(token);
  });

  //Begin disablePriorContract tests

  it('should fail to disablePriorContract when sender is not pauser', async function () {
    await helpers.fail_disablePriorContract_senderNotPauser(token);
  });

})
