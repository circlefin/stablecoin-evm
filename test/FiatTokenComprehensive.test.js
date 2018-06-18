var FiatToken = artifacts.require('FiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var helpers = require('./ComprehensiveTestHelpers');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var BigNumber = require('bignumber.js');

var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals
var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
<<<<<<< HEAD
var masterMinterRole = tokenUtils.masterMinterRole;
var blacklisterRole = tokenUtils.blacklisterRole;
var pauserRole = tokenUtils.pauserRole;
var roleAddressChangerRole = tokenUtils.roleAddressChangerRole;
=======
var expectRevert = tokenUtils.expectRevert;
>>>>>>> 36f10f5e0e9ce674e5abf8ab2a7b0decdbe307b4
var checkVariables = tokenUtils.checkVariables;
var checkFailureIsExpected = tokenUtils.checkFailureIsExpected;
var ownerAccount = tokenUtils.ownerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var upgraderAccount = tokenUtils.upgraderAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;

var check_defaultVariableValues = helpers.check_defaultVariableValues;
var check_pause = helpers.check_pause;
var check_unpause = helpers.check_unpause;
var check_approve = helpers.check_approve;
var check_blacklist = helpers.check_blacklist;
var check_unblacklist = helpers.check_unblacklist;
var check_burn = helpers.check_burn;
var check_configureMinter = helpers.check_configureMinter;
var check_mint = helpers.check_mint;
var check_removeMinter = helpers.check_removeMinter;
var check_transfer = helpers.check_transfer;
var check_transferFrom = helpers.check_transferFrom;
var check_configureMinter = helpers.check_configureMinter;
var check_configureMinter_masterMinterBlacklisted = helpers.check_configureMinter_masterMinterBlacklisted;
var check_configureMinter_minterBlacklisted = helpers.check_configureMinter_minterBlacklisted;
var check_removeMinter_doesNotAffectTotalSupplyOrBalances = helpers.check_removeMinter_doesNotAffectTotalSupplyOrBalances;
var check_removeMinter_whilePaused = helpers.check_removeMinter_whilePaused;
var check_removeMinter_masterMinterBlacklisted = helpers.check_removeMinter_masterMinterBlacklisted;
var check_removeMinter_minterBlacklisted = helpers.check_removeMinter_minterBlacklisted;
var check_burn_some = helpers.check_burn_some;
var check_updateRoleAddress_masterMinter = helpers.check_updateRoleAddress_masterMinter;
var check_updateRoleAddress_blacklister = helpers.check_updateRoleAddress_blacklister;
var check_updateRoleAddress_pauser = helpers.check_updateRoleAddress_pauser;
var check_updateRoleAddress_roleAddressChanger = helpers.check_updateRoleAddress_roleAddressChanger;
var check_updateRoleAddress_whilePaused = helpers.check_updateRoleAddress_whilePaused;
var check_updateRoleAddress_newRoleAddressChangerCanUpdate = helpers.check_updateRoleAddress_newRoleAddressChangerCanUpdate;
var check_updateRoleAddress_fakeRole = helpers.check_updateRoleAddress_fakeRole;
var check_updateRoleAddress_userIsZeroAccount = helpers.check_updateRoleAddress_userIsZeroAccount;
var check_updateRoleAddress_userIsRoleAddressChanger = helpers.check_updateRoleAddress_userIsRoleAddressChanger;
var check_updateRoleAddress_userIsBlacklisted = helpers.check_updateRoleAddress_userIsBlacklisted;
var check_updateRoleAddress_roleAddressChangerIsBlacklisted = helpers.check_updateRoleAddress_roleAddressChangerIsBlacklisted;
var check_updateRoleAddress_afterUpgrade = helpers.check_updateRoleAddress_afterUpgrade;
var check_noPayableFunction = helpers.check_noPayableFunction;
var check_updateUpgraderAddress = helpers.check_updateUpgraderAddress;


contract('FiatToken', function (accounts) {
  beforeEach(async function checkBefore() {
<<<<<<< HEAD
    token = await FiatToken.new(
      "0x0",
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      roleAddressChangerAccount);
=======
    token = await FiatToken.new("0x0", name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, tokenOwnerAccount);

    let tokenAddress = token.address;
>>>>>>> 36f10f5e0e9ce674e5abf8ab2a7b0decdbe307b4

    let dataContractAddress = await token.getDataContractAddress();
    let storage = EternalStorage.at(dataContractAddress);

    // add in javascript field for storageAddress + owner to token

    assert.equal(await storage.owner.call(), token.address);
  });


  it('should check that default variable values are correct', async function () {
    await check_defaultVariableValues(token);
  });

  it('should pause and set paused to true', async function () {
    await check_pause(token);
  });

  it('should unpause and set paused to false', async function () {
    await check_unpause(token);
  });

  it('should approve a spend and set allowed amount', async function () {
    await check_approve(token);
  });

  it('should blacklist and set blacklisted to true', async function () {
    await check_blacklist(token);
  });

  it('should blacklist and set blacklisted to true, then unblacklist and set blacklisted to false', async function () {
    await check_unblacklist(token);
  });

  it('should burn amount of tokens and reduce balance and total supply by amount', async function () {
    await check_burn(token);
  });

  it('should configureMinter, setting the minter to true and mintingAllowance to amount', async function () {
    await check_configureMinter(token);
  });

  it('should mint the amount, increasing balance of recipient by amount, increasing total supply by amount, and decreasing minterAllowed by amount', async function () {
    await check_mint(token);
  });

  it('should removeMinter, setting the minter to false and minterAllowed to 0', async function () {
    await check_removeMinter(token);
  });

  it('should transfer, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    await check_transfer(token);
  });

  it('should transferFrom, reducing sender balance by amount and increasing recipient balance by amount', async function () {
    await check_transferFrom(token);
  });

  it('configureMinter', async function () {
    await check_configureMinter(token);
  });

  it('configureMinter when masterMinter is blacklisted', async function () {
    await check_configureMinter_masterMinterBlacklisted(token);
  });

  it('configureMinter when minter is blacklisted', async function () {
    await check_configureMinter_minterBlacklisted(token);
  });

  //**REPEAT of "should removeMinter, setting the minter to false and minterAllowed to 0"**
  it('removeMinter', async function () {
    // set up pre-conditions
    let amount = 11;
    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    var isAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount) },
    ];
    await checkVariables(token, isAMinter);

    // now remove minter
    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    var notAMinter = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': false },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
    ];
    // verify it worked
    await checkVariables(token, notAMinter);
  });


  it('removeMinter does not affect totalSupply or balances', async function () {
    await check_removeMinter_doesNotAffectTotalSupplyOrBalances(token);
  });

  it('removeMinter whilePaused', async function () {
    await check_removeMinter_whilePaused(token);
  });

  it('removeMinter when masterMinter is blacklisted', async function () {
    await check_removeMinter_masterMinterBlacklisted(token);
  });

  it('removeMinter when minter is blacklisted', async function () {
    await check_removeMinter_minterBlacklisted(token);
  });

  //**REPEAT of "should burn amount of tokens and reduce balance and total supply by amount"**
  it('burn', async function () {
    // set up pre-conditions
    var amount = 11;
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
    await token.burn(amount, { from: minterAccount });

    var afterBurn = [
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(0) },
      { 'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(0) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(0) },
    ];
    // state should be unchanged
    await checkVariables(token, afterBurn);
  });

  it('burn some', async function () {
    await check_burn_some(token);
  });

