var FiatToken = artifacts.require('FiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var BigNumber = require('bignumber.js');
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals
var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
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

var amount = 100;

//Where should this be??
const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

async function check_defaultVariableValues(token) {
  await checkVariables(token, []);
}

async function check_pause(token) {
  await token.pause({ from: pauserAccount });
  var customVars = [{ 'variable': 'paused', 'expectedValue': true }];
  await checkVariables(token, customVars);
}

async function check_unpause(token) {
  await token.pause({ from: pauserAccount });
  var customVars = [{ 'variable': 'paused', 'expectedValue': true }];
  await checkVariables(token, customVars);
  await token.unpause({ from: pauserAccount });
  await checkVariables(token, []);
}

async function check_approve(token) {
  await token.approve(minterAccount, 100, { from: arbitraryAccount });
  var customVars = [{ 'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': bigHundred }];
  await checkVariables(token, customVars);
}

async function check_blacklist(token) {
  await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
  var customVars = [{ 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }]
  await checkVariables(token, customVars);
}

async function check_unblacklist(token) {
  await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
  var customVars = [{ 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }]
  await checkVariables(token, customVars);

  await token.unBlacklist(arbitraryAccount, { from: blacklisterAccount });
  customVars = [{ 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': false }]
  await checkVariables(token, customVars);
}

async function check_burn(token) {
  // mint tokens to arbitraryAccount
  await mint(token, minterAccount, amount, minterAccount);
  var customVars = [
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true }
  ];
  await checkVariables(token, customVars);

  await token.burn(amount, { from: minterAccount });

  var customVars = [{ 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true }]
  // (tests that totalSupply and balance are returned to defaults after burn)
  await checkVariables(token, customVars);
}

async function check_configureMinter(token) {
  var amount = 100;

  // configure minter
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
  ];
  await checkVariables(token, customVars);
}

async function check_mint(token) {
  var amount = 100

  // configure minter
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
  ];
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, { from: minterAccount });

  customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
    { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
  ];

  await checkVariables(token, customVars);
}

async function check_removeMinter(token) {
  var amount = 100;

  // configure minter
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });

  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
  ];
  await checkVariables(token, customVars);

  // remove minter
  await token.removeMinter(minterAccount, { from: masterMinterAccount });

  await checkVariables(token, []);
}

async function check_transfer(token) {
  var amount = 100

  // configure minter
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
  ];
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, { from: minterAccount });

  customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
    { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
  ];
  await checkVariables(token, customVars);

  await token.transfer(pauserAccount, 50, { from: arbitraryAccount });

  customVars = [
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
    { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(50) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
  ];
  await checkVariables(token, customVars);
}

async function check_transferFrom(token) {
  var amount = 100;

  // configure minter
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) }
  ];
  await checkVariables(token, customVars);

  await token.mint(arbitraryAccount, 50, { from: minterAccount });

  customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
    { 'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
  ];
  await checkVariables(token, customVars);

  await token.approve(upgraderAccount, 50, { from: arbitraryAccount });

  await token.transferFrom(arbitraryAccount, pauserAccount, 50, { from: upgraderAccount });

  customVars = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50) },
    { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
    { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(50) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(50) }
  ];
  await checkVariables(token, customVars);
}

async function check_configureMinter(token) {
  // make sure not a minter and set up pre-conditions
  let amount = 11;

  // now make into a minter
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var isAMinter = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(0) }
  ];
  // verify it worked
  await checkVariables(token, isAMinter);
}

async function check_configureMinter_masterMinterBlacklisted(token) {
  // set up pre-conditions
  let amount = 11;
  await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
  var setup = [
    { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
  ];
  await checkVariables(token, setup);

  // now configure minter
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var result = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
  ];
  // verify it worked
  await checkVariables(token, result);
}

async function check_configureMinter_minterBlacklisted(token) {
  // set up pre-conditions
  let amount = 11;
  await token.blacklist(minterAccount, { from: blacklisterAccount });
  var setup = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
  ];
  await checkVariables(token, setup);

  // now configure minter
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  var result = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
  ];
  // verify it worked
  await checkVariables(token, result);
}

