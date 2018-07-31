var tokenUtils = require('./TokenTestUtils');;
var BigNumber = require('bignumber.js');
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
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
var UpgradedFiatTokenNewFieldsNewLogic = tokenUtils.UpgradedFiatTokenNewFieldsNewLogic;
var getAdmin = tokenUtils.getAdmin;

var amount = 100;


async function run_tests(newToken) {

  beforeEach('Make fresh token contract', async function () {
    rawToken = await newToken();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.equal(proxy.address, token.address);
  });

  it('upt001 should upgradeTo new contract and preserve data field values', async function () {
  	let mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });

    var upgradedToken = await UpgradedFiatToken.new();
  	var tokenConfig = await upgradeTo(proxy, upgradedToken, proxyOwnerAccount);
    var newToken = tokenConfig.token;

    customVars = [
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'proxiedTokenAddress', 'expectedValue': upgradedToken.address }
    ];
    await checkVariables([newToken], [customVars]);
  });

  it('upt002 should upgradeToandCall to contract with new data fields set on initialize and ensure new fields are correct and old data is preserved', async function () {
    let mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });

    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall('initialize', ['bool', 'address', 'uint256'], [true, pauserAccount, 12]);
    await proxy.upgradeToAndCall(upgradedToken.address, initializeData, { from: proxyOwnerAccount })
    newProxiedToken = await UpgradedFiatTokenNewFields.at(proxy.address);
    assert.equal(newProxiedToken.address, proxy.address);
    assert.notEqual(newProxiedToken.address, upgradedToken.address);

    assert.equal(await newProxiedToken.newBool(), true);
    assert.equal(await newProxiedToken.newAddress(), pauserAccount);
    assert.equal((new BigNumber(12)).isEqualTo(await newProxiedToken.newUint()), true);

    customVars = [
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'proxiedTokenAddress', 'expectedValue': upgradedToken.address }
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  it('upt003 should upgradeToAndCall to contract with new data fields set on initialize and new logic and ensure old data preserved,new logic works, and new fields correct', async function () {
    let mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });

    var upgradedToken = await UpgradedFiatTokenNewFieldsNewLogic.new();
    const initializeData = encodeCall('initialize', ['bool', 'address', 'uint256'], [true, pauserAccount, 12]);
    await proxy.upgradeToAndCall(upgradedToken.address, initializeData, { from: proxyOwnerAccount })
    newProxiedToken = await UpgradedFiatTokenNewFieldsNewLogic.at(proxy.address);
    assert.equal(newProxiedToken.address, proxy.address);
    assert.notEqual(newProxiedToken.address, upgradedToken.address);

    assert.equal(await newProxiedToken.newBool(), true);
    assert.equal(await newProxiedToken.newAddress(), pauserAccount);
    assert.equal((new BigNumber(12)).isEqualTo(await newProxiedToken.newUint()), true);

    await newProxiedToken.setNewAddress(masterMinterAccount);
    assert.equal(await newProxiedToken.newAddress(), masterMinterAccount);

    customVars = [
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'proxiedTokenAddress', 'expectedValue': upgradedToken.address }
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  it('upt004 should update proxy adminAccount with previous adminAccount', async function () {
    await proxy.changeAdmin(masterMinterAccount, {from: proxyOwnerAccount});
    assert.equal(await proxy.admin({from: masterMinterAccount}), masterMinterAccount);
    await checkVariables([token], [[]]);
  });

  it('upt005 should receive Transfer event on transfer when proxied after upgrade', async function () {
    let mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, mintAmount + 1, { from: minterAccount });
    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });

    var upgradedToken = await UpgradedFiatToken.new();
    var tokenConfig = await upgradeTo(proxy, upgradedToken, proxyOwnerAccount);
    var newToken = tokenConfig.token;

    transfer = await newToken.transfer(pauserAccount, 1, { from: arbitraryAccount});
    validateTransferEvent(transfer, arbitraryAccount, pauserAccount, 1);

    customVars = [
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount - 1) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount + 1) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount + 1) },
      { 'variable': 'proxiedTokenAddress', 'expectedValue': upgradedToken.address }
    ];
    await checkVariables([newToken], [customVars]);
  });

  it('upt006 should upgrade while paused and upgraded contract should be paused as a result; then unpause should unpause contract', async function () {
    await token.pause({from: pauserAccount});
    var upgradedToken = await UpgradedFiatToken.new();
    var tokenConfig = await upgradeTo(proxy, upgradedToken, proxyOwnerAccount);
    var newToken = tokenConfig.token;

    customVars = [
      { 'variable': 'paused', 'expectedValue': true, },
      { 'variable': 'proxiedTokenAddress', 'expectedValue': upgradedToken.address }
    ];
    await checkVariables([newToken], [customVars]);

    await newToken.unpause({from:pauserAccount});

    customVars2 = [
      { 'variable': 'proxiedTokenAddress', 'expectedValue': upgradedToken.address }
    ];
    await checkVariables([newToken], [customVars2]);
  });

  it('upt009 should check that admin is set correctly by proxy constructor', async function() {
    assert.equal(await getAdmin(token), upgraderAccount);
  });

}

module.exports = {
  run_tests: run_tests,
}
