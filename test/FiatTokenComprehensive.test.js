const util = require('util');
var _ = require('lodash');
var FiatToken = artifacts.require('FiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var name = 'Sample Fiat Token';
var symbol = 'C-USD';
var currency = 'USD';
var decimals = 2;
var BigNumber = require('bignumber.js');
var bigZero = new BigNumber(0);
// used as arbitrary number
var bigHundred = new BigNumber(100);
// TODO: test really big numbers

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('FiatToken', function (accounts) {
  let token;
  let arbitraryAccount = accounts[8];
  let masterMinterAccount = accounts[9];
  let minterAccount = accounts[7];
  let pauserAccount = accounts[6];
  let blacklisterAccount = accounts[4];
  let roleAddressChangerAccount = accounts[3];
  let upgraderAccount = accounts[2];

  // For testing variance of specific variables from their default values.
  // customVars is an array of objects of the form,
  // {'variable': <name of variable>, 'expectedValue': <expected value after modification>}
  // to reference nested variables, name variable using dot syntax, e.g. 'allowance.arbitraryAccount.minterAccount'
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
  
    // for each item in customVars, set the item in expectedState
    for (i = 0; i < customVars.length; ++i) {
      if (_.has(expectedState, customVars[i].variable)) {
        _.set(expectedState, customVars[i].variable, customVars[i].expectedValue);
      } else {
        // TODO: test the error 
        throw new Error("variable " + customVars[i].variable + " not found in expectedState");
      }
    }

    console.log(util.inspect(expectedState, {showHidden: false, depth: null}))

    // check each value in expectedState against contract state
    assert.equal(await token.name.call(), expectedState['name']);
    assert.equal(await token.symbol.call(), expectedState['symbol']);
    assert.equal(await token.currency.call(), expectedState['currency']);

    // CHAI:
    let decimalsCount = await token.decimals.call();
    decimalsCount.should.be.bignumber.equal(expectedState['decimals'])

    assert.equal(await token.roleAddressChanger.call(), expectedState['roleAddressChanger']);
    assert.equal(await token.masterMinter.call(), expectedState['masterMinter']);

    //TODO contractStorage

    //balances
    assert.isTrue(new BigNumber(await token.balanceOf(arbitraryAccount)).equals(expectedState['balances']['arbitraryAccount']))
    assert.isTrue(new BigNumber(await token.balanceOf(masterMinterAccount)).equals(expectedState['balances']['masterMinterAccount']))
    assert.isTrue(new BigNumber(await token.balanceOf(minterAccount)).equals(expectedState['balances']['minterAccount']))
    assert.isTrue(new BigNumber(await token.balanceOf(pauserAccount)).equals(expectedState['balances']['pauserAccount']))
    assert.isTrue(new BigNumber(await token.balanceOf(blacklisterAccount)).equals(expectedState['balances']['blacklisterAccount']))
    assert.isTrue(new BigNumber(await token.balanceOf(roleAddressChangerAccount)).equals(expectedState['balances']['roleAddressChangerAccount']))
    assert.isTrue(new BigNumber(await token.balanceOf(upgraderAccount)).equals(expectedState['balances']['upgraderAccount']))

    // allowance
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, masterMinterAccount)).equals(expectedState['allowance']['arbitraryAccount']['masterMinterAccount']));

    // CHAI:
    let allowanceAmount = await token.allowance(arbitraryAccount, minterAccount);
    allowanceAmount.should.be.bignumber.equal(expectedState['allowance']['arbitraryAccount']['minterAccount']);
    
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, minterAccount)).equals(expectedState['allowance']['arbitraryAccount']['minterAccount']));
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, pauserAccount)).equals(expectedState['allowance']['arbitraryAccount']['pauserAccount']));
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, blacklisterAccount)).equals(expectedState['allowance']['arbitraryAccount']['blacklisterAccount']));
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, roleAddressChangerAccount)).equals(expectedState['allowance']['arbitraryAccount']['roleAddressChangerAccount']));
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, upgraderAccount)).equals(expectedState['allowance']['arbitraryAccount']['upgraderAccount']));
    // TODO: write assert statements for the rest of the 42 combinations of possible spenders and destination addresses. (Will slow down tests.)

    assert.isTrue(new BigNumber(await token.totalSupply.call()).equals(expectedState['totalSupply']));

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
    assert.isTrue(new BigNumber(await token.minterAllowance(arbitraryAccount)).equals(expectedState['minterAllowance']['arbitraryAccount']))
    assert.isTrue(new BigNumber(await token.minterAllowance(masterMinterAccount)).equals(expectedState['minterAllowance']['masterMinterAccount']))
    assert.isTrue(new BigNumber(await token.minterAllowance(minterAccount)).equals(expectedState['minterAllowance']['minterAccount']))
    assert.isTrue(new BigNumber(await token.minterAllowance(pauserAccount)).equals(expectedState['minterAllowance']['pauserAccount']))
    assert.isTrue(new BigNumber(await token.minterAllowance(blacklisterAccount)).equals(expectedState['minterAllowance']['blacklisterAccount']))
    assert.isTrue(new BigNumber(await token.minterAllowance(roleAddressChangerAccount)).equals(expectedState['minterAllowance']['roleAddressChangerAccount']))
    assert.isTrue(new BigNumber(await token.minterAllowance(upgraderAccount)).equals(expectedState['minterAllowance']['upgraderAccount']))

    assert.equal(await token.blacklister.call(), expectedState['blacklister']);
    assert.equal(await token.pauser.call(), expectedState['pauser']);
    assert.equal(await token.upgrader.call(), expectedState['upgrader']);
    assert.equal(await token.paused.call(), expectedState['paused']);
  }

  setMinter = async function(minter, amount) {
    let update = await token.configureMinter(minter, amount, {from: masterMinterAccount});
    assert.equal(update.logs[0].event, 'MinterConfigured');
    assert.equal(update.logs[0].args.minter, minter);
    assert.equal(update.logs[0].args.minterAllowedAmount, amount);
    let minterAllowance = await token.minterAllowance(minter);

    assert.equal(minterAllowance, amount);
  }

  mint = async function(to, amount) {
    minter = minterAccount;
    await setMinter(minter, amount);
    await mintRaw(to, amount, minter);
  }

  mintRaw = async function(to, amount, minter) {
    let initialTotalSupply = await token.totalSupply();
    let initialMinterAllowance = await token.minterAllowance(minter);
    let minting = await token.mint(to, amount, {from: minter});
    assert.equal(minting.logs[0].event, 'Mint');
    assert.equal(minting.logs[0].args.minter, minter);
    assert.equal(minting.logs[0].args.to, to);
    assert.equal(minting.logs[0].args.amount, amount);
    let totalSupply = await token.totalSupply();
    assert.isTrue(new BigNumber(totalSupply).minus(new BigNumber(amount)).equals(new BigNumber(initialTotalSupply)));
    let minterAllowance = await token.minterAllowance(minter);
    assert.isTrue(new BigNumber(initialMinterAllowance).minus(new BigNumber(amount)).equals(new BigNumber(minterAllowance)));
  }

  beforeEach(async function checkBefore() {
    token = await FiatToken.new("0x0", name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, roleAddressChangerAccount);
    let tokenAddress = token.address;

    let dataContractAddress = await token.getDataContractAddress();
    let storage = EternalStorage.at(dataContractAddress);
    assert.equal(await storage.owner.call(), tokenAddress)

    await checkVariables([]);
  });

  // Test template
  /*  it('<DESCRIPTION>', async function () {
    let actual = await token.<FUNCTION>();
    customVars = [{'variable': '<VARIABLE NAME>', 'expectedValue': actual}];
    await checkVariables(customVars);
  }); */