async function check_removeMinter_doesNotAffectTotalSupplyOrBalances(token) {
  // set up pre-conditions
  let amount = 11;
  let totalSupply = 10;
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  await token.mint(minterAccount, totalSupply, { from: minterAccount })
  var isAMinter = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - totalSupply) },
    { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(totalSupply) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(totalSupply) }
  ];
  await checkVariables(token, isAMinter);

  // now remove minter
  await token.removeMinter(minterAccount, { from: masterMinterAccount });
  var notAMinter = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(totalSupply) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(totalSupply) }
  ];
  // verify it worked
  await checkVariables(token, notAMinter);
}

async function check_removeMinter_whilePaused(token) {
  // set up pre-conditions
  let amount = 6;
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  await token.pause({ from: pauserAccount })
  var isAMinter = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'paused', 'expectedValue': true }
  ];
  await checkVariables(token, isAMinter);

  // now remove minter
  await token.removeMinter(minterAccount, { from: masterMinterAccount });
  var notAMinter = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    { 'variable': 'paused', 'expectedValue': true }
  ];
  // verify it worked
  await checkVariables(token, notAMinter);
}

async function check_removeMinter_masterMinterBlacklisted(token) {
  // set up pre-conditions
  let amount = 11;
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
  var setup = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
  ];
  await checkVariables(token, setup);

  // now remove minter
  await token.removeMinter(minterAccount, { from: masterMinterAccount });
  var afterMinterRemoval = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    { 'variable': 'isAccountBlacklisted.masterMinterAccount', 'expectedValue': true },
  ];
  // verify it worked
  await checkVariables(token, afterMinterRemoval);
}

async function check_removeMinter_minterBlacklisted(token) {
  // set up pre-conditions
  let amount = 11;
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  await token.blacklist(minterAccount, { from: blacklisterAccount });
  var setup = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
  ];
  await checkVariables(token, setup);

  // now remove minter
  await token.removeMinter(minterAccount, { from: masterMinterAccount });
  var notAMinter = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    { 'variable': 'isAccountBlacklisted.minterAccount', 'expectedValue': true },
  ];
  // verify it worked
  await checkVariables(token, notAMinter);
}

async function check_burn_some(token) {
  // set up pre-conditions
  var amount = 11;
  var burnAmount = 10;
  await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
  await token.mint(minterAccount, amount, { from: minterAccount });
  var setup = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(amount) },
  ];
  await checkVariables(token, setup);

  // now burn the tokens
  await token.burn(burnAmount, { from: minterAccount });

  var afterBurn = [
    { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
    { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount - burnAmount) },
    { 'variable': 'totalSupply', 'expectedValue': new BigNumber(amount - burnAmount) },
  ];

  // state should be unchanged
  await checkVariables(token, afterBurn);
}

async function check_updateRoleAddress_masterMinter(token) {
  await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: roleAddressChangerAccount });
  var result = [
    { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount }
  ];
  // verify it worked
  await checkVariables(token, result);
}


async function check_updateRoleAddress_blacklister(token) {
  // change masterMinter role address
  await token.updateRoleAddress(arbitraryAccount, blacklisterRole, { from: roleAddressChangerAccount });
  var result = [
    { 'variable': 'blacklister', 'expectedValue': arbitraryAccount }
  ];
  // verify it worked
  await checkVariables(token, result);
}

async function check_updateRoleAddress_pauser(token) {
  // change masterMinter role address
  await token.updateRoleAddress(arbitraryAccount, pauserRole, { from: roleAddressChangerAccount });
  var result = [
    { 'variable': 'pauser', 'expectedValue': arbitraryAccount }
  ];
  // verify it worked
  await checkVariables(token, result);
}

async function check_updateRoleAddress_roleAddressChanger(token) {
  // change masterMinter role address
  await token.updateRoleAddress(arbitraryAccount, roleAddressChangerRole, { from: roleAddressChangerAccount });
  var result = [
    { 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount }
  ];
  // verify it worked
  await checkVariables(token, result);
}

