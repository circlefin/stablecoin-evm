var FiatToken = artifacts.require('FiatToken');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var positive_tests = require('./PositiveTests');
var extended_positive_tests = require('./ExtendedPositiveTests');
var negative_tests = require('./NegativeTests');
var forwarding_tests = require('./ForwardingTests');
var misc_tests = require('./MiscTests');

var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var upgraderAccount = tokenUtils.upgraderAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var deployerAccount = tokenUtils.deployerAccount;


// The following helpers make fresh original/upgraded tokens before each test.

async function newOriginalToken() {
  var token = await FiatToken.new(
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

  token.default_priorContractAddress = "undefined";
  token.default_storageOwner = token.address;
  token.default_storageAddress = await token.getDataContractAddress();

  return token;
}

async function newUpgradedToken() {
  let oldToken = await FiatToken.new(
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

  let dataContractAddress = await oldToken.getDataContractAddress();

  var token = await UpgradedFiatToken.new(
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
    tokenOwnerAccount
  );

  await oldToken.upgrade(token.address, {from: upgraderAccount});

  token.default_priorContractAddress = oldToken.address;
  token.default_storageOwner = token.address;
  token.default_storageAddress = dataContractAddress;

  oldToken.default_priorContractAddress = "undefined";
  oldToken.default_storageOwner = oldToken.address;
  oldToken.default_storageAddress = dataContractAddress;
  token.priorToken = oldToken;

  return token;
}

// The following helper makes a new EternalStorage for testing the storage contract directly.

async function newEternalStorage() {
  storage = await EternalStorage.new(deployerAccount);
  storageOwner = deployerAccount;
  return [storage, storageOwner];
}

///////////////////////////////////////////////////////////////////////////////

// Run specific tests combos by commenting/uncommenting the contract blocks below.

contract('FiatToken_Forwarding_Original', async function () {
  await forwarding_tests.run_tests_common(newOriginalToken);
});

contract('FiatToken_Forwarding_Upgraded', async function () {
  await forwarding_tests.run_tests_common(newUpgradedToken);
});

contract('FiatToken_Forwarding_Original_Disabled', async function () {
  await forwarding_tests.run_tests_common_upgraded_disabled(newOriginalToken);
});

contract('FiatToken_Forwarding_Upgraded_Disabled', async function () {
  await forwarding_tests.run_tests_common_upgraded_disabled(newUpgradedToken);
});

contract('FiatToken_Forwarding_UpgradedOnly', async function () {
  await forwarding_tests.run_tests_upgraded_only(newUpgradedToken);
});

contract('FiatToken_Forwarding_UpgradedOnly_Disabled', async function () {
  await forwarding_tests.run_tests_upgraded_only_upgraded_disabled(newUpgradedToken);
});

contract('FiatToken_PositiveTests_Original', async function () {
  await positive_tests.run_tests(newOriginalToken);
});

contract('FiatToken_PositiveTests_Upgraded', async function () {
  await positive_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_ExtendedPositiveTests_Original', async function () {
  await extended_positive_tests.run_tests(newOriginalToken);
});

contract('FiatToken_ExtendedPositiveTests_Upgraded', async function () {
  await extended_positive_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_NegativeTests_Original', async function () {
  await negative_tests.run_tests(newOriginalToken);
});

contract('FiatToken_NegativeTests_Upgraded', async function () {
  await negative_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_MiscTests_Original', async function () {
  await misc_tests.run_tests(newOriginalToken);
});

contract('FiatToken_MiscTests_Upgraded', async function () {
  await misc_tests.run_tests(newUpgradedToken);
});

contract('EternalStorage_MiscTests', async function () {
  await misc_tests.run_storage_tests(newEternalStorage);
});
