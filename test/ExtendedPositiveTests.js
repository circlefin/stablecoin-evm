var FiatToken = artifacts.require('FiatToken');
var tokenUtils = require('./TokenTestUtils');
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
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var upgradeTo = tokenUtils.upgradeTo;

var amount = 100;

async function run_tests(newToken) {

  beforeEach('Make fresh token contract', async function () {
    rawToken = await newToken();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.equal(proxy.address, token.address);
  });

  it('should check that default variable values are correct', async function () {
    await checkVariables([token], [[]]);
  });

  // Paused

  it('ept002 should updateMasterMinter while paused', async function () {
    await token.pause({ from: pauserAccount });
    await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [result]);
  });

  it('ept003 should updateBlacklister while paused', async function () {
    await token.pause({ from: pauserAccount });
    await token.updateBlacklister(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'blacklister', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [result]);
  });

  it('ept004 should updatePauser while paused', async function () {
    await token.pause({ from: pauserAccount });
    await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'pauser', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [result]);
  });

  it('ept005 should transferOwnership while paused', async function () {
    await token.pause({ from: pauserAccount });
    await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [result]);
  });

  it('ept006 should removeMinter while paused', async function () {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.pause({ from: pauserAccount });
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [isAMinter]);

    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [notAMinter]);
  });

  it('ept008 should upgrade while paused', async function() {
    var newRawToken = await UpgradedFiatToken.new();
    await token.pause({from: pauserAccount});
    var tokenConfig = await upgradeTo(proxy, newRawToken);
    var newProxiedToken = tokenConfig.token;
    var newToken = newProxiedToken;

    var newToken_result = [
      { 'variable': 'paused', 'expectedValue': true },
      {'variable': 'proxiedTokenAddress', 'expectedValue': newRawToken.address }
    ];
    await checkVariables([newToken], [newToken_result]);
  });

  // Zero Address

  it('ept010 should updateMasterMinter to zero address', async function () {
    let longZero = 0x0000000000000000000000000000000000000000;
    let shortZero = 0x00;

    await token.updateMasterMinter(longZero, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': "0x0000000000000000000000000000000000000000" },
    ];

    // Note: longZero and shortZero both resolve to 0x0000000000000000000000000000000000000000
    await token.updateMasterMinter(shortZero, { from: tokenOwnerAccount });
    await checkVariables([token], [result]);
  });

  it('ept011 should updateBlacklister to zero address', async function () {
    let longZero = 0x0000000000000000000000000000000000000000;
    let shortZero = 0x00;

    await token.updateBlacklister(longZero, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'blacklister', 'expectedValue': "0x0000000000000000000000000000000000000000" },
    ];

    await token.updateBlacklister(shortZero, { from: tokenOwnerAccount });
    await checkVariables([token], [result]);
  });

  it('ept012 should updatePauser to zero address', async function () {
    let longZero = 0x0000000000000000000000000000000000000000;
    let shortZero = 0x00;

    await token.updatePauser(longZero, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'pauser', 'expectedValue': "0x0000000000000000000000000000000000000000" },
    ];

    await token.updatePauser(shortZero, { from: tokenOwnerAccount });
    await checkVariables([token], [result]);
  });

  // Blacklisted

  it('ept014 should updateMasterMinter when msg.sender blacklisted', async function () {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept015 should updateBlacklister when msg.sender blacklisted', async function () {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    await token.updateBlacklister(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'blacklister', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept016 should updatePauser when msg.sender blacklisted', async function () {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'pauser', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept017 should transferOwnership when msg.sender blacklisted', async function () {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it ('ept018 should pause when msg.sender blacklisted', async function() {
    await token.blacklist(pauserAccount, { from: blacklisterAccount });
    await token.pause({ from: pauserAccount });
    var setup = [
      { 'variable': 'paused', 'expectedValue': true },
      { 'variable': 'isAccountBlacklisted.pauserAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it ('ept019 should unpause when msg.sender blacklisted', async function() {
    await token.pause({ from: pauserAccount });
    var setup = [
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);

    await token.blacklist(pauserAccount, { from: blacklisterAccount });
    await token.unpause({ from: pauserAccount });
    setup = [
      { 'variable': 'isAccountBlacklisted.pauserAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it ('ept020 should blacklist when msg.sender blacklisted', async function() {
    await token.blacklist(blacklisterAccount, { from: blacklisterAccount });
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.blacklisterAccount', 'expectedValue': true },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it ('ept021 should unBlacklist when msg.sender blacklisted', async function() {
    await token.blacklist(blacklisterAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.blacklisterAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);

    await token.unBlacklist(blacklisterAccount, { from: blacklisterAccount });
    await checkVariables([token], [[]]);
  });

  it ('ept023 should upgrade to blacklisted address', async function() {
    var newRawToken = await UpgradedFiatToken.new();

    await token.blacklist(newRawToken.address, { from: blacklisterAccount });
    var tokenConfig = await upgradeTo(proxy, newRawToken);
    var newProxiedToken = tokenConfig.token;
    var newToken = newProxiedToken;

    var newToken_result = [
      {'variable': 'proxiedTokenAddress', 'expectedValue': newRawToken.address }
    ];

    assert(await newToken.isBlacklisted(newRawToken.address));
    await checkVariables([newToken], [newToken_result]);
  });

  it('ept024 should blacklist a blacklisted address', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await checkVariables([token], [setup]);
  });

  it('ept026 should updateMasterMinter to blacklisted address', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept027 should updateBlacklister to blacklisted address', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.updateBlacklister(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'blacklister', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept028 should updatePauser to blacklisted address', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'pauser', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept029 should transferOwnership to blacklisted address', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept030 should configureMinter when masterMinter is blacklisted', async function () {
    await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var result = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [result]);
  });

  it('ept032 should configureMinter when minter is blacklisted', async function () {
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var result = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
    ];
    await checkVariables([token], [result]);
  });

  it('ept033 should removeMinter when masterMinter is blacklisted', async function() {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
    ];
    await checkVariables([token], [customVars]);

    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ept034 should removeMinter when minter is blacklisted', async function() {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
    ];
    await checkVariables([token], [customVars]);

    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
    ];
    await checkVariables([token], [customVars]);
  });

}

module.exports = {
  run_tests: run_tests,
}
