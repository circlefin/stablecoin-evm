var FiatToken = artifacts.require('FiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var BigNumber = require('bignumber.js');
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals
var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var checkVariables = tokenUtils.checkVariables;
var checkFailureIsExpected = tokenUtils.checkFailureIsExpected;
var deployerAccount = tokenUtils.deployerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var upgraderAccount = tokenUtils.upgraderAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;

var amount = 100;

async function check_defaultVariableValues(token) {
  await checkVariables(token, []);
}

async function check_pause(token) {
  await token.pause({ from: pauserAccount });
  var customVars = [{ 'variable': 'paused', 'expectedValue': true }];
  await checkVariables(token, customVars);
}

async function check_unpause(token) {
  await token.pause({ from: pauserAccount });
  var customVars = [{ 'variable': 'paused', 'expectedValue': true }];
  await checkVariables(token, customVars);
  await token.unpause({ from: pauserAccount });
  await checkVariables(token, []);
}

async function check_approve(token) {
  await token.approve(minterAccount, 100, { from: arbitraryAccount });
  var customVars = [{ 'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': bigHundred }];
  await checkVariables(token, customVars);
}

async function check_blacklist(token) {
  await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
  var customVars = [{ 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }]
  await checkVariables(token, customVars);
}

async function check_unblacklist(token) {
  await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
  var customVars = [{ 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }]
  await checkVariables(token, customVars);

  await token.unBlacklist(arbitraryAccount, { from: blacklisterAccount });
  customVars = [{ 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': false }]
  await checkVariables(token, customVars);
}

async function check_burn(token) {
  var mintAmount = 11;
  var burnAmount = 10;
  await token.configureMinter(minterAccount, mintAmount, { from: masterMinterAccount });
  await token.mint(minterAccount, mintAmount, { from: minterAccount });
  var setup = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(mintAmount) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
  ];
  await checkVariables(token, setup);

  await token.burn(burnAmount, { from: minterAccount });
  var afterBurn = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(mintAmount - burnAmount) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount - burnAmount) },
  ];
  await checkVariables(token, afterBurn);
}

async function check_configureMinter(token) {
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
  ];
  await checkVariables(token, customVars);
}

async function check_mint(token) {
  var mintAmount = 50;

  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
  ];
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
  customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
    { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
  ];
  await checkVariables(token, customVars);
}

async function check_removeMinter(token) {
  let mintAmount = 11;

  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  await token.mint(arbitraryAccount, mintAmount, { from: minterAccount })
  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
    { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
  ];
  await checkVariables(token, customVars);

  await token.removeMinter(minterAccount, { from: masterMinterAccount });
  customVars = [
    { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
  ];
  await checkVariables(token, customVars);
}

async function check_transfer(token) {
  let mintAmount = 50;

  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
  ];
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
  customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
    { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
  ];
  await checkVariables(token, customVars);

  await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });
  customVars = [
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
    { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
  ];
  await checkVariables(token, customVars);
}

async function check_transferFrom(token) {
  let mintAmount = 50;

  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
  ];
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
  customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
    { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
  ];
  await checkVariables(token, customVars);

  await token.approve(upgraderAccount, mintAmount, { from: arbitraryAccount });
  await token.transferFrom(arbitraryAccount, pauserAccount, mintAmount, { from: upgraderAccount });
  customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
    { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
    { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
  ];
  await checkVariables(token, customVars);
}

async function check_configureMinter(token) {
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
  ];
  await checkVariables(token, customVars);
}

async function check_configureMinter_masterMinterBlacklisted(token) {
  await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var result = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true }
  ];
  await checkVariables(token, result);
}

async function check_configureMinter_minterBlacklisted(token) {
  await token.blacklist(minterAccount, { from: blacklisterAccount });
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var result = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
  ];
  await checkVariables(token, result);
}

async function check_removeMinter_whilePaused(token) {
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  await token.pause({ from: pauserAccount });
  var isAMinter = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'paused', 'expectedValue': true }
  ];
  await checkVariables(token, isAMinter);

  await token.removeMinter(minterAccount, { from: masterMinterAccount });
  var notAMinter = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    { 'variable': 'paused', 'expectedValue': true }
  ];
  await checkVariables(token, notAMinter);
}

async function check_removeMinter_masterMinterBlacklisted(token) {
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
  ];
  await checkVariables(token, customVars);

  await token.removeMinter(minterAccount, { from: masterMinterAccount });
  customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
  ];
  await checkVariables(token, customVars);
}

