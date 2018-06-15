var FiatToken = artifacts.require('FiatToken');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var BigNumber = require('bignumber.js');
var tokenUtils = require('./TokenTestUtils');
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var bigZero = tokenUtils.bigZero;

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

var amount = 100;


//Begin mint test helpers

async function fail_mint_paused(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  await token.pause({from: pauserAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
    {'variable': 'paused', 'expectedValue': true}
  ]
  await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function fail_mint_senderNotMinter(token) {
  //Note: minterAccount has not yet been configured as a minter
  await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
  await checkVariables(token, []);
}

async function fail_mint_senderBlacklisted(token) {
  await token.blacklist(minterAccount, {from: blacklisterAccount});
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
    {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true}
  ]
  await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function fail_mint_recipientBlacklisted(token) {
  await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function fail_mint_allowanceLessThanAmount(token) {
  await token.configureMinter(minterAccount, amount - 1, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 1)}
  ]
  await expectRevert(token.mint(arbitraryAccount, amount, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function fail_mint_toZeroAddress(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await expectRevert(token.mint("0x0", amount, {from: minterAccount}));
  await expectRevert(token.mint("0x0000000000000000000000000000000000000000", amount, {from: minterAccount}));
  await expectRevert(token.mint(0x0000000000000000000000000000000000000000, amount, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function fail_mint_contractNotOwner(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(arbitraryAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), arbitraryAccount);

  await expectRevert(token.mint(pauserAccount, 50, {from: minterAccount}));
}

//Begin approve test helpers

async function fail_approve_spenderBlacklisted(token) {
  await token.blacklist(minterAccount, {from: blacklisterAccount});
  var customVars = [
    {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true},
  ]
  await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function fail_approve_messageSenderBlacklisted(token) {
  await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
  var customVars = [
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true},
  ]
  await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function fail_approve_paused(token) {
  await token.pause({from: pauserAccount});
  var customVars = [
    {'variable': 'paused', 'expectedValue': true},
  ]
  await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function fail_approve_contractNotOwner(token) {
  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(arbitraryAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), arbitraryAccount);

  await expectRevert(token.approve(pauserAccount, 50, {from: minterAccount}));
}

//Begin transferFrom test helpers

async function fail_transferFrom_toZeroAddress(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)}
  ]
  await expectRevert(token.transferFrom(arbitraryAccount, "0x0", 50, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

async function fail_transferFrom_amountGreaterThanBalance(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  await token.approve(upgraderAccount, amount, {from: arbitraryAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(amount)},
  ]
  await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, amount, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

async function fail_transferFrom_recipientBlacklisted(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(upgraderAccount, 50, {from: minterAccount});
  await token.approve(pauserAccount, 50, {from: upgraderAccount});
  await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.upgraderAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'allowance.upgraderAccount.pauserAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await expectRevert(token.transferFrom(upgraderAccount, arbitraryAccount, 50, {from: pauserAccount}));
  await checkVariables(token, customVars);
}

async function fail_transferFrom_messageSenderBlacklisted(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(upgraderAccount, 50, {from: minterAccount});
  await token.approve(arbitraryAccount, 50, {from: upgraderAccount});
  await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.upgraderAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'allowance.upgraderAccount.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await expectRevert(token.transferFrom(upgraderAccount, pauserAccount, 50, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function fail_transferFrom_fromBlacklisted(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
  await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 50, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

async function fail_transferFrom_amountGreaterThanAllowance(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)},
  ]
  await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 60, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

async function fail_transferFrom_paused(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
  await token.pause({from: pauserAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'paused', 'expectedValue': true}
  ]
  await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 50, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

async function fail_transferFrom_contractNotOwner(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)},
  ]
  await checkVariables(token, customVars);

  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(pauserAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), pauserAccount);

  await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 50, {from: upgraderAccount}));
}

//Begin transfer test helpers

async function fail_transfer_toZeroAddress(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
  ]
  await expectRevert(token.transfer("0x0", 50, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function fail_transfer_amountGreaterThanBalance(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
  ]
  await expectRevert(token.transfer(pauserAccount, amount, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function fail_transfer_recipientBlacklisted(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(upgraderAccount, 50, {from: minterAccount});
  await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.upgraderAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await expectRevert(token.transfer(arbitraryAccount, 50, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

async function fail_transfer_senderBlacklisted(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await expectRevert(token.transfer(upgraderAccount, 50, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function fail_transfer_paused(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  await token.pause({from: pauserAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'paused', 'expectedValue': true}
  ]
  await expectRevert(token.transfer(upgraderAccount, 50, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function fail_transfer_contractNotOwner(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
  ]
  await checkVariables(token, customVars);

  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(pauserAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), pauserAccount);

  await expectRevert(token.transfer(pauserAccount, 50, {from: arbitraryAccount}));
}

//Begin configureMinter test helpers

async function fail_configureMinter_senderNotMasterMinter(token) {
  assert.isFalse(arbitraryAccount == masterMinterAccount);
  await expectRevert(token.configureMinter(minterAccount, amount, {from: arbitraryAccount}));
  await checkVariables(token, []);
}

async function fail_configureMinter_contractNotOwner(token) {
  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(arbitraryAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), arbitraryAccount);

  await expectRevert(token.configureMinter(minterAccount, amount, {from: masterMinterAccount}));
}

async function fail_configureMinter_paused(token) {
  await token.pause({from: pauserAccount});
  customVars = [
    {'variable': 'paused', 'expectedValue': true}
  ]
  await expectRevert(token.configureMinter(minterAccount, amount, {from: masterMinterAccount}));
  await checkVariables(token, customVars);
}

//Begin removeMinter test helpers

async function fail_removeMinter_senderNotMasterMinter(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await expectRevert(token.removeMinter(minterAccount, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function fail_removeMinter_contractNotOwner(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(arbitraryAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), arbitraryAccount);

  await expectRevert(token.removeMinter(minterAccount, {from: masterMinterAccount}));
}

//Begin burn test helpers

async function fail_burn_balanceLessThanAmount(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await expectRevert(token.burn(amount, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function fail_burn_amountNegative(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  await token.mint(minterAccount, amount, {from: minterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0)},
    {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)}
  ]
  await expectRevert(token.burn(-1, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function fail_burn_senderBlacklisted(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(minterAccount, 50, {from: minterAccount});
  await token.blacklist(minterAccount, {from: blacklisterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true}
  ]
  await expectRevert(token.burn(50, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function fail_burn_paused(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(minterAccount, 50, {from: minterAccount});
  await token.pause({from: pauserAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
    {'variable': 'paused', 'expectedValue': true}
  ]
  await expectRevert(token.burn(50, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function fail_burn_senderNotMinter(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(minterAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
  ]
  await expectRevert(token.burn(50, {from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

async function fail_burn_afterRemoverMinter(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(minterAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
  ]
  await checkVariables(token, customVars);

  await token.removeMinter(minterAccount, {from: masterMinterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': false},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0)},
    {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
  ]
  await expectRevert(token.burn(50, {from: minterAccount}));
  await checkVariables(token, customVars);
}

async function fail_burn_contractNotOwner(token) {
  await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
  var customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
  ]
  await checkVariables(token, customVars);

  await token.mint(minterAccount, 50, {from: minterAccount});
  customVars = [
    {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
    {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
    {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(50)},
    {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
  ]
  await checkVariables(token, customVars);

  var dataContractAddress = await token.getDataContractAddress();
  var storage = EternalStorage.at(dataContractAddress);
  await token.upgrade(arbitraryAccount, {from: upgraderAccount});
  assert.equal(await storage.owner.call(), arbitraryAccount);

  await expectRevert(token.burn(50, {from: minterAccount}));
}

//Begin updateRoleAddress/updateUpgraderAddress test helpers

async function fail_updateRoleAddress_senderNotRoleAddressChanger(token) {
  await expectRevert(token.updateRoleAddress(pauserAccount, "masterMinter", {from: arbitraryAccount}));
  await checkVariables(token, []);
}

async function fail_updateRoleAddress_senderIsOldRoleAddressChanger(token) {
  await token.updateRoleAddress(arbitraryAccount, roleAddressChangerRole, {from: roleAddressChangerAccount});
  var customVars = [
    {'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount}
  ]
  await expectRevert(token.updateRoleAddress(masterMinterAccount, roleAddressChangerRole, {from: roleAddressChangerAccount}));
  await checkVariables(token, customVars);
}

async function fail_updateUpgraderAddress_senderNotUpgrader(token) {
  await expectRevert(token.updateUpgraderAddress(arbitraryAccount, {from: pauserAccount}));
  await checkVariables(token, []);
}

//Begin pause/unpause test helpers

async function fail_pause_senderNotPauser(token) {
  await expectRevert(token.pause({from: arbitraryAccount}));
  await checkVariables(token, []);
}

async function fail_unpause_senderNotPauser(token) {
  await token.pause({from: pauserAccount});
  customVars = [
    {'variable': 'paused', 'expectedValue': true}
  ]
  await expectRevert(token.unpause({from: arbitraryAccount}));
  await checkVariables(token, customVars);
}

//Begin blacklist/unblacklist test helpers

async function fail_blacklist_senderNotBlacklister(token) {
  await expectRevert(token.blacklist(upgraderAccount, {from: arbitraryAccount}));
  await checkVariables(token, []);
}

async function fail_unblacklist_senderNotBlacklister(token) {
  await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
  customVars = [
    {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
  ]
  await expectRevert(token.unBlacklist(arbitraryAccount, {from: upgraderAccount}));
  await checkVariables(token, customVars);
}

//Begin upgrade test helpers

async function fail_upgrade_senderNotUpgrader(token) {
  await expectRevert(token.upgrade(arbitraryAccount, {from: minterAccount}));
  await checkVariables(token, []);
}

async function fail_upgrade_upgradedAddressIsNotZeroAddress(token) {
  await token.upgrade(arbitraryAccount, {from: upgraderAccount});
  await expectRevert(token.upgrade(pauserAccount, {from: upgraderAccount}));
}

async function fail_upgrade_newAddressIsZeroAddress(token) {
  await expectRevert(token.upgrade("0x0", {from: upgraderAccount}));
  await checkVariables(token, []);
}

//Begin disablePriorContract test helpers

async function fail_disablePriorContract_senderNotPauser(token) {
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
  await (token.upgrade(newToken.address, {from: upgraderAccount}));

  await expectRevert(newToken.disablePriorContract({from: arbitraryAccount}));
  await checkVariables(token, []);
}

module.exports = {
  fail_mint_paused: fail_mint_paused,
  fail_mint_senderNotMinter: fail_mint_senderNotMinter,
  fail_mint_senderBlacklisted: fail_mint_senderBlacklisted,
  fail_mint_recipientBlacklisted: fail_mint_recipientBlacklisted,
  fail_mint_allowanceLessThanAmount: fail_mint_allowanceLessThanAmount,
  fail_mint_toZeroAddress: fail_mint_toZeroAddress,
  fail_mint_contractNotOwner: fail_mint_contractNotOwner,
  fail_approve_spenderBlacklisted: fail_approve_spenderBlacklisted,
  fail_approve_messageSenderBlacklisted: fail_approve_messageSenderBlacklisted,
  fail_approve_paused: fail_approve_paused,
  fail_approve_contractNotOwner: fail_approve_contractNotOwner,
  fail_transferFrom_toZeroAddress: fail_transferFrom_toZeroAddress,
  fail_transferFrom_amountGreaterThanBalance: fail_transferFrom_amountGreaterThanBalance,
  fail_transferFrom_recipientBlacklisted: fail_transferFrom_recipientBlacklisted,
  fail_transferFrom_messageSenderBlacklisted: fail_transferFrom_messageSenderBlacklisted,
  fail_transferFrom_fromBlacklisted: fail_transferFrom_fromBlacklisted,
  fail_transferFrom_amountGreaterThanAllowance: fail_transferFrom_amountGreaterThanAllowance,
  fail_transferFrom_paused: fail_transferFrom_paused,
  fail_transferFrom_contractNotOwner: fail_transferFrom_contractNotOwner,
  fail_transfer_toZeroAddress: fail_transfer_toZeroAddress,
  fail_transfer_amountGreaterThanBalance: fail_transfer_amountGreaterThanBalance,
  fail_transfer_recipientBlacklisted: fail_transfer_recipientBlacklisted,
  fail_transfer_senderBlacklisted: fail_transfer_senderBlacklisted,
  fail_transfer_paused: fail_transfer_paused,
  fail_transfer_contractNotOwner: fail_transfer_contractNotOwner,
  fail_configureMinter_senderNotMasterMinter: fail_configureMinter_senderNotMasterMinter,
  fail_configureMinter_contractNotOwner: fail_configureMinter_contractNotOwner,
  fail_configureMinter_paused: fail_configureMinter_paused,
  fail_removeMinter_senderNotMasterMinter: fail_removeMinter_senderNotMasterMinter,
  fail_removeMinter_contractNotOwner: fail_removeMinter_contractNotOwner,
  fail_burn_balanceLessThanAmount: fail_burn_balanceLessThanAmount,
  fail_burn_amountNegative: fail_burn_amountNegative,
  fail_burn_senderBlacklisted: fail_burn_senderBlacklisted,
  fail_burn_paused: fail_burn_paused,
  fail_burn_senderNotMinter: fail_burn_senderNotMinter,
  fail_burn_afterRemoverMinter: fail_burn_afterRemoverMinter,
  fail_burn_contractNotOwner: fail_burn_contractNotOwner,
  fail_updateRoleAddress_senderNotRoleAddressChanger: fail_updateRoleAddress_senderNotRoleAddressChanger,
  fail_updateRoleAddress_senderIsOldRoleAddressChanger: fail_updateRoleAddress_senderIsOldRoleAddressChanger,
  fail_updateUpgraderAddress_senderNotUpgrader: fail_updateUpgraderAddress_senderNotUpgrader,
  fail_pause_senderNotPauser: fail_pause_senderNotPauser,
  fail_unpause_senderNotPauser: fail_unpause_senderNotPauser,
  fail_blacklist_senderNotBlacklister: fail_blacklist_senderNotBlacklister,
  fail_unblacklist_senderNotBlacklister: fail_unblacklist_senderNotBlacklister,
  fail_upgrade_senderNotUpgrader: fail_upgrade_senderNotUpgrader,
  fail_upgrade_upgradedAddressIsNotZeroAddress: fail_upgrade_upgradedAddressIsNotZeroAddress,
  fail_upgrade_newAddressIsZeroAddress: fail_upgrade_newAddressIsZeroAddress,
  fail_disablePriorContract_senderNotPauser: fail_disablePriorContract_senderNotPauser,
};
