var FiatToken = artifacts.require('FiatToken');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var EternalStorage = artifacts.require('EternalStorage');
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

contract('FiatToken', function (accounts) {
  var amount = 100;

  beforeEach(async function checkBefore() {
    token = await FiatToken.new(
      "0x0",
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      roleAddressChangerAccount);

    let tokenAddress = token.address;

    let dataContractAddress = await token.getDataContractAddress();
    let storage = EternalStorage.at(dataContractAddress);
    assert.equal(await storage.owner.call(), tokenAddress);

    await checkVariables(token, []);
  });

  //Begin mint tests

  it('should fail to mint when paused', async function () {
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
  })

  it('should fail to mint when message sender is not a minter', async function () {
    //Note: minterAccount has not yet been configured as a minter
    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables(token, []);
  })

  it('should fail to mint when message sender is blacklisted', async function () {
    await token.blacklist(minterAccount, {from: blacklisterAccount});

    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables(token, customVars);
  })

  it('should fail to mint when recipient is blacklisted', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});

    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables(token, customVars);
  })

  it('should fail to mint when allowance of minter is less than amount', async function () {
    await token.configureMinter(minterAccount, amount - 1, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - 1}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.mint(arbitraryAccount, amount, {from: minterAccount}));
    await checkVariables(token, customVars);
  })

  it('should fail to mint to 0x0 address', async function () {
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

  });

  it('should fail to mint when contract is not owner', async function () {
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
  })

  //Begin approve tests

  it('should fail to approve when spender is blacklisted', async function () {
    await token.blacklist(minterAccount, {from: blacklisterAccount});

    await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));

    await checkVariables(token, []);
  })

  it('should fail to approve when msg.sender is blacklisted', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});

    await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));

    await checkVariables(token, []);
  })

  it('should fail to approve when contract is paused', async function () {
    await token.pause({from: pauserAccount});

    await expectRevert(token.approve(minterAccount, 100, {from: arbitraryAccount}));

    await checkVariables(token, []);
  })

  it('should fail to approve when contract is not owner', async function () {
    var dataContractAddress = await token.getDataContractAddress();
    var storage = EternalStorage.at(dataContractAddress);
    await token.upgrade(arbitraryAccount, {from: upgraderAccount});
    assert.equal(await storage.owner.call(), arbitraryAccount);

    await expectRevert(token.approve(pauserAccount, 50, {from: minterAccount}));
  })

  //Begin transferFrom tests

  it('should fail to transferFrom to 0x0 address', async function () {
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
  })

  it('should fail to transferFrom an amount greater than balance', async function () {
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
  })

  it('should fail to transferFrom to blacklisted recipient', async function () {
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
  })

  it('should fail to transferFrom from blacklisted msg.sender', async function () {
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
  })

  it('should fail to transferFrom when from is blacklisted', async function () {
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
  })

  it('should fail to transferFrom an amount greater than allowed for msg.sender', async function () {
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
  })

  it('should fail to transferFrom when paused', async function () {
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
  })

  it('should fail to transferFrom when contract is not owner', async function () {
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
  })


  //Begin transfer tests

  it('should fail to transfer to 0x0 address', async function () {
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
  })

  it('should fail to transfer an amount greater than balance', async function() {
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
  })

  it('should fail to transfer to blacklisted recipient', async function () {
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
  })

  it('should fail to transfer when sender is blacklisted', async function () {
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
  })

  it('should fail to transfer when paused', async function () {
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
  })

  it('should fail to transfer when contract is not owner', async function () {
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
  })

  //Begin configureMinter tests

  it('should fail to configureMinter when sender is not masterMinter', async function() {
    assert.isFalse(arbitraryAccount == masterMinterAccount);
    await expectRevert(token.configureMinter(minterAccount, amount, {from: arbitraryAccount}));
    await checkVariables(token, []);
  })

  it('should fail to configureMinter when contract is not owner', async function() {
    var dataContractAddress = await token.getDataContractAddress();
    var storage = EternalStorage.at(dataContractAddress);
    await token.upgrade(arbitraryAccount, {from: upgraderAccount});
    assert.equal(await storage.owner.call(), arbitraryAccount);

    await expectRevert(token.configureMinter(minterAccount, amount, {from: masterMinterAccount}));
  })

  it('should fail to configureMinter when paused', async function () {
    await token.pause({from: pauserAccount});
    customVars = [
      {'variable': 'paused', 'expectedValue': true}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.configureMinter(minterAccount, amount, {from: masterMinterAccount}));
    await checkVariables(token, customVars);
  })

  //Begin removeMinter tests

  it('should fail to removeMinter when sender is not masterMinter', async function() {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.removeMinter(minterAccount, {from: arbitraryAccount}));
    await checkVariables(token, customVars);
  })

  it('should fail to removeMinter when contract is not owner', async function() {
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
  })

  //Begin burn tests

  it('should fail to burn when balance is less than amount', async function() {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.burn(amount, {from: minterAccount}));
  })

  it('should fail to burn when amount is -1', async function () {
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
  });

  it('should fail to burn when sender is blacklisted', async function() {
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
  })

  it('should fail to burn when paused', async function() {
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
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount- 50},
      {'variable': 'balances.minterAccount', 'expectedValue': 50},
      {'variable': 'totalSupply', 'expectedValue': 50},
      {'variable': 'paused', 'expectedValue': true}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.burn(50, {from: minterAccount}));
  })

  it('should fail to burn when sender is not minter', async function() {
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
  })

  it('should fail to burn after removeMinter', async function () {
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
  });

  it('should fail to burn when contract is not owner', async function() {
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
  })

  //Begin updateRoleAddress/updateUpgraderAddress tests

  it('should fail to updateRoleAddress when sender is not roleAddressChanger', async function() {
    await expectRevert(token.updateRoleAddress(pauserAccount, "masterMinter", {from: arbitraryAccount}));
    await checkVariables(token, []);
  })

  it('should fail to updateRoleAddress when sender is old roleAddressChanger', async function () {
    await token.updateRoleAddress(arbitraryAccount, roleAddressChangerRole, {from: roleAddressChangerAccount});
    var customVars = [
      {'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.updateRoleAddress(masterMinterAccount, roleAddressChangerRole, {from: roleAddressChangerAccount}));
    await checkVariables(token, customVars);
  });

  it('should fail to updateUpgraderAddress when sender is not upgrader', async function() {
    await expectRevert(token.updateUpgraderAddress(arbitraryAccount, {from: pauserAccount}));
    await checkVariables(token, []);
  })

  //Begin pause/unpause tests

  it('should fail to pause when sender is not pauser', async function() {
    await expectRevert(token.pause({from: arbitraryAccount}));
  })

  it('should fail to unpause when sender is not pauser', async function() {
    await token.pause({from: pauserAccount});
    customVars = [
      {'variable': 'paused', 'expectedValue': true}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.unpause({from: arbitraryAccount}));
  })

  //Begin blacklist/unblacklist tests

  it('should fail to blacklist when sender is not blacklister', async function() {
    await expectRevert(token.blacklist(upgraderAccount, {from: arbitraryAccount}));
  })

  it('should fail to unblacklist when sender is not blacklister', async function() {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.unBlacklist(arbitraryAccount, {from: upgraderAccount}));
  })

  it('should fail to unBlacklist when paused', async function() {
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
  })

  //Begin upgrade tests

  it('should fail to upgrade when sender is not upgrader', async function() {
    await expectRevert(token.upgrade(arbitraryAccount, {from: minterAccount}));
  })

  it('should fail to upgrade when upgradedAddress is not 0x0', async function() {
    await token.upgrade(arbitraryAccount, {from: upgraderAccount});
    await expectRevert(token.upgrade(pauserAccount, {from: upgraderAccount}));
  })

  it('should fail to upgrade when newAddress is 0x0', async function() {
    await expectRevert(token.upgrade("0x0", {from: upgraderAccount}));
  })

  //Begin disablePriorContract tests

  it('should fail to disablePriorContract when sender is not pauser', async function() {
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
  })

})