async function check_removeMinter_minterBlacklisted(token) {
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  await token.blacklist(minterAccount, { from: blacklisterAccount });
  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
  ];
  await checkVariables(token, customVars);

  await token.removeMinter(minterAccount, { from: masterMinterAccount });
  customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
  ];
  await checkVariables(token, customVars);
}

//Check update functions.

async function check_updateUpgraderAddress(token) {
  await token.updateUpgraderAddress(arbitraryAccount, { from: upgraderAccount });
  var result = [
    { 'variable': 'upgrader', 'expectedValue': arbitraryAccount }
  ];
  await checkVariables(token, result);
}

async function check_updateMasterMinter(token) {
  await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });
  var result = [
    { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount }
  ];
  await checkVariables(token, result);
}

async function check_updateBlacklister(token) {
  await token.updateBlacklister(arbitraryAccount, { from: tokenOwnerAccount });
  var result = [
    { 'variable': 'blacklister', 'expectedValue': arbitraryAccount }
  ];
  await checkVariables(token, result);
}

async function check_updatePauser(token) {
  await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
  var result = [
    { 'variable': 'pauser', 'expectedValue': arbitraryAccount }
  ];
  await checkVariables(token, result);
}

async function check_transferOwnership(token) {
  await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
  var result = [
    { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount }
  ];
  await checkVariables(token, result);
}

//Check update functions while paused.

async function check_updateUpgraderAddress_whilePaused(token) {
  await token.pause({ from: pauserAccount });
  await token.updateUpgraderAddress(arbitraryAccount, { from: upgraderAccount });
  var result = [
    { 'variable': 'upgrader', 'expectedValue': arbitraryAccount },
    { 'variable': 'paused', 'expectedValue': true }
  ];
  await checkVariables(token, result);
}

async function check_updateMasterMinter_whilePaused(token) {
  await token.pause({ from: pauserAccount });
  await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });
  var result = [
    { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
    { 'variable': 'paused', 'expectedValue': true }
  ];
  await checkVariables(token, result);
}

async function check_updateBlacklister_whilePaused(token) {
  await token.pause({ from: pauserAccount });
  await token.updateBlacklister(arbitraryAccount, { from: tokenOwnerAccount });
  var result = [
    { 'variable': 'blacklister', 'expectedValue': arbitraryAccount },
    { 'variable': 'paused', 'expectedValue': true }
  ];
  await checkVariables(token, result);
}

async function check_updatePauser_whilePaused(token) {
  await token.pause({ from: pauserAccount });
  await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
  var result = [
    { 'variable': 'pauser', 'expectedValue': arbitraryAccount },
    { 'variable': 'paused', 'expectedValue': true }
  ];
  await checkVariables(token, result);
}

async function check_transferOwnership_whilePaused(token) {
  await token.pause({ from: pauserAccount });
  await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
  var result = [
    { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount },
    { 'variable': 'paused', 'expectedValue': true }
  ];
  await checkVariables(token, result);
}

//Check update functions when newAddress is zero account.

async function check_updateUpgraderAddress_toZeroAddress(token) {
  let longZero = 0x0000000000000000000000000000000000000000;
  let shortZero = 0x00;

  await token.updateUpgraderAddress(longZero, { from: upgraderAccount });
  var result = [
    { 'variable': 'upgrader', 'expectedValue': "0x0000000000000000000000000000000000000000" },
  ];

  // Note: longZero and shortZero both resolve to 0x0000000000000000000000000000000000000000
  await token.updateUpgraderAddress(shortZero, { from: upgraderAccount });
  await checkVariables(token, result);
}

async function check_updateMasterMinter_toZeroAddress(token) {
  let longZero = 0x0000000000000000000000000000000000000000;
  let shortZero = 0x00;

  await token.updateMasterMinter(longZero, { from: tokenOwnerAccount });
  var result = [
    { 'variable': 'masterMinter', 'expectedValue': "0x0000000000000000000000000000000000000000" },
  ];

  await token.updateMasterMinter(shortZero, { from: tokenOwnerAccount });
  await checkVariables(token, result);
}

async function check_updateBlacklister_toZeroAddress(token) {
  let longZero = 0x0000000000000000000000000000000000000000;
  let shortZero = 0x00;

  await token.updateBlacklister(longZero, { from: tokenOwnerAccount });
  var result = [
    { 'variable': 'blacklister', 'expectedValue': "0x0000000000000000000000000000000000000000" },
  ];

  await token.updateBlacklister(shortZero, { from: tokenOwnerAccount });
  await checkVariables(token, result);
}

