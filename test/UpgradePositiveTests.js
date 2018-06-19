var FiatToken = artifacts.require('FiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var helpers = require('./PositiveTestHelpers');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var BigNumber = require('bignumber.js');

var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals
var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var masterMinterRole = tokenUtils.masterMinterRole;
var blacklisterRole = tokenUtils.blacklisterRole;
var pauserRole = tokenUtils.pauserRole;
var roleAddressChangerRole = tokenUtils.roleAddressChangerRole;
var checkVariables = tokenUtils.checkVariables;
var checkFailureIsExpected = tokenUtils.checkFailureIsExpected;
var ownerAccount = tokenUtils.ownerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var upgraderAccount = tokenUtils.upgraderAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;

var check_defaultVariableValues = helpers.check_defaultVariableValues;
var check_pause = helpers.check_pause;
var check_unpause = helpers.check_unpause;
var check_approve = helpers.check_approve;
var check_blacklist = helpers.check_blacklist;
var check_unblacklist = helpers.check_unblacklist;
var check_burn = helpers.check_burn;
var check_configureMinter = helpers.check_configureMinter;
var check_mint = helpers.check_mint;
var check_removeMinter = helpers.check_removeMinter;
var check_transfer = helpers.check_transfer;
var check_transferFrom = helpers.check_transferFrom;
var check_configureMinter = helpers.check_configureMinter;
var check_configureMinter_masterMinterBlacklisted = helpers.check_configureMinter_masterMinterBlacklisted;
var check_configureMinter_minterBlacklisted = helpers.check_configureMinter_minterBlacklisted;
var check_removeMinter_doesNotAffectTotalSupplyOrBalances = helpers.check_removeMinter_doesNotAffectTotalSupplyOrBalances;
var check_removeMinter_whilePaused = helpers.check_removeMinter_whilePaused;
var check_removeMinter_masterMinterBlacklisted = helpers.check_removeMinter_masterMinterBlacklisted;
var check_removeMinter_minterBlacklisted = helpers.check_removeMinter_minterBlacklisted;
var check_updateUpgraderAddress = helpers.check_updateUpgraderAddress;
var check_updateMasterMinter = helpers.check_updateMasterMinter;
var check_updateBlacklister = helpers.check_updateBlacklister;
var check_updatePauser = helpers.check_updatePauser;
var check_transferOwnership = helpers.check_transferOwnership;
var check_updateUpgraderAddress_whilePaused = helpers.check_updateUpgraderAddress_whilePaused;
var check_updateMasterMinter_whilePaused = helpers.check_updateMasterMinter_whilePaused;
var check_updateBlacklister_whilePaused = helpers.check_updateBlacklister_whilePaused;
var check_updatePauser_whilePaused = helpers.check_updatePauser_whilePaused;
var check_transferOwnership_whilePaused = helpers.check_transferOwnership_whilePaused;
var check_updateUpgraderAddress_toZeroAddress = helpers.check_updateUpgraderAddress_toZeroAddress;
var check_updateMasterMinter_toZeroAddress = helpers.check_updateMasterMinter_toZeroAddress;
var check_updateBlacklister_toZeroAddress = helpers.check_updateBlacklister_toZeroAddress;
var check_updatePauser_toZeroAddress = helpers.check_updatePauser_toZeroAddress;
var check_updateUpgraderAddress_toBlacklisted = helpers.check_updateUpgraderAddress_toBlacklisted;
var check_updateMasterMinter_toBlacklisted = helpers.check_updateMasterMinter_toBlacklisted;
var check_updateBlacklister_toBlacklisted = helpers.check_updateBlacklister_toBlacklisted;
var check_updatePauser_toBlacklisted = helpers.check_updatePauser_toBlacklisted;
var check_updatePauser_toBlacklisted = helpers.check_updatePauser_toBlacklisted;
var check_transferOwnership_toBlacklisted = helpers.check_transferOwnership_toBlacklisted;
var check_noPayableFunction = helpers.check_noPayableFunction;
var check_updateUpgraderAddress = helpers.check_updateUpgraderAddress;

contract('UpgradedFiatToken', function (accounts) {
  beforeEach(async function checkBefore() {
    oldToken = await FiatToken.new(
      "0x0",
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount);

    let dataContractAddress = await oldToken.getDataContractAddress();
    let storage = EternalStorage.at(dataContractAddress);
    assert.equal(await storage.owner.call(), oldToken.address);

    token = await UpgradedFiatToken.new(
      dataContractAddress,
      oldToken.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount);
    await oldToken.upgrade(token.address, {from: upgraderAccount});
    assert.equal(await storage.owner.call(), token.address);
  });


  it('should check that default variable values are correct', async function () {
    await check_defaultVariableValues(token);
  });

  it('should pause and set paused to true', async function () {
    await check_pause(token);
  });

  it('should unpause and set paused to false', async function () {
    await check_unpause(token);
  });

  it('should approve a spend and set allowed amount', async function () {
    await check_approve(token);
  });

  it('should blacklist and set blacklisted to true', async function () {
    await check_blacklist(token);
  });

  it('should blacklist and set blacklisted to true, then unblacklist and set blacklisted to false', async function () {
    await check_unblacklist(token);
  });

  it('should mint the amount, increasing balance of recipient by amount, increasing total supply by amount, and decreasing minterAllowed by amount', async function () {
    await check_mint(token);
  });

  it('should burn amount of tokens and reduce balance and total supply by amount', async function () {
    await check_burn(token);
  });

  it('should configureMinter, setting the minter to true and mintingAllowance to amount', async function () {
    await check_configureMinter(token);
  });

  it('should removeMinter, setting the minter to false and minterAllowed to 0', async function () {
    await check_removeMinter(token);
  });

  it('should transfer, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    await check_transfer(token);
  });

  it('should transferFrom, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    await check_transferFrom(token);
  });

  it('should updateMasterMinter', async function () {
    await check_updateMasterMinter(token);
  });

  it('should updateBlacklister', async function () {
    await check_updateBlacklister(token);
  });

  it('should updatePauser', async function () {
    await check_updatePauser(token);
  });

  it('should set owner to _newOwner', async function () {
    await check_transferOwnership(token);
  });

  it('no payable function', async function () {
    await check_noPayableFunction(token);
  });

  it('should updateUpgraderAddress', async function () {
    await check_updateUpgraderAddress(token);
  });

});
