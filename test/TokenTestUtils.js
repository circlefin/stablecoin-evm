const util = require('util');
var _ = require('lodash');
var name = 'Sample Fiat Token';
var symbol = 'C-USD';
var currency = 'USD';
var decimals = 2;
var BigNumber = require('bignumber.js');
var bigZero = new BigNumber(0);
var bigHundred = new BigNumber(100);
// TODO: test really big numbers

// string role names to send to updateRoleAddress()  
var masterMinterRole = 'masterMinter';
var blacklisterRole = 'blacklister';
var pauserRole = 'pauser';
var roleAddressChangerRole = 'roleAddressChanger';

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

var BigNumber = require('bignumber.js');

// set to true to enable verbose logging in the tests
var debugLogging = false;

function calculateFeeAmount(amount) {
  return Math.floor((fee / feeBase) * amount);
}

function checkTransferEventsWithFee(transfer, from, to, value, feeAmount) {
  assert.equal(transfer.logs[0].event, 'Fee');
  assert.equal(transfer.logs[0].args.from, from);
  assert.equal(transfer.logs[0].args.feeAccount, feeAccount);
  assert.equal(transfer.logs[0].args.feeAmount, feeAmount);
  assert.equal(transfer.logs[1].event, 'Transfer');
  assert.equal(transfer.logs[1].args.from, from);
  assert.equal(transfer.logs[1].args.to, to);
  assert.equal(transfer.logs[1].args.value, value);
}

function checkTransferEvents(transfer, from, to, value) {
  assert.equal(transfer.logs[0].event, 'Transfer');
  assert.equal(transfer.logs[0].args.from, from);
  assert.equal(transfer.logs[0].args.to, to);
  assert.equal(transfer.logs[0].args.value, value);
}

