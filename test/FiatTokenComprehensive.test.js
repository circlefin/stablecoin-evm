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

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('FiatToken', function (accounts) {
  beforeEach(async function checkBefore() {
    token = await FiatToken.new("0x0", name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, roleAddressChangerAccount);

    let tokenAddress = token.address;

    let dataContractAddress = await token.getDataContractAddress();
    let storage = EternalStorage.at(dataContractAddress);
    assert.equal(await storage.owner.call(), tokenAddress)
  });

  // Test template
  /*  it('<DESCRIPTION>', async function () {
    let actual = await token.<FUNCTION>();
    customVars = [{'variable': '<VARIABLE NAME>', 'expectedValue': actual}];
    await checkVariables(token, customVars);
  }); */

  it('should check that default variable values are correct', async function () {
    await checkVariables(token, []);
  });

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
    await checkVariables(token, []);
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
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 }
    ]
    await checkVariables(token, notAMinter);

    // now make into a minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount }
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
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true }
    ]
    await checkVariables(token, setup);

    // now configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var result = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true }
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
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true }
    ]
    await checkVariables(token, setup);

    // now configure minter
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var result = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true }
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
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount }
    ]
    await checkVariables(token, isAMinter);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 }
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
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': amount }
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
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true }
    ]
    await checkVariables(token, setup);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 }
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
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true }
    ]
    await checkVariables(token, setup);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 }
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
      { 'variable': 'totalSupply', 'expectedValue': amount }
    ]
    await checkVariables(token, setup);

    // now burn the tokens
    await token.burn(amount, { from: minterAccount })

    var afterBurn = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': 0 }
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
      { 'variable': 'totalSupply', 'expectedValue': amount }
    ]
    await checkVariables(token, setup);

    // now burn the tokens
    await token.burn(burnAmount, { from: minterAccount })

    var afterBurn = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': 0 },
      { 'variable': 'balances.minterAccount', 'expectedValue': amount - burnAmount },
      { 'variable': 'totalSupply', 'expectedValue': amount - burnAmount }
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
      { 'variable': 'totalSupply', 'expectedValue': amount }
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
      { 'variable': 'totalSupply', 'expectedValue': amount }
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
      { 'variable': 'totalSupply', 'expectedValue': amount }
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
      { 'variable': 'totalSupply', 'expectedValue': amount }
    ]
    await checkVariables(token, setup);

    // now burn the tokens
    await expectRevert(token.burn(burnAmount, { from: minterAccount }))

    // state should be unchanged
    await checkVariables(token, setup)
  });

  it('updateRoleAddress masterMinter', async function () {

    // change masterMinter role address
    await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: roleAddressChangerAccount });
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount }
    ]
    // verify it worked
    await checkVariables(token, result);
  });

  it('updateRoleAddress blacklister', async function () {

    // change masterMinter role address
    await token.updateRoleAddress(arbitraryAccount, blacklisterRole, { from: roleAddressChangerAccount });
    var result = [
      { 'variable': 'blacklister', 'expectedValue': arbitraryAccount }
    ]
    // verify it worked
    await checkVariables(token, result);
  });

  it('updateRoleAddress pauser', async function () {

    // change masterMinter role address
    await token.updateRoleAddress(arbitraryAccount, pauserRole, { from: roleAddressChangerAccount });
    var result = [
      { 'variable': 'pauser', 'expectedValue': arbitraryAccount }
    ]
    // verify it worked
    await checkVariables(token, result);
  });

  it('updateRoleAddress roleAddressChanger', async function () {

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
      { 'variable': 'paused', 'expectedValue': true }
    ]
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
      { 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount }
    ]

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
    // Try to send fake role. Should not throw.
    await token.updateRoleAddress(arbitraryAccount, 'fakeRoleName', { from: roleAddressChangerAccount });

    // verify nothing changed
    await checkVariables(token, []);
  });

  it('updateRoleAddress user is 0x00', async function () {
    let bigZero = 0x0000000000000000000000000000000000000000;
    let smallZero = 0x00;

    // Set masterMinter and pauser to zero-addresss
    await token.updateRoleAddress(bigZero, masterMinterRole, { from: roleAddressChangerAccount });
    await token.updateRoleAddress(smallZero, pauserRole, { from: roleAddressChangerAccount });

    // verify updates to zero
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': bigZero },
      { 'variable': 'pauser', 'expectedValue': smallZero }
    ]
    await checkVariables(token, result);
  });

  it('updateRoleAddress user is roleAddressChanger', async function () {
    // Set roleAddressChanger to self
    await token.updateRoleAddress(roleAddressChangerAccount, roleAddressChangerRole, { from: roleAddressChangerAccount });

    // verify no changes
    await checkVariables(token, []);
  });

  it('updateRoleAddress user is blacklisted', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ]
    await checkVariables(token, setup);

    // updated masterMinter to blacklisted account
    await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: roleAddressChangerAccount });

    // verify
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ]
    await checkVariables(token, result);
  });

  it('updateRoleAddress roleAddressChanger is blacklisted', async function () {
    await token.blacklist(roleAddressChangerAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.roleAddressChangerAccount', 'expectedValue': true }
    ]
    await checkVariables(token, setup);

    // updated masterMinter to blacklisted account
    await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: roleAddressChangerAccount });

    // verify
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.roleAddressChangerAccount', 'expectedValue': true }
    ]
    await checkVariables(token, result);
  });

  // bad sender
  it('updateRoleAddress msg.sender is not roleAddressChanger', async function () {

    // try to update masterMinter
    await expectRevert(token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: arbitraryAccount }));

    // ensure nothing changed
    await checkVariables(token, []);
  });

  // while paused
  it('updateRoleAddress while paused', async function () {
    await token.pause({ from: pauserAccount });
    var setup = [
      { 'variable': 'paused', 'expectedValue': true }
    ]
    await checkVariables(token, []);

    // updated masterMinter to blacklisted account
    await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: roleAddressChangerAccount });

    // verify
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    await checkVariables(token, result);
  });

  // while upgraded
  it('updateRoleAddress after upgrade', async function () {
    // create new token with same DataConract but arbitraryAddress in all the roles
    let dataContractAddress = await token.getDataContractAddress();
    let newToken = await FiatToken.new(dataContractAddress,
      name, symbol, currency, decimals, arbitraryAccount, arbitraryAccount, arbitraryAccount,
      arbitraryAccount, arbitraryAccount);
    var newTokenSetup = [
      { 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount },
      { 'variable': 'pauser', 'expectedValue': arbitraryAccount },
      { 'variable': 'upgrader', 'expectedValue': arbitraryAccount },
      { 'variable': 'blacklister', 'expectedValue': arbitraryAccount },
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount }
    ]
    await checkVariables(newToken, newTokenSetup);

    //upgrade the token contract
    await token.upgrade(newToken.address, { from: upgraderAccount });
    var setup = [
      { 'variable': 'paused', 'expectedValue': true }
    ]
    await checkVariables(token, setup);

    // updateRoleAddress
    await token.updateRoleAddress(arbitraryAccount2, masterMinterRole, { from: roleAddressChangerAccount });

    // verify
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount2 },
      { 'variable': 'paused', 'expectedValue': true }
    ]

    // check only old token has changed
    await checkVariables(token, result);
    await checkVariables(newToken, newTokenSetup);
  });

});