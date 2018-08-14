var tokenUtils = require('./TokenTestUtils');
var positive_tests = require('./PositiveTests');
var extended_positive_tests = require('./ExtendedPositiveTests');
var negative_tests = require('./NegativeTests');
var misc_tests = require('./MiscTests');
var abi_tests = require('./ABITests.test');
var legacy_tests = require('./FiatTokenLegacy.test');
var proxy_positive_tests = require('./ProxyPositiveTests');
var proxy_negative_tests = require('./ProxyNegativeTests');
var events_tests = require('./EventsTests');

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

contract('FiatToken_ABIHackingTests_Upgraded', async function () {
  await abi_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_PositiveTests_Upgraded', async function () {
  await positive_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_ExtendedPositiveTests_Upgraded', async function () {
  await extended_positive_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_NegativeTests_Upgraded', async function () {
  await negative_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_MiscTests_Upgraded', async function () {
  await misc_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_ProxyPositiveTests_Upgraded', async function (accounts) {
  await proxy_positive_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_ProxyNegativeTests_Upgraded', async function (accounts) {
  await proxy_negative_tests.run_tests(newUpgradedToken);
});

contract('FiatToken_LegacyTests_Upgraded', async function (accounts) {
  await legacy_tests.run_tests(newUpgradedToken, accounts);
});

contract('FiatToken_EventTests_Upgraded', async function () {
  await events_tests.run_tests(newUpgradedToken);
});