async function check_updateRoleAddress_whilePaused(token) {
  // initial
  await token.pause({ from: pauserAccount });
  var setup = [
    { 'variable': 'paused', 'expectedValue': true }
  ];
  await checkVariables(token, setup);

  // change masterMinter role address
  await token.updateRoleAddress(arbitraryAccount, roleAddressChangerRole, { from: roleAddressChangerAccount });
  var result = [
    { 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount },
    { 'variable': 'paused', 'expectedValue': true }
  ];
  // verify it worked
  await checkVariables(token, result);
}

async function check_updateRoleAddress_newRoleAddressChangerCanUpdate(token) {
  // switch roleAddressChanger
  await token.updateRoleAddress(arbitraryAccount, roleAddressChangerRole, { from: roleAddressChangerAccount });
  var setup = [
    { 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount }
  ];

  await checkVariables(token, setup);

  // arbitraryAccount will try to make himself masterMinter
  await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: arbitraryAccount });
  var result = [
    { 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount },
    { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount }
  ];
  // verify it worked
  await checkVariables(token, result);
}

async function check_updateRoleAddress_fakeRole(token) {
  // Try to send fake role. Should not throw.
  await token.updateRoleAddress(arbitraryAccount, 'fakeRoleName', { from: roleAddressChangerAccount });

  // verify nothing changed
  await checkVariables(token, []);
}

async function check_updateRoleAddress_userIsZeroAccount(token) {
  let bigZero = 0x0000000000000000000000000000000000000000; // TODO rename variable
  let smallZero = 0x00;

  // Set masterMinter and pauser to zero-addresss
  await token.updateRoleAddress(bigZero, masterMinterRole, { from: roleAddressChangerAccount });
  await token.updateRoleAddress(smallZero, pauserRole, { from: roleAddressChangerAccount });

  // Note: bigZero and smallZero both resolve to 0x0000000000000000000000000000000000000000
  var result = [
    { 'variable': 'masterMinter', 'expectedValue': "0x0000000000000000000000000000000000000000" },
    { 'variable': 'pauser', 'expectedValue': "0x0000000000000000000000000000000000000000" }
  ];

  await checkVariables(token, result);
}

async function check_updateRoleAddress_userIsRoleAddressChanger(token) {
  // Set roleAddressChanger to self
  await token.updateRoleAddress(roleAddressChangerAccount, roleAddressChangerRole, { from: roleAddressChangerAccount });

  // verify no changes
  await checkVariables(token, []);
}

