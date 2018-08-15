var tokenUtils = require('./TokenTestUtils');
var BigNumber = require('bignumber.js');
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
var deployerAccount = tokenUtils.deployerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var proxyOwnerAccount = tokenUtils.proxyOwnerAccount;
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var customInitializeTokenWithProxy = tokenUtils.customInitializeTokenWithProxy;
var upgradeTo = tokenUtils.upgradeTo;
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var FiatToken = tokenUtils.FiatToken;

var amount = 100;
let longZero = 0x0000000000000000000000000000000000000000;
let shortZero = 0x00;

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
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    await token.pause({from: pauserAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt002 should fail to mint when msg.sender is not a minter', async function () {
    //Note: minterAccount has not yet been configured as a minter
    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt003 should fail to mint when msg.sender is blacklisted', async function () {
    await token.blacklist(minterAccount, {from: blacklisterAccount});
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true}
    ]
    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt004 should fail to mint when recipient is blacklisted', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt005 should fail to mint when allowance of minter is less than amount', async function () {
    await token.configureMinter(minterAccount, amount - 1, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 1)}
    ]
    await expectRevert(token.mint(arbitraryAccount, amount, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt006 should fail to mint to 0x0 address', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await expectRevert(token.mint("0x0", amount, {from: minterAccount}));
    await expectRevert(token.mint("0x0000000000000000000000000000000000000000", amount, {from: minterAccount}));
    await expectRevert(token.mint(0x0000000000000000000000000000000000000000, amount, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  // Approve

  it('nt008 should fail to approve when spender is blacklisted', async function () {
    await token.blacklist(minterAccount, {from: blacklisterAccount});
    var customVars = [
      {'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true},
    ]
    await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt009 should fail to approve when msg.sender is blacklisted', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    var customVars = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true},
    ]
    await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt010 should fail to approve when contract is paused', async function () {
    await token.pause({from: pauserAccount});
    var customVars = [
      {'variable': 'paused', 'expectedValue': true},
    ]
    await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // TransferFrom

  it('nt012 should fail to transferFrom to 0x0 address', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.approve(pauserAccount, 50, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.pauserAccount', 'expectedValue': new BigNumber(50)}
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, "0x0", 50, {from: pauserAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt013 should fail to transferFrom an amount greater than balance', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.approve(blacklisterAccount, amount, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.blacklisterAccount', 'expectedValue': new BigNumber(amount)},
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, amount, {from: blacklisterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt014 should fail to transferFrom to blacklisted recipient', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(blacklisterAccount, 50, {from: minterAccount});
    await token.approve(pauserAccount, 50, {from: blacklisterAccount});
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.blacklisterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.blacklisterAccount.pauserAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transferFrom(blacklisterAccount, arbitraryAccount, 50, {from: pauserAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt015 should fail to transferFrom from blacklisted msg.sender', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(tokenOwnerAccount, 50, {from: minterAccount});
    await token.approve(arbitraryAccount, 50, {from: tokenOwnerAccount});
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.tokenOwnerAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.tokenOwnerAccount.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transferFrom(tokenOwnerAccount, pauserAccount, 50, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt016 should fail to transferFrom when from is blacklisted', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.approve(tokenOwnerAccount, 50, {from: arbitraryAccount});
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.tokenOwnerAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 50, {from: tokenOwnerAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt017 should fail to transferFrom an amount greater than allowed for msg.sender', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.approve(tokenOwnerAccount, 50, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.tokenOwnerAccount', 'expectedValue': new BigNumber(50)},
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 60, {from: tokenOwnerAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt018 should fail to transferFrom when paused', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.approve(tokenOwnerAccount, 50, {from: arbitraryAccount});
    await token.pause({from: pauserAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.tokenOwnerAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 50, {from: tokenOwnerAccount}));
    await checkVariables([token], [customVars]);
  });

  // Transfer

  it('nt020 should fail to transfer to 0x0 address', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await expectRevert(token.transfer("0x0", 50, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt021 should fail to transfer an amount greater than balance', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await expectRevert(token.transfer(pauserAccount, amount, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt022 should fail to transfer to blacklisted recipient', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(tokenOwnerAccount, 50, {from: minterAccount});
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.tokenOwnerAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transfer(arbitraryAccount, 50, {from: tokenOwnerAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt023 should fail to transfer when sender is blacklisted', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.transfer(tokenOwnerAccount, 50, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt024 should fail to transfer when paused', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});
    await token.pause({from: pauserAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.transfer(tokenOwnerAccount, 50, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // ConfigureMinter

  it('nt026 should fail to configureMinter when sender is not masterMinter', async function () {
    assert.isFalse(arbitraryAccount == masterMinterAccount);
    await expectRevert(token.configureMinter(minterAccount, amount, {from: arbitraryAccount}));
    await checkVariables([token], [[]]);
  });


  it('nt028 should fail to configureMinter when paused', async function () {
    await token.pause({from: pauserAccount});
    customVars = [
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.configureMinter(minterAccount, amount, {from: masterMinterAccount}));
    await checkVariables([token], [customVars]);
  });

  // RemoveMinter

  it('nt029 should fail to removeMinter when sender is not masterMinter', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await expectRevert(token.removeMinter(minterAccount, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // Burn

  it('nt031 should fail to burn when balance is less than amount', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await expectRevert(token.burn(amount, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt032 should fail to burn when amount is -1', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    await token.mint(minterAccount, amount, {from: minterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0)},
      {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)}
    ]
    await expectRevert(token.burn(-1, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt033 should fail to burn when sender is blacklisted', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

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
    await checkVariables([token], [customVars]);
  });

  it('nt034 should fail to burn when paused', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

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
    await checkVariables([token], [customVars]);
  });

  it('nt035 should fail to burn when sender is not minter', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(minterAccount, 50, {from: minterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await expectRevert(token.burn(50, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt036 should fail to burn after removeMinter', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

    await token.mint(minterAccount, 50, {from: minterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await checkVariables([token], [customVars]);

    await token.removeMinter(minterAccount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': false},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0)},
      {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await expectRevert(token.burn(50, {from: minterAccount}));
    await checkVariables([token], [customVars]);
  });

  // Update functions

  it('nt050 should fail to updatePauser when sender is not owner', async function () {
    await expectRevert(token.updatePauser(arbitraryAccount, {from: pauserAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt049 should fail to updateMasterMinter when sender is not owner', async function () {
    await expectRevert(token.updateMasterMinter(arbitraryAccount, {from: pauserAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt048 should fail to updateBlacklister when sender is not owner', async function () {
    await expectRevert(token.updateBlacklister(arbitraryAccount, {from: pauserAccount}));
    await checkVariables([token], [[]]);
  });

  // Pause and Unpause

  it('nt040 should fail to pause when sender is not pauser', async function () {
    await expectRevert(token.pause({from: arbitraryAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt041 should fail to unpause when sender is not pauser', async function () {
    await token.pause({from: pauserAccount});
    customVars = [
      {'variable': 'paused', 'expectedValue': true}
    ]
    await expectRevert(token.unpause({from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // Blacklist and Unblacklist

  it('nt042 should fail to blacklist when sender is not blacklister', async function () {
    await expectRevert(token.blacklist(tokenOwnerAccount, {from: arbitraryAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt043 should fail to unblacklist when sender is not blacklister', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.unBlacklist(arbitraryAccount, {from: tokenOwnerAccount}));
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
    await expectRevert(newToken.transferOwnership(arbitraryAccount, {from: arbitraryAccount2}));
    await checkVariables([newToken], [newToken_result]);
  });

  it('nt055 should fail to mint when amount = 0', async function() {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    await expectRevert(token.mint(pauserAccount, 0, {from: minterAccount}));

    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);
  });

  it('nt056 should fail to burn when amount = 0', async function() {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    await token.mint(minterAccount, amount, {from: minterAccount});
    await expectRevert(token.burn(0, {from: minterAccount}));
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);
  });

  it('nt064 transferOwnership should fail on 0x0', async function () {
    await expectRevert(token.transferOwnership(longZero, { from: tokenOwnerAccount }));
    await expectRevert(token.transferOwnership(shortZero, { from: tokenOwnerAccount }));
  });

  it('nt057 updateMasterMinter should fail on 0x0', async function () {
    await expectRevert(token.updateMasterMinter(longZero, { from: tokenOwnerAccount }));
    await expectRevert(token.updateMasterMinter(shortZero, { from: tokenOwnerAccount }));
  });

  it('nt058 updatePauser should fail on 0x0', async function () {
    await expectRevert(token.updatePauser(longZero, { from: tokenOwnerAccount }));
    await expectRevert(token.updatePauser(shortZero, { from: tokenOwnerAccount }));
  });

  it('nt059 updateBlacklister should fail on 0x0', async function () {
    await expectRevert(token.updateBlacklister(longZero, { from: tokenOwnerAccount }));
    await expectRevert(token.updateBlacklister(shortZero, { from: tokenOwnerAccount }));
  });

  it('nt060 initialize should fail when _masterMinter is 0x0', async function () {
    rawToken = await newToken();
    await expectRevert(customInitializeTokenWithProxy(rawToken, longZero, pauserAccount, blacklisterAccount, tokenOwnerAccount));
    await expectRevert(customInitializeTokenWithProxy(rawToken, shortZero, pauserAccount, blacklisterAccount, tokenOwnerAccount));
  });

  it('nt061 initialize should fail when _pauser is 0x0', async function () {
    rawToken = await newToken();
    await expectRevert(customInitializeTokenWithProxy(rawToken, masterMinterAccount, longZero, blacklisterAccount, tokenOwnerAccount));
    await expectRevert(customInitializeTokenWithProxy(rawToken, masterMinterAccount, shortZero, blacklisterAccount, tokenOwnerAccount));
  });

  it('nt062 initialize should fail when _blacklister is 0x0', async function () {
    rawToken = await newToken();
    await expectRevert(customInitializeTokenWithProxy(rawToken, masterMinterAccount, pauserAccount, longZero, tokenOwnerAccount));
    await expectRevert(customInitializeTokenWithProxy(rawToken, masterMinterAccount, pauserAccount, shortZero, tokenOwnerAccount));
  });

  it('nt063 initialize should fail when _owner is 0x0', async function () {
    rawToken = await newToken();
    await expectRevert(customInitializeTokenWithProxy(rawToken, masterMinterAccount, pauserAccount, blacklisterAccount, longZero));
    await expectRevert(customInitializeTokenWithProxy(rawToken, masterMinterAccount, pauserAccount, blacklisterAccount, shortZero));
  });
}

var testWrapper = require('./TestWrapper');
testWrapper.execute('FiatToken_NegativeTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
