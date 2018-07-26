var tokenUtils = require('./TokenTestUtils');
var positive_tests = require('./PositiveTests');
var extended_positive_tests = require('./ExtendedPositiveTests');
var negative_tests = require('./NegativeTests');
var misc_tests = require('./MiscTests');
var abi_tests = require('./ABITests.test');
var legacy_tests = require('./FiatTokenLegacy.test');

var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var FiatToken = tokenUtils.FiatToken;


// The following helpers make fresh original/upgraded tokens before each test.

async function newToken() {
  var token = await FiatToken.new();
  return token;
}

async function newUpgradedToken() {
	var token = await UpgradedFiatToken.new();
	return token;
}

///////////////////////////////////////////////////////////////////////////////

// Run specific tests combos by commenting/uncommenting the contract blocks below.

contract('FiatToken_ABIHackingTests', async function () {
  await abi_tests.run_tests(newToken);
});

contract('FiatToken_ABIHackingTests_Upgraded', async function () {
  await abi_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_PositiveTests', async function () {
  await positive_tests.run_tests(newToken);
});

contract('FiatToken_PositiveTests_Upgraded', async function () {
  await positive_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_ExtendedPositiveTests', async function () {
  await extended_positive_tests.run_tests(newToken);
});

contract('FiatToken_ExtendedPositiveTests_Upgraded', async function () {
  await extended_positive_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_NegativeTests', async function () {
  await negative_tests.run_tests(newToken);
});

contract('FiatToken_NegativeTests_Upgraded', async function () {
  await negative_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_MiscTests', async function () {
  await misc_tests.run_tests(newToken);
});

contract('FiatToken_MiscTests_Upgraded', async function () {
  await misc_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_LegacyTests', async function (accounts) {
  await legacy_tests.run_tests(newToken, accounts);
});

contract('FiatToken_LegacyTests_Upgraded', async function (accounts) {
  await legacy_tests.run_tests(newUpgradedToken, accounts);
});