//  it('should have correct contractStorage after contract initialization', async function () {
//    let actual = await token.getDataContractAddress();
//    var customVars = {'contractStorage': actual};
//    await checkVariables(customVars);
//  });

  it('should have correct blacklister after contract initialization', async function checkBlacklister() {
    let actual = await token.blacklister.call();
    customVars = [{'variable': 'blacklister', 'expectedValue': actual}];
    await checkVariables(customVars);
  });

  it('should have correct pauser after contract initialization', async function checkPauser() {
    let actual = await token.pauser.call();
    customVars = [{'variable': 'pauser', 'expectedValue': actual}];
    await checkVariables(customVars);
  });

  it('should have correct upgrader after contract initialization', async function checkUpgrader() {
    let actual = await token.upgrader.call();
    customVars = [{'variable': 'upgrader', 'expectedValue': actual}];
    await checkVariables(customVars);
  });

  it('should have correct roleAddressChanger after updateRoleAddress', async function checkRoleAddressChanger() {
    await token.updateRoleAddress(arbitraryAccount, 'roleAddressChanger', {from: roleAddressChangerAccount});
    customVars = [{'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount}];
    await checkVariables(customVars);
  });

  it('should have correct blacklister after updateRoleAddress', async function () {
    await token.updateRoleAddress(arbitraryAccount, 'blacklister', {from: roleAddressChangerAccount});
    customVars = [{'variable': 'blacklister', 'expectedValue': arbitraryAccount}];
    await checkVariables(customVars);
  })

  it('should have correct pauser after updateRoleAddress', async function () {
    await token.updateRoleAddress(arbitraryAccount, 'pauser', {from: roleAddressChangerAccount});
    customVars = [{'variable': 'pauser', 'expectedValue': arbitraryAccount}];
    await checkVariables(customVars);
  });

  it('should have correct upgrader after updateRoleAddress', async function () {
    await token.updateRoleAddress(arbitraryAccount, 'upgrader', {from: roleAddressChangerAccount});
    customVars = [{'variable': 'upgrader', 'expectedValue': arbitraryAccount}];
    await checkVariables(customVars);
  });

  it('should pause and set paused to true', async function () {
    await token.pause({from: pauserAccount});
    customVars = [{'variable': 'paused', 'expectedValue': true}];
    await checkVariables(customVars);
  });

  it('should unpause and set paused to false', async function () {
    await token.pause({from: pauserAccount});
    customVars = [{'variable': 'paused', 'expectedValue': true}];
    await checkVariables(customVars);
    await token.unpause({from: pauserAccount});
    customVars = [{'variable': 'paused', 'expectedValue': false}];
    await checkVariables(customVars);
  });

  it('should approve a spend and set allowed amount', async function () {
    await token.approve(minterAccount, 100, {from: arbitraryAccount});
    customVars = [{'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': bigHundred}];
    await checkVariables(customVars)
  });

  it('should blacklist and set blacklisted to true', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [{'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}]
    await checkVariables(customVars)
  });

  it('should blacklist and set blacklisted to true, then unblacklist and set blacklisted to false', async function () {
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [{'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true}]
    await checkVariables(customVars)

    await token.unBlacklist(arbitraryAccount, {from: blacklisterAccount});
    customVars = [{'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': false}]
    await checkVariables(customVars)
  });

  it('should burn amount of tokens and reduce balance and total supply by amount', async function () {
    amount = 100;

    // mint tokens to arbitraryAccount
    await mint(minterAccount, amount);
    customVars = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true}
    ]
    await checkVariables(customVars);
    
    await token.burn(amount, {from: minterAccount});

    customVars = [{'variable': 'isAccountMinter.minterAccount', 'expectedValue': true}]
    // (tests that totalSupply and balance are returned to defaults after burn)
    await checkVariables(customVars);
  });

  it('should configureMinter, setting the minter to true and mintingAllowance to amount', async function () {
    amount = 100;

    // configure minter
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': amount}
    ]
    await checkVariables(customVars);
  });

  it('should mint the amount, increasing balance of recipient by amount, increasing total supply by amount, and decreasing minterAllowed by amount', async function () {
    amount = 100

    // configure minter
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(customVars);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});

    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
  });

  it('should removeMinter, setting the minter to false and minterAllowed to 0', async function () {
    amount = 100

    // configure minter
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});

    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(customVars);

    // remove minter
    await token.removeMinter(minterAccount, {from: masterMinterAccount});

    // TODO: decide whether, in general, returning to defaults should be passed in explicitly or empty array
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': false},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': bigZero}
    ]
    await checkVariables(customVars);
  })

  it('should transfer, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    amount = 100

    // configure minter
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(customVars);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});

    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await checkVariables(customVars);

    await token.transfer(pauserAccount, 50, {from: arbitraryAccount})

    customVars = [
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero},
      {'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await checkVariables(customVars);
  })

  it('should transferFrom, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    amount = 100;

    // configure minter
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)}
    ]
    await checkVariables(customVars);

    await token.mint(arbitraryAccount, 50, {from: minterAccount});

    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await checkVariables(customVars);

    await token.approve(upgraderAccount, 50, {from: arbitraryAccount});

    await token.transferFrom(arbitraryAccount, pauserAccount, 50, {from: upgraderAccount})

    customVars = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero},
      {'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)}
    ]
    await checkVariables(customVars);
  })

});