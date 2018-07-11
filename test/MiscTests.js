var FiatToken = artifacts.require('FiatToken');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');;
var BigNumber = require('bignumber.js');
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var checkVariables = tokenUtils.checkVariables;
var checkVariables_storage = tokenUtils.checkVariables_storage;
var expectRevert = tokenUtils.expectRevert;
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var deployerAccount = tokenUtils.deployerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var upgraderAccount = tokenUtils.upgraderAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;

var amount = 100;

async function run_tests(newToken) {

  beforeEach('Make fresh token contract', async function () {
    token = await newToken();
  });

  it('pt016 should check that default variable values are correct', async function () {
    await checkVariables([token], [[]]);
  });


  // No Payable Function

  it('ms001 no payable function', async function () {
    var success = false;
    try {
      await web3.eth.sendTransaction({ from: arbitraryAccount, to: token.address, value: 1 });
    } catch (e) {
      success = true;
    }
    assert.equal(true, success);
  });

  // Same Address

  it('ms005 should mint to self with correct final balance', async function () {
    var mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(minterAccount, mintAmount, { from: minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms006 should approve correct allowance for self', async function () {
    var mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.approve(arbitraryAccount, amount, { from: arbitraryAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'allowance.arbitraryAccount.arbitraryAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms007 should configureMinter for masterMinter', async function () {
    await token.configureMinter(masterMinterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.masterMinterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.masterMinterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms008 should upgrade contract to original address', async function () {
    await token.upgrade(token.address, {from: upgraderAccount});
    assert.equal(await token.upgradedAddress.call(), token.address);
  });

  // Multiple Minters

  it('ms009 should configure two minters', async function () {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms010 should configure two minters and each mint distinct amounts', async function () {
    var mintAmount1 = 10;
    var mintAmount2 = 20;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    await token.mint(pauserAccount, mintAmount1, { from: minterAccount });
    await token.mint(pauserAccount, mintAmount2, { from: arbitraryAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount1) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount - mintAmount2) },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount1 + mintAmount2) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount1 + mintAmount2) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms011 should configure two minters, each minting distinct amounts and then remove one minter', async function () {
    var mintAmount1 = 10;
    var mintAmount2 = 20;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    await token.mint(pauserAccount, mintAmount1, { from: minterAccount });
    await token.mint(pauserAccount, mintAmount2, { from: arbitraryAccount });
    await token.removeMinter(arbitraryAccount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount1) },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount1 + mintAmount2) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount1 + mintAmount2) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms012 should configure two minters and adjust both allowances', async function () {
    var adjustment = 10;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount) },
    ];
    await checkVariables([token], [customVars]);

    await token.configureMinter(minterAccount, amount - adjustment, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount + adjustment, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - adjustment) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount + adjustment) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms013 should configure two minters, one with zero allowance fails to mint', async function () {
    var mintAmount = 10;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, 0, { from: masterMinterAccount });
    await token.mint(pauserAccount, mintAmount, { from: minterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
    ];
    await expectRevert(token.mint(pauserAccount, mintAmount, { from: arbitraryAccount }));
    //await expectRevert(token.mint(pauserAccount, 0, { from: arbitraryAccount }));
    await checkVariables([token], [customVars]);
  });

  it('ms014 should configure two minters and fail to mint when paused', async function () {
    var mintAmount = 10;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    await token.pause({ from: pauserAccount });
    var customVars = [
      { 'variable': 'paused', 'expectedValue': true },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await expectRevert(token.mint(pauserAccount, mintAmount, { from: minterAccount }));
    await expectRevert(token.mint(pauserAccount, mintAmount, { from: arbitraryAccount }));
    await checkVariables([token], [customVars]);
  });

  it('ms015 should configure two minters, blacklist one and ensure it cannot mint, then unblacklist and ensure it can mint', async function () {
    var mintAmount = 10;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    await token.mint(pauserAccount, mintAmount, { from: arbitraryAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
    ];
    await expectRevert(token.mint(pauserAccount, mintAmount, { from: minterAccount }));
    await checkVariables([token], [customVars]);

    await token.unBlacklist(minterAccount, { from: blacklisterAccount });
    await token.mint(pauserAccount, mintAmount, { from: minterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount + mintAmount) },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount + mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms016 should configure two minters, each mints to themselves and then burns certain amount', async function () {
    var mintAmount1 = 10;
    var mintAmount2 = 20;
    var burnAmount = 10;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, mintAmount1, { from: minterAccount });
    await token.mint(arbitraryAccount, mintAmount2, { from: arbitraryAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount1) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount - mintAmount2) },
      { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(mintAmount1) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount2) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount1 + mintAmount2) },
    ];
    await checkVariables([token], [customVars]);

    await token.burn(burnAmount, { from: minterAccount });
    await token.burn(burnAmount, { from: arbitraryAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount1) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount - mintAmount2) },
      { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(mintAmount1 - burnAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount2 - burnAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount1 + mintAmount2 - burnAmount - burnAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  // 0 Input

  it('ms017 should mint 0 tokens with unchanged state', async function () {
    var mintAmount = 0;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await checkVariables([token], [customVars]);
  });

  it('ms018 should approve 0 token allowance with unchanged state', async function () {
    await token.approve(minterAccount, 0, { from: arbitraryAccount });
    await checkVariables([token], [[]]);
  });

  it('ms019 should transferFrom 0 tokens with unchanged state', async function () {
    await token.transferFrom(arbitraryAccount, pauserAccount, 0, { from: upgraderAccount });
    await checkVariables([token], [[]]);
  });

  it('ms020 should transfer 0 tokens with unchanged state', async function () {
    await token.transfer(arbitraryAccount, 0, { from: upgraderAccount });
    await checkVariables([token], [[]]);
  });

  it('ms021 should burn 0 tokens with unchanged state', async function () {
    var burnAmount = 0;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];

    await token.burn(burnAmount, { from: minterAccount });
    await checkVariables([token], [customVars]);
  });
}

