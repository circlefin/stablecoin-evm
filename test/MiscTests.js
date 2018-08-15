var FiatTokenProxy = artifacts.require('FiatTokenProxy');

var tokenUtils = require('./TokenTestUtils');;
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
var blacklisterAccount = tokenUtils.blacklisterAccount;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var getInitializedV1 = tokenUtils.getInitializedV1;
var FiatToken = tokenUtils.FiatToken;

var maxAmount = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
var amount = 100;

async function run_tests(newToken, accounts) {

  beforeEach('Make fresh token contract', async function () {
    rawToken = await newToken();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.equal(proxy.address, token.address);
  });


  // No Payable Function

  it('ms001 no payable function', async function () {
    var success = false;
    try {
      await web3.eth.sendTransaction({ from: arbitraryAccount, to: token.address, value: 1 });
    } catch (e) {
      success = true;
    }
    assert.equal(true, success);
  });

  // Same Address

  it('ms002 should transfer to self has correct final balance', async function() {
    let mintAmount = 50;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.transfer(arbitraryAccount, mintAmount, { from: arbitraryAccount });

    var customVars = [
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms003 should transferFrom to self from approved account and have correct final balance', async function() {
    let mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });

    await token.approve(pauserAccount, mintAmount, { from: arbitraryAccount });
    await token.transferFrom(arbitraryAccount, arbitraryAccount, mintAmount, { from: pauserAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms004 should transferFrom to self from approved self and have correct final balance', async function() {
    let mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });

    await token.approve(arbitraryAccount, mintAmount, { from: arbitraryAccount });
    await token.transferFrom(arbitraryAccount, arbitraryAccount, mintAmount, { from: arbitraryAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms005 should mint to self with correct final balance', async function () {
    var mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(minterAccount, mintAmount, { from: minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms006 should approve correct allowance for self', async function () {
    var mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.approve(arbitraryAccount, amount, { from: arbitraryAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'allowance.arbitraryAccount.arbitraryAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms007 should configureMinter for masterMinter', async function () {
    await token.configureMinter(masterMinterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.masterMinterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.masterMinterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);
  });

  // Multiple Minters

  it('ms009 should configure two minters', async function () {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms010 should configure two minters and each mint distinct amounts', async function () {
    var mintAmount1 = 10;
    var mintAmount2 = 20;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    await token.mint(pauserAccount, mintAmount1, { from: minterAccount });
    await token.mint(pauserAccount, mintAmount2, { from: arbitraryAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount1) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount - mintAmount2) },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount1 + mintAmount2) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount1 + mintAmount2) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms011 should configure two minters, each minting distinct amounts and then remove one minter', async function () {
    var mintAmount1 = 10;
    var mintAmount2 = 20;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    await token.mint(pauserAccount, mintAmount1, { from: minterAccount });
    await token.mint(pauserAccount, mintAmount2, { from: arbitraryAccount });
    await token.removeMinter(arbitraryAccount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount1) },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount1 + mintAmount2) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount1 + mintAmount2) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms012 should configure two minters and adjust both allowances', async function () {
    var adjustment = 10;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount) },
    ];
    await checkVariables([token], [customVars]);

    await token.configureMinter(minterAccount, amount - adjustment, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount + adjustment, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - adjustment) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount + adjustment) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms013 should configure two minters, one with zero allowance fails to mint', async function () {
    var mintAmount = 10;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, 0, { from: masterMinterAccount });
    await token.mint(pauserAccount, mintAmount, { from: minterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
    ];
    await expectRevert(token.mint(pauserAccount, mintAmount, { from: arbitraryAccount }));
    //await expectRevert(token.mint(pauserAccount, 0, { from: arbitraryAccount }));
    await checkVariables([token], [customVars]);
  });

  it('ms014 should configure two minters and fail to mint when paused', async function () {
    var mintAmount = 10;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    await token.pause({ from: pauserAccount });
    var customVars = [
      { 'variable': 'paused', 'expectedValue': true },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await expectRevert(token.mint(pauserAccount, mintAmount, { from: minterAccount }));
    await expectRevert(token.mint(pauserAccount, mintAmount, { from: arbitraryAccount }));
    await checkVariables([token], [customVars]);
  });

  it('ms015 should configure two minters, blacklist one and ensure it cannot mint, then unblacklist and ensure it can mint', async function () {
    var mintAmount = 10;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    await token.mint(pauserAccount, mintAmount, { from: arbitraryAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
    ];
    await expectRevert(token.mint(pauserAccount, mintAmount, { from: minterAccount }));
    await checkVariables([token], [customVars]);

    await token.unBlacklist(minterAccount, { from: blacklisterAccount });
    await token.mint(pauserAccount, mintAmount, { from: minterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount + mintAmount) },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount + mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms016 should configure two minters, each mints to themselves and then burns certain amount', async function () {
    var mintAmount1 = 10;
    var mintAmount2 = 20;
    var burnAmount = 10;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.configureMinter(arbitraryAccount, amount, { from: masterMinterAccount });
    await token.mint(minterAccount, mintAmount1, { from: minterAccount });
    await token.mint(arbitraryAccount, mintAmount2, { from: arbitraryAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount1) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount - mintAmount2) },
      { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(mintAmount1) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount2) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount1 + mintAmount2) },
    ];
    await checkVariables([token], [customVars]);

    await token.burn(burnAmount, { from: minterAccount });
    await token.burn(burnAmount, { from: arbitraryAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount1) },
      { 'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(amount - mintAmount2) },
      { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(mintAmount1 - burnAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount2 - burnAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount1 + mintAmount2 - burnAmount - burnAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  // 0 Input

  it('ms018 should approve 0 token allowance with unchanged state', async function () {
    await token.approve(minterAccount, 0, { from: arbitraryAccount });
    await checkVariables([token], [[]]);
  });

  it('ms019 should transferFrom 0 tokens with unchanged state', async function () {
    await token.transferFrom(arbitraryAccount, pauserAccount, 0, { from: arbitraryAccount2 });
    await checkVariables([token], [[]]);
  });

  it('ms020 should transfer 0 tokens with unchanged state', async function () {
    await token.transfer(arbitraryAccount, 0, { from: arbitraryAccount2 });
    await checkVariables([token], [[]]);
  });

  it('ms036 should get allowance for same address', async function() {
    await token.approve(arbitraryAccount, amount, {from: arbitraryAccount});
    var allowance = new BigNumber(await token.allowance(arbitraryAccount, arbitraryAccount));
    assert(allowance.isEqualTo(new BigNumber(amount)));
  });

  // Return value

  /*
  * Calls (i.e token.mint.call(...) , token.approve.call(...) etc.) expose the
  * return value of functions while transactions (token.mint(...) ,
  * token.approve(...) etc.) return transaction receipts and do not read
  * function return values. Calls, unlike transactions, do not permanently
  * modify data. However, both calls and transactions execute code on the
  * network. That is, token.mint.call(...) will revert if and only if
  * token.mint(...) reverts.
  *
  * "Choosing between a transaction and a call is as simple as deciding
  *  whether you want to read data, or write it."
  *  - truffle docs
  *    (https://truffleframework.com/docs/getting_started/contracts)
  */

  it('ms039 should return true on mint', async function() {
    var mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    assert(await token.mint.call(arbitraryAccount, mintAmount, { from: minterAccount }));
    await checkVariables([token], [customVars]);
  });

  it('ms040 should return true on approve', async function() {
    assert(await token.approve.call(minterAccount, amount, { from: arbitraryAccount }));
  });

  it('ms041 should return true on transferFrom', async function() {
    let mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.approve(masterMinterAccount, mintAmount, { from: arbitraryAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'allowance.arbitraryAccount.masterMinterAccount', 'expectedValue': new BigNumber(mintAmount)},
    ];
    assert(await token.transferFrom.call(arbitraryAccount, pauserAccount, mintAmount, { from: masterMinterAccount }));
    await checkVariables([token], [customVars]);
  });

  it('ms042 should return true on transfer', async function() {
    let mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) }
    ];
    assert(await token.transfer.call(pauserAccount, mintAmount, { from: arbitraryAccount }));
    await checkVariables([token], [customVars]);
  });

  it('ms043 should return true on configureMinter', async function() {
    assert(await token.configureMinter.call(minterAccount, amount, { from: masterMinterAccount }));
  });

  it('ms044 should return true on removeMinter', async function() {
    assert(await token.removeMinter.call(minterAccount, { from: masterMinterAccount }));
  });

  it('ms045 initialized should be in slot 8, byte 21', async function() {
    var initialized = await getInitializedV1(token);
    assert.equal("0x01", initialized);
  });

  it('ms046 initialized should be 0 before initialization', async function() {
    var rawToken = await newToken();
    var newProxy = await FiatTokenProxy.new(rawToken.address, { from: arbitraryAccount });
    var token = FiatToken.at(newProxy.address);
    var initialized = await getInitializedV1(token);
    assert.equal("0x00", initialized);
  });

  it('ms047 configureMinter works on amount=2^256-1', async function() {
    await token.configureMinter(minterAccount, maxAmount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);
  });

  it('ms048 mint works on amount=2^256-1', async function() {
    await token.configureMinter(minterAccount, maxAmount, { from: masterMinterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, maxAmount, { from: minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);
   });

  it('ms049 burn on works on amount=2^256-1', async function() {
    await token.configureMinter(minterAccount, maxAmount, { from: masterMinterAccount });
    await token.mint(minterAccount, maxAmount, { from: minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.burn(maxAmount, { from: minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    ];
    await checkVariables([token], [customVars]);
   });

  it('ms050 approve works on amount=2^256-1', async function() {
    await token.configureMinter(minterAccount, maxAmount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, maxAmount, { from: minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.approve(pauserAccount, maxAmount, {from: arbitraryAccount});
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(maxAmount) },
      { 'variable': 'allowance.arbitraryAccount.pauserAccount', 'expectedValue': new BigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);
   });

  it('ms051 transfer works on amount=2^256-1', async function() {
    await token.configureMinter(minterAccount, maxAmount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, maxAmount, { from: minterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.transfer(pauserAccount, maxAmount, {from: arbitraryAccount});
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(maxAmount) },
    ];
    await checkVariables([token], [customVars]);
   });

  it('ms052 transferFrom works on amount=2^256-1', async function() {
    await token.configureMinter(minterAccount, maxAmount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, maxAmount, { from: minterAccount });
    await token.approve(pauserAccount, maxAmount, {from: arbitraryAccount});
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(maxAmount) },
      { 'variable': 'allowance.arbitraryAccount.pauserAccount', 'expectedValue': new BigNumber(maxAmount) }
    ];
    await checkVariables([token], [customVars]);

    await token.transferFrom(arbitraryAccount, pauserAccount, maxAmount, {from: pauserAccount});
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(maxAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(maxAmount) },
    ];
    await checkVariables([token], [customVars]);
   });
}

var testWrapper = require('./TestWrapper');
testWrapper.execute('FiatToken_MiscTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
