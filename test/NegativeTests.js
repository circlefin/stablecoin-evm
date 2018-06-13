var FiatToken = artifacts.require('FiatToken');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var helpers = require('./NegativeTestHelpers');
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
//var bigZero = tokenUtils.bigZero;

var checkVariables = tokenUtils.checkVariables;
//var expectRevert = tokenUtils.expectRevert;
//var blacklist = tokenUtils.blacklist;
//var ownerAccount = tokenUtils.ownerAccount;
//var arbitraryAccount = tokenUtils.arbitraryAccount;
var upgraderAccount = tokenUtils.upgraderAccount;
//var roleAddressChangerAccount = tokenUtils.roleAddressChangerAccount;
//var blacklisterAccount = tokenUtils.blacklisterAccount;
//var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var masterMinterAccount = tokenUtils.masterMinterAccount;
//var minterAccount = tokenUtils.minterAccount;
//var pauserAccount = tokenUtils.pauserAccount;
//var blacklisterAccount = tokenUtils.blacklisterAccount;
//var roleAddressChangerRole = tokenUtils.roleAddressChangerRole;

contract('FiatToken', function (accounts) {
  var amount = 100;

  beforeEach(async function checkBefore() {
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

    await checkVariables(token, []);
  });

  //Begin mint tests

  it('should fail to mint when paused', async function () {
<<<<<<< HEAD
    await helpers.shouldFailToMintWhenPaused(token);
  });
=======
    //Configure minter
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    await token.pause({from: pauserAccount});

    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables(token, customVars);
  })
>>>>>>> 5d5af563aa4348845e44a16b64feb6e7d0d4825f

  it('should fail to mint when message sender is not a minter', async function () {
    helpers.shouldFailToMintWhenMessageSenderIsNotMinter(token);
  });

  it('should fail to mint when message sender is blacklisted', async function () {
<<<<<<< HEAD
    helpers.shouldFailToMintWhenMessageSenderIsBlacklisted(token);
  });

  it('should fail to mint when recipient is blacklisted', async function () {
    helpers.shouldFailToMintWhenRecipientIsBlacklisted(token);
  });
=======
    await token.blacklist(minterAccount, {from: blacklisterAccount});

    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables(token, customVars);
  })

  it('should fail to mint when recipient is blacklisted', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});

    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables(token, customVars);
  })
>>>>>>> 5d5af563aa4348845e44a16b64feb6e7d0d4825f

  it('should fail to mint when allowance of minter is less than amount', async function () {
    helpers.shouldFailToMintWhenAllowanceIsLessThanAmount(token);
  });

  it('should fail to mint to 0x0 address', async function () {
    helpers.shouldFailToMintToZeroAddress(token);
  });

  it('should fail to mint when contract is not owner', async function () {
    helpers.shouldFailToMintWhenContractIsNotOwner(token);
  });

  //Begin approve tests

  it('should fail to approve when spender is blacklisted', async function () {
<<<<<<< HEAD
    helpers.shouldFailToApproveWhenSpenderIsBlacklisted(token);
  });

  it('should fail to approve when msg.sender is blacklisted', async function () {
    helpers.shouldFailToApproveWhenMessageSenderIsBlacklisted(token);
  });

  it('should fail to approve when contract is paused', async function () {
    helpers.shouldFailToApproveWhenContractIsPaused(token);
  });
=======
    await token.blacklist(minterAccount, {from: blacklisterAccount});

    await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));

    await checkVariables(token, [{'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true}]);
  })

  it('should fail to approve when msg.sender is blacklisted', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});

    await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));

    await checkVariables(token, [{'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}]);
  })

  it('should fail to approve when contract is paused', async function () {
    await token.pause({from: pauserAccount});

    await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));

    await checkVariables(token, [{'variable': 'paused', 'expectedValue': true}]);
  })
