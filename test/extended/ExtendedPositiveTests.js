var tokenUtils = require('./../TokenTestUtils.js');
var newBigNumber = tokenUtils.newBigNumber;
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

var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var FiatToken = tokenUtils.FiatToken;
var upgradeTo = tokenUtils.upgradeTo;

var AccountUtils = require('./../AccountUtils.js');
var Accounts = AccountUtils.Accounts;

var amount = 100;

async function run_tests(newToken, accounts) {

  beforeEach('Make fresh token contract', async function () {
    rawToken = await newToken();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.equal(proxy.address, token.address);
  });

  // Paused

  it('ept001 should changeAdmin while paused', async function () {
    await token.pause({ from: Accounts.pauserAccount });
    await proxy.changeAdmin(Accounts.arbitraryAccount, { from: Accounts.proxyOwnerAccount });
    var result = [
      { 'variable': 'paused', 'expectedValue': true },
      { 'variable': 'proxyOwner', 'expectedValue': Accounts.arbitraryAccount},
    ];
    await checkVariables([token], [result]);
  });

  it('ept002 should updateMasterMinter while paused', async function () {
    await token.pause({ from: Accounts.pauserAccount });
    await token.updateMasterMinter(Accounts.arbitraryAccount, { from: Accounts.tokenOwnerAccount });
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': Accounts.arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [result]);
  });

  it('ept003 should updateBlacklister while paused', async function () {
    await token.pause({ from: Accounts.pauserAccount });
    await token.updateBlacklister(Accounts.arbitraryAccount, { from: Accounts.tokenOwnerAccount });
    var result = [
      { 'variable': 'blacklister', 'expectedValue': Accounts.arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [result]);
  });

  it('ept004 should updatePauser while paused', async function () {
    await token.pause({ from: Accounts.pauserAccount });
    await token.updatePauser(Accounts.arbitraryAccount, { from: Accounts.tokenOwnerAccount });
    var result = [
      { 'variable': 'pauser', 'expectedValue': Accounts.arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [result]);
  });

  it('ept005 should transferOwnership while paused', async function () {
    await token.pause({ from: Accounts.pauserAccount });
    await token.transferOwnership(Accounts.arbitraryAccount, { from: Accounts.tokenOwnerAccount });
    var result = [
      { 'variable': 'tokenOwner', 'expectedValue': Accounts.arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [result]);
  });

  it('ept006 should removeMinter while paused', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.pause({ from: Accounts.pauserAccount });
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [isAMinter]);

    await token.removeMinter(Accounts.minterAccount, { from: Accounts.masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(0) },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [notAMinter]);
  });

  it('ept008 should upgrade while paused', async function() {
    var newRawToken = await UpgradedFiatToken.new();
    await token.pause({from: Accounts.pauserAccount});
    var tokenConfig = await upgradeTo(proxy, newRawToken);
    var newProxiedToken = tokenConfig.token;
    var newToken = newProxiedToken;

    var newToken_result = [
      { 'variable': 'paused', 'expectedValue': true },
      {'variable': 'proxiedTokenAddress', 'expectedValue': newRawToken.address }
    ];
    await checkVariables([newToken], [newToken_result]);
  });

  // Blacklisted

  it('ept013 should changeAdmin when msg.sender blacklisted', async function () {
    await token.blacklist(Accounts.proxyOwnerAccount, { from: Accounts.blacklisterAccount });
    await proxy.changeAdmin(Accounts.arbitraryAccount, { from: Accounts.proxyOwnerAccount });
    var result = [
      { 'variable': 'isAccountBlacklisted.proxyOwnerAccount', 'expectedValue': true },
      { 'variable': 'proxyOwner', 'expectedValue': Accounts.arbitraryAccount },
    ];
    await checkVariables([token], [result]);
  });

  it('ept014 should updateMasterMinter when msg.sender blacklisted', async function () {
    await token.blacklist(Accounts.tokenOwnerAccount, { from: Accounts.blacklisterAccount });
    await token.updateMasterMinter(Accounts.arbitraryAccount, { from: Accounts.tokenOwnerAccount });
    var setup = [
      { 'variable': 'masterMinter', 'expectedValue': Accounts.arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept015 should updateBlacklister when msg.sender blacklisted', async function () {
    await token.blacklist(Accounts.tokenOwnerAccount, { from: Accounts.blacklisterAccount });
    await token.updateBlacklister(Accounts.arbitraryAccount, { from: Accounts.tokenOwnerAccount });
    var setup = [
      { 'variable': 'blacklister', 'expectedValue': Accounts.arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept016 should updatePauser when msg.sender blacklisted', async function () {
    await token.blacklist(Accounts.tokenOwnerAccount, { from: Accounts.blacklisterAccount });
    await token.updatePauser(Accounts.arbitraryAccount, { from: Accounts.tokenOwnerAccount });
    var setup = [
      { 'variable': 'pauser', 'expectedValue': Accounts.arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept017 should transferOwnership when msg.sender blacklisted', async function () {
    await token.blacklist(Accounts.tokenOwnerAccount, { from: Accounts.blacklisterAccount });
    await token.transferOwnership(Accounts.arbitraryAccount, { from: Accounts.tokenOwnerAccount });
    var setup = [
      { 'variable': 'tokenOwner', 'expectedValue': Accounts.arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it ('ept018 should pause when msg.sender blacklisted', async function() {
    await token.blacklist(Accounts.pauserAccount, { from: Accounts.blacklisterAccount });
    await token.pause({ from: Accounts.pauserAccount });
    var setup = [
      { 'variable': 'paused', 'expectedValue': true },
      { 'variable': 'isAccountBlacklisted.pauserAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it ('ept019 should unpause when msg.sender blacklisted', async function() {
    await token.pause({ from: Accounts.pauserAccount });
    var setup = [
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);

    await token.blacklist(Accounts.pauserAccount, { from: Accounts.blacklisterAccount });
    await token.unpause({ from: Accounts.pauserAccount });
    setup = [
      { 'variable': 'isAccountBlacklisted.pauserAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it ('ept020 should blacklist when msg.sender blacklisted', async function() {
    await token.blacklist(Accounts.blacklisterAccount, { from: Accounts.blacklisterAccount });
    await token.blacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.blacklisterAccount', 'expectedValue': true },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it ('ept021 should unBlacklist when msg.sender blacklisted', async function() {
    await token.blacklist(Accounts.blacklisterAccount, { from: Accounts.blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.blacklisterAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);

    await token.unBlacklist(Accounts.blacklisterAccount, { from: Accounts.blacklisterAccount });
    await checkVariables([token], [[]]);
  });

  it('ept022 should upgrade when msg.sender blacklisted', async function () {
    await token.blacklist(Accounts.proxyOwnerAccount, { from: Accounts.blacklisterAccount });
    var newRawToken = await UpgradedFiatToken.new();
    var tokenConfig = await upgradeTo(proxy, newRawToken);
    var newToken = tokenConfig.token;

    var newToken_result = [
      { 'variable': 'proxiedTokenAddress', 'expectedValue': newRawToken.address },
      { 'variable': 'isAccountBlacklisted.proxyOwnerAccount', 'expectedValue': true },
    ];
    await checkVariables([newToken], [newToken_result]);
  });

  it ('ept023 should upgrade to blacklisted address', async function() {
    var newRawToken = await UpgradedFiatToken.new();

    await token.blacklist(newRawToken.address, { from: Accounts.blacklisterAccount });
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
    await token.blacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await token.blacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
    await checkVariables([token], [setup]);
  });

  it('ept025 should changeAdmin to blacklisted address', async function () {
    await token.blacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
    await proxy.changeAdmin(Accounts.arbitraryAccount, { from: Accounts.proxyOwnerAccount });
    var result = [
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'proxyOwner', 'expectedValue': Accounts.arbitraryAccount },
    ];
    await checkVariables([token], [result]);
  });

  it('ept026 should updateMasterMinter to blacklisted address', async function () {
    await token.blacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
    await token.updateMasterMinter(Accounts.arbitraryAccount, { from: Accounts.tokenOwnerAccount });
    var setup = [
      { 'variable': 'masterMinter', 'expectedValue': Accounts.arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept027 should updateBlacklister to blacklisted address', async function () {
    await token.blacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
    await token.updateBlacklister(Accounts.arbitraryAccount, { from: Accounts.tokenOwnerAccount });
    var setup = [
      { 'variable': 'blacklister', 'expectedValue': Accounts.arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept028 should updatePauser to blacklisted address', async function () {
    await token.blacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
    await token.updatePauser(Accounts.arbitraryAccount, { from: Accounts.tokenOwnerAccount });
    var setup = [
      { 'variable': 'pauser', 'expectedValue': Accounts.arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept029 should transferOwnership to blacklisted address', async function () {
    await token.blacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
    await token.transferOwnership(Accounts.arbitraryAccount, { from: Accounts.tokenOwnerAccount });
    var setup = [
      { 'variable': 'tokenOwner', 'expectedValue': Accounts.arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [setup]);
  });

  it('ept030 should configureMinter when masterMinter is blacklisted', async function () {
    await token.blacklist(Accounts.masterMinterAccount, { from: Accounts.blacklisterAccount });
    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    var result = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [result]);
  });

  it('ept032 should configureMinter when minter is blacklisted', async function () {
    await token.blacklist(Accounts.minterAccount, { from: Accounts.blacklisterAccount });
    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    var result = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
    ];
    await checkVariables([token], [result]);
  });

  it('ept033 should removeMinter when masterMinter is blacklisted', async function() {
    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.blacklist(Accounts.masterMinterAccount, { from: Accounts.blacklisterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
    ];
    await checkVariables([token], [customVars]);

    await token.removeMinter(Accounts.minterAccount, { from: Accounts.masterMinterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(0) },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ept034 should removeMinter when minter is blacklisted', async function() {
    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.blacklist(Accounts.minterAccount, { from: Accounts.blacklisterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
    ];
    await checkVariables([token], [customVars]);

    await token.removeMinter(Accounts.minterAccount, { from: Accounts.masterMinterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(0) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ept035 should unBlacklist while contract is paused', async function() {
    await token.pause({from: Accounts.pauserAccount});
    await token.blacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
    var customVars = [
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': true},
    ];
    await checkVariables([token], [customVars]);

    await token.unBlacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
    customVars = [
      { 'variable': 'paused', 'expectedValue': true},
    ];
    await checkVariables([token], [customVars]);
  });

  it('ept036 should blacklist while contract is paused', async function() {
    await token.pause({from: Accounts.pauserAccount});
    var customVars = [
      { 'variable': 'paused', 'expectedValue': true},
    ];
    await checkVariables([token], [customVars]);

    await token.blacklist(Accounts.arbitraryAccount, { from: Accounts.blacklisterAccount });
    customVars = [
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': true},
    ];
    await checkVariables([token], [customVars]);
  });

  it('ept037 should pause while contract is paused', async function() {
    await token.pause({from: Accounts.pauserAccount});
    var customVars = [
      { 'variable': 'paused', 'expectedValue': true},
    ];
    await checkVariables([token], [customVars]);

    await token.pause({from: Accounts.pauserAccount});
    customVars = [
      { 'variable': 'paused', 'expectedValue': true},
    ];
    await checkVariables([token], [customVars]);
  });

 }

var testWrapper = require('./../TestWrapper');
testWrapper.execute('FiatToken_ExtendedPositiveTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
