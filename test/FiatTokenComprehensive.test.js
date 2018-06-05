
import {
  setupAccountsFromTestRPC,
  setToken,
  checkVariables,
  setMinter,
  mint,
  mintRaw
} from './TokenTestUtils';

import {
  name, symbol, currency, decimals, bigZero, bigHundred, debugLogging, 
  arbitraryAccount, masterMinterAccount, minterAccount, pauserAccount, blacklisterAccount, 
  roleAddressChangerAccount, upgraderAccount, owner, token
} from './TokenTestUtils';

contract('FiatToken', function (accounts) {
  const util = require('util');
  var _ = require('lodash');
  var FiatToken = artifacts.require('FiatToken');
  var EternalStorage = artifacts.require('EternalStorage');

  var BigNumber = require('bignumber.js');
 
  setupAccountsFromTestRPC(accounts)

  beforeEach(async function checkBefore() {
      var newToken = await FiatToken.new(0, name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, roleAddressChangerAccount);
      setToken(newToken)
      let tokenAddress = token.address;
      await checkVariables([]);
    });

  // Test template
  /*  it('<DESCRIPTION>', async function () {
    let actual = await token.<FUNCTION>();
    customVars = [{'variable': '<VARIABLE NAME>', 'expectedValue': actual}];
    await checkVariables(token, customVars);
  }); */

//  it('should have correct contractStorage after contract initialization', async function () {
//    let actual = await token.getDataContractAddress();
//    var customVars = {'contractStorage': actual};
//    await checkVariables(token, customVars);
//  });

  it('should have correct blacklister after contract initialization', async function checkBlacklister() {
    let actual = await token.blacklister.call();
    var customVars = [{'variable': 'blacklister', 'expectedValue': actual}];
    await checkVariables(customVars);
  });

  it('should have correct pauser after contract initialization', async function checkPauser() {
    let actual = await token.pauser.call();
    var customVars = [{'variable': 'pauser', 'expectedValue': actual}];
    await checkVariables(customVars);
  });

  it('should have correct upgrader after contract initialization', async function checkUpgrader() {
    let actual = await token.upgrader.call();
    var customVars = [{'variable': 'upgrader', 'expectedValue': actual}];
    await checkVariables(customVars);
  });

  it('should have correct roleAddressChanger after updateRoleAddress', async function checkRoleAddressChanger() {
    await token.updateRoleAddress(arbitraryAccount, 'roleAddressChanger', {from: roleAddressChangerAccount});
    var customVars = [{'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount}];
    await checkVariables(customVars);
  });

  it('should have correct blacklister after updateRoleAddress', async function () {
    await token.updateRoleAddress(arbitraryAccount, 'blacklister', {from: roleAddressChangerAccount});
    var customVars = [{'variable': 'blacklister', 'expectedValue': arbitraryAccount}];
    await checkVariables(customVars);
  })

  it('should have correct pauser after updateRoleAddress', async function () {
    await token.updateRoleAddress(arbitraryAccount, 'pauser', {from: roleAddressChangerAccount});
    var customVars = [{'variable': 'pauser', 'expectedValue': arbitraryAccount}];
    await checkVariables(customVars);
  });

  it('should have correct upgrader after updateRoleAddress', async function () {
    await token.updateRoleAddress(arbitraryAccount, 'upgrader', {from: roleAddressChangerAccount});
    var customVars = [{'variable': 'upgrader', 'expectedValue': arbitraryAccount}];
    await checkVariables(customVars);
  });

  it('should pause and set paused to true', async function () {
    await token.pause({from: pauserAccount});
    var customVars = [{'variable': 'paused', 'expectedValue': true}];
    await checkVariables(customVars);
  });

  it('should unpause and set paused to false', async function () {
    await token.pause({from: pauserAccount});
    var customVars = [{'variable': 'paused', 'expectedValue': true}];
    await checkVariables(customVars);
    await token.unpause({from: pauserAccount});
    customVars = [{'variable': 'paused', 'expectedValue': false}];
    await checkVariables(customVars);
  });

  it('should approve a spend and set allowed amount', async function () {
    await token.approve(minterAccount, 100, {from: arbitraryAccount});
    var customVars = [{'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': bigHundred}];
    await checkVariables(customVars)
  })

  it('should blacklist and set blacklisted to true', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    var customVars = [{'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}]
    await checkVariables(customVars)
  })

  it('should burn amount of tokens and reduce balance and total supply by amount', async function () {
    var amount = 100;

    // mint tokens to arbitraryAccount
    await mint(minterAccount, amount);
    var customVars = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true}
    ]
    await checkVariables(customVars);
    
    await token.burn(amount, {from: minterAccount});

    var customVars = [{'variable': 'isAccountMinter.minterAccount', 'expectedValue': true}]
    // (tests that totalSupply and balance are returned to defaults after burn)
    await checkVariables(customVars);
  });

  it('should configureMinter, setting the minter to true and mintingAllowance to amount', async function () {
    var amount = 100;

    // configure minter
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
    ]
    await checkVariables(customVars);
  })
});