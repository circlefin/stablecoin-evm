<<<<<<< HEAD
var tokenUtils = require('./TokenTestUtils');;
=======
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var tokenUtils = require('./TokenTestUtils');
>>>>>>> 6c8b1fd50d14ecf9da8b1e1996606ff817b6195d
var BigNumber = require('bignumber.js');
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var checkVariables = tokenUtils.checkVariables;
<<<<<<< HEAD
=======
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
>>>>>>> 6c8b1fd50d14ecf9da8b1e1996606ff817b6195d
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

  /////////////////////////////////////////////////////////////////////////////

  beforeEach('Make fresh token contract', async function () {
    token = await newToken();
  });

  it('should check that default variable values are correct', async function () {
    await checkVariables(token, []);
  });

  /////////////////////////////////////////////////////////////////////////////

  // Paused

  it('should updateUpgraderAddress while paused', async function () {
    await token.pause({ from: pauserAccount });
    await token.updateUpgraderAddress(arbitraryAccount, { from: upgraderAccount });
    var result = [
      { 'variable': 'upgrader', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables(token, result);
  });

  it('should updateMasterMinter while paused', async function () {
    await token.pause({ from: pauserAccount });
    await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables(token, result);
  });

  it('should updateBlacklister while paused', async function () {
    await token.pause({ from: pauserAccount });
    await token.updateBlacklister(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'blacklister', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables(token, result);
  });

  it('should updatePauser while paused', async function () {
    await token.pause({ from: pauserAccount });
    await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'pauser', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables(token, result);
  });

  it('should transferOwnership while paused', async function () {
    await token.pause({ from: pauserAccount });
    await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables(token, result);
  });

  it('should removeMinter while paused', async function () {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.pause({ from: pauserAccount });
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables(token, isAMinter);

    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables(token, notAMinter);
  });

<<<<<<< HEAD
=======
  it('should upgrade while paused', async function() {
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
    await token.pause({from: pauserAccount});
    await token.upgrade(newToken.address, {from: upgraderAccount});
    var result = [
      //TODO: Add this to checkVariables.
      //{ 'variable': 'tokenOwner', 'expectedValue': newToken.address },
      //{ 'variable': 'upgradedAddress', 'expectedValue': newToken.address },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables(token, result);
    assert.equal(await token.upgradedAddress.call(), newToken.address);
  });

>>>>>>> 6c8b1fd50d14ecf9da8b1e1996606ff817b6195d
  // Zero Address

  it('should updateMasterMinter to zero address', async function () {
    let longZero = 0x0000000000000000000000000000000000000000;
    let shortZero = 0x00;

    await token.updateMasterMinter(longZero, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': "0x0000000000000000000000000000000000000000" },
    ];

    // Note: longZero and shortZero both resolve to 0x0000000000000000000000000000000000000000
    await token.updateMasterMinter(shortZero, { from: tokenOwnerAccount });
    await checkVariables(token, result);
  });

  it('should updateBlacklister to zero address', async function () {
    let longZero = 0x0000000000000000000000000000000000000000;
    let shortZero = 0x00;

    await token.updateBlacklister(longZero, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'blacklister', 'expectedValue': "0x0000000000000000000000000000000000000000" },
    ];

    await token.updateBlacklister(shortZero, { from: tokenOwnerAccount });
    await checkVariables(token, result);
  });

  it('should updatePauser to zero address', async function () {
    let longZero = 0x0000000000000000000000000000000000000000;
    let shortZero = 0x00;

    await token.updatePauser(longZero, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'pauser', 'expectedValue': "0x0000000000000000000000000000000000000000" },
    ];

    await token.updatePauser(shortZero, { from: tokenOwnerAccount });
    await checkVariables(token, result);
  });

  // Blacklisted

<<<<<<< HEAD
=======
  it('should updateUpgraderAddress when msg.sender blacklisted', async function () {
    await token.blacklist(upgraderAccount, { from: blacklisterAccount });
    await token.updateUpgraderAddress(arbitraryAccount, { from: upgraderAccount });
    var setup = [
      { 'variable': 'upgrader', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.upgraderAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it('should updateMasterMinter when msg.sender blacklisted', async function () {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it('should updateBlacklister when msg.sender blacklisted', async function () {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    await token.updateBlacklister(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'blacklister', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it('should updatePauser when msg.sender blacklisted', async function () {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'pauser', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it('should transferOwnership when msg.sender blacklisted', async function () {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it ('should pause when msg.sender blacklisted', async function() {
    await token.blacklist(pauserAccount, { from: blacklisterAccount });
    await token.pause({ from: pauserAccount });
    var setup = [
      { 'variable': 'paused', 'expectedValue': true },
      { 'variable': 'isAccountBlacklisted.pauserAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it ('should unpause when msg.sender blacklisted', async function() {
    await token.pause({ from: pauserAccount });
    var setup = [
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables(token, setup);

    await token.blacklist(pauserAccount, { from: blacklisterAccount });
    await token.unpause({ from: pauserAccount });
    setup = [
      { 'variable': 'isAccountBlacklisted.pauserAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it ('should blacklist when msg.sender blacklisted', async function() {
    await token.blacklist(blacklisterAccount, { from: blacklisterAccount });
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.blacklisterAccount', 'expectedValue': true },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it ('should unBlacklist when msg.sender blacklisted', async function() {
    await token.blacklist(blacklisterAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.blacklisterAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);

    await token.unBlacklist(blacklisterAccount, { from: blacklisterAccount });
    await checkVariables(token, []);
  });

  it ('should upgrade when msg.sender blacklisted', async function() {
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
    await token.blacklist(upgraderAccount, { from: blacklisterAccount });
    await token.upgrade(newToken.address, { from: upgraderAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.upgraderAccount', 'expectedValue': true },
      //TODO: Add this to checkVariables.
      //{ 'variable': 'tokenOwner', 'expectedValue': newToken.address },
      //{ 'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ];
    await checkVariables(token, setup);
    assert.equal(await token.upgradedAddress.call(), newToken.address);
  });

  it ('should upgrade to blacklisted address', async function() {
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
    await token.blacklist(newToken.address, { from: blacklisterAccount });
    await token.upgrade(newToken.address, { from: upgraderAccount });
    var setup = [
      //TODO: Add this to checkVariables.
      //{ 'variable': 'isAccountBlacklisted.newToken.address', 'expectedValue': true },
      //{ 'variable': 'tokenOwner', 'expectedValue': newToken.address },
      //{ 'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ];
    await checkVariables(token, setup);
    assert.equal(await token.upgradedAddress.call(), newToken.address);
  });

  it('should blacklist a blacklisted address', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await checkVariables(token, setup);
  });

>>>>>>> 6c8b1fd50d14ecf9da8b1e1996606ff817b6195d
  it('should updateUpgraderAddress to blacklisted address', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.updateUpgraderAddress(arbitraryAccount, { from: upgraderAccount });
    var setup = [
      { 'variable': 'upgrader', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it('should updateMasterMinter to blacklisted address', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it('should updateBlacklister to blacklisted address', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.updateBlacklister(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'blacklister', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it('should updatePauser to blacklisted address', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'pauser', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it('should transferOwnership to blacklisted address', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);
  });

  it('should configureMinter when masterMinter is blacklisted', async function () {
    await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var result = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true }
    ];
    await checkVariables(token, result);
  });

  it('should configureMinter when minter is blacklisted', async function () {
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var result = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
    ];
    await checkVariables(token, result);
  });

  it('should removeMinter when masterMinter is blacklisted', async function() {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
    ];
    await checkVariables(token, customVars);

    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
      { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
    ];
    await checkVariables(token, customVars);
  });

  it('should removeMinter when minter is blacklisted', async function() {
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    var customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
    ];
    await checkVariables(token, customVars);

    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    customVars = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
      { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
    ];
    await checkVariables(token, customVars);
  });

}

module.exports = {
  run_tests: run_tests,
}