// For testing variance of specific variables from their default values.
// customVars is an array of objects of the form,
// {'variable': <name of variable>, 'expectedValue': <expected value after modification>}
// to reference nested variables, name variable using dot syntax, e.g. 'allowance.arbitraryAccount.minterAccount'
async function checkVariables(token, customVars) {
  // set each variable's default value
  var expectedState = {
    'name': name,
    'symbol': symbol,
    'currency': currency,
    'decimals': new BigNumber(decimals),
    'roleAddressChanger': roleAddressChangerAccount,
    'masterMinter': masterMinterAccount,
    // contractStorage is not deterministic for FiatTokenWithStorage
    //'contractStorage': storageAddress,
    'owner': owner,
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
  var i;
  for (i = 0; i < customVars.length; ++i) {
    if (_.has(expectedState, customVars[i].variable)) {
      if (expectedState[customVars[i].variable] == customVars[i].expectedValue) {
        throw new Error("variable " + customVars[i].variable + " to test has same default state as expected state");
      } else {
        _.set(expectedState, customVars[i].variable, customVars[i].expectedValue);
      }
    } else {
      // TODO: test the error 
      throw new Error("variable " + customVars[i].variable + " not found in expectedState");
    }
  }

  if (debugLogging) {
    console.log(util.inspect(expectedState, { showHidden: false, depth: null }))
  }

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


  let allowanceArbitaryUpgrader = await token.allowance(arbitraryAccount, upgraderAccount);
  allowanceArbitaryUpgrader.should.be.bignumber.equal(expectedState['allowance']['arbitraryAccount']['upgraderAccount']);

  /*
    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, upgraderAccount)).equals(expectedState['allowance']['arbitraryAccount']['upgraderAccount']));
  */

  // TODO: write assert statements for the rest of the 42 combinations of possible spenders and destination addresses. (Will slow down tests.)
}

async function setMinter(token, minter, amount) {
  let update = await token.configureMinter(minter, amount, { from: masterMinterAccount });
  assert.equal(update.logs[0].event, 'MinterConfigured');
  assert.equal(update.logs[0].args.minter, minter);
  assert.equal(update.logs[0].args.minterAllowedAmount, amount);
  let minterAllowance = await token.minterAllowance(minter);

  assert.equal(minterAllowance, amount);
}

async function mint(token, to, amount, minter) {
  await setMinter(token, minter, amount);
  await mintRaw(token, to, amount, minter);
}

async function mintRaw(token, to, amount, minter) {
  let initialTotalSupply = await token.totalSupply();
  let initialMinterAllowance = await token.minterAllowance(minter);
  let minting = await token.mint(to, amount, { from: minter });
  assert.equal(minting.logs[0].event, 'Mint');
  assert.equal(minting.logs[0].args.minter, minter);
  assert.equal(minting.logs[0].args.to, to);
  assert.equal(minting.logs[0].args.amount, amount);
  let totalSupply = await token.totalSupply();
  assert.isTrue(new BigNumber(totalSupply).minus(new BigNumber(amount)).equals(new BigNumber(initialTotalSupply)));
  let minterAllowance = await token.minterAllowance(minter);
  assert.isTrue(new BigNumber(initialMinterAllowance).minus(new BigNumber(amount)).equals(new BigNumber(minterAllowance)));
}

async function mintToReserveAccount(token, address, amount) {
  let minting = await token.mint(amount, { from: minterAccount });
  assert.equal(minting.logs[0].event, 'Mint');
  assert.equal(minting.logs[0].args.amount, amount);
  let mintTransfer = await token.transfer(address, amount, { from: reserverAccount });
  assert.equal(mintTransfer.logs[0].event, 'Transfer');
  assert.equal(mintTransfer.logs[0].args.from, reserverAccount);
  assert.equal(mintTransfer.logs[0].args.to, address);
  assert.equal(mintTransfer.logs[0].args.value, amount);
}

async function blacklist(token, account) {
  let blacklist = await token.blacklist(account, { from: blacklisterAccount });
  assert.equal(blacklist.logs[0].event, 'Blacklisted');
  assert.equal(blacklist.logs[0].args._account, account);
}

async function unBlacklist(token, account) {
  let unblacklist = await token.unBlacklist(account, { from: blacklisterAccount });
  assert.equal(unblacklist.logs[0].event, 'UnBlacklisted');
  assert.equal(unblacklist.logs[0].args._account, account);
}

async function setLongDecimalFeesTransferWithFees(token, owner, arbitraryAccount) {
  fee = 123589;
  feeBase = 1000000;
  await token.updateTransferFee(fee, feeBase);
  let allowed = await token.allowance.call(owner, arbitraryAccount);
  assert.isTrue(new BigNumber(allowed).equals(new BigNumber(0)));
  await mint(token, owner, 1900);
  let initialBalanceFeeAccount = await token.balanceOf(feeAccount);

  await token.approve(arbitraryAccount, 1500);
  allowed = await token.allowance.call(owner, arbitraryAccount);
  assert.isTrue(new BigNumber(allowed).equals(new BigNumber(1500)));

  let transfer = await token.transfer(arbitraryAccount, 1000, { from: owner });

  let feeAmount = calculateFeeAmount(1000);
  checkTransferEvents(transfer, owner, arbitraryAccount, 1000, feeAmount);


  let balance0 = await token.balanceOf(owner);
  assert.equal(balance0, 1900 - 1000 - feeAmount);
  let balance3 = await token.balanceOf(arbitraryAccount);
  assert.equal(balance3, 1000);
  let balanceFeeAccount = await token.balanceOf(feeAccount);
  assert.isTrue(new BigNumber(balanceFeeAccount).minus(new BigNumber(initialBalanceFeeAccount)).equals(new BigNumber(feeAmount)));
}

async function sampleTransfer(token, owner, arbitraryAccount, minter) {
  let allowed = await token.allowance.call(owner, arbitraryAccount);
  assert.isTrue(new BigNumber(allowed).equals(new BigNumber(0)));
  await mint(token, owner, 1900, minter);

  await token.approve(arbitraryAccount, 1500);
  allowed = await token.allowance.call(owner, arbitraryAccount);
  assert.isTrue(new BigNumber(allowed).equals(new BigNumber(1500)));

  let transfer = await token.transfer(arbitraryAccount, 1000, { from: owner });

  checkTransferEvents(transfer, owner, arbitraryAccount, 1000);

  let balance0 = await token.balanceOf(owner);
  assert.equal(balance0, 1900 - 1000);
  let balance3 = await token.balanceOf(arbitraryAccount);
  assert.equal(balance3, 1000);
}

async function transferFromWithFees(token, owner, arbitraryAccount, minter) {
  fee = 1235;
  feeBase = 10000;
  await token.updateTransferFee(fee, feeBase);
  let allowed = await token.allowance.call(owner, arbitraryAccount);
  assert.isTrue(new BigNumber(allowed).equals(new BigNumber(0)));
  await mint(token, owner, 900, minter);
  let initialBalanceFeeAccount = await token.balanceOf(feeAccount);
  await token.approve(arbitraryAccount, 634);
  allowed = await token.allowance.call(owner, arbitraryAccount);
  assert.isTrue(new BigNumber(allowed).equals(new BigNumber(634)));

  transfer = await token.transferFrom(owner, arbitraryAccount, 534, { from: arbitraryAccount });

  let feeAmount = calculateFeeAmount(534);
  checkTransferEvents(transfer, owner, arbitraryAccount, 534, feeAmount);

  let balance0 = await token.balanceOf(owner);
  assert.isTrue(new BigNumber(balance0).equals(new BigNumber(900).minus(new BigNumber(534)).minus(new BigNumber(feeAmount))));
  let balance3 = await token.balanceOf(arbitraryAccount);
  assert.isTrue(new BigNumber(balance3).equals(new BigNumber(534)));
  let balanceFeeAccount = await token.balanceOf(feeAccount);
  assert.isTrue(new BigNumber(balanceFeeAccount).minus(new BigNumber(initialBalanceFeeAccount)).equals(new BigNumber(feeAmount)));
}

async function sampleTransferFrom(token, owner, arbitraryAccount, minter) {
  let allowed = await token.allowance.call(owner, arbitraryAccount); // TODO not this
  assert.isTrue(new BigNumber(allowed).equals(new BigNumber(0)));
  await mint(token, owner, 900, minter); // TODO maybe this
  await token.approve(arbitraryAccount, 634); // TODO not this
  allowed = await token.allowance.call(owner, arbitraryAccount); // TODO not this
  assert.isTrue(new BigNumber(allowed).equals(new BigNumber(634)));

  let transfer = await token.transferFrom(owner, arbitraryAccount, 534, { from: arbitraryAccount }); // TODO not this

  checkTransferEvents(transfer, owner, arbitraryAccount, 534);

  let balance0 = await token.balanceOf(owner);
  assert.isTrue(new BigNumber(balance0).equals(new BigNumber(900).minus(new BigNumber(534))));
  let balance3 = await token.balanceOf(arbitraryAccount);
  assert.isTrue(new BigNumber(balance3).equals(new BigNumber(534)));
}

async function approve(token, to, amount, from) {
  await token.approve(to, amount, { from: from });
}

async function redeem(token, account, amount) {
  let redeemResult = await token.redeem(amount, { from: account });
  assert.equal(redeemResult.logs[0].event, 'Redeem');
  assert.equal(redeemResult.logs[0].args.redeemedAddress, account);
  assert.equal(redeemResult.logs[0].args.amount, amount);
}

async function expectRevert(contractPromise) {

  try {
    await contractPromise;
  } catch (error) {
    const revert = error.message.search('revert') >= 0;
    assert(
      revert,
      'Expected error of type revert, got \'' + error + '\' instead',
    );
    return;
  }
  assert.fail('Expected error of type revert, but no error was received');
}

module.exports = {
  name: name,
  symbol: symbol,
  currency: currency,
  decimals: decimals,
  bigZero: bigZero,
  bigHundred: bigHundred,
  debugLogging: debugLogging,
  calculateFeeAmount: calculateFeeAmount,
  checkTransferEventsWithFee: checkTransferEventsWithFee,
  checkTransferEvents: checkTransferEvents,
  checkVariables: checkVariables,
  setMinter: setMinter,
  mint: mint,
  mintRaw: mintRaw,
  mintToReserveAccount: mintToReserveAccount,
  blacklist: blacklist,
  unBlacklist: unBlacklist,
  setLongDecimalFeesTransferWithFees: setLongDecimalFeesTransferWithFees,
  sampleTransfer: sampleTransfer,
  transferFromWithFees: transferFromWithFees,
  sampleTransferFrom: sampleTransferFrom,
  approve: approve,
  redeem: redeem,
  expectRevert: expectRevert,
  masterMinterRole: masterMinterRole,
  blacklisterRole: blacklisterRole,
  pauserRole: pauserRole,
  roleAddressChangerRole: roleAddressChangerRole
};