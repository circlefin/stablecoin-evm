var FiatToken = artifacts.require('FiatToken');
var tokenUtils = require('./TokenTestUtils');
var positive_tests = require('./PositiveTests');
var extended_positive_tests = require('./ExtendedPositiveTests');
var negative_tests = require('./NegativeTests');

var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;


// The following helpers make fresh original/upgraded tokens before each test.

async function newOriginalToken() {
  var token = await FiatToken.new();
  return token;
}


///////////////////////////////////////////////////////////////////////////////

// Run specific tests combos by commenting/uncommenting the contract blocks below.

contract('FiatToken_PositiveTests', async function () {
  await positive_tests.run_tests(newOriginalToken);
});

/*
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
*/