async function check_updatePauser_toZeroAddress(token) {
  let longZero = 0x0000000000000000000000000000000000000000;
  let shortZero = 0x00;

  await token.updatePauser(longZero, { from: tokenOwnerAccount });
  var result = [
    { 'variable': 'pauser', 'expectedValue': "0x0000000000000000000000000000000000000000" },
  ];

  await token.updatePauser(shortZero, { from: tokenOwnerAccount });
  await checkVariables(token, result);
}

// Check update functions when newAddress is blacklisted.

async function check_updateUpgraderAddress_toBlacklisted(token) {
  await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
  await token.updateUpgraderAddress(arbitraryAccount, { from: upgraderAccount });
  var setup = [
    { 'variable': 'upgrader', 'expectedValue': arbitraryAccount },
    { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
  ];
  await checkVariables(token, setup);
}

async function check_updateMasterMinter_toBlacklisted(token) {
  await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
  await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });
  var setup = [
    { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
    { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
  ];
  await checkVariables(token, setup);
}

async function check_updateBlacklister_toBlacklisted(token) {
  await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
  await token.updateBlacklister(arbitraryAccount, { from: tokenOwnerAccount });
  var setup = [
    { 'variable': 'blacklister', 'expectedValue': arbitraryAccount },
    { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
  ];
  await checkVariables(token, setup);
}

async function check_updatePauser_toBlacklisted(token) {
  await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
  await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
  var setup = [
    { 'variable': 'pauser', 'expectedValue': arbitraryAccount },
    { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
  ];
  await checkVariables(token, setup);
}

async function check_transferOwnership_toBlacklisted(token) {
  await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
  await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
  var setup = [
    { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount },
    { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
  ];
  await checkVariables(token, setup);
}

// Check contract is not payable.

async function check_noPayableFunction(token) {
  var success = false;
  try {
    await web3.eth.sendTransaction({ from: arbitraryAccount, to: token.address, value: 1 });
  } catch (e) {
    success = true;
  }
  assert.equal(true, success);
}

module.exports = {
  check_defaultVariableValues: check_defaultVariableValues,
  check_pause: check_pause,
  check_unpause: check_unpause,
  check_approve: check_approve,
  check_blacklist: check_blacklist,
  check_unblacklist: check_unblacklist,
  check_burn: check_burn,
  check_configureMinter: check_configureMinter,
  check_mint: check_mint,
  check_removeMinter: check_removeMinter,
  check_transfer: check_transfer,
  check_transferFrom: check_transferFrom,
  check_configureMinter: check_configureMinter,
  check_configureMinter_masterMinterBlacklisted: check_configureMinter_masterMinterBlacklisted,
  check_configureMinter_minterBlacklisted: check_configureMinter_minterBlacklisted,
  check_removeMinter_whilePaused: check_removeMinter_whilePaused,
  check_removeMinter_masterMinterBlacklisted: check_removeMinter_masterMinterBlacklisted,
  check_removeMinter_minterBlacklisted: check_removeMinter_minterBlacklisted,
  check_updateUpgraderAddress: check_updateUpgraderAddress,
  check_updateMasterMinter: check_updateMasterMinter,
  check_updateBlacklister: check_updateBlacklister,
  check_updatePauser: check_updatePauser,
  check_transferOwnership: check_transferOwnership,
  check_updateUpgraderAddress_whilePaused: check_updateUpgraderAddress_whilePaused,
  check_updateMasterMinter_whilePaused: check_updateMasterMinter_whilePaused,
  check_updateBlacklister_whilePaused: check_updateBlacklister_whilePaused,
  check_updatePauser_whilePaused: check_updatePauser_whilePaused,
  check_transferOwnership_whilePaused: check_transferOwnership_whilePaused,
  check_updateUpgraderAddress_toZeroAddress: check_updateUpgraderAddress_toZeroAddress,
  check_updateMasterMinter_toZeroAddress: check_updateMasterMinter_toZeroAddress,
  check_updateBlacklister_toZeroAddress: check_updateBlacklister_toZeroAddress,
  check_updatePauser_toZeroAddress: check_updatePauser_toZeroAddress,
  check_updateUpgraderAddress_toBlacklisted: check_updateUpgraderAddress_toBlacklisted,
  check_updateMasterMinter_toBlacklisted: check_updateMasterMinter_toBlacklisted,
  check_updateBlacklister_toBlacklisted: check_updateBlacklister_toBlacklisted,
  check_updatePauser_toBlacklisted: check_updatePauser_toBlacklisted,
  check_updatePauser_toBlacklisted: check_updatePauser_toBlacklisted,
  check_transferOwnership_toBlacklisted: check_transferOwnership_toBlacklisted,
  check_noPayableFunction: check_noPayableFunction,
  check_updateUpgraderAddress: check_updateUpgraderAddress,
};
