var FiatToken = artifacts.require('FiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var bigZero = tokenUtils.bigZero;
var BigNumber = require('bignumber.js');

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
    assert.equal(await storage.owner.call(), tokenAddress)

    await checkVariables(token, []);
  });

  //Begin mint tests

  it('should fail to mint when paused', async function () {
    //Configure minter
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(token, customVars);

    await token.pause({from: pauserAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
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
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
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
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    await checkVariables(token, customVars);
  })

  it('should fail to mint when allowance of minter is less than amount', async function () {
    await token.configureMinter(minterAccount, amount - 1, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 1)}
    ]
    await checkVariables(token, customVars);

    await expectRevert(token.mint(arbitraryAccount, amount, {from: minterAccount}));
    await checkVariables(token, customVars);
  })

  it('should fail to mint to 0x0 address', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
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
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(token, customVars);

    var dataContractAddress = await token.getDataContractAddress();
    var storage = EternalStorage.at(dataContractAddress);
    await token.upgrade(arbitraryAccount, {from: upgraderAccount});
    assert.equal(await storage.owner.call(), arbitraryAccount);

    await expectRevert(token.mint(pauserAccount, 50, {from: minterAccount}));
  })

  //Begin approve tests

  /*
    SUCCESSFUL APPROVE
  it('should approve a spend and set allowed amount', async function () {
    await token.approve(minterAccount, 100, {from: arbitraryAccount});
    customVars = [{'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': bigHundred}];
    await checkVariables(token, customVars)
  });
  */

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

  //SUCCESSFUL TRANSFERFROM
  /*it('should transferFrom, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    amount = 100;

    // configure minter
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(token, customVars);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});

    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await checkVariables(token, customVars);

    await token.approve(upgraderAccount, 50, {from: arbitraryAccount});

    await token.transferFrom(arbitraryAccount, pauserAccount, 50, {from: upgraderAccount})

    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero},
      {'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await checkVariables(token, customVars);
  })*/

  it('should fail to transferFrom to 0x0 address', async function () {
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

    await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)}
    ]
    await checkVariables(token, customVars);

    expectRevert(token.transferFrom(arbitraryAccount, "0x0", 50, {from: upgraderAccount}));
    await checkVariables(token, customVars);
  })

  it('should fail to transferFrom an amount greater than balance', async function () {
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
    await checkVariables(token, customVars);

    await token.approve(upgraderAccount, amount, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(amount)},
    ]
    await checkVariables(token, customVars);

    expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, amount, {from: upgraderAccount}));
    await checkVariables(token, customVars);
  })

  it('should fail to transferFrom to blacklisted recipient', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(token, customVars);

    await token.mint(upgraderAccount, 50, {from: minterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.upgraderAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await checkVariables(token, customVars);

    await token.approve(pauserAccount, 50, {from: upgraderAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.upgraderAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.upgraderAccount.pauserAccount', 'expectedValue': new BigNumber(50)},
    ]
    await checkVariables(token, customVars);

    await blacklist(token, arbitraryAccount);
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.upgraderAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.upgraderAccount.pauserAccount', 'expectedValue': new BigNumber(50)},
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
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(token, customVars);

    await token.mint(upgraderAccount, 50, {from: minterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.upgraderAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await checkVariables(token, customVars);

    await token.approve(arbitraryAccount, 50, {from: upgraderAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.upgraderAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.upgraderAccount.arbitraryAccount', 'expectedValue': new BigNumber(50)},
    ]
    await checkVariables(token, customVars);

    await blacklist(token, arbitraryAccount);
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.upgraderAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.upgraderAccount.arbitraryAccount', 'expectedValue': new BigNumber(50)},
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
    await checkVariables(token, customVars);

    await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)},
    ]
    await checkVariables(token, customVars);

    await blacklist(token, arbitraryAccount);
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)},
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
    await checkVariables(token, customVars);

    await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)},
    ]
    await checkVariables(token, customVars);

    expectRevert(token.transferFrom(arbitraryAccount, pauserAccount, 60, {from: upgraderAccount}));
    await checkVariables(token, customVars);
  })

  it('should fail to transferFrom when paused', async function () {
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

    await token.approve(upgraderAccount, 50, {from: arbitraryAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)},
    ]
    await checkVariables(token, customVars);

    await token.pause({from: pauserAccount});
    customVars = [
      {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)},
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
  })


  //Begin transfer tests

  it('should fail to transfer to 0x0 address', async function () {
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

    expectRevert(token.transfer("0x0", 50, {from: arbitraryAccount}));
    await checkVariables(token, customVars);
  })

  it('should fail to transfer an amount greater than balance', async function() {
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
    await checkVariables(token, customVars);

    expectRevert(token.transfer(pauserAccount, amount, {from: arbitraryAccount}));
    await checkVariables(token, customVars);
  })

  it('should fail to transfer to blacklisted recipient', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(token, customVars);

    await token.mint(upgraderAccount, 50, {from: minterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.upgraderAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await checkVariables(token, customVars);

    await blacklist(token, arbitraryAccount);
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.upgraderAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
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
    await checkVariables(token, customVars);

    await blacklist(token, arbitraryAccount);
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
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

    await token.pause({from: pauserAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - 50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
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
  })

  //Begin configureMinter tests

})
