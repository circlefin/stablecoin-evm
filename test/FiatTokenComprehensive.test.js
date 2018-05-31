var FiatToken = artifacts.require('FiatTokenWithStorage');
var EternalStorage = artifacts.require('EternalStorage');
var name = 'Sample Fiat Token';
var symbol = 'C-USD';
var currency = 'USD';
var decimals = 2;
var BigNumber = require('bignumber.js');
var bigZero = new BigNumber(0);

contract('FiatToken', function (accounts) {
  let token;
  let arbitraryAccount = accounts[8];
  let masterMinterAccount = accounts[9];
  let minterAccount = accounts[7];
  let pauserAccount = accounts[6];
  let blacklisterAccount = accounts[4];
  let roleAddressChangerAccount = accounts[3];
  let upgraderAccount = accounts[2];

  // for testing variance of specific variables from their default values,
  // pass in an object with keys of those specific variables' names, and values of their expected values
  checkVariables = async function (customVars) {
    // set each variable's default value
    expectedState = {
      'name': name,
      'symbol': symbol,
      'currency': currency,
      'decimals': new BigNumber(decimals),
      'roleAddressChanger': roleAddressChangerAccount,
      'masterMinter': masterMinterAccount,
      // contractStorage is not deterministic for FiatTokenWithStorage
      //'contractStorage': storageAddress,
      'owner': accounts[0],
      'balances': {
        'arbitraryAccount': bigZero,
        'masterMinterAccount': bigZero,
        'minterAccount': bigZero,
        'pauserAccount': bigZero,
        'blacklisterAccount': bigZero,
        'roleAddressChangerAccount': bigZero,
        'upgraderAccount': bigZero
      },
      'allowance': {
        'arbitraryAccount': {
          'masterMinterAccount': bigZero,
          'minterAccount': bigZero,
          'pauserAccount': bigZero,
          'blacklisterAccount': bigZero,
          'roleAddressChangerAccount': bigZero,
          'upgraderAccount': bigZero
        },
        'masterMinterAccount': {
          'arbitraryAccount': bigZero,
          'minterAccount': bigZero,
          'pauserAccount': bigZero,
          'blacklisterAccount': bigZero,
          'roleAddressChangerAccount': bigZero,
          'upgraderAccount': bigZero
        },
        'minterAccount': {
          'arbitraryAccount': bigZero,
          'masterMinterAccount': bigZero,
          'pauserAccount': bigZero,
          'blacklisterAccount': bigZero,
          'roleAddressChangerAccount': bigZero,
          'upgraderAccount': bigZero
        },
        'pauserAccount': {
          'arbitraryAccount': bigZero,
          'masterMinterAccount': bigZero,
          'minterAccount': bigZero,
          'blacklisterAccount': bigZero,
          'roleAddressChangerAccount': bigZero,
          'upgraderAccount': bigZero
        },
        'blacklisterAccount': {
          'arbitraryAccount': bigZero,
          'masterMinterAccount': bigZero,
          'minterAccount': bigZero,
          'pauserAccount': bigZero,
          'roleAddressChangerAccount': bigZero,
          'upgraderAccount': bigZero
        },
        'roleAddressChangerAccount': {
          'arbitraryAccount': bigZero,
          'masterMinterAccount': bigZero,
          'minterAccount': bigZero,
          'pauserAccount': bigZero,
          'blacklisterAccount': bigZero,
          'upgraderAccount': bigZero
        },
        'upgraderAccount': {
          'arbitraryAccount': bigZero,
          'masterMinterAccount': bigZero,
          'minterAccount': bigZero,
          'pauserAccount': bigZero,
          'blacklisterAccount': bigZero,
          'roleAddressChangerAccount': bigZero,
        }
      },
      'totalSupply': bigZero,
      'isAccountBlacklisted': {
        'arbitraryAccount': false,
        'masterMinterAccount': false,
        'minterAccount': false,
        'pauserAccount': false,
        'blacklisterAccount': false,
        'roleAddressChangerAccount': false,
        'upgraderAccount': false
      },
      'isAccountMinter': {
        'arbitraryAccount': false,
        'masterMinterAccount': false,
        'minterAccount': false,
        'pauserAccount': false,
        'blacklisterAccount': false,
        'roleAddressChangerAccount': false,
        'upgraderAccount': false
      },
      'minterAllowance': {
        'arbitraryAccount': bigZero,
        'masterMinterAccount': bigZero,
        'minterAccount': bigZero,
        'pauserAccount': bigZero,
        'blacklisterAccount': bigZero,
        'roleAddressChangerAccount': bigZero,
        'upgraderAccount': bigZero
      },
      'blacklister': blacklisterAccount,
      'pauser': pauserAccount,
      'upgrader': upgraderAccount,
      'paused': false
    };

    // set the new expected variables passed in
    for (key in customVars) {
      console.log('key', key);
      console.log('value', customVars[key]);
      expectedState[key] = customVars[key]
    }

    // check each value in expectedState against contract state
    assert.equal(await token.name.call(), expectedState['name']);
    assert.equal(await token.symbol.call(), expectedState['symbol']);
    assert.equal(await token.currency.call(), expectedState['currency']);
    assert.isTrue(new BigNumber(await token.decimals.call()).isEqualTo(expectedState['decimals']));
    assert.equal(await token.roleAddressChanger.call(), expectedState['roleAddressChanger']);
    assert.equal(await token.masterMinter.call(), expectedState['masterMinter']);

    //TODO contractStorage

    //balances
    assert.isTrue(new BigNumber(await token.balanceOf(arbitraryAccount)).isEqualTo(expectedState['balances']['arbitraryAccount']))
    assert.isTrue(new BigNumber(await token.balanceOf(masterMinterAccount)).isEqualTo(expectedState['balances']['masterMinterAccount']))
    assert.isTrue(new BigNumber(await token.balanceOf(minterAccount)).isEqualTo(expectedState['balances']['minterAccount']))
    assert.isTrue(new BigNumber(await token.balanceOf(pauserAccount)).isEqualTo(expectedState['balances']['pauserAccount']))
    assert.isTrue(new BigNumber(await token.balanceOf(blacklisterAccount)).isEqualTo(expectedState['balances']['blacklisterAccount']))
    assert.isTrue(new BigNumber(await token.balanceOf(roleAddressChangerAccount)).isEqualTo(expectedState['balances']['roleAddressChangerAccount']))
    assert.isTrue(new BigNumber(await token.balanceOf(upgraderAccount)).isEqualTo(expectedState['balances']['upgraderAccount']))

    // allowance
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, masterMinterAccount)).isEqualTo(expectedState['allowance']['arbitraryAccount']['masterMinterAccount']));
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, minterAccount)).isEqualTo(expectedState['allowance']['arbitraryAccount']['minterAccount']));
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, pauserAccount)).isEqualTo(expectedState['allowance']['arbitraryAccount']['pauserAccount']));
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, blacklisterAccount)).isEqualTo(expectedState['allowance']['arbitraryAccount']['blacklisterAccount']));
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, roleAddressChangerAccount)).isEqualTo(expectedState['allowance']['arbitraryAccount']['roleAddressChangerAccount']));
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, upgraderAccount)).isEqualTo(expectedState['allowance']['arbitraryAccount']['upgraderAccount']));
    // TODO: write assert statements for the rest of the 42 combinations of possible spenders and destination addresses. (Will slow down tests.)

    assert.isTrue(new BigNumber(await token.totalSupply.call()).isEqualTo(expectedState['totalSupply']));

    //blacklisted
    assert.equal(await token.isAccountBlacklisted(arbitraryAccount), expectedState['isAccountBlacklisted']['arbitraryAccount'])
    assert.equal(await token.isAccountBlacklisted(masterMinterAccount), expectedState['isAccountBlacklisted']['masterMinterAccount'])
    assert.equal(await token.isAccountBlacklisted(minterAccount), expectedState['isAccountBlacklisted']['minterAccount'])
    assert.equal(await token.isAccountBlacklisted(pauserAccount), expectedState['isAccountBlacklisted']['pauserAccount'])
    assert.equal(await token.isAccountBlacklisted(blacklisterAccount), expectedState['isAccountBlacklisted']['blacklisterAccount'])
    assert.equal(await token.isAccountBlacklisted(roleAddressChangerAccount), expectedState['isAccountBlacklisted']['roleAddressChangerAccount'])
    assert.equal(await token.isAccountBlacklisted(upgraderAccount), expectedState['isAccountBlacklisted']['upgraderAccount'])

    //isMinter
    assert.equal(await token.isAccountMinter(arbitraryAccount), expectedState['isAccountMinter']['arbitraryAccount'])
    assert.equal(await token.isAccountMinter(masterMinterAccount), expectedState['isAccountMinter']['masterMinterAccount'])
    assert.equal(await token.isAccountMinter(minterAccount), expectedState['isAccountMinter']['minterAccount'])
    assert.equal(await token.isAccountMinter(pauserAccount), expectedState['isAccountMinter']['pauserAccount'])
    assert.equal(await token.isAccountMinter(blacklisterAccount), expectedState['isAccountMinter']['blacklisterAccount'])
    assert.equal(await token.isAccountMinter(roleAddressChangerAccount), expectedState['isAccountMinter']['roleAddressChangerAccount'])
    assert.equal(await token.isAccountMinter(upgraderAccount), expectedState['isAccountMinter']['upgraderAccount'])

    //minterAllowance
    assert.isTrue(new BigNumber(await token.minterAllowance(arbitraryAccount)).isEqualTo(expectedState['minterAllowance']['arbitraryAccount']))
    assert.isTrue(new BigNumber(await token.minterAllowance(masterMinterAccount)).isEqualTo(expectedState['minterAllowance']['masterMinterAccount']))
    assert.isTrue(new BigNumber(await token.minterAllowance(minterAccount)).isEqualTo(expectedState['minterAllowance']['minterAccount']))
    assert.isTrue(new BigNumber(await token.minterAllowance(pauserAccount)).isEqualTo(expectedState['minterAllowance']['pauserAccount']))
    assert.isTrue(new BigNumber(await token.minterAllowance(blacklisterAccount)).isEqualTo(expectedState['minterAllowance']['blacklisterAccount']))
    assert.isTrue(new BigNumber(await token.minterAllowance(roleAddressChangerAccount)).isEqualTo(expectedState['minterAllowance']['roleAddressChangerAccount']))
    assert.isTrue(new BigNumber(await token.minterAllowance(upgraderAccount)).isEqualTo(expectedState['minterAllowance']['upgraderAccount']))

    assert.equal(await token.blacklister.call(), expectedState['blacklister']);
    assert.equal(await token.pauser.call(), expectedState['pauser']);
    assert.equal(await token.upgrader.call(), expectedState['upgrader']);
    assert.equal(await token.paused.call(), expectedState['paused']);
  }

  beforeEach(async function checkBefore() {
      token = await FiatToken.new(name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, roleAddressChangerAccount);
      let tokenAddress = token.address;
      await checkVariables({});
    });

  it('should have correct name after contract initialization', async function checkName() {
      let actual = await token.name.call();
      var customVars = {'name': actual};
      await checkVariables(customVars);
  });

  it('should have correct symbol after contract initialization', async function checkSymbol() {
      let actual = await token.symbol.call();
      var customVars = {'symbol': actual};
      await checkVariables(customVars);
  });

  it('should have correct currency after contract initialization', async function checkCurrency() {
      let actual = await token.currency.call();
      var customVars = {'currency': actual};
      await checkVariables(customVars);
  });

  it('should have correct decimals after contract initialization', async function checkDecimals() {
      let actual = await token.decimals.call();
      var customVars = {'decimals': actual};
      await checkVariables(customVars);
  });

  it('should have correct roleAddressChanger after contract initialization', async function checkRoleAddressChanger() {
    let actual = await token.roleAddressChanger.call();
    var customVars = {'roleAddressChanger': actual};
    await checkVariables(customVars);
  });

  it('should have correct masterMinter after contract initialization', async function checkMasterMinter() {
    let actual = await token.masterMinter.call();
    var customVars = {'masterMinter': actual};
    await checkVariables(customVars);
  });