>>>>>>> 5d5af563aa4348845e44a16b64feb6e7d0d4825f

  it('should fail to approve when contract is not owner', async function () {
    helpers.shouldFailToApproveWhenContractIsNotOwner(token);
  });

  //Begin transferFrom tests

  it('should fail to transferFrom to 0x0 address', async function () {
    helpers.shouldFailToTransferFromToZeroAddress(token);
  });

  it('should fail to transferFrom an amount greater than balance', async function () {
    helpers.shouldFailToTransferFromAnAmountGreaterThanBalance(token);
  });

  it('should fail to transferFrom to blacklisted recipient', async function () {
    helpers.shouldFailToTransferFromToBlacklistedRecipient(token);
  });

  it('should fail to transferFrom from blacklisted msg.sender', async function () {
    helpers.shouldFailToTransferFromFromBlacklistedMessageSender(token);
  });

  it('should fail to transferFrom when from is blacklisted', async function () {
    helpers.shouldFailToTransferFromWhenFromIsBlacklisted(token);
  });

  it('should fail to transferFrom an amount greater than allowed for msg.sender', async function () {
    helpers.shouldFailToTransferFromAnAmountGreaterThanAllowedForMessageSender(token);
  });

  it('should fail to transferFrom when paused', async function () {
    helpers.shouldFailToTransferFromWhenPaused(token);
  });

  it('should fail to transferFrom when contract is not owner', async function () {
    helpers.shouldFailToTransferFromWhenContractIsNotOwner(token);
  });


  //Begin transfer tests

  it('should fail to transfer to 0x0 address', async function () {
    helpers.shouldFailToTransferToZeroAddress(token);
  });

  it('should fail to transfer an amount greater than balance', async function () {
    helpers.shouldFailToTransferAnAmountGreaterThanBalance(token);
  });

  it('should fail to transfer to blacklisted recipient', async function () {
    helpers.shouldFailToTransferToBlacklistedRecipient(token);
  });

  it('should fail to transfer when sender is blacklisted', async function () {
    helpers.shouldFailToTransferWhenSenderIsBlacklisted(token);
  });

  it('should fail to transfer when paused', async function () {
    helpers.shouldFailToTransferWhenPaused(token);
  });

  it('should fail to transfer when contract is not owner', async function () {
    helpers.shouldFailToTransferWhenContractIsNotOwner(token);
  });

  //Begin configureMinter tests

  it('should fail to configureMinter when sender is not masterMinter', async function () {
    helpers.shouldFailToConfigureMinterWhenSenderIsNotMasterMinter(token);
  });

  it('should fail to configureMinter when contract is not owner', async function () {
    helpers.shouldFailToConfigureMinterWhenContractIsNotOwner(token);
  });

  it('should fail to configureMinter when paused', async function () {
    helpers.shouldFailToConfigureMinterWhenPaused(token);
  });

  //Begin removeMinter tests

  it('should fail to removeMinter when sender is not masterMinter', async function () {
    helpers.shouldFailToRemoveMinterWhenSenderIsNotMasterMinter(token);
  });

  it('should fail to removeMinter when contract is not owner', async function () {
    helpers.shouldFailToRemoveMinterWhenContractIsNotOwner(token);
  });

  //Begin burn tests

  it('should fail to burn when balance is less than amount', async function () {
    helpers.shouldFailToBurnWhenBalanceIsLessThanAmount(token);
  });

  it('should fail to burn when amount is -1', async function () {
    helpers.shouldFailToBurnWhenAmountIsNegative(token);
  });

  it('should fail to burn when sender is blacklisted', async function () {
    helpers.shouldFailToBurnWhenSenderIsBlacklisted(token);
  });

  it('should fail to burn when paused', async function () {
    helpers.shouldFailToBurnWhenPaused(token);
  });

  it('should fail to burn when sender is not minter', async function () {
    helpers.shouldFailToBurnWhenSenderIsNotMinter(token);
  });

  it('should fail to burn after removeMinter', async function () {
    helpers.shouldFailToBurnAfterRemoverMinter(token);
  });

  it('should fail to burn when contract is not owner', async function () {
    helpers.shouldFailToBurnWhenContractIsNotOwner(token);
  });

  //Begin updateRoleAddress/updateUpgraderAddress tests

  it('should fail to updateRoleAddress when sender is not roleAddressChanger', async function () {
    helpers.shouldFailToUpdateRoleAddressWhenSenderIsNotRoleAddressChanger(token);
  });

  it('should fail to updateRoleAddress when sender is old roleAddressChanger', async function () {
    helpers.shouldFailToUpdateRoleAddressWhenSenderIsOldRoleAddressChanger(token);
  });

  it('should fail to updateUpgraderAddress when sender is not upgrader', async function () {
    helpers.shouldFailToUpdateUpgraderAddressWhenSenderIsNotUpgrader(token);
  });

  //Begin pause/unpause tests

  it('should fail to pause when sender is not pauser', async function () {
    helpers.shouldFailToPauseWhenSenderIsNotPauser(token);
  });

  it('should fail to unpause when sender is not pauser', async function () {
    helpers.shouldFailToUnpauseWhenSenderIsNotPauser(token);
  });

  //Begin blacklist/unblacklist tests

  it('should fail to blacklist when sender is not blacklister', async function () {
    helpers.shouldFailToBlacklistWhenSenderIsNotBlacklister(token);
  });

  it('should fail to unblacklist when sender is not blacklister', async function () {
    helpers.shouldFailToUnblacklistWhenSenderIsNotBlacklister(token);
  });

  it('should fail to unBlacklist when paused', async function () {
    helpers.shouldFailToUnblacklistWhenPaused(token);
  });

  //Begin upgrade tests

  it('should fail to upgrade when sender is not upgrader', async function () {
    helpers.shouldFailToUpgradeWhenSenderIsNotUpgrader(token);
  });

  it('should fail to upgrade when upgradedAddress is not 0x0', async function () {
    helpers.shouldFailToUpgradeWhenUpgradedAddressIsNotZeroAddress(token);
  });

  it('should fail to upgrade when newAddress is 0x0', async function () {
    helpers.shouldFailToUpgradeWhenNewAddressIsZeroAddress(token);
  });

  //Begin disablePriorContract tests

  it('should fail to disablePriorContract when sender is not pauser', async function () {
    helpers.shouldFailToDisablePriorContractWhenSenderIsNotPauser(token);
  });

})
