var tokenUtils = require('./../TokenTestUtils.js');
var newBigNumber = tokenUtils.newBigNumber;
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var checkVariables = tokenUtils.checkVariables;
var expectRevert = tokenUtils.expectRevert;
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;

var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var customInitializeTokenWithProxy = tokenUtils.customInitializeTokenWithProxy;
var upgradeTo = tokenUtils.upgradeTo;
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var FiatToken = tokenUtils.FiatToken;

var AccountUtils = require('./../AccountUtils.js');
var Accounts = AccountUtils.Accounts;

var amount = 100;
var zeroAddress = tokenUtils.zeroAddress;

async function run_tests(newToken, accounts) {

  beforeEach('Make fresh token contract', async function () {
    rawToken = await newToken();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.equal(proxy.address, token.address);
  });


  // Mint

  it('nt001 should fail to mint when paused', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    await token.pause({from: Accounts.pauserAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt002 should fail to mint when msg.sender is not a minter', async function () {
    //Note: Accounts.minterAccount has not yet been configured as a minter
    await expectRevert(token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt003 should fail to mint when msg.sender is blacklisted', async function () {
    await token.blacklist(Accounts.minterAccount, {from: Accounts.blacklisterAccount});
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)},
      {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true}
    ]
    await expectRevert(token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt004 should fail to mint when recipient is blacklisted', async function () {
    await token.blacklist(Accounts.arbitraryAccount, {from: Accounts.blacklisterAccount});
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt005 should fail to mint when allowance of minter is less than amount', async function () {
    await token.configureMinter(Accounts.minterAccount, amount - 1, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 1)}
    ]
    await expectRevert(token.mint(Accounts.arbitraryAccount, amount, {from: Accounts.minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt006 should fail to mint to 0x0 address', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await expectRevert(token.mint(zeroAddress, amount, {from: Accounts.minterAccount}));
    await checkVariables([token], [customVars]);
  });

  // Approve

  it('nt008 should fail to approve when spender is blacklisted', async function () {
    await token.blacklist(Accounts.minterAccount, {from: Accounts.blacklisterAccount});
    var customVars = [
      {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true},
    ]
    await expectRevert(token.approve(Accounts.minterAccount, 100, {from: Accounts.arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt009 should fail to approve when msg.sender is blacklisted', async function () {
    await token.blacklist(Accounts.arbitraryAccount, {from: Accounts.blacklisterAccount});
    var customVars = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true},
    ]
    await expectRevert(token.approve(Accounts.minterAccount, 100, {from: Accounts.arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt010 should fail to approve when contract is paused', async function () {
    await token.pause({from: Accounts.pauserAccount});
    var customVars = [
      {'variable': 'paused', 'expectedValue': true},
    ]
    await expectRevert(token.approve(Accounts.minterAccount, 100, {from: Accounts.arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // TransferFrom

  it('nt012 should fail to transferFrom to 0x0 address', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount});
    await token.approve(Accounts.arbitraryAccount2, 50, {from: Accounts.arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.arbitraryAccount2', 'expectedValue': newBigNumber(50)}
    ]
    await expectRevert(token.transferFrom(Accounts.arbitraryAccount, zeroAddress, 50, {from: Accounts.arbitraryAccount2}));
    await checkVariables([token], [customVars]);
  });

  it('nt013 should fail to transferFrom an amount greater than balance', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount});
    await token.approve(Accounts.blacklisterAccount, amount, {from: Accounts.arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.blacklisterAccount', 'expectedValue': newBigNumber(amount)},
    ]
    await expectRevert(token.transferFrom(Accounts.arbitraryAccount, Accounts.pauserAccount, amount, {from: Accounts.blacklisterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt014 should fail to transferFrom to blacklisted recipient', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.blacklisterAccount, 50, {from: Accounts.minterAccount});
    await token.approve(Accounts.arbitraryAccount2, 50, {from: Accounts.blacklisterAccount});
    await token.blacklist(Accounts.arbitraryAccount, {from: Accounts.blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.blacklisterAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)},
      {'variable': 'allowance.blacklisterAccount.arbitraryAccount2', 'expectedValue': newBigNumber(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transferFrom(Accounts.blacklisterAccount, Accounts.arbitraryAccount, 50, {from: Accounts.arbitraryAccount2}));
    await checkVariables([token], [customVars]);
  });

  it('nt015 should fail to transferFrom from blacklisted msg.sender', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount2, 50, {from: Accounts.minterAccount});
    await token.approve(Accounts.arbitraryAccount, 50, {from: Accounts.arbitraryAccount2});
    await token.blacklist(Accounts.arbitraryAccount, {from: Accounts.blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount2', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)},
      {'variable': 'allowance.arbitraryAccount2.arbitraryAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transferFrom(Accounts.arbitraryAccount2, Accounts.pauserAccount, 50, {from: Accounts.arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt016 should fail to transferFrom when from is blacklisted', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount});
    await token.approve(Accounts.arbitraryAccount2, 50, {from: Accounts.arbitraryAccount});
    await token.blacklist(Accounts.arbitraryAccount, {from: Accounts.blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.arbitraryAccount2', 'expectedValue': newBigNumber(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transferFrom(Accounts.arbitraryAccount, Accounts.pauserAccount, 50, {from: Accounts.arbitraryAccount2}));
    await checkVariables([token], [customVars]);
  });

  it('nt017 should fail to transferFrom an amount greater than allowed for msg.sender', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount});
    await token.approve(Accounts.arbitraryAccount2, 50, {from: Accounts.arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.arbitraryAccount2', 'expectedValue': newBigNumber(50)},
    ]
    await expectRevert(token.transferFrom(Accounts.arbitraryAccount, Accounts.pauserAccount, 60, {from: Accounts.arbitraryAccount2}));
    await checkVariables([token], [customVars]);
  });

  it('nt018 should fail to transferFrom when paused', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount});
    await token.approve(Accounts.arbitraryAccount2, 50, {from: Accounts.arbitraryAccount});
    await token.pause({from: Accounts.pauserAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.arbitraryAccount2', 'expectedValue': newBigNumber(50)},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.transferFrom(Accounts.arbitraryAccount, Accounts.pauserAccount, 50, {from: Accounts.arbitraryAccount2}));
    await checkVariables([token], [customVars]);
  });

  // Transfer

  it('nt020 should fail to transfer to 0x0 address', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)}
    ]
    await expectRevert(token.transfer(zeroAddress, 50, {from: Accounts.arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt021 should fail to transfer an amount greater than balance', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)}
    ]
    await expectRevert(token.transfer(Accounts.pauserAccount, amount, {from: Accounts.arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt022 should fail to transfer to blacklisted recipient', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount2, 50, {from: Accounts.minterAccount});
    await token.blacklist(Accounts.arbitraryAccount, {from: Accounts.blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount2', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transfer(Accounts.arbitraryAccount, 50, {from: Accounts.arbitraryAccount2}));
    await checkVariables([token], [customVars]);
  });

  it('nt023 should fail to transfer when sender is blacklisted', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount});
    await token.blacklist(Accounts.arbitraryAccount, {from: Accounts.blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transfer(Accounts.tokenOwnerAccount, 50, {from: Accounts.arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt024 should fail to transfer when paused', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, 50, {from: Accounts.minterAccount});
    await token.pause({from: Accounts.pauserAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.transfer(Accounts.tokenOwnerAccount, 50, {from: Accounts.arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // ConfigureMinter

  it('nt026 should fail to configureMinter when sender is not masterMinter', async function () {
    assert.isFalse(Accounts.arbitraryAccount == Accounts.masterMinterAccount);
    await expectRevert(token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.arbitraryAccount}));
    await checkVariables([token], [[]]);
  });


  it('nt028 should fail to configureMinter when paused', async function () {
    await token.pause({from: Accounts.pauserAccount});
    customVars = [
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount}));
    await checkVariables([token], [customVars]);
  });

  // RemoveMinter

  it('nt029 should fail to removeMinter when sender is not masterMinter', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await expectRevert(token.removeMinter(Accounts.minterAccount, {from: Accounts.arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // Burn

  it('nt031 should fail to burn when balance is less than amount', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await expectRevert(token.burn(amount, {from: Accounts.minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt032 should fail to burn when amount is -1', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    await token.mint(Accounts.minterAccount, amount, {from: Accounts.minterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(0)},
      {'variable': 'balances.minterAccount', 'expectedValue': newBigNumber(amount)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(amount)}
    ]
    await expectRevert(token.burn(-1, {from: Accounts.minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt033 should fail to burn when sender is blacklisted', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.minterAccount, 50, {from: Accounts.minterAccount});
    await token.blacklist(Accounts.minterAccount, {from: Accounts.blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.minterAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)},
      {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true}
    ]
    await expectRevert(token.burn(50, {from: Accounts.minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt034 should fail to burn when paused', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.minterAccount, 50, {from: Accounts.minterAccount});
    await token.pause({from: Accounts.pauserAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.minterAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.burn(50, {from: Accounts.minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt035 should fail to burn when sender is not minter', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.minterAccount, 50, {from: Accounts.minterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.minterAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)}
    ]
    await expectRevert(token.burn(50, {from: Accounts.arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt036 should fail to burn after removeMinter', async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.minterAccount, 50, {from: Accounts.minterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - 50)},
      {'variable': 'balances.minterAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)}
    ]
    await checkVariables([token], [customVars]);

    await token.removeMinter(Accounts.minterAccount, {from: Accounts.masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': false},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(0)},
      {'variable': 'balances.minterAccount', 'expectedValue': newBigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(50)}
    ]
    await expectRevert(token.burn(50, {from: Accounts.minterAccount}));
    await checkVariables([token], [customVars]);
  });

  // Update functions

  it('nt050 should fail to updatePauser when sender is not owner', async function () {
    await expectRevert(token.updatePauser(Accounts.arbitraryAccount, {from: Accounts.pauserAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt049 should fail to updateMasterMinter when sender is not owner', async function () {
    await expectRevert(token.updateMasterMinter(Accounts.arbitraryAccount, {from: Accounts.pauserAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt048 should fail to updateBlacklister when sender is not owner', async function () {
    await expectRevert(token.updateBlacklister(Accounts.arbitraryAccount, {from: Accounts.pauserAccount}));
    await checkVariables([token], [[]]);
  });

  // Pause and Unpause

  it('nt040 should fail to pause when sender is not pauser', async function () {
    await expectRevert(token.pause({from: Accounts.arbitraryAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt041 should fail to unpause when sender is not pauser', async function () {
    await token.pause({from: Accounts.pauserAccount});
    customVars = [
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.unpause({from: Accounts.arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // Blacklist and Unblacklist

  it('nt042 should fail to blacklist when sender is not blacklister', async function () {
    await expectRevert(token.blacklist(Accounts.tokenOwnerAccount, {from: Accounts.arbitraryAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt043 should fail to unblacklist when sender is not blacklister', async function () {
    await token.blacklist(Accounts.arbitraryAccount, {from: Accounts.blacklisterAccount});
    customVars = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.unBlacklist(Accounts.arbitraryAccount, {from: Accounts.tokenOwnerAccount}));
    await checkVariables([token], [customVars]);
  });

  // Upgrade

  it('nt054 should fail to transferOwnership when sender is not owner', async function() {
    // Create upgraded token
    var newRawToken = await UpgradedFiatToken.new();
    var tokenConfig = await upgradeTo(proxy, newRawToken);
    var newProxiedToken = tokenConfig.token;
    var newToken = newProxiedToken;

    var newToken_result = [
      { 'variable': 'proxiedTokenAddress', 'expectedValue': newRawToken.address }
    ];

    // expectRevert on transferOwnership with wrong sender
    await expectRevert(newToken.transferOwnership(Accounts.arbitraryAccount, {from: Accounts.arbitraryAccount2}));
    await checkVariables([newToken], [newToken_result]);
  });

  it('nt055 should fail to mint when amount = 0', async function() {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    await expectRevert(token.mint(Accounts.pauserAccount, 0, {from: Accounts.minterAccount}));

    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);
  });

  it('nt056 should fail to burn when amount = 0', async function() {
    await token.configureMinter(Accounts.minterAccount, amount, {from: Accounts.masterMinterAccount});
    await token.mint(Accounts.minterAccount, amount, {from: Accounts.minterAccount});
    await expectRevert(token.burn(0, {from: Accounts.minterAccount}));
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.minterAccount', 'expectedValue': newBigNumber(amount)},
      {'variable': 'totalSupply', 'expectedValue': newBigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);
  });

  it('nt064 transferOwnership should fail on 0x0', async function () {
    await expectRevert(token.transferOwnership(zeroAddress, { from: Accounts.tokenOwnerAccount }));
  });

  it('nt057 updateMasterMinter should fail on 0x0', async function () {
    await expectRevert(token.updateMasterMinter(zeroAddress, { from: Accounts.tokenOwnerAccount }));
  });

  it('nt058 updatePauser should fail on 0x0', async function () {
    await expectRevert(token.updatePauser(zeroAddress, { from: Accounts.tokenOwnerAccount }));
  });

  it('nt059 updateBlacklister should fail on 0x0', async function () {
    await expectRevert(token.updateBlacklister(zeroAddress, { from: Accounts.tokenOwnerAccount }));
  });

  it('nt060 initialize should fail when _masterMinter is 0x0', async function () {
    rawToken = await newToken();
    await expectRevert(customInitializeTokenWithProxy(rawToken, zeroAddress, Accounts.pauserAccount, Accounts.blacklisterAccount, Accounts.tokenOwnerAccount));
  });

  it('nt061 initialize should fail when _pauser is 0x0', async function () {
    rawToken = await newToken();
    await expectRevert(customInitializeTokenWithProxy(rawToken, Accounts.masterMinterAccount, zeroAddress, Accounts.blacklisterAccount, Accounts.tokenOwnerAccount));
  });

  it('nt062 initialize should fail when _blacklister is 0x0', async function () {
    rawToken = await newToken();
    await expectRevert(customInitializeTokenWithProxy(rawToken, Accounts.masterMinterAccount, Accounts.pauserAccount, zeroAddress, Accounts.tokenOwnerAccount));
  });

  it('nt063 initialize should fail when _owner is 0x0', async function () {
    rawToken = await newToken();
    await expectRevert(customInitializeTokenWithProxy(rawToken, Accounts.masterMinterAccount, Accounts.pauserAccount, Accounts.blacklisterAccount, zeroAddress));
  });
}

var testWrapper = require('./../TestWrapper');
testWrapper.execute('FiatToken_NegativeTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