/*  it('should have correct contractStorage after contract initialization', async function () {
    let actual = await token.getDataContractAddress();
    var customVars = {'contractStorage': actual};
    await checkVariables(customVars);
  });
*/

  it('should have correct blacklister after contract initialization', async function checkBlacklister() {
    let actual = await token.blacklister.call();
    var customVars = {'blacklister': actual};
    await checkVariables(customVars);
  });

  it('should have correct pauser after contract initialization', async function checkPauser() {
    let actual = await token.pauser.call();
    var customVars = {'pauser': actual};
    await checkVariables(customVars);
  });

  it('should have correct upgrader after contract initialization', async function checkUpgrader() {
    let actual = await token.upgrader.call();
    var customVars = {'upgrader': actual};
    await checkVariables(customVars);
  });

  it('should have correct roleAddressChanger after updateRoleAddress', async function checkRoleAddressChanger() {
    await token.updateRoleAddress(arbitraryAccount, 'roleAddressChanger', {from: roleAddressChangerAccount});
    var customVars = {'roleAddressChanger': arbitraryAccount};
    await checkVariables(customVars);
  });

  it('should have correct blacklister after updateRoleAddress', async function () {
    await token.updateRoleAddress(arbitraryAccount, 'blacklister', {from: roleAddressChangerAccount});
    var customVars = {'blacklister': arbitraryAccount};
    await checkVariables(customVars);
  })

  it('should have correct pauser after updateRoleAddress', async function () {
    await token.updateRoleAddress(arbitraryAccount, 'pauser', {from: roleAddressChangerAccount});
    var customVars = {'pauser': arbitraryAccount};
    await checkVariables(customVars);
  });

  it('should have correct upgrader after updateRoleAddress', async function () {
    await token.updateRoleAddress(arbitraryAccount, 'upgrader', {from: roleAddressChangerAccount});
    var customVars = {'upgrader': arbitraryAccount};
    await checkVariables(customVars);
  });

  it('should pause and set paused to true', async function () {
      await token.pause({from: pauserAccount});
    await checkVariables({'paused': true});
  });

  it('should unpause and set paused to false', async function () {
      await token.pause({from: pauserAccount});
      await checkVariables({'paused': true});
      await token.unpause({from: pauserAccount});
      await checkVariables({'paused': false});
  });
});