<<<<<<< HEAD
  it('updateRoleAddress masterMinter', async function () {
    await check_updateRoleAddress_masterMinter(token);
  });

  it('updateRoleAddress blacklister', async function () {
    await check_updateRoleAddress_blacklister(token);
  });

  it('updateRoleAddress pauser', async function () {
    await check_updateRoleAddress_pauser(token);
  });

  it('updateRoleAddress roleAddressChanger', async function () {
    await check_updateRoleAddress_roleAddressChanger(token);
  });

  it('updateRoleAddress while paused', async function () {
    await check_updateRoleAddress_whilePaused(token);
  });

  it('updateRoleAddress new roleAddressChanger can update', async function () {
    await check_updateRoleAddress_newRoleAddressChangerCanUpdate(token);
  });

  it('updateRoleAddress fake role', async function () {
    await check_updateRoleAddress_fakeRole(token);
  });

  it('updateRoleAddress user is 0x00', async function () {
    await check_updateRoleAddress_userIsZeroAccount(token);
  });

  it('updateRoleAddress user is roleAddressChanger', async function () {
    await check_updateRoleAddress_userIsRoleAddressChanger(token);
  });

  it('updateRoleAddress user is blacklisted', async function () {
    await check_updateRoleAddress_userIsBlacklisted(token);
  });

  it('updateRoleAddress roleAddressChanger is blacklisted', async function () {
    await check_updateRoleAddress_roleAddressChangerIsBlacklisted(token);
  });

  //**REPEAT of "updateRoleAddress while paused"**
  it('updateRoleAddress while paused', async function () {
=======
  it('update masterMinter', async function () {
    // change masterMinter role address
    await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount }
    ];
    // verify it worked
    await checkVariables(token, result);
  });

  it('update blacklister', async function () {
    // change masterMinter role address
    await token.updateBlacklister(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'blacklister', 'expectedValue': arbitraryAccount }
    ];
    // verify it worked
    await checkVariables(token, result);
  });

  it('update pauser', async function () {

    // change masterMinter role address
    await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'pauser', 'expectedValue': arbitraryAccount }
    ];
    // verify it worked
    await checkVariables(token, result);
  });

  it('update tokenOwner', async function () {

    // change masterMinter role address
    await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount }
    ];
    // verify it worked
    await checkVariables(token, result);
  });

  // while paused
  it('update owner while paused', async function () {
    // initial
    await token.pause({ from: pauserAccount });
    var setup = [
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables(token, setup);

    // change masterMinter role address
    await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
    var result = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ];
    // verify it worked
    await checkVariables(token, result);
  });

  it('update owner old tokenOwner disabled', async function () {
    // initial
    await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount }
    ];
    await checkVariables(token, setup);

    // try change tokenOwner role address
    await expectRevert(token.transferOwnership(masterMinterAccount, { from: tokenOwnerAccount }))

    // verify it no changes
    await checkVariables(token, setup);
  });

  it('update owner new tokenOwner can update', async function () {
    // switch tokenOwner
    await token.transferOwnership(arbitraryAccount, { from: tokenOwnerAccount });
    var setup = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount }
    ];

    await checkVariables(token, setup);

    // arbitraryAccount will try to make himself masterMinter
    await token.updateMasterMinter(arbitraryAccount, { from: arbitraryAccount });
    var result = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount },
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount }
    ];
    // verify it worked
    await checkVariables(token, result);
  });

  it('update master minter and pauser to 0x00', async function () {
    let bigZero = 0x0000000000000000000000000000000000000000; // TODO rename variable
    let smallZero = 0x00;

    // Set masterMinter and pauser to zero-addresss
    await token.updateMasterMinter(bigZero, { from: tokenOwnerAccount });
    await token.updatePauser(smallZero, { from: tokenOwnerAccount });

    // Note: bigZero and smallZero both resolve to 0x0000000000000000000000000000000000000000
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': "0x0000000000000000000000000000000000000000" },
      { 'variable': 'pauser', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    await checkVariables(token, result);
  });

  it('update owner user is tokenOwner', async function () {
    // Set tokenOwner to self
    await token.transferOwnership(tokenOwnerAccount, { from: tokenOwnerAccount });

    // verify no changes
    await checkVariables(token, []);
  });

  it('update master minter user is blacklisted', async function () {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);

    // updated masterMinter to blacklisted account
    await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });

    // verify
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables(token, result);
  });

  it('update master minter tokenOwner is blacklisted', async function () {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    var setup = [
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables(token, setup);

    // updated masterMinter to blacklisted account
    await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });

    // verify
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'isAccountBlacklisted.tokenOwnerAccount', 'expectedValue': true }
    ];
    await checkVariables(token, result);
  });

  // bad sender
  it('update master minter msg.sender is not tokenOwner', async function () {

    // try to update masterMinter
    await expectRevert(token.updateMasterMinter(arbitraryAccount, { from: arbitraryAccount }));

    // ensure nothing changed
    await checkVariables(token, []);
  });

    // bad sender
    it('update pauser msg.sender is not tokenOwner', async function () {

        // try to update masterMinter
        await expectRevert(token.updatePauser(arbitraryAccount, { from: arbitraryAccount }));
    });

    // bad sender
    it('update blacklister msg.sender is not tokenOwner', async function () {

        // try to update masterMinter
        await expectRevert(token.updateBlacklister(arbitraryAccount, { from: arbitraryAccount }));
    });

    // bad sender
    it('update owner msg.sender is not tokenOwner', async function () {

        // try to update masterMinter
        await expectRevert(token.transferOwnership(arbitraryAccount, { from: arbitraryAccount }));
    });

    // while paused
  it('update master minter while paused', async function () {
>>>>>>> 36f10f5e0e9ce674e5abf8ab2a7b0decdbe307b4
    await token.pause({ from: pauserAccount });
    var setup = [
      { 'variable': 'paused', 'expectedValue': true }
    ];
    await checkVariables(token, setup);

    // updated masterMinter to blacklisted account
    await token.updateMasterMinter(arbitraryAccount, { from: tokenOwnerAccount });

    // verify
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount },
      { 'variable': 'paused', 'expectedValue': true }
    ]
    await checkVariables(token, result);
  });

