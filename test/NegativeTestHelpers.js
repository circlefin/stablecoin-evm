//var FiatToken = artifacts.require('FiatToken');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
//var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
//var bigZero = tokenUtils.bigZero;

var checkVariables = tokenUtils.checkVariables;
var expectRevert = tokenUtils.expectRevert;
var blacklist = tokenUtils.blacklist;
var ownerAccount = tokenUtils.ownerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var upgraderAccount = tokenUtils.upgraderAccount;
var roleAddressChangerAccount = tokenUtils.roleAddressChangerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var roleAddressChangerRole = tokenUtils.roleAddressChangerRole;


//Begin mint test helpers

async function shouldFailToMintWhenPaused(token) {
  //Configure minter
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.pause({from: pauserAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount},
    {'variable': 'paused', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToMintWhenMessageSenderIsNotMinter(token) {
  //Note: minterAccount has not yet been configured as a minter
  await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
  await checkVariables(token, []);
}

async function shouldFailToMintWhenMessageSenderIsBlacklisted(token) {
  await token.blacklist(minterAccount, {from: blacklisterAccount});

  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToMintWhenRecipientIsBlacklisted(token) {
  await token.blacklist(arbitraryAccount, {from: blacklisterAccount});

  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToMintWhenAllowanceIsLessThanAmount(token) {
  await token.configureMinter(minterAccount, amount - 1, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 1}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.mint(arbitraryAccount, amount, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToMintToZeroAddress(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.mint("0x0", amount, {from: minterAccount}));
  await checkVariables(token, customVars);

  await expectRevert(token.mint("0x0000000000000000000000000000000000000000", amount, {from: minterAccount}));

  await checkVariables(token, customVars);

  await expectRevert(token.mint(0x0000000000000000000000000000000000000000, amount, {from: minterAccount}));

  await checkVariables(token, customVars);
}

async function shouldFailToMintWhenContractIsNotOwner(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(arbitraryAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), arbitraryAccount);

  await expectRevert(token.mint(pauserAccount, 50, {from: minterAccount}));
}

//Begin approve test helpers

async function shouldFailToApproveWhenSpenderIsBlacklisted(token) {
  await token.blacklist(minterAccount, {from: blacklisterAccount});

  await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));

  await checkVariables(token, []);
}

async function shouldFailToMintWhenMessageSenderIsBlacklisted(token) {
  await token.blacklist(arbitraryAccount, {from: blacklisterAccount});

  await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));

  await checkVariables(token, []);
}

async function shouldFailToApproveWhenContractIsPaused(token) {
  await token.pause({from: pauserAccount});

  await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));

  await checkVariables(token, []);
}

async function shouldFailToApproveWhenContractIsNotOwner(token) {
  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(arbitraryAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), arbitraryAccount);

  await expectRevert(token.approve(pauserAccount, 50, {from: minterAccount}));
}

//Begin transferFrom test helpers

