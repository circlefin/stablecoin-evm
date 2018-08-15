var tokenUtils = require('./TokenTestUtils');;
var BigNumber = require('bignumber.js');
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var checkVariables = tokenUtils.checkVariables;
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
var proxyOwnerAccount = tokenUtils.proxyOwnerAccount;
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var FiatToken = tokenUtils.FiatToken;

var amount = 100;

async function run_tests(newToken, accounts) {

  beforeEach('Make fresh token contract', async function () {
    rawToken = await newToken();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.equal(proxy.address, token.address);
  });

  it('pt000 should check that default variable values are correct', async function () {
    await checkVariables([token], [[]]);
  });

  // Pause and Unpause

  it('pt011 should pause and set paused to true', async function () {
    await token.pause({ from: pauserAccount });
    var customVars = [{ 'variable': 'paused', 'expectedValue': true }];
    await checkVariables([token], [customVars]);
  });

  it('pt006 should unpause and set paused to false', async function () {
    await token.pause({ from: pauserAccount });
    var customVars = [{ 'variable': 'paused', 'expectedValue': true }];
    await checkVariables([token], [customVars]);
    await token.unpause({ from: pauserAccount });
    await checkVariables([token], [[]]);
  });

  // Approve

  it('pt020 should approve a spend and set allowed amount', async function () {
    await token.approve(minterAccount, amount, { from: arbitraryAccount });
    var customVars = [
      { 'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);
  });

  // Blacklist and Unblacklist

  it('pt019 should blacklist and set blacklisted to true', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var customVars = [
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [customVars]);
  });

  it('pt018 should blacklist and set blacklisted to true, then unblacklist and set blacklisted to false', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var customVars = [
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [customVars]);

    await token.unBlacklist(arbitraryAccount, { from: blacklisterAccount });
    await checkVariables([token], [[]]);
  });

  // Configure minter

  it('pt015 should configureMinter, setting the minter to true and mintingAllowance to amount', async function () {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);
  });

  // Mint and Burn

  it('pt012 should mint the amount, increasing balance of recipient by amount, increasing total supply by amount, and decreasing minterAllowed by amount', async function () {
    var mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('pt017 should burn amount of tokens and reduce balance and total supply by amount', async function () {
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
    await checkVariables([token], [setup]);

    await token.burn(burnAmount, { from: minterAccount });
    var afterBurn = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
      { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(mintAmount - burnAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount - burnAmount) },
    ];
    await checkVariables([token], [afterBurn]);
  });

  // Remove minter

  it('pt010 should removeMinter, setting the minter to false and minterAllowed to 0', async function () {
    let mintAmount = 11;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount })
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    customVars = [
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  // Transfer and transferFrom

  it('pt008 should transfer, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    let mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });
    customVars = [
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('pt007 should transferFrom, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    let mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.approve(masterMinterAccount, mintAmount, { from: arbitraryAccount });
    await token.transferFrom(arbitraryAccount, pauserAccount, mintAmount, { from: masterMinterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  // Update methods

  it('pt004 should updateMasterMinter', async function () {
    await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount }
    ];
    await checkVariables([token], [result]);
  });

  it('pt005 should updateBlacklister', async function () {
    await token.updateBlacklister(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'blacklister', 'expectedValue': arbitraryAccount }
    ];
    await checkVariables([token], [result]);
  });

  it('pt003 should updatePauser', async function () {
    await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'pauser', 'expectedValue': arbitraryAccount }
    ];
    await checkVariables([token], [result]);
  });

  // Transfer Ownership

  it('pt009 should set owner to _newOwner', async function () {
    await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount }
    ];
    await checkVariables([token], [result]);
  });

}

var testWrapper = require('./TestWrapper');
testWrapper.execute('FiatToken_PositiveTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
