var tokenUtils = require('./../TokenTestUtils');;
var newBigNumber = tokenUtils.newBigNumber;
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var zeroAddress = tokenUtils.zeroAddress;
var mint = tokenUtils.mint;
var expectRevert = tokenUtils.expectRevert;
var checkVariables = tokenUtils.checkVariables;
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var upgradeTo = tokenUtils.upgradeTo;
var encodeCall = tokenUtils.encodeCall;
var validateTransferEvent = tokenUtils.validateTransferEvent;
var FiatToken = tokenUtils.FiatToken;
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var UpgradedFiatTokenNewFields = tokenUtils.UpgradedFiatTokenNewFields;

var AccountUtils = require('./../AccountUtils');
var Accounts = AccountUtils.Accounts;
var addressEquals = AccountUtils.addressEquals;

var amount = 100;

async function run_tests(newToken, accounts) {

  beforeEach('Make fresh token contract', async function () {
    rawToken = await newToken();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.isTrue(addressEquals(proxy.address ,token.address));
  });

  it('nut002 should fail to switch adminAccount with non-adminAccount as caller', async function () {
    await expectRevert(proxy.changeAdmin(Accounts.masterMinterAccount, {from: Accounts.masterMinterAccount}));
    assert.isTrue(addressEquals(await proxy.admin({from: Accounts.proxyOwnerAccount}), Accounts
    .proxyOwnerAccount));
    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut003 should fail to upgradeTo to null contract address', async function () {
    var upgradedToken = await UpgradedFiatToken.new();
    await expectRevert(proxy.upgradeTo(zeroAddress, {from: Accounts.proxyOwnerAccount}));

    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut004 should fail to upgradeToAndCall to null contract address', async function () {
    var upgradedToken = await UpgradedFiatToken.new();
    const initializeData = encodeCall('pauser', [], []);
    await expectRevert(proxy.upgradeToAndCall(zeroAddress, initializeData, { from: Accounts.proxyOwnerAccount }));

    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut005 should fail to initialize contract twice', async function () {
    await expectRevert(token.initialize(name, symbol, currency, decimals, Accounts.masterMinterAccount, Accounts.pauserAccount, Accounts.blacklisterAccount, Accounts.tokenOwnerAccount));
    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut006 should fail to call contract function with adminAccount', async function () {
    await expectRevert(token.allowance(Accounts.minterAccount, Accounts.arbitraryAccount, { from: Accounts.proxyOwnerAccount }));

    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut007 should fail to call proxy function with non-adminAccount', async function () {
    await expectRevert(proxy.admin({ from: Accounts.masterMinterAccount }));

    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut008 shoud fail to update proxy storage if state-changing function called directly in FiatToken', async function () {
    await rawToken.initialize(name, symbol, currency, decimals, Accounts.masterMinterAccount, Accounts.pauserAccount, Accounts.blacklisterAccount, Accounts.tokenOwnerAccount);
    assert.isTrue(addressEquals(await rawToken.pauser(), Accounts.pauserAccount));
    await rawToken.updatePauser(Accounts.masterMinterAccount, {from: Accounts.tokenOwnerAccount});
    assert.isTrue(addressEquals(await rawToken.pauser(), Accounts.masterMinterAccount));

    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut009 should fail to call upgradeTo with non-adminAccount', async function () {
    var upgradedToken = await UpgradedFiatToken.new();
    await expectRevert(proxy.upgradeTo(upgradedToken.address, {from:Accounts.masterMinterAccount}));
    var finalToken = await FiatToken.at(proxy.address);
    var implementation = await proxy.implementation({from: Accounts.proxyOwnerAccount});
    finalToken.proxiedTokenAddress = implementation;

    customVars = [];
    await checkVariables([finalToken], [customVars]);
  });

  it('nut010 should fail to call updateToAndCall with non-adminAccount', async function () {
    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall('initialize', ['bool', 'address', 'uint256'], [true, Accounts.pauserAccount, 12]);
    await expectRevert(proxy.upgradeToAndCall(upgradedToken.address, initializeData, { from: Accounts.masterMinterAccount }));
    var finalToken = await FiatToken.at(proxy.address);
    var implementation = await proxy.implementation({from: Accounts.proxyOwnerAccount});
    finalToken.proxiedTokenAddress = implementation;

    customVars = [];
    await checkVariables([finalToken], [customVars]);
  });

   it('nut011 should fail to upgradeToAndCall with initialize (already set variables)', async function () {
    let mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, { from: Accounts.masterMinterAccount });
    await token.mint(Accounts.arbitraryAccount, mintAmount, { from: Accounts.minterAccount });
    await token.transfer(Accounts.arbitraryAccount2, mintAmount, { from: Accounts.arbitraryAccount });

    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    var data = encodeCall('initialize', ['string','string','string','uint8','address','address','address','address','bool','address','uint256'], [name, symbol, currency, decimals, Accounts.masterMinterAccount, Accounts.arbitraryAccount2, Accounts.blacklisterAccount, Accounts.tokenOwnerAccount, true, Accounts.arbitraryAccount2, 12]);
    await expectRevert(proxy.upgradeToAndCall(upgradedToken.address, data, { from: Accounts.proxyOwnerAccount }));

    customVars = [
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': newBigNumber(amount - mintAmount) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.arbitraryAccount2', 'expectedValue': newBigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': newBigNumber(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });  

}

var testWrapper = require('./../TestWrapper');
testWrapper.execute('FiatToken_ProxyNegativeTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