async function shouldFailToTransferFromToZeroAddress(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  expectRevert(token.transferFrom(arbitraryAccount, "0x0", 50, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToTransferFromAnAmountGreaterThanBalance(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await token.approve(upgraderAccount, amount, {from: arbitraryAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': amount},
  ]
  await checkVariables(token, customVars);

  expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, amount, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToTransferFromToBlacklistedRecipient(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(upgraderAccount, 50, {from: minterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.upgraderAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await token.approve(pauserAccount, 50, {from: upgraderAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.upgraderAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'allowance.upgraderAccount.pauserAccount', 'expectedValue': 50},
  ]
  await checkVariables(token, customVars);

  await blacklist(token, arbitraryAccount);
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.upgraderAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'allowance.upgraderAccount.pauserAccount', 'expectedValue': 50},
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  expectRevert(token.transferFrom(upgraderAccount, arbitraryAccount, 50, {from: pauserAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToTransferFromFromBlacklistedMessageSender(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(upgraderAccount, 50, {from: minterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.upgraderAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await token.approve(arbitraryAccount, 50, {from: upgraderAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.upgraderAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'allowance.upgraderAccount.arbitraryAccount', 'expectedValue': 50},
  ]
  await checkVariables(token, customVars);

  await blacklist(token, arbitraryAccount);
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.upgraderAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'allowance.upgraderAccount.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  expectRevert(token.transferFrom(upgraderAccount, pauserAccount, 50, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToTransferFromWhenFromIsBlacklisted(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': 50},
  ]
  await checkVariables(token, customVars);

  await blacklist(token, arbitraryAccount);
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': 50},
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 50, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToTransferFromAnAmountGreaterThanAllowedForMessageSender(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': 50},
  ]
  await checkVariables(token, customVars);

  expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 60, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToTransferFromWhenPaused(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': 50},
  ]
  await checkVariables(token, customVars);

  await token.pause({from: pauserAccount});
  customVars = [
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': 50},
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': 50},
    {'variable': 'paused', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 50, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToTransferFromWhenContractIsNotOwner(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': 50},
  ]
  await checkVariables(token, customVars);

  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(pauserAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), pauserAccount);

  await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 50, {from: upgraderAccount}));
}

//Begin transfer test helpers

async function shouldFailToTransferToZeroAddress(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  expectRevert(token.transfer("0x0", 50, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToTransferAnAmountGreaterThanBalance(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  expectRevert(token.transfer(pauserAccount, amount, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToTransferToBlacklistedRecipient(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(upgraderAccount, 50, {from: minterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.upgraderAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await blacklist(token, arbitraryAccount);
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.upgraderAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  expectRevert(token.transfer(arbitraryAccount, 50, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToTransferWhenSenderIsBlacklisted(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await blacklist(token, arbitraryAccount);
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  expectRevert(token.transfer(upgraderAccount, 50, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToTransferWhenPaused(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await token.pause({from: pauserAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'paused', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.transfer(upgraderAccount, 50, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToTransferWhenContractIsNotOwner(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(pauserAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), pauserAccount);

  await expectRevert(token.transfer(pauserAccount, 50, {from: arbitraryAccount}));
}

//Begin configureMinter test helpers

async function shouldFailToConfigureMinterWhenSenderIsNotMasterMinter(token) {
  assert.isFalse(arbitraryAccount == masterMinterAccount);
  await expectRevert(token.configureMinter(minterAccount, amount, {from: arbitraryAccount}));
  await checkVariables(token, []);
}

async function shouldFailToConfigureMinterWhenContractIsNotOwner(token) {
  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(arbitraryAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), arbitraryAccount);

  await expectRevert(token.configureMinter(minterAccount, amount, {from: masterMinterAccount}));
}

async function shouldFailToConfigureMinterWhenPaused(token) {
  await token.pause({from: pauserAccount});
  customVars = [
    {'variable': 'paused', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.configureMinter(minterAccount, amount, {from: masterMinterAccount}));
  await checkVariables(token, customVars);
}

//Begin removeMinter test helpers

async function shouldFailToRemoveMinterWhenSenderIsNotMasterMinter(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.removeMinter(minterAccount, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToRemoveMinterWhenContractIsNotOwner(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(arbitraryAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), arbitraryAccount);

  await expectRevert(token.removeMinter(minterAccount, {from: masterMinterAccount}));
}

async function shouldFailToBurnWhenBalanceIsLessThanAmount(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.burn(amount, {from: minterAccount}));
}

async function shouldFailToBurnWhenAmountIsNegative(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  await token.mint(minterAccount, amount, {from: minterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': 0},
    {'variable': 'balances.minterAccount', 'expectedValue': amount},
    {'variable': 'totalSupply', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.burn(-1, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToBurnWhenSenderIsBlacklisted(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(minterAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.minterAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await blacklist(token, minterAccount);
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.minterAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.burn(50, {from: minterAccount}));
}

async function shouldFailToBurnWhenPaused(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(minterAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.minterAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await token.pause({from: pauserAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.minterAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50},
    {'variable': 'paused', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.burn(50, {from: minterAccount}));
}

async function shouldFailToBurnWhenSenderIsNotMinter(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(minterAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.minterAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.burn(50, {from: arbitraryAccount}));
}

async function shouldFailToBurnAfterRemoverMinter(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(minterAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.minterAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await token.removeMinter(minterAccount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': false},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': 0},
    {'variable': 'balances.minterAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.burn(50, {from: minterAccount}));
}

async function shouldFailToBurnWhenContractIsNotOwner(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
  ]
  await checkVariables(token, customVars);

  await token.mint(minterAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 50},
    {'variable': 'balances.minterAccount', 'expectedValue': 50},
    {'variable': 'totalSupply', 'expectedValue': 50}
  ]
  await checkVariables(token, customVars);

  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(arbitraryAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), arbitraryAccount);

  await expectRevert(token.burn(50, {from: minterAccount}));
}

//Begin updateRoleAddress/updateUpgraderAddress test helpers

async function shouldFailToUpdateRoleAddressWhenSenderIsNotRoleAddressChanger(token) {
  await expectRevert(token.updateRoleAddress(pauserAccount, "masterMinter", {from: arbitraryAccount}));
  await checkVariables(token, []);
}

async function shouldFailToUpdateRoleAddressWhenSenderIsOldRoleAddressChanger(token) {
  await token.updateRoleAddress(arbitraryAccount, roleAddressChangerRole, {from: roleAddressChangerAccount});
  var customVars = [
    {'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.updateRoleAddress(masterMinterAccount, roleAddressChangerRole, {from: roleAddressChangerAccount}));
  await checkVariables(token, customVars);
}

async function shouldFailToUpdateUpgraderAddressWhenSenderIsNotUpgrader(token) {
  await expectRevert(token.updateUpgraderAddress(arbitraryAccount, {from: pauserAccount}));
  await checkVariables(token, []);
}

//Begin pause/unpause test helpers

async function shouldFailToPauseWhenSenderIsNotPauser(token) {
  await expectRevert(token.pause({from: arbitraryAccount}));
}

async function shouldFailToUnpauseWhenSenderIsNotPauser(token) {
  await token.pause({from: pauserAccount});
  customVars = [
    {'variable': 'paused', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.unpause({from: arbitraryAccount}));
}

//Begin blacklist/unblacklist test helpers

async function shouldFailToBlacklistWhenSenderIsNotBlacklister(token) {
  await expectRevert(token.blacklist(upgraderAccount, {from: arbitraryAccount}));
}

async function shouldFailToUnblacklistWhenSenderIsNotBlacklister(token) {
  await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
  customVars = [
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.unBlacklist(arbitraryAccount, {from: upgraderAccount}));
}

async function shouldFailToUnblacklistWhenPaused(token) {
  await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
  customVars = [
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  await token.pause({from: pauserAccount});
  customVars = [
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true},
    {'variable': 'paused', 'expectedValue': true}
  ]
  await checkVariables(token, customVars);

  await expectRevert(token.unBlacklist(arbitraryAccount, {from: blacklisterAccount}));
}

//Begin upgrade test helpers

async function shouldFailToUpgradeWhenSenderIsNotUpgrader(token) {
  await expectRevert(token.upgrade(arbitraryAccount, {from: minterAccount}));
}

async function shouldFailToUpgradeWhenUpgradedAddressIsNotZeroAddress(token) {
  await token.upgrade(arbitraryAccount, {from: upgraderAccount});
  await expectRevert(token.upgrade(pauserAccount, {from: upgraderAccount}));
}

async function shouldFailToUpgradeWhenNewAddressIsZeroAddress(token) {
  await expectRevert(token.upgrade("0x0", {from: upgraderAccount}));
}

//Begin disablePriorContract test helpers

async function shouldFailToDisablePriorContractWhenSenderIsNotPauser(token) {
  let dataContractAddress = await token.getDataContractAddress();
  newToken = await UpgradedFiatToken.new(
    dataContractAddress,
    token.address,
    name,
    symbol,
    currency,
    decimals,
    masterMinterAccount,
    pauserAccount,
    blacklisterAccount,
    upgraderAccount,
    roleAddressChangerAccount);
  await(token.upgrade(newToken.address, {from: upgraderAccount}));

  await expectRevert(newToken.disablePriorContract({from: arbitraryAccount}));
}
