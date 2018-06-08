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

contract('FiatToken', function (accounts) {
  owner = accounts[0]
  arbitraryAccount = accounts[8];
  masterMinterAccount = accounts[9];
  minterAccount = accounts[7];
  pauserAccount = accounts[6];
  blacklisterAccount = accounts[4];
  roleAddressChangerAccount = accounts[3];
  upgraderAccount = accounts[2];

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

  it('should fail to mint when paused', async function () {

    // await token.pause({from: pauserAccount});

    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]

    await token.pause({from: pauserAccount});

    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));
    
    await checkVariables(token, customVars);

  })

  it('should fail to mint when message sender is not a minter', async function () {

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

    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));

    await checkVariables(token, customVars);
  })

  it('should fail to mint when allowance of minter is less than amount', async function () {
    await token.configureMinter(minterAccount, amount - 1, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]

    await expectRevert(token.mint(arbitraryAccount, amount, {from: minterAccount}));

    await checkVariables(token, customVars);
  })

  it('should fail to mint to 0x0 address', async function () {

    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]

    await expectRevert(token.mint("0x0", amount, {from: minterAccount}));

    await checkVariables(token, customVars);

    await expectRevert(token.mint(0x0000000000000000000000000000000000000000, amount, {from: minterAccount}));

    await checkVariables(token, customVars);

    // TODO: figure out what this test is actually supposed to be
    /*await expectRevert(token.mint("0x0000000000000000000000000000000000000000", amount, {from: minterAccount}));

    await checkVariables(token, customVars);*/

  });

  /*
    SUCCESSFUL APPROVE
  it('should approve a spend and set allowed amount', async function () {
    await token.approve(minterAccount, 100, {from: arbitraryAccount});
    customVars = [{'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': bigHundred}];
    await checkVariables(token, customVars)
  });
  */

  it('should fail to mint when contract is not owner', async function () {

  })


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

  /*it('should fail to approve when contract is not owner', async function () {

  })*/

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

  /*it('should fail to transferFrom to 0x0 address', async function () {
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

    await token.approve("0x0", 50, {from: arbitraryAccount});

    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]

    // since 0x0 is not a tracked address, we cannot use customVars to check that only the allowance is updated
    try {
      await token.transferFrom(arbitraryAccount, "0x0", 50, {from: upgraderAccount})
      assert.fail();
    } catch(e) {
      await expectRevert(e);
    } finally {
      await checkVariables(token, customVars)
    }
  })*/

  /*it('should fail to transferFrom an amount greater than balance', async function () {
    // configure minter
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(token, customVars);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});

    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]

    await checkVariables(token, customVars);

    await token.approve("0x0", amount, {from: arbitraryAccount});

    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
  })*/

  /*it('should fail to transferFrom to blacklisted recipient', async function () {

  })

  it('should fail to transferFrom from blacklisted msg.sender', async function () {
    
  })

  it('should fail to transferFrom when from is blacklisted', asybc function () {

  })

  it('should fail to transferFrom an amount greater than allowed for msg.sender', async function () {

  })*/

  it('should fail to transferFrom when paused', async function () {
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

    await token.pause({from: pauserAccount});

    customVars = [
      {'variable': 'allowance.arbitraryAccount.upgraderAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'paused', 'expectedValue': true}
    ]

    await expectRevert(token.transferFrom(arbitraryAccount, "0x0", 50, {from: upgraderAccount}));

    await checkVariables(token, customVars);
  })

  /*it('should fail to transferFrom when contract is not owner', async function () {

  })*/

})