var FiatToken = artifacts.require('FiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals
var BigNumber = require('bignumber.js');
var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var expectRevert = tokenUtils.expectRevert;
var masterMinterRole = tokenUtils.masterMinterRole;
var blacklisterRole = tokenUtils.blacklisterRole;
var pauserRole = tokenUtils.pauserRole;
var roleAddressChangerRole = tokenUtils.roleAddressChangerRole;
var checkVariables = tokenUtils.checkVariables;
var checkFailureIsExpected = tokenUtils.checkFailureIsExpected;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('FiatToken', function (accounts) {
  owner = accounts[0]
  arbitraryAccount = accounts[8];
  masterMinterAccount = accounts[9];
  minterAccount = accounts[7];
  pauserAccount = accounts[6];
  blacklisterAccount = accounts[4];
  roleAddressChangerAccount = accounts[3];
  upgraderAccount = accounts[2];

  beforeEach(async function checkBefore() {
    token = await FiatToken.new("0x0", name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, roleAddressChangerAccount);

    let tokenAddress = token.address;

    let dataContractAddress = await token.getDataContractAddress();
    let storage = EternalStorage.at(dataContractAddress);
    assert.equal(await storage.owner.call(), tokenAddress)

    await checkVariables(token, []);
  });

  // Test template
  /*  it('<DESCRIPTION>', async function () {
    let actual = await token.<FUNCTION>();
    customVars = [{'variable': '<VARIABLE NAME>', 'expectedValue': actual}];
    await checkVariables(token, customVars);
  }); */

  it('should pause and set paused to true', async function () {
    await token.pause({ from: pauserAccount });
    var customVars = [{ 'variable': 'paused', 'expectedValue': true }];
    await checkVariables(token, customVars);
  });

  it('should unpause and set paused to false', async function () {
    await token.pause({ from: pauserAccount });
    var customVars = [{ 'variable': 'paused', 'expectedValue': true }];
    await checkVariables(token, customVars);
    await token.unpause({ from: pauserAccount });
    customVars = [{ 'variable': 'paused', 'expectedValue': false }];
    await checkVariables(token, customVars);
  });

  it('should approve a spend and set allowed amount', async function () {
    await token.approve(minterAccount, 100, { from: arbitraryAccount });
    var customVars = [{ 'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': bigHundred }];
    await checkVariables(token, customVars)
  });

  it('should blacklist and set blacklisted to true', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var customVars = [{ 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }]
    await checkVariables(token, customVars)
  });

  it('should blacklist and set blacklisted to true, then unblacklist and set blacklisted to false', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var customVars = [{ 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }]
    await checkVariables(token, customVars)

    await token.unBlacklist(arbitraryAccount, { from: blacklisterAccount });
    customVars = [{ 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': false }]
    await checkVariables(token, customVars)
  });

  it('should burn amount of tokens and reduce balance and total supply by amount', async function () {
    var amount = 100;

    // mint tokens to arbitraryAccount
    await mint(token, minterAccount, amount, minterAccount);
    var customVars = [
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true }
    ]
    await checkVariables(token, customVars);

    await token.burn(amount, { from: minterAccount });

    var customVars = [{ 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true }]
    // (tests that totalSupply and balance are returned to defaults after burn)
    await checkVariables(token, customVars);
  });

  it('should configureMinter, setting the minter to true and mintingAllowance to amount', async function () {
    var amount = 100;

    // configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount }
    ]
    await checkVariables(token, customVars);
  });

  it('should mint the amount, increasing balance of recipient by amount, increasing total supply by amount, and decreasing minterAllowed by amount', async function () {
    var amount = 100

    // configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ]
    await checkVariables(token, customVars);

    await token.mint(arbitraryAccount, 50, { from: minterAccount });

    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
    ]

    await checkVariables(token, customVars);
  });

  it('should removeMinter, setting the minter to false and minterAllowed to 0', async function () {
    var amount = 100

    // configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });

    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ]
    await checkVariables(token, customVars);

    // remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });

    await checkVariables(token, []);
  });

  it('should transfer, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    var amount = 100

    // configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ]
    await checkVariables(token, customVars);

    await token.mint(arbitraryAccount, 50, { from: minterAccount });

    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
    ]
    await checkVariables(token, customVars);

    await token.transfer(pauserAccount, 50, { from: arbitraryAccount })

    customVars = [
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
    ]
    await checkVariables(token, customVars);
  });

  it('should transferFrom, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    var amount = 100;

    // configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ]
    await checkVariables(token, customVars);

    await token.mint(arbitraryAccount, 50, { from: minterAccount });

    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
    ]
    await checkVariables(token, customVars);

    await token.approve(upgraderAccount, 50, { from: arbitraryAccount });

    await token.transferFrom(arbitraryAccount, pauserAccount, 50, { from: upgraderAccount })

    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(50) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
    ]
    await checkVariables(token, customVars);
  });

  it('configureMinter', async function () {
    // make sure not a minter and set up pre-conditions
    let amount = 11;
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': false },
      { 'variable': 'totalSupply', 'expectedValue': 0 }
    ]
    await checkVariables(token, notAMinter);

    // now make into a minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': 0 }
    ]
    // verify it worked
    await checkVariables(token, isAMinter);
  });

  it('configureMinter whilePaused', async function () {
    let amount = 6;

    // pause contract and make sure not a minter
    await token.pause({ from: pauserAccount })
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    await checkVariables(token, notAMinter);

    // now make into a minter - this will throw
    await expectRevert(token.configureMinter(minterAccount, amount, { from: masterMinterAccount }));

    // state should be unchanged
    await checkVariables(token, notAMinter)
  });

  it('configureMinter from bad masterMinter', async function () {
    let amount = 6;

    // make sure not a minter, and sender is not a masterMinter
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': false },
      { 'variable': 'masterMinter', 'expectedValue': masterMinterAccount }
    ]
    assert.isFalse(arbitraryAccount == masterMinterAccount)
    await checkVariables(token, notAMinter);

    // now make into a minter - this will throw
    await expectRevert(token.configureMinter(minterAccount, amount, { from: arbitraryAccount }));

    // state should be unchanged
    await checkVariables(token, notAMinter)
  });

  it('configureMinter when masterMinter is blacklisted', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(token, setup);

    // now configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var result = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    // verify it worked
    await checkVariables(token, result);
  });

  it('configureMinter when minter is blacklisted', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(token, setup);

    // now configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var result = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    // verify it worked
    await checkVariables(token, result);
  });

  it('removeMinter', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(token, isAMinter);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    // verify it worked
    await checkVariables(token, notAMinter);
  });

  it('removeMinter does not affect totalSupply or balances', async function () {
    // set up pre-conditions
    let amount = 11;
    let totalSupply = 10;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, totalSupply, { from: minterAccount })
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount - totalSupply },
      { 'variable': 'balances.minterAccount', 'expectedValue': totalSupply },
      { 'variable': 'totalSupply', 'expectedValue': totalSupply }
    ]
    await checkVariables(token, isAMinter);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': totalSupply },
      { 'variable': 'totalSupply', 'expectedValue': totalSupply }
    ]
    // verify it worked
    await checkVariables(token, notAMinter);
  });

  it('removeMinter whilePaused', async function () {
    // set up pre-conditions
    let amount = 6;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.pause({ from: pauserAccount })
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    await checkVariables(token, isAMinter);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    // verify it worked
    await checkVariables(token, notAMinter);
  });

  it('removeMinter from bad masterMinter', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(token, isAMinter);

    // now remove minter - this will throw
    await expectRevert(token.removeMinter(minterAccount, { from: arbitraryAccount }));

    // state should be unchanged
    await checkVariables(token, isAMinter)
  });

  it('removeMinter when masterMinter is blacklisted', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(token, setup);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    // verify it worked
    await checkVariables(token, notAMinter);
  });

  it('removeMinter when minter is blacklisted', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(token, setup);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    // verify it worked
    await checkVariables(token, notAMinter);
  });

  it('burn', async function () {
    // set up pre-conditions
    var amount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false },
    ]
    await checkVariables(token, setup);

    // now burn the tokens
    await token.burn(amount, { from: minterAccount })

    var afterBurn = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': 0 },
      { 'variable': 'totalSupply', 'expectedValue': 0 },
      { 'variable': 'paused', 'expectedValue': false }
    ]

    // state should be unchanged
    await checkVariables(token, afterBurn)
  });

  it('burn some', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = 10;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(token, setup);

    // now burn the tokens
    await token.burn(burnAmount, { from: minterAccount })

    var afterBurn = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount - burnAmount },
      { 'variable': 'totalSupply', 'expectedValue': amount - burnAmount },
      { 'variable': 'paused', 'expectedValue': false }
    ]

    // state should be unchanged
    await checkVariables(token, afterBurn)
  });

  it('burn too many', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = 12;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(token, setup);

    // now burn the tokens
    await expectRevert(token.burn(burnAmount, { from: minterAccount }))

    // state should be unchanged
    await checkVariables(token, setup)
  });

  it('burn -1', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = -1;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(token, setup);

    // now burn the tokens
    await expectRevert(token.burn(burnAmount, { from: minterAccount }))

    // state should be unchanged
    await checkVariables(token, setup)
  });

  it('burn sender is mallory', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = -1;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false }
    ]
    await checkVariables(token, setup);

    // now burn the tokens
    await expectRevert(token.burn(burnAmount, { from: arbitraryAccount }))

    // state should be unchanged
    await checkVariables(token, setup)
  });

  it('burn while paused', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    await token.pause({ from: pauserAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    await checkVariables(token, setup);

    // now burn the tokens
    await expectRevert(token.burn(burnAmount, { from: minterAccount }))

    // state should be unchanged
    await checkVariables(token, setup)
  });

  it('burn while minter blacklisted', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    await token.blacklist(minterAccount, { from: blacklisterAccount })
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
    ]
    await checkVariables(token, setup);

    // now burn the tokens
    await expectRevert(token.burn(burnAmount, { from: minterAccount }))

    // state should be unchanged
    await checkVariables(token, setup)
  });

  it('burn after removeMinter', async function () {
    // set up pre-conditions
    var amount = 11;
    var burnAmount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, amount, { from: minterAccount });
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var setup = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount },
      { 'variable': 'totalSupply', 'expectedValue': amount },
      { 'variable': 'paused', 'expectedValue': false },
    ]
    await checkVariables(token, setup);

    // now burn the tokens
    await expectRevert(token.burn(burnAmount, { from: minterAccount }))

    // state should be unchanged
    await checkVariables(token, setup)
  });

  it('updateRoleAddress masterMinter', async function () {
    // initial
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'masterMinter', 'expectedValue': masterMinterAccount },
    ]
    assert.notEqual(masterMinterAccount, arbitraryAccount)
    await checkVariables(token, setup);

    // change masterMinter role address
    await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: roleAddressChangerAccount });
    var result = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount }
    ]
    // verify it worked
    await checkVariables(token, result);
  });

  it('updateRoleAddress blacklister', async function () {
    // initial
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'blacklister', 'expectedValue': blacklisterAccount },
    ]
    assert.notEqual(blacklisterAccount, arbitraryAccount)
    await checkVariables(token, setup);

    // change masterMinter role address
    await token.updateRoleAddress(arbitraryAccount, blacklisterRole, { from: roleAddressChangerAccount });
    var result = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'blacklister', 'expectedValue': arbitraryAccount }
    ]
    // verify it worked
    await checkVariables(token, result);
  });

  it('updateRoleAddress pauser', async function () {
    // initial
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'pauser', 'expectedValue': pauserAccount },
    ]
    assert.notEqual(pauserAccount, arbitraryAccount)
    await checkVariables(token, setup);

    // change masterMinter role address
    await token.updateRoleAddress(arbitraryAccount, pauserRole, { from: roleAddressChangerAccount });
    var result = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'pauser', 'expectedValue': arbitraryAccount }
    ]
    // verify it worked
    await checkVariables(token, result);
  });

  it('updateRoleAddress roleAddressChanger', async function () {
    // initial
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount }
    ]
    assert.notEqual(roleAddressChangerAccount, arbitraryAccount)
    await checkVariables(token, setup);

    // change masterMinter role address
    await token.updateRoleAddress(arbitraryAccount, roleAddressChangerRole, { from: roleAddressChangerAccount });
    var result = [
      { 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount }
    ]
    // verify it worked
    await checkVariables(token, result);
  });

  // while paused
  it('updateRoleAddress while paused', async function () {
    // initial
    await token.pause({ from: pauserAccount });
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    assert.notEqual(roleAddressChangerAccount, arbitraryAccount)
    await checkVariables(token, setup);

    // change masterMinter role address
    await token.updateRoleAddress(arbitraryAccount, roleAddressChangerRole, { from: roleAddressChangerAccount });
    var result = [
      { 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount }
    ]
    // verify it worked
    await checkVariables(token, result);
  });

  it('updateRoleAddress old roleAddressChanger disabled', async function () {
    // initial
    await token.updateRoleAddress(arbitraryAccount, roleAddressChangerRole, { from: roleAddressChangerAccount });
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount }
    ]
    assert.notEqual(roleAddressChangerAccount, arbitraryAccount)
    assert.notEqual(masterMinterAccount, arbitraryAccount);
    await checkVariables(token, setup);

    // try change roleAddressChanger role address
    await expectRevert(token.updateRoleAddress(masterMinterAccount, roleAddressChangerRole, { from: roleAddressChangerAccount }))

    // verify it no changes
    await checkVariables(token, setup);
  });

  it('updateRoleAddress new roleAddressChanger can update', async function () {
    // switch roleAddressChanger
    await token.updateRoleAddress(arbitraryAccount, roleAddressChangerRole, { from: roleAddressChangerAccount });
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount },
      { 'variable': 'masterMinter', 'expectedValue': masterMinterAccount }
    ]
    assert.notEqual(roleAddressChangerAccount, arbitraryAccount)
    assert.notEqual(masterMinterAccount, arbitraryAccount)
    await checkVariables(token, setup);

    // arbitraryAccount will try to make himself masterMinter
    await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: arbitraryAccount });
    var result = [
      { 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount },
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount }
    ]
    // verify it worked
    await checkVariables(token, result);
  });

  // fake role
  it('updateRoleAddress fake role', async function () {
    // switch roleAddressChanger
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
    ]
    assert.notEqual(roleAddressChangerAccount, arbitraryAccount)
    await checkVariables(token, setup);

    // Try to send fake role. Should not throw.
    await token.updateRoleAddress(arbitraryAccount, 'fakeRoleName', { from: roleAddressChangerAccount });

    // verify nothing changed
    await checkVariables(token, setup);
  });

  it('updateRoleAddress user is 0x00', async function () {
    let bigZero = 0x0000000000000000000000000000000000000000;
    let smallZero = 0x00;
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'masterMinter', 'expectedValue': masterMinterAccount },
      { 'variable': 'pauser', 'expectedValue': pauserAccount },
    ]
    assert.notEqual(bigZero, masterMinterAccount)
    assert.notEqual(smallZero, pauserAccount)
    await checkVariables(token, setup);

    // Set masterMinter and pauser to zero-addresss
    await token.updateRoleAddress(bigZero, masterMinterRole, { from: roleAddressChangerAccount });
    await token.updateRoleAddress(smallZero, pauserRole, { from: roleAddressChangerAccount });

    // verify updates to zero
    var result = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'masterMinter', 'expectedValue': bigZero },
      { 'variable': 'pauser', 'expectedValue': smallZero }
    ]
    await checkVariables(token, result);
  });

  it('updateRoleAddress user is roleAddressChanger', async function () {
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount }
    ]
    await checkVariables(token, setup);

    // Set roleAddressChanger to self
    await token.updateRoleAddress(roleAddressChangerAccount, roleAddressChangerRole, { from: roleAddressChangerAccount });

    // verify no changes
    await checkVariables(token, setup);
  });

  it('updateRoleAddress user is blacklisted', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'masterMinter', 'expectedValue': masterMinterAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ]
    assert.notEqual(masterMinterAccount, arbitraryAccount);
    await checkVariables(token, setup);

    // updated masterMinter to blacklisted account
    await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: roleAddressChangerAccount });

    // verify
    var result = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ]
    await checkVariables(token, result);
  });

  it('updateRoleAddress roleAddressChanger is blacklisted', async function () {
    await token.blacklist(roleAddressChangerAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'masterMinter', 'expectedValue': masterMinterAccount },
      { 'variable': 'isAccountBlacklisted.roleAddressChangerAccount', 'expectedValue': true }
    ]
    assert.notEqual(masterMinterAccount, arbitraryAccount);
    await checkVariables(token, setup);

    // updated masterMinter to blacklisted account
    await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: roleAddressChangerAccount });

    // verify
    var result = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.roleAddressChangerAccount', 'expectedValue': true }
    ]
    await checkVariables(token, result);
  });

  // bad sender
  it('updateRoleAddress msg.sender is not roleAddressChanger', async function () {
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'masterMinter', 'expectedValue': masterMinterAccount }
    ]
    assert.notEqual(roleAddressChangerAccount, arbitraryAccount);
    assert.notEqual(masterMinterAccount, arbitraryAccount);
    await checkVariables(token, setup);

    // try to update masterMinter
    await expectRevert(token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: arbitraryAccount }));

    // ensure nothing changed
    await checkVariables(token, setup);
  });

  // while paused
  it('updateRoleAddress while paused', async function () {
    await token.pause({ from: pauserAccount });
    var setup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'masterMinter', 'expectedValue': masterMinterAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    assert.notEqual(masterMinterAccount, arbitraryAccount);
    await checkVariables(token, setup);

    // updated masterMinter to blacklisted account
    await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: roleAddressChangerAccount });

    // verify
    var result = [
      { 'variable': 'roleAddressChanger', 'expectedValue': roleAddressChangerAccount },
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    await checkVariables(token, result);
  });

});