var FiatToken = artifacts.require('FiatToken');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var EternalStorage = artifacts.require('EternalStorage');
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

  it('should check that default variable values are correct', async function () {
    await checkVariables([token], [[]]);
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

  it('nt011 should fail to approve when contract is not storage owner', async function () {
    let storage = await EternalStorage.new({from: arbitraryAccount});
    let newToken = await FiatToken.new(
      storage.address,
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
    newToken.default_priorContractAddress = 'undefined';
    newToken.default_storageAddress = storage.address;

    await expectRevert(newToken.approve(pauserAccount, amount, {from: arbitraryAccount}));
    await checkVariables([newToken], [[{'variable': 'storageOwner', 'expectedValue': arbitraryAccount}]]);
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
    await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)}
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, "0x0", 50, {from: upgraderAccount}));
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
    await token.approve(upgraderAccount, amount, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(amount)},
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, amount, {from: upgraderAccount}));
    await checkVariables([token], [customVars]);
  });

  it('nt014 should fail to transferFrom to blacklisted recipient', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

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
    await checkVariables([token], [customVars]);
  });

  it('nt015 should fail to transferFrom from blacklisted msg.sender', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables([token], [customVars]);

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
    await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)},
    ]
    await expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 60, {from: upgraderAccount}));
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
    await expectRevert(token.transfer(upgraderAccount, 50, {from: arbitraryAccount}));
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
    await expectRevert(token.transfer(upgraderAccount, 50, {from: arbitraryAccount}));
    await checkVariables([token], [customVars]);
  });

  // ConfigureMinter

  it('nt026 should fail to configureMinter when sender is not masterMinter', async function () {
    assert.isFalse(arbitraryAccount == masterMinterAccount);
    await expectRevert(token.configureMinter(minterAccount, amount, {from: arbitraryAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt027 should fail to configureMinter when contract is not storage owner', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
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
      tokenOwnerAccount
    );
    await token.upgrade(newToken.address, { from: upgraderAccount });
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    var newToken_result = [
      { 'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    var oldToken_result = [
      { 'variable': 'storageOwner', 'expectedValue': newToken.address },
      { 'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ];

    await expectRevert(token.configureMinter(minterAccount, amount, {from: masterMinterAccount}));
    await checkVariables([newToken, token], [newToken_result, oldToken_result]);
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

  it('nt038 should fail to updateUpgraderAddress when sender is not upgrader', async function () {
    await expectRevert(token.updateUpgraderAddress(arbitraryAccount, {from: pauserAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt039 should fail to updateUpgraderAddress when newAddress is 0x0', async function () {
    await expectRevert(token.updateUpgraderAddress("0x0", {from: upgraderAccount}));
    await checkVariables([token], [[]]);
  });

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
    await expectRevert(token.blacklist(upgraderAccount, {from: arbitraryAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt043 should fail to unblacklist when sender is not blacklister', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await expectRevert(token.unBlacklist(arbitraryAccount, {from: upgraderAccount}));
    await checkVariables([token], [customVars]);
  });

  // Upgrade

  it('nt044 should fail to upgrade when sender is not upgrader', async function () {
    await expectRevert(token.upgrade(arbitraryAccount, {from: minterAccount}));
    await checkVariables([token], [[]]);
  });

  it('nt045 should fail to upgrade when upgradedAddress is not 0x0', async function () {
    await token.upgrade(arbitraryAccount, {from: upgraderAccount});
    await expectRevert(token.upgrade(pauserAccount, {from: upgraderAccount}));
  });

  it('nt046 should fail to upgrade when newAddress is 0x0', async function () {
    await expectRevert(token.upgrade("0x0", {from: upgraderAccount}));
    await checkVariables([token], [[]]);
  });

  // priorContract

  it('nt047 should fail to disablePriorContract when sender is not pauser', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
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
      tokenOwnerAccount);
    await (token.upgrade(newToken.address, {from: upgraderAccount}));
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    var newToken_result = [
      { 'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    var oldToken_result = [
      { 'variable': 'storageOwner', 'expectedValue': newToken.address },
      { 'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ];
    await checkVariables([newToken, token], [newToken_result, oldToken_result]);

    await expectRevert(newToken.disablePriorContract({from: arbitraryAccount}));
  });

  it('nt051 should fail to approveViaPriorContract when sender is not priorContractAddress', async function() {
    // Create upgraded token
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
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
      tokenOwnerAccount
    );
    await token.upgrade(newToken.address, {from: upgraderAccount});
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    var newToken_result = [
      { 'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    var oldToken_result = [
      { 'variable': 'storageOwner', 'expectedValue': newToken.address },
      { 'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ];
    await checkVariables([newToken, token], [newToken_result, oldToken_result]);

    // Set up token state for approve
    let mintAmount = 50;
    await newToken.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    await newToken.mint(arbitraryAccount, mintAmount, {from: minterAccount});
    newToken_result = [
      { 'variable': 'priorContractAddress', 'expectedValue': token.address },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) }
    ];
    oldToken_result = [
      { 'variable': 'storageOwner', 'expectedValue': newToken.address },
      { 'variable': 'upgradedAddress', 'expectedValue': newToken.address },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([newToken, token], [newToken_result, oldToken_result]);

    // expectRevert on approveViaPriorContract with wrong sender
    await expectRevert(newToken.approveViaPriorContract(arbitraryAccount, pauserAccount, mintAmount, {from: arbitraryAccount2}));
    await checkVariables([newToken, token], [newToken_result, oldToken_result]);
  });

  it('nt052 should fail to transferViaPriorContract when sender is not priorContractAddress', async function() {
    // Create upgraded token
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
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
      tokenOwnerAccount
    );
    await token.upgrade(newToken.address, {from: upgraderAccount});
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    var newToken_result = [
      { 'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    var oldToken_result = [
      { 'variable': 'storageOwner', 'expectedValue': newToken.address },
      { 'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ];
    await checkVariables([newToken, token], [newToken_result, oldToken_result]);

    // Set up token state for transfer
    let mintAmount = 50;
    await newToken.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    await newToken.mint(arbitraryAccount, mintAmount, {from: minterAccount});
    newToken_result = [
      { 'variable': 'priorContractAddress', 'expectedValue': token.address },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) }
    ];
    oldToken_result = [
      { 'variable': 'storageOwner', 'expectedValue': newToken.address },
      { 'variable': 'upgradedAddress', 'expectedValue': newToken.address },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) }
    ];

    // expectRevert on transferViaPriorContract with wrong sender
    await expectRevert(newToken.transferViaPriorContract(arbitraryAccount, pauserAccount, mintAmount, {from: arbitraryAccount2}));
    await checkVariables([newToken, token], [newToken_result, oldToken_result]);
  });

  it('nt053 should fail to transferFromViaPriorContract when sender is not priorContractAddress', async function() {
    // Create upgraded token
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
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
      tokenOwnerAccount
    );
    await token.upgrade(newToken.address, {from: upgraderAccount});
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    var newToken_result = [
      { 'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    var oldToken_result = [
      { 'variable': 'storageOwner', 'expectedValue': newToken.address },
      { 'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ];
    await checkVariables([newToken, token], [newToken_result, oldToken_result]);

    // Set up token state for transferFrom
    let mintAmount = 50;
    await newToken.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    await newToken.mint(arbitraryAccount, mintAmount, {from: minterAccount});
    await newToken.approve(upgraderAccount, mintAmount, {from: arbitraryAccount});
    newToken_result = [
      { 'variable': 'priorContractAddress', 'expectedValue': token.address },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(mintAmount)}
    ];
    oldToken_result = [
      { 'variable': 'storageOwner', 'expectedValue': newToken.address },
      { 'variable': 'upgradedAddress', 'expectedValue': newToken.address },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(mintAmount)}
    ];

    // expectRevert on transferFromViaPriorContract with wrong sender
    await expectRevert(newToken.transferFromViaPriorContract(upgraderAccount, arbitraryAccount, pauserAccount, mintAmount, {from: arbitraryAccount2}));
    await checkVariables([newToken, token], [newToken_result, oldToken_result]);
  });

  it('nt054 should fail to transferOwnership when sender is not owner', async function() {
    // Create upgraded token
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
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
      tokenOwnerAccount
    );
    await token.upgrade(newToken.address, {from: upgraderAccount});
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    var newToken_result = [
      { 'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    var oldToken_result = [
      { 'variable': 'storageOwner', 'expectedValue': newToken.address },
      { 'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ];

    // expectRevert on transferOwnership with wrong sender
    await expectRevert(newToken.transferOwnership(arbitraryAccount, {from: arbitraryAccount2}));
    await checkVariables([newToken, token], [newToken_result, oldToken_result]);
  });

}

module.exports = {
  run_tests: run_tests,
}