async function run_storage_tests(newStorage) {

  beforeEach('Make fresh eternal storage', async function () {
    params = await newStorage();
    storage = params[0];
    storageOwner = params[1];
  });

  it('should check that storage default variable values are correct', async function() {
    await checkVariables_storage(storage, []);
  });


  it('ms022 should setAllowed to 0 with unchanged state', async function() {
    await storage.setAllowed(arbitraryAccount, upgraderAccount, 0, {from: storageOwner});
    await checkVariables_storage(storage, []);
  });

  it('ms023 should setAllowed for same address', async function() {
    await storage.setAllowed(arbitraryAccount, arbitraryAccount, amount, {from: storageOwner});
    var customVars = [
      {'variable': 'allowance.arbitraryAccount.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
    ];
    await checkVariables_storage(storage, customVars);
  });

  it('ms024 should setBalance to 0 with unchanged state', async function() {
    await storage.setBalance(arbitraryAccount, 0, {from: storageOwner});
    await checkVariables_storage(storage, []);
  });

  it('ms025 should setBalances for same address', async function() {
    await storage.setBalances(arbitraryAccount, 30, arbitraryAccount, 40, {from: storageOwner});
    var customVars = [
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(40)},
    ];
    await checkVariables_storage(storage, customVars);
  });

  it('ms026 should setBalances to 0 firstAmount', async function() {
    await storage.setBalances(arbitraryAccount, 0, upgraderAccount, 20, {from: storageOwner});
    var customVars = [
      {'variable': 'balances.upgraderAccount', 'expectedValue': new BigNumber(20)},
    ];
    await checkVariables_storage(storage, customVars);
  });

  it('ms027 should setBalances to 0 secondAmount', async function() {
    await storage.setBalances(arbitraryAccount, 20, upgraderAccount, 0, {from: storageOwner});
    var customVars = [
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(20)},
    ];
    await checkVariables_storage(storage, customVars);
  });

  it('ms028 should setTotalSupply to 0', async function() {
    await storage.setTotalSupply(0, {from: storageOwner});
    await checkVariables_storage(storage, []);
  });

  it('ms029 should setMinterAllowed to 0', async function() {
    await storage.setMinterAllowed(arbitraryAccount, 0, {from: storageOwner});
    await checkVariables_storage(storage, []);
  });

  // it('ms030 should approveViaPriorContract for same address', async function() {
  //   //TODO
  // });
  //
  // it('ms031 should approveViaPriorContract 0 tokens', async function() {
  //   //TODO
  // });
  //
  // it('ms032 should transferViaPriorContract for same address', async function() {
  //   //TODO
  // });
  //
  // it('ms033 should transferViaPriorContract 0 tokens', async function() {
  //   //TODO
  // });
  //
  // it('ms034 should transferFromViaPriorContract for same address', async function() {
  //   //TODO
  // });
  //
  // it('ms035 should transferFromViaPriorContract 0 tokens', async function() {
  //   //TODO
  // });
  //
  // it('ms036 should get allowance for same address', async function() {
  //   //TODO
  // });

}

module.exports = {
  run_tests: run_tests,
  run_storage_tests: run_storage_tests,
}