<<<<<<< HEAD
  it('updateRoleAddress after upgrade', async function () {
    await check_updateRoleAddress_afterUpgrade(token);
=======
  // while upgraded
  it('update master minter after upgrade', async function () {
    // create new token with same DataConract but arbitraryAddress in all the roles
    let dataContractAddress = await token.getDataContractAddress();
    let newToken = await FiatToken.new(dataContractAddress,
      name, symbol, currency, decimals, arbitraryAccount, arbitraryAccount, arbitraryAccount,
      arbitraryAccount, arbitraryAccount);
    var newTokenSetup = [
      { 'variable': 'tokenOwner', 'expectedValue': arbitraryAccount },
      { 'variable': 'pauser', 'expectedValue': arbitraryAccount },
      { 'variable': 'upgrader', 'expectedValue': arbitraryAccount },
      { 'variable': 'blacklister', 'expectedValue': arbitraryAccount },
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount }
    ]
    await checkVariables(newToken, newTokenSetup);

    //upgrade the token contract
    await token.upgrade(newToken.address, { from: upgraderAccount });

    await checkVariables(token, []);

    // updateRoleAddress
    await token.updateMasterMinter(arbitraryAccount2, { from: tokenOwnerAccount });

    // verify
    var result = [
      { 'variable': 'masterMinter', 'expectedValue': arbitraryAccount2 }
    ];

    // check only old token has changed
    await checkVariables(token, result);
    await checkVariables(newToken, newTokenSetup);
>>>>>>> 36f10f5e0e9ce674e5abf8ab2a7b0decdbe307b4
  });

  it('no payable function', async function () {
    await check_noPayableFunction(token);
  });

  it('updateUpgraderAddress', async function () {
<<<<<<< HEAD
    await check_updateUpgraderAddress(token);
=======
    await token.updateUpgraderAddress(arbitraryAccount, { from: upgraderAccount });
    var result = [{ 'variable': 'upgrader', 'expectedValue': arbitraryAccount }];
    await checkVariables(token, result);
  });

  it('updateUpgraderAddress should fail with bad sender', async function () {
    await expectRevert(token.updateUpgraderAddress(arbitraryAccount, { from: tokenOwnerAccount }));
    await checkVariables(token, []);
  });

  it('updateUpgraderAddress should fail with bad new Value', async function () {
    await expectRevert(token.updateUpgraderAddress(0x00, { from: tokenOwnerAccount }));
    await checkVariables(token, []);
  });

  it('updateUpgraderAddress should fail with old upgrader', async function () {
    await token.updateUpgraderAddress(arbitraryAccount, { from: upgraderAccount });
    await expectRevert(token.updateUpgraderAddress(upgraderAccount, { from: upgraderAccount }));
    var result = [
      { 'variable': 'upgrader', 'expectedValue': arbitraryAccount }
    ];
    await checkVariables(token, result);
>>>>>>> 36f10f5e0e9ce674e5abf8ab2a7b0decdbe307b4
  });

});
