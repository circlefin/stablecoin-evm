var FiatToken = artifacts.require('FiatToken');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var positive_tests = require('./PositiveTests');
var extended_positive_tests = require('./ExtendedPositiveTests');
var negative_tests = require('./NegativeTests');

var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var upgraderAccount = tokenUtils.upgraderAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var pauserAccount = tokenUtils.pauserAccount;


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

  return token;
}

// Instantiates a FiatToken and an EternalStorage without making the token contract
// owner of the storage contract. This setup is needed for several negative tests.

async function notStorageOwner() {
  //TODO 
}

///////////////////////////////////////////////////////////////////////////////

// Run specific tests combos by commenting/uncommenting the contract blocks below.

// contract('FiatToken_PositiveTests_Original', async function () {
//   await positive_tests.run_tests(newOriginalToken);
// });
//
// contract('FiatToken_PositiveTests_Upgraded', async function () {
//   await positive_tests.run_tests(newUpgradedToken);
// });

// contract('FiatToken_ExtendedPositiveTests_Original', async function () {
//   await extended_positive_tests.run_tests(newOriginalToken);
// });
//
// contract('FiatToken_ExtendedPositiveTests_Upgraded', async function () {
//   await extended_positive_tests.run_tests(newUpgradedToken);
// });
//
contract('FiatToken_NegativeTests_Original', async function () {
  await negative_tests.run_tests(newOriginalToken);
});

contract('FiatToken_NegativeTests_Upgraded', async function () {
  await negative_tests.run_tests(newUpgradedToken);
  await negative_tests.run_tests_contractNotStorageOwner(notStorageOwner);
});
