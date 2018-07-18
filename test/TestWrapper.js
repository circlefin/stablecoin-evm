var FiatToken = artifacts.require('FiatToken');
var tokenUtils = require('./TokenTestUtils');
var positive_tests = require('./PositiveTests');
var extended_positive_tests = require('./ExtendedPositiveTests');
var negative_tests = require('./NegativeTests');
var misc_tests = require('./MiscTests');

var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var deployerAccount = tokenUtils.deployerAccount;


// The following helpers make fresh original/upgraded tokens before each test.

async function newToken() {
  var token = await FiatToken.new();
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

contract('FiatToken_PositiveTests', async function () {
  await positive_tests.run_tests(newToken);
});

contract('FiatToken_ExtendedPositiveTests', async function () {
  await extended_positive_tests.run_tests(newToken);
});

contract('FiatToken_NegativeTests', async function () {
  await negative_tests.run_tests(newToken);
});

contract('FiatToken_MiscTests', async function () {
  await misc_tests.run_tests(newToken);
});