async function check_updateRoleAddress_userIsBlacklisted(token) {
  await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
  var setup = [
    { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
  ];
  await checkVariables(token, setup);

  // updated masterMinter to blacklisted account
  await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: roleAddressChangerAccount });

  // verify
  var result = [
    { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
    { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
  ];
  await checkVariables(token, result);
}

async function check_updateRoleAddress_roleAddressChangerIsBlacklisted(token) {
  await token.blacklist(roleAddressChangerAccount, { from: blacklisterAccount });
  var setup = [
    { 'variable': 'isAccountBlacklisted.roleAddressChangerAccount', 'expectedValue': true }
  ];
  await checkVariables(token, setup);

  // updated masterMinter to blacklisted account
  await token.updateRoleAddress(arbitraryAccount, masterMinterRole, { from: roleAddressChangerAccount });

  // verify
  var result = [
    { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
    { 'variable': 'isAccountBlacklisted.roleAddressChangerAccount', 'expectedValue': true }
  ];
  await checkVariables(token, result);
}

async function check_updateRoleAddress_afterUpgrade(token) {
  // create new token with same DataConract but arbitraryAddress in all the roles
  let dataContractAddress = await token.getDataContractAddress();
  let storage = EternalStorage.at(dataContractAddress);
  assert.equal(await storage.owner.call(), token.address);
  let newToken = await UpgradedFiatToken.new(
    dataContractAddress,
    token.address,
    name,
    symbol,
    currency,
    decimals,
    arbitraryAccount,
    arbitraryAccount,
    arbitraryAccount,
    arbitraryAccount,
    arbitraryAccount);
  var newTokenSetup = [
    { 'variable': 'roleAddressChanger', 'expectedValue': arbitraryAccount },
    { 'variable': 'pauser', 'expectedValue': arbitraryAccount },
    { 'variable': 'upgrader', 'expectedValue': arbitraryAccount },
    { 'variable': 'blacklister', 'expectedValue': arbitraryAccount },
    { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount }
  ]
  await checkVariables(newToken, newTokenSetup);

  await(token.upgrade(newToken.address, {from: upgraderAccount}));
  assert.equal(await storage.owner.call(), newToken.address);

  await checkVariables(token, []);

  // updateRoleAddress
  await token.updateRoleAddress(arbitraryAccount2, masterMinterRole, { from: roleAddressChangerAccount });

  // verify
  var result = [
    { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount2 }
  ];

  // check only old token has changed
  await checkVariables(token, result);
  await checkVariables(newToken, newTokenSetup);
}

async function check_noPayableFunction(token) {
  var success = false;
  try {
    await web3.eth.sendTransaction({ from: arbitraryAccount, to: token.address, value: 1 });
  } catch (e) {
    success = true;
  }
  assert.equal(true, success);
}

async function check_updateUpgraderAddress(token) {
  await token.updateUpgraderAddress(arbitraryAccount, { from: upgraderAccount });
  var result = [{ 'variable': 'upgrader', 'expectedValue': arbitraryAccount }];
  await checkVariables(token, result);
}

module.exports = {
  check_defaultVariableValues: check_defaultVariableValues,
  check_pause: check_pause,
  check_unpause: check_unpause,
  check_approve: check_approve,
  check_blacklist: check_blacklist,
  check_unblacklist: check_unblacklist,
  check_burn: check_burn,
  check_configureMinter: check_configureMinter,
  check_mint: check_mint,
  check_removeMinter: check_removeMinter,
  check_transfer: check_transfer,
  check_transferFrom: check_transferFrom,
  check_configureMinter: check_configureMinter,
  check_configureMinter_masterMinterBlacklisted: check_configureMinter_masterMinterBlacklisted,
  check_configureMinter_minterBlacklisted: check_configureMinter_minterBlacklisted,
  check_removeMinter_doesNotAffectTotalSupplyOrBalances: check_removeMinter_doesNotAffectTotalSupplyOrBalances,
  check_removeMinter_whilePaused: check_removeMinter_whilePaused,
  check_removeMinter_masterMinterBlacklisted: check_removeMinter_masterMinterBlacklisted,
  check_removeMinter_minterBlacklisted: check_removeMinter_minterBlacklisted,
  check_burn_some: check_burn_some,
  check_updateRoleAddress_masterMinter: check_updateRoleAddress_masterMinter,
  check_updateRoleAddress_blacklister: check_updateRoleAddress_blacklister,
  check_updateRoleAddress_pauser: check_updateRoleAddress_pauser,
  check_updateRoleAddress_roleAddressChanger: check_updateRoleAddress_roleAddressChanger,
  check_updateRoleAddress_whilePaused: check_updateRoleAddress_whilePaused,
  check_updateRoleAddress_newRoleAddressChangerCanUpdate: check_updateRoleAddress_newRoleAddressChangerCanUpdate,
  check_updateRoleAddress_fakeRole: check_updateRoleAddress_fakeRole,
  check_updateRoleAddress_userIsZeroAccount: check_updateRoleAddress_userIsZeroAccount,
  check_updateRoleAddress_userIsRoleAddressChanger: check_updateRoleAddress_userIsRoleAddressChanger,
  check_updateRoleAddress_userIsBlacklisted: check_updateRoleAddress_userIsBlacklisted,
  check_updateRoleAddress_roleAddressChangerIsBlacklisted: check_updateRoleAddress_roleAddressChangerIsBlacklisted,
  check_updateRoleAddress_afterUpgrade: check_updateRoleAddress_afterUpgrade,
  check_noPayableFunction: check_noPayableFunction,
  check_updateUpgraderAddress: check_updateUpgraderAddress,
};
