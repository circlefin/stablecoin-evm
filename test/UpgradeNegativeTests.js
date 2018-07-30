var tokenUtils = require('./TokenTestUtils');;
var BigNumber = require('bignumber.js');
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var expectRevert = tokenUtils.expectRevert;
var checkVariables = tokenUtils.checkVariables;
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
var proxyOwnerAccount = tokenUtils.proxyOwnerAccount;
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var upgradeTo = tokenUtils.upgradeTo;
var encodeCall = tokenUtils.encodeCall;
var validateTransferEvent = tokenUtils.validateTransferEvent;
var FiatToken = tokenUtils.FiatToken;
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var UpgradedFiatTokenNewFields = tokenUtils.UpgradedFiatTokenNewFields;

var amount = 100;

async function run_tests(newToken) {

  beforeEach('Make fresh token contract', async function () {
    rawToken = await newToken();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.equal(proxy.address, token.address);
  });
  

  it('nut002 should fail to switch adminAccount with non-adminAccount as caller', async function () {
    await expectRevert(proxy.changeAdmin(masterMinterAccount, {from: masterMinterAccount}));
    assert.equal(await proxy.admin({from: proxyOwnerAccount}), proxyOwnerAccount);
    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut003 should fail to upgradeTo to null contract address', async function () {
    var upgradedToken = await UpgradedFiatToken.new();
    await expectRevert(proxy.upgradeTo("0x0", token, {from: proxyOwnerAccount}));

    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut004 should fail to upgradeToAndCall to null contract address', async function () {
    var upgradedToken = await UpgradedFiatToken.new();
    const initializeData = encodeCall('pauser', [], []);
    await expectRevert(proxy.upgradeToAndCall("0x0", initializeData, { from: proxyOwnerAccount }));

    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut005 should fail to initialize contract twice', async function () {
    await expectRevert(token.initialize(name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, tokenOwnerAccount));
    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut006 should fail to call contract function with adminAccount', async function () {
    await expectRevert(token.allowance(minterAccount, arbitraryAccount, { from: proxyOwnerAccount }));

    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut007 should fail to call proxy function with non-adminAccount', async function () {
    await expectRevert(proxy.admin({ from: masterMinterAccount }));

    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut008 shoud fail to update proxy storage if state-changing function called directly in FiatToken', async function () {
    await rawToken.initialize(name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, tokenOwnerAccount);
    assert.equal(await rawToken.pauser(), pauserAccount);
    await rawToken.updatePauser(masterMinterAccount, {from: tokenOwnerAccount});
    assert.equal(await rawToken.pauser(), masterMinterAccount);

    customVars = [];
    await checkVariables([token], [customVars]);
  });

  it('nut009 should fail to call upgradeTo with non-adminAccount', async function () {
    var upgradedToken = await UpgradedFiatToken.new();
    await expectRevert(proxy.upgradeTo(upgradedToken.address, {from:masterMinterAccount}));
    var finalToken = FiatToken.at(proxy.address);
    var implementation = await proxy.implementation({from: proxyOwnerAccount});
    finalToken.proxiedTokenAddress = implementation;

    customVars = [];
    await checkVariables([finalToken], [customVars]);
  });

  it('nut010 should fail to call updateToAndCall with non-adminAccount', async function () {
    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall('initialize', ['bool', 'address', 'uint256'], [true, pauserAccount, 12]);
    await expectRevert(proxy.upgradeToAndCall(upgradedToken.address, initializeData, { from: masterMinterAccount }));
    var finalToken = FiatToken.at(proxy.address);
    var implementation = await proxy.implementation({from: proxyOwnerAccount});
    finalToken.proxiedTokenAddress = implementation;

    customVars = [];
    await checkVariables([finalToken], [customVars]);
  });

}

module.exports = {
  run_tests: run_tests,
}
