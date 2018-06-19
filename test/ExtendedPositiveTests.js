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
var expectRevert = tokenUtils.expectRevert;
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


contract('FiatTokenExtended', function (accounts) {
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
      tokenOwnerAccount
    );

    let dataContractAddress = await token.getDataContractAddress();
    let storage = EternalStorage.at(dataContractAddress);

    assert.equal(await storage.owner.call(), token.address);
  });


it('should check that default variable values are correct', async function () {
  await check_defaultVariableValues(token);
});

it('should updateUpgraderAddress while paused', async function () {
  await check_updateUpgraderAddress_whilePaused(token);
});

it('should transferOwnership while paused', async function () {
  await check_transferOwnership_whilePaused(token);
});

it('should updateMasterMinter while paused', async function () {
  await check_updateMasterMinter_whilePaused(token);
});

it('should updateBlacklister while paused', async function () {
  await check_updateBlacklister_whilePaused(token);
});

it('should updatePauser while paused', async function () {
  await check_updatePauser_whilePaused(token);
});

it('should updateUpgraderAddress to zero address', async function () {
  await check_updateUpgraderAddress_toZeroAddress(token);
});

it('should updateMasterMinter to zero address', async function () {
  await check_updateMasterMinter_toZeroAddress(token);
});

it('should updateBlacklister to zero address', async function () {
  await check_updateBlacklister_toZeroAddress(token);
});

it('should updatePauser to zero address', async function () {
  await check_updatePauser_toZeroAddress(token);
});

it('should updateUpgraderAddress to blacklisted address', async function () {
  await check_updateUpgraderAddress_toBlacklisted(token);
});

it('should transferOwnership to blacklisted address', async function () {
  await check_transferOwnership_toBlacklisted(token);
});

it('should updateMasterMinter to blacklisted address', async function () {
  await check_updateMasterMinter_toBlacklisted(token);
});

it('should updateBlacklister to blacklisted address', async function () {
  await check_updateBlacklister_toBlacklisted(token);
});

it('should updatePauser to blacklisted address', async function () {
  await check_updatePauser_toBlacklisted(token);
});

it('should configureMinter when masterMinter is blacklisted', async function () {
  await check_configureMinter_masterMinterBlacklisted(token);
});

it('should configureMinter when minter is blacklisted', async function () {
  await check_configureMinter_minterBlacklisted(token);
});

it('should removeMinter when paused', async function () {
  await check_removeMinter_whilePaused(token);
});

it('should removeMinter when masterMinter is blacklisted', async function() {
  await check_removeMinter_masterMinterBlacklisted(token);
});

it('should removeMinter when minter is blacklisted', async function() {
  await check_removeMinter_masterMinterBlacklisted(token);
});
