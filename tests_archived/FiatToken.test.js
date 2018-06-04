// these tests are for reference. Do not run. Use npm test

var FiatToken = artifacts.require('FiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var name = 'Sample Fiat Token';
var symbol = 'C-USD';
var currency = 'USD';
var decimals = 2;
var BigNumber = require('bignumber.js');

contract('FiatToken', function (accounts) {
  let token;
  let feeAccount = accounts[8];
  let masterMinterAccount = accounts[9];
  let minterAccount = accounts[7];
  let pauserAccount = accounts[6];
  let blacklisterAccount = accounts[4];
  let roleAddressChangerAccount = accounts[3];
  let upgraderAccount = accounts[2];

  calculateFeeAmount = function(amount) {
    return Math.floor((fee / feeBase) * amount);
  }

  checkTransferEventsWithFee = function(transfer, from, to, value, feeAmount) {
    assert.equal(transfer.logs[0].event, 'Fee');
    assert.equal(transfer.logs[0].args.from, from);
    assert.equal(transfer.logs[0].args.feeAccount, feeAccount);
    assert.equal(transfer.logs[0].args.feeAmount, feeAmount);
    assert.equal(transfer.logs[1].event, 'Transfer');
    assert.equal(transfer.logs[1].args.from, from);
    assert.equal(transfer.logs[1].args.to, to);
    assert.equal(transfer.logs[1].args.value, value);
  }

  checkTransferEvents = function(transfer, from, to, value) {
    assert.equal(transfer.logs[0].event, 'Transfer');
    assert.equal(transfer.logs[0].args.from, from);
    assert.equal(transfer.logs[0].args.to, to);
    assert.equal(transfer.logs[0].args.value, value);
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
    assert.isTrue(new BigNumber(totalSupply).minus(new BigNumber(amount)).isEqualTo(new BigNumber(initialTotalSupply)));
    let minterAllowance = await token.minterAllowance(minter);
    assert.isTrue(new BigNumber(initialMinterAllowance).minus(new BigNumber(amount)).isEqualTo(new BigNumber(minterAllowance)));
  }

  mintToReserveAccount = async function(address, amount) {
    let minting = await token.mint(amount, {from: minterAccount});
    assert.equal(minting.logs[0].event, 'Mint');
    assert.equal(minting.logs[0].args.amount, amount);
    let mintTransfer = await token.transfer(address, amount, {from: reserverAccount});
    assert.equal(mintTransfer.logs[0].event, 'Transfer');
    assert.equal(mintTransfer.logs[0].args.from, reserverAccount);
    assert.equal(mintTransfer.logs[0].args.to, address);
    assert.equal(mintTransfer.logs[0].args.value, amount);
  }

  blacklist = async function(account) {
    let blacklist = await token.blacklist(account, {from: blacklisterAccount});
    assert.equal(blacklist.logs[0].event, 'Blacklisted');
    assert.equal(blacklist.logs[0].args._account, account);
  }

  unBlacklist = async function(account) {
    let unblacklist = await token.unBlacklist(account, {from: blacklisterAccount});
    assert.equal(unblacklist.logs[0].event, 'UnBlacklisted');
    assert.equal(unblacklist.logs[0].args._account, account);
  }

  setLongDecimalFeesTransferWithFees = async function() {
    fee = 123589;
    feeBase = 1000000;
    await token.updateTransferFee(fee, feeBase);
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(accounts[0], 1900);
    let initialBalanceFeeAccount = await token.balanceOf(feeAccount);

    await token.approve(accounts[3], 1500);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(1500)));

    let transfer = await token.transfer(accounts[3], 1000, {from: accounts[0]});

    let feeAmount = calculateFeeAmount(1000);
    checkTransferEvents(transfer, accounts[0], accounts[3], 1000, feeAmount);


    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 1900 - 1000 - feeAmount);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, 1000);
    let balanceFeeAccount = await token.balanceOf(feeAccount);
    assert.isTrue(new BigNumber(balanceFeeAccount).minus(new BigNumber(initialBalanceFeeAccount)).isEqualTo(new BigNumber(feeAmount)));
  }

  sampleTransfer = async function() {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(accounts[0], 1900);

    await token.approve(accounts[3], 1500);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(1500)));

    let transfer = await token.transfer(accounts[3], 1000, {from: accounts[0]});

    checkTransferEvents(transfer, accounts[0], accounts[3], 1000);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 1900 - 1000);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, 1000);
  }

  transferFromWithFees = async function() {
    fee = 1235;
    feeBase = 10000;
    await token.updateTransferFee(fee, feeBase);
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(accounts[0], 900);
    let initialBalanceFeeAccount = await token.balanceOf(feeAccount);
    await token.approve(accounts[3], 634);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(634)));

    transfer = await token.transferFrom(accounts[0], accounts[3], 534, {from: accounts[3]});

    let feeAmount = calculateFeeAmount(534);
    checkTransferEvents(transfer, accounts[0], accounts[3], 534, feeAmount);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(new BigNumber(balance0).isEqualTo(new BigNumber(900).minus(new BigNumber(534)).minus(new BigNumber(feeAmount))));
    let balance3 = await token.balanceOf(accounts[3]);
    assert.isTrue(new BigNumber(balance3).isEqualTo(new BigNumber(534)));
    let balanceFeeAccount = await token.balanceOf(feeAccount);
    assert.isTrue(new BigNumber(balanceFeeAccount).minus(new BigNumber(initialBalanceFeeAccount)).isEqualTo(new BigNumber(feeAmount)));
  }

  sampleTransferFrom = async function() {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(accounts[0], 900);
    await token.approve(accounts[3], 634);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(634)));

    transfer = await token.transferFrom(accounts[0], accounts[3], 534, {from: accounts[3]});

    checkTransferEvents(transfer, accounts[0], accounts[3], 534);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(new BigNumber(balance0).isEqualTo(new BigNumber(900).minus(new BigNumber(534))));
    let balance3 = await token.balanceOf(accounts[3]);
    assert.isTrue(new BigNumber(balance3).isEqualTo(new BigNumber(534)));
  }

  approve = async function(to, amount, from) {
    await token.approve(to, amount, {from: from});
  }

  redeem = async function(account, amount) {
    let redeemResult = await token.redeem(amount, {from: account});
    assert.equal(redeemResult.logs[0].event, 'Redeem');
    assert.equal(redeemResult.logs[0].args.redeemedAddress, account);
    assert.equal(redeemResult.logs[0].args.amount, amount);
  }

  checkFailureIsExpected = function(error) {
    const revertFound = error.message.search('revert') >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }

  beforeEach(async function () {
    token = await FiatToken.new("0x0", name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, roleAddressChangerAccount);
    let tokenAddress = token.address;
  });

  it('should start with a totalSupply of 0', async function () {
    let totalSupply = await token.totalSupply();
    assert.isTrue(new BigNumber(totalSupply).isEqualTo(new BigNumber(0)));
  });

  it('should add multiple mints to a given address in address balance', async function () {
    await mint(accounts[0], 100);
    await mint(accounts[0], 200);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 300);
  });

  it('should fail to mint to a null address', async function () {
    let initialTotalSupply = await token.totalSupply();
    try {
      await mint("0x0", 100);
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let totalSupply = await token.totalSupply();
      assert.isTrue(new BigNumber(totalSupply).isEqualTo(new BigNumber(initialTotalSupply)));
    }

    try {
      await mint(0x0, 100);
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let totalSupply = await token.totalSupply();
      assert.isTrue(new BigNumber(totalSupply).isEqualTo(new BigNumber(initialTotalSupply)));
    }

    try {
      await mint("0x0000000000000000000000000000000000000000", 100);
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let totalSupply = await token.totalSupply();
      assert.isTrue(new BigNumber(totalSupply).isEqualTo(new BigNumber(initialTotalSupply)));
    }

    try {
      await mint(0x0000000000000000000000000000000000000000, 100);
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let totalSupply = await token.totalSupply();
      assert.isTrue(new BigNumber(totalSupply).isEqualTo(new BigNumber(initialTotalSupply)));
    }
  });


  it('should add multiple mints to a given address in address balance', async function () {
    await mint(accounts[0], 100);
    await mint(accounts[0], 200);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(new BigNumber(balance0).isEqualTo(new BigNumber(300)));
  });

  it('should add multiple mints to total supply', async function () {
    let initialTotalSupply = await token.totalSupply();
    await mint(accounts[0], 100);
    await mint(accounts[0], 400);
    await mint(accounts[1], 600);

    let totalSupply = await token.totalSupply();
    assert.isTrue(new BigNumber(totalSupply).minus(new BigNumber(initialTotalSupply)).isEqualTo(new BigNumber(1100)));
  });

  it('should fail to mint from blacklisted minter', async function () {
     await setMinter(accounts[2], 200);
     await blacklist(accounts[2]);
     try {
      await token.mint(accounts[0], 100, {from: accounts[2]});
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let balance0 = await token.balanceOf(accounts[0]);
      assert.equal(balance0, 0);
    }
  });

  it('should fail to mint to blacklisted address', async function () {
     await blacklist(accounts[3]);
     try {
      await mint(accounts[3], 100);
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let balance0 = await token.balanceOf(accounts[0]);
      assert.equal(balance0, 0);
    }
  });

  it('should fail to mint from a non-minter call', async function () {
     await mint(accounts[0], 400);
     try {
      await token.mint(accounts[0], 100, {from: accounts[0]});
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let balance0 = await token.balanceOf(accounts[0]);
      assert.equal(balance0, 400);
    }
  });

  it('should complete transferFrom', async function() {
    await sampleTransferFrom();
  });

  it('should approve', async function() {
    await approve(accounts[3], 100, accounts[2]);
    let allowance = await token.allowance(accounts[2], accounts[3]);
    assert.isTrue(new BigNumber(allowance).isEqualTo(new BigNumber(100)));
  });

  it('should complete sample transfer', async function() {
    await sampleTransfer();  
  });

  it('should complete transfer from non-owner', async function() {
    await mint(accounts[2], 1900);
    let transfer = await token.transfer(accounts[3], 1000, {from: accounts[2]});

    checkTransferEvents(transfer, accounts[2], accounts[3], 1000);

    let balance0 = await token.balanceOf(accounts[2]);
    assert.equal(balance0, 1900 - 1000);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, 1000);
  });

  it('should set allowance and balances before and after approved transfer', async function() {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(accounts[0], 500);
    await token.approve(accounts[3], 100);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(100)));

    let transfer = await token.transferFrom(accounts[0], accounts[3], 50, {from: accounts[3]});

    checkTransferEvents(transfer, accounts[0], accounts[3], 50);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(new BigNumber(balance0).isEqualTo(new BigNumber(450)));
    let balance3 = await token.balanceOf(accounts[3]);
    assert.isTrue(new BigNumber(balance3).isEqualTo(new BigNumber(50)));
  });

  it('should fail on unauthorized approved transfer and not change balances', async function() {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(accounts[0], 500);
    await token.approve(accounts[3], 100);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(100)));

    try {
      await token.transferFrom(accounts[0], accounts[3], 50, {from: accounts[4]});
      assert.fail()
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let balance0 = await token.balanceOf(accounts[0]);
      assert.equal(balance0, 500);
      let balance3 = await token.balanceOf(accounts[3]);
      assert.equal(balance3, 0);
    }
  });

  it('should fail on invalid approved transfer amount and not change balances', async function() {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(accounts[0], 500);
    await token.approve(accounts[3], 100);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(100)));

    try {
      await token.transferFrom(accounts[0], accounts[3], 450, {from: accounts[3]});
      assert.fail()
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let balance0 = await token.balanceOf(accounts[0]);
      assert.equal(balance0, 500);
      let balance3 = await token.balanceOf(accounts[3]);
      assert.equal(balance3, 0);
    }
  });

  it('should fail on invalid transfer recipient (zero-account) and not change balances', async function() {

    await mint(accounts[0], 500);
    await token.approve(accounts[3], 100);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(100)));

    try {
      await token.transferFrom(accounts[0], 0, 50, {from: accounts[3]});
      assert.fail()
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let balance0 = await token.balanceOf(accounts[0]);
      assert.equal(balance0, 500);
    }
  });

  it('should test consistency of transfer(x) and approve(x) + transferFrom(x)', async function() {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    let transferAmount = 650;
    let totalAmount = transferAmount;
    await mint(accounts[0], totalAmount);

    let transfer = await token.transfer(accounts[3], transferAmount);
    checkTransferEvents(transfer, accounts[0], accounts[3], transferAmount);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, totalAmount - transferAmount);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, transferAmount);

    await token.allowance.call(accounts[1], accounts[4]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(accounts[1], totalAmount);

    await token.approve(accounts[4], transferAmount, {from: accounts[1]});
    allowed = await token.allowance.call(accounts[1], accounts[4]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(transferAmount)));

    transfer = await token.transferFrom(accounts[1], accounts[4], transferAmount, {from: accounts[4]});

    checkTransferEvents(transfer, accounts[1], accounts[4], transferAmount);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance0, totalAmount - transferAmount);
    let balance4 = await token.balanceOf(accounts[4]);
    assert.equal(balance3, transferAmount);
  });

  it('should pause and should not be able to transfer', async function () {
    await mint(accounts[2], 1900);
    assert.equal(await token.paused.call(), false);
    await token.pause({from: pauserAccount});
    assert.equal(await token.paused.call(), true);

    try {
      await sampleTransferFrom();
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    }
  });

  it('should pause and should not be able to transfer, then unpause and be able to transfer', async function () {
    await mint(accounts[2], 1900);
    assert.equal(await token.paused.call(), false);
    await token.pause({from: pauserAccount});
    assert.equal(await token.paused.call(), true);

    try {
      await sampleTransferFrom();
      assert.fail();
    } catch (e) {
      checkFailureIsExpected(e);
    }

    await token.unpause({from: pauserAccount});
    assert.equal(await token.paused.call(), false);
    await sampleTransferFrom();
  });

  it('should attempt to unpause when already unpaused and fail', async function () {
    assert.equal(await token.paused.call(), false);
    try {
      await token.unpause({from: pauserAccount});
      assert.fail();
    } catch (e) {
      checkFailureIsExpected(e);
    }
  })

  it('should pause and should not be able to transferFrom', async function () {
    await mint(accounts[2], 1900);
    assert.equal(await token.paused.call(), false);
    await token.pause({from: pauserAccount});
    assert.equal(await token.paused.call(), true);

    try {
      await sampleTransfer();
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    }
  });

  it('should pause and should not be able to approve', async function () {
    await mint(accounts[2], 1900);
    assert.equal(await token.paused.call(), false);
    await token.pause({from: pauserAccount});
    assert.equal(await token.paused.call(), true);

    try {
      await approve(accounts[2], 50, accounts[3]);
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    }
  });

  it('should pause and should not be able to mint', async function () {
    await mint(accounts[2], 1900);
    assert.equal(await token.paused.call(), false);
    await token.pause({from: pauserAccount});
    assert.equal(await token.paused.call(), true);

    try {
      await mint(accounts[2], 1900);
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    }
  });

  it('should try to pause with non-pauser and fail to pause', async function () {
    await mint(accounts[2], 1900);
    assert.equal(await token.paused.call(), false);
    try {
      await token.pause({from: accounts[0]});
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      assert.equal(await token.paused.call(), false);
    }
  });   

  it('should try to pause with non-pauser and fail to pause', async function () {
    await mint(accounts[2], 1900);
    assert.equal(await token.paused.call(), false);
    try {
      await token.pause({from: accounts[0]});
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      assert.equal(await token.paused.call(), false);
    }
  }); 

  it('should approve and fail to transfer more than balance', async function() {
    await mint(accounts[2], 100);
    await token.approve(accounts[1], 600, {from: accounts[2]});
    try {
      await token.transferFrom(accounts[2], accounts[1], 600, {from: accounts[1]});
      assert.fail();
    } catch (e) {
      checkFailureIsExpected(e);
    } 
    finally {
       let balance = await token.balanceOf(accounts[2]);
       assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(100)));
    }  
  });

  it('should blacklist and make transfer impossible', async function() {
    await mint(accounts[2], 1900);
    await blacklist(accounts[2]);
    try {
      await token.transfer(accounts[3], 600, {from: accounts[2]});
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
       let balance = await token.balanceOf(accounts[2]);
       assert.equal(balance, 1900);
    }
  });

  it('should blacklist recipient and make transfer to recipient impossible', async function() {
    await mint(accounts[2], 1900);
    await mint(accounts[9], 1600);
    await blacklist(accounts[2]);
    try {
      await token.transfer(accounts[2], 600, {from: accounts[9]});
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
       let balance = await token.balanceOf(accounts[2]);
       assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(1900)));
       balance = await token.balanceOf(accounts[9]);
       assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(1600)));
    }
  });

  it('should blacklist and make transferFrom impossible with the approved transferer', async function() {
    let isBlacklistedBefore = await token.isAccountBlacklisted(accounts[2])
    assert.equal(isBlacklistedBefore, false);

    await mint(accounts[2], 1900);
    await token.approve(accounts[1], 600, {from: accounts[2]});
    await blacklist(accounts[2]);
    try {
      await token.transferFrom(accounts[2], accounts[3], 600, {from: accounts[1]});
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } 
    finally {
       let balance = await token.balanceOf(accounts[2]);
       assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(1900)));
    }

    let isBlacklistedAfter = await token.isAccountBlacklisted(accounts[2]);
    assert.equal(isBlacklistedAfter, true);
  });

  it('should make transferFrom impossible with the approved and blacklisted transferer', async function() {
    await mint(accounts[2], 1900);
    await token.approve(accounts[1], 600, {from: accounts[2]});
    await blacklist(accounts[1]);
    try {
      await token.transferFrom(accounts[2], accounts[3], 600, {from: accounts[1]});
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    }
    finally {
       let balance = await token.balanceOf(accounts[2]);
       assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(1900)));
    }
  });

  it('should blacklist recipient and make transfer to recipient using transferFrom impossible', async function() {
    await mint(accounts[2], 1900);
    await token.approve(accounts[3], 600, {from: accounts[2]});
    await blacklist(accounts[3]);
    try {
      await token.transferFrom(accounts[2], accounts[3], 600, {from: accounts[2]});
      assert.fail();
    } catch (e) {
      checkFailureIsExpected(e);
    } 
    finally {
       let balance = await token.balanceOf(accounts[2]);
       assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(1900)));
    }
  });

  it('should blacklist and make approve impossible', async function() {
    await mint(accounts[1], 1900);
    await blacklist(accounts[1]);
    try {
      await token.approve(accounts[2], 600, {from: accounts[1]});
    } catch(e) {
      checkFailureIsExpected(e);
    }
    finally {
       let approval = await token.allowance(accounts[1], accounts[2]);
       assert.isTrue(new BigNumber(approval).isEqualTo(new BigNumber(0)));
    }
  });

  it('should make giving approval to blacklisted account impossible', async function() {
    await mint(accounts[2], 1900);
    await blacklist(accounts[1]);
    try {
      await token.approve(accounts[1], 600, {from: accounts[2]});
    } catch(e) {
      checkFailureIsExpected(e);
    }
    finally {
       let approval = await token.allowance(accounts[2], accounts[1]);
       assert.isTrue(new BigNumber(approval).isEqualTo(new BigNumber(0)));
    }
  });

  /* Comments out increase/decrease approval tests */
  /* 

  it('should increase approval', async function() {
    await approve(accounts[3], 100, accounts[2]);
    await increaseApproval(accounts[3], 50, accounts[2]);
    let allowance = await token.allowance(accounts[2], accounts[3]);
    assert.isTrue(new BigNumber(allowance).isEqualTo(new BigNumber(150)));
  });

  it('should decrease approval', async function() {
    await approve(accounts[3], 100, accounts[2]);
    await decreaseApproval(accounts[3], 50, accounts[2]);
    let allowance = await token.allowance(accounts[2], accounts[3]);
    assert.isTrue(new BigNumber(allowance).isEqualTo(new BigNumber(50)));
  });

  it('should set long-decimal fees, approve transfer amount with fee, and complete transferFrom with fees', async function() {
    fee = 1235;
    feeBase = 10000;
    await token.updateTransferFee(fee, feeBase);
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    let transferAmount = 650;
    let feeAmount = calculateFeeAmount(transferAmount);
    let totalAmount = transferAmount + feeAmount;
    await mint(accounts[0], totalAmount);


    await token.approveWithFee(accounts[3], transferAmount);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(totalAmount)));

    transfer = await token.transferFrom(accounts[0], accounts[3], transferAmount, {from: accounts[3]});

    checkTransferEvents(transfer, accounts[0], accounts[3], transferAmount, feeAmount);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, transferAmount);
    let balanceFeeAccount = await token.balanceOf(feeAccount);
    assert.equal(balanceFeeAccount, feeAmount);
  });
*/
/*
  it('should set long-decimal fees, set approval amount with fee, complete transferFrom, increase approval with fees and complete transferFrom another with fees', async function() {
    fee = 1235;
    feeBase = 10000;
    await token.updateTransferFee(fee, feeBase);
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    let transferAmount = 650;
    let feeAmount = calculateFeeAmount(transferAmount);
    let totalAmount = transferAmount + feeAmount;
    await mint(accounts[0], totalAmount);
    console.log(totalAmount);


    await token.approveWithFee(accounts[3], transferAmount);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(totalAmount)));
    transfer = await token.transferFrom(accounts[0], accounts[3], transferAmount, {from: accounts[3]});

    checkTransferEvents(transfer, accounts[0], accounts[3], transferAmount, feeAmount);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, transferAmount);
    let balanceFeeAccount = await token.balanceOf(feeAccount);
    assert.equal(balanceFeeAccount, feeAmount);

    let transferAmountOld = transferAmount;
    let feeAmountOld = feeAmount;
    let totalAmountOld = totalAmount;

    transferAmount = 800;
    feeAmount = calculateFeeAmount(transferAmount);
    totalAmount = transferAmount + feeAmount;
    await mint(accounts[0], totalAmount);

    await token.increaseApprovalWithFee(accounts[3], transferAmount);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(totalAmount)));

    transfer = await token.transferFrom(accounts[0], accounts[3], transferAmount, {from: accounts[3]});

    checkTransferEvents(transfer, accounts[0], accounts[3], transferAmount, feeAmount);

    balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);
    balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, transferAmount + transferAmountOld);
    balanceFeeAccount = await token.balanceOf(feeAccount);
    assert.equal(balanceFeeAccount, feeAmount + feeAmountOld);
  });

  it('should set approve transfer amount with fee, decrease approval amount with fee', async function() {
    fee = 1235;
    feeBase = 10000;
    await token.updateTransferFee(fee, feeBase);
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    let transferAmount = 650;

    await token.approveWithFee(accounts[3], transferAmount);
    await token.decreaseApprovalWithFee(accounts[3], transferAmount);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
  });

  it('should pause and should not be able to increaseApproval', async function () {
    await mint(accounts[2], 1900);
    await approve(accounts[2], 50, accounts[3]);
    assert.equal(await token.paused.call(), false);
    await token.pause({from: pauserAccount});
    assert.equal(await token.paused.call(), true);

    try {
      await increaseApproval(accounts[2], 200, accounts[3]);
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    }
  });

  it('should pause and should not be able to decreaseApproval', async function () {
    await mint(accounts[2], 1900);
    await approve(accounts[2], 50, accounts[3]);
    assert.equal(await token.paused.call(), false);
    await token.pause({from: pauserAccount});
    assert.equal(await token.paused.call(), true);

    try {
      await decreaseApproval(accounts[2], 20, accounts[3]);
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    }
  });

  it('should blacklist and make increaseApproval impossible', async function() {
    await mint(accounts[1], 1900);
    await token.approve(accounts[2], 600, {from: accounts[1]});
    await blacklist(accounts[1]);
    try {
      await token.increaseApproval(accounts[2], 600, {from: accounts[1]});
    } catch(e) {
      checkFailureIsExpected(e);
    }
    finally {
       let approval = await token.allowance(accounts[1], accounts[2]);
       assert.isTrue(new BigNumber(approval).isEqualTo(new BigNumber(600)));
    }
  });

  it('should make giving increaseApproval to blacklisted account impossible', async function() {
    await mint(accounts[2], 1900);
    await token.approve(accounts[1], 600, {from: accounts[2]});
    await blacklist(accounts[1]);
    try {
      await token.increaseApproval(accounts[1], 600, {from: accounts[2]});
    } catch(e) {
      checkFailureIsExpected(e);
    }
    finally {
       let approval = await token.allowance(accounts[2], accounts[1]);
        assert.isTrue(new BigNumber(approval).isEqualTo(new BigNumber(600)));
    }
  });

  it('should blacklist and make decreaseApproval impossible', async function() {
    await mint(accounts[1], 1900);
    await token.approve(accounts[2], 600, {from: accounts[1]});
    await blacklist(accounts[1]);
    try {
      await token.decreaseApproval(accounts[2], 600, {from: accounts[1]});
    } catch(e) {
      checkFailureIsExpected(e);
    }
    finally {
       let approval = await token.allowance(accounts[1], accounts[2]);
        assert.isTrue(new BigNumber(approval).isEqualTo(new BigNumber(600)));
    }
  });

  it('should make giving decreaseApproval to blacklisted account impossible', async function() {
    await mint(accounts[2], 1900);
    await token.approve(accounts[1], 600, {from: accounts[2]});
    await blacklist(accounts[1]);
    try {
      await token.decreaseApproval(accounts[1], 600, {from: accounts[2]});
    } catch(e) {
      checkFailureIsExpected(e);
    }
    finally {
       let approval = await token.allowance(accounts[2], accounts[1]);
       assert.isTrue(new BigNumber(approval).isEqualTo(new BigNumber(600)));
    }
  });*/

  it('should blacklist then unblacklist to make a transfer possible', async function() {
    await mint(accounts[2], 1900);
    await blacklist(accounts[2]);
    await unBlacklist(accounts[2]);
    await token.transfer(accounts[3], 600, {from: accounts[2]});
    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(1300)));
    balance = await token.balanceOf(accounts[3]);
    assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(600)));

  });

  it('should fail to blacklist with non-blacklister account', async function() {
    await mint(accounts[2], 1900);
    try {
      await token.blacklist(accounts[2], {from: pauserAccount});
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      await token.transfer(accounts[3], 600, {from: accounts[2]});
      let balance = await token.balanceOf(accounts[2]);
      assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(1300)));
      balance = await token.balanceOf(accounts[3]);
      assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(600)));
    }
  });

/* TODO: Update with global roleAddressChangerAccount
  it('should fail to change the minter with a non-minterCertifier account', async function() {
    try {
      await token.updateMasterMinter(accounts[8]);
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let minter = await token.masterMinter();
      assert.equal(masterMinterAccount, minter);
    }
  });

  it('should change the masterMinter with a valid minterCertifier account and fail to finishMinting with old masterMinter', async function() {
    await token.updateMasterMinter(accounts[8], {from: minterCertifier});

    try {
      await token.finishMinting({from: masterMinterAccount});
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      await token.finishMinting({from: accounts[8]});
      assert.equal(await token.mintingFinished(), true);
    }
  });
*/
  it('should change the minter and mint as well as fail to mint with the old minter', async function() {
    let update = await token.removeMinter(minterAccount, {from: masterMinterAccount});
    assert.equal(update.logs[0].event, 'MinterRemoved');
    assert.equal(update.logs[0].args.oldMinter, minterAccount);
    update = await setMinter(accounts[3], 10000, {from: masterMinterAccount});
    await token.mint(accounts[1], 100, {from: accounts[3]});
    try {
      await token.mint(accounts[1], 200, {from: minterAccount});
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let isMinter = await token.isAccountMinter(minterAccount);
      assert.equal(isMinter, false);
      let balance = await token.balanceOf(accounts[1]);
      assert.equal(balance, 100);
    }
  });

  it('should remove a minter even if the contract is paused', async function() {
    await token.configureMinter(accounts[3], 200, {from: masterMinterAccount});
    let isAccountMinter = await token.isAccountMinter(accounts[3]);
    assert.equal(isAccountMinter, true);
    await token.pause({from: pauserAccount});
    await token.removeMinter(accounts[3], {from: masterMinterAccount});
    isAccountMinter = await token.isAccountMinter(accounts[3]);
    assert.equal(isAccountMinter, false);
  });

  it('should fail to updateMinterAllowance from non-masterMinter', async function() {
    let minterAllowanceBefore = await token.minterAllowance(minterAccount)
    assert.equal(minterAllowanceBefore, 0);

    try {
      update = await token.configureMinter(minterAccount, 100, {from: roleAddressChangerAccount});
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let minterAllowanceAfter = await token.minterAllowance(minterAccount)
      assert.equal(minterAllowanceAfter, 0);
    }
  });

  it('should have correct name', async function () {
    let actual = await token.name.call();
    assert.equal(actual, name);
  });

  it('should have correct symbol', async function () {
    let actual = await token.symbol.call();
    assert.equal(actual, symbol);
  });

  it('should have correct decimals', async function () {
    let actual = await token.decimals.call();
    assert.equal(actual, decimals);
  });

  it('should have correct currency', async function () {
    let actual = await token.currency.call();
    assert.equal(actual, currency);
  });

  it('should setBalance and getBalance from storage', async function () {
    testStorage = await EternalStorage.new();
    let setterAddress = accounts[3];
    
    await testStorage.setBalance(setterAddress, 100);
    let balance = await testStorage.getBalance(setterAddress);
    assert.equal(balance, 100);
  });

  it('should setAllowed and getAllowed from storage', async function () {
    testStorage = await EternalStorage.new();
    let setterAddress = accounts[3];
    let spenderAddress = accounts[4];
    await testStorage.setAllowed(setterAddress, spenderAddress, 100);
    let allowedBalance = await testStorage.getAllowed(setterAddress, spenderAddress);
    assert.equal(allowedBalance, 100);
  });

  it('should set totalSupply and getTotalSupply from storage', async function () {
    testStorage = await EternalStorage.new();
    let setterAddress = accounts[3];
    let spenderAddress = accounts[4];
    await testStorage.setTotalSupply(100);
    let totalSupply = await testStorage.getTotalSupply();
    assert.equal(totalSupply, 100);
  });

  it('should fail to setAccess from an address which has not been given access', async function () {
    testStorage = await EternalStorage.new();
    let illegalSetter = accounts[3];

    try {
      await testStorage.setAccess(illegalSetter, true, {from: illegalSetter});
      checkFailureIsExpected(e);
    } catch (e) {}
  });

  it('should mint and burn tokens', async function () {
    let burnerAddress = accounts[3];
    let amount = 500;
    await setMinter(burnerAddress, amount);
    let totalSupply = await token.totalSupply();
    let minterBalance = await token.balanceOf(burnerAddress);
    assert.isTrue(new BigNumber(totalSupply).isEqualTo(new BigNumber(0)));
    assert.isTrue(new BigNumber(minterBalance).isEqualTo(new BigNumber(0)));

    // mint tokens to burnerAddress
    await mint(burnerAddress, amount);
    let totalSupply1 = await token.totalSupply();
    let minterBalance1 = await token.balanceOf(burnerAddress); 
    assert.isTrue(new BigNumber(totalSupply1).isEqualTo(new BigNumber(totalSupply).plus(new BigNumber(amount))));
    assert.isTrue(new BigNumber(minterBalance1).isEqualTo(new BigNumber(minterBalance).plus(new BigNumber(amount))));

    // burn tokens
    await token.burn(amount, {from: burnerAddress});
    let totalSupply2 = await token.totalSupply();
    assert.isTrue(new BigNumber(totalSupply2).isEqualTo(new BigNumber(totalSupply1).minus(new BigNumber(amount))));

    // check that minter's balance has been reduced
    let minterBalance2 = await token.balanceOf(burnerAddress);
    assert.isTrue(new BigNumber(minterBalance2).isEqualTo(new BigNumber(minterBalance1).minus(new BigNumber(amount))));
  });

  it('should try to burn tokens from a non-minter and fail', async function () {
    let burnerAddress = accounts[3];
    let amount = 1000;
    try {
      await token.burn(amount, {from: burnerAddress});
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    }
  });

  it('should fail to burn from a blacklisted address', async function () {
     let burnerAddress = accounts[3];
     await setMinter(burnerAddress, 200);
     await mint(burnerAddress, 200);
     await blacklist(burnerAddress);
     try {
      await token.burn(100, {from: burnerAddress});
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      let balance0 = await token.balanceOf(burnerAddress);
      assert.equal(balance0, 200);
    }
  });

  it('should try to burn more tokens than balance and fail', async function () {
    let burnerAddress = accounts[3];
    let amount = 500;
    await setMinter(burnerAddress, 250);
    await mint(burnerAddress, 100);
    try {
      await token.burn(amount, {from: burnerAddress});
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    }
  });

    it('should fail to upgrade to 0x0', async function () {
        let dataContractAddress = await token.getDataContractAddress();

        // make sure token isn't already upgraded
        assert.isFalse(await token.isUpgraded.call());

        let storage = EternalStorage.at(dataContractAddress);

        let storageOwner = await storage.owner.call();
        // make sure data contract owned by the token contract
        assert.equal(storageOwner, token.address);

        try {
            // upgrade to null
            await token.upgrade("0x0", {from: upgraderAccount});
            assert.fail();
        } catch(e) {
            checkFailureIsExpected(e);
        }

        // make sure the data contracts owner is unchanged
        assert.equal(await storage.owner.call(), token.address);
    });

    it('should upgrade and preserve data', async function () {
    await mint(accounts[2], 200);
    let initialBalance = await token.balanceOf(accounts[2]);
    assert.isTrue((new BigNumber(initialBalance)).isEqualTo(new BigNumber(200)));
    let dataContractAddress = await token.getDataContractAddress();
    tokenNew = await FiatToken.new(dataContractAddress, name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, roleAddressChangerAccount);

    let upgradedDataContractAddress = await tokenNew.getDataContractAddress();
    assert.isTrue(upgradedDataContractAddress == dataContractAddress);

    await token.upgrade(tokenNew.address, {from: upgraderAccount});
    let upgradedBalance = await tokenNew.balanceOf(accounts[2]);
    assert.isTrue((new BigNumber(upgradedBalance)).isEqualTo(new BigNumber(200)));
    tokenNew.configureMinter(minterAccount, 500, {from: masterMinterAccount});
    await tokenNew.mint(accounts[2], 200, {from: minterAccount});
    let balance = await tokenNew.balanceOf(accounts[2]);
    assert.isTrue((new BigNumber(balance)).isEqualTo(new BigNumber(400)));
  });

  it('should fail to upgrade twice', async function () {
    await mint(accounts[2], 200);
    let initialBalance = await token.balanceOf(accounts[2]);
    assert.isTrue((new BigNumber(initialBalance)).isEqualTo(new BigNumber(200)));
    let dataContractAddress = await token.getDataContractAddress();
    tokenNew = await FiatToken.new(dataContractAddress, name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, roleAddressChangerAccount);

    let upgradedDataContractAddress = await tokenNew.getDataContractAddress();
    assert.isTrue(upgradedDataContractAddress == dataContractAddress);

    await token.upgrade(tokenNew.address, {from: upgraderAccount});
    let upgradedBalance = await tokenNew.balanceOf(accounts[2]);
    assert.isTrue((new BigNumber(upgradedBalance)).isEqualTo(new BigNumber(200)));
    tokenNew.configureMinter(minterAccount, 500, {from: masterMinterAccount});
    await tokenNew.mint(accounts[2], 200, {from: minterAccount});
    let balance = await tokenNew.balanceOf(accounts[2]);
    assert.isTrue((new BigNumber(balance)).isEqualTo(new BigNumber(400)));

    tokenNewSecond = await FiatToken.new(dataContractAddress, name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, upgraderAccount, roleAddressChangerAccount);
    try {
        await token.upgrade(tokenNewSecond.address, {from: upgraderAccount});
        assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    }
  });

  it('should updateRoleAddress for masterMinter', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.updateRoleAddress(address1, "masterMinter", {from: roleAddressChangerAccount});
    let masterMinter1 = await token.masterMinter();
    assert.equal(masterMinter1, address1);

    await token.updateRoleAddress(address2, "masterMinter", {from: roleAddressChangerAccount});
    let masterMinter2 = await token.masterMinter();
    assert.equal(masterMinter2, address2);
  });

  it('should updateRoleAddress for blacklister', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.updateRoleAddress(address1, "blacklister", {from: roleAddressChangerAccount});
    let blacklister1 = await token.blacklister();
    assert.equal(blacklister1, address1);

    await token.updateRoleAddress(address2, "blacklister", {from: roleAddressChangerAccount});
    let blacklister2 = await token.blacklister();
    assert.equal(blacklister2, address2);
  });

  it('should updateRoleAddress for pauser', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.updateRoleAddress(address1, "pauser", {from: roleAddressChangerAccount});
    let pauser1 = await token.pauser();
    assert.equal(pauser1, address1);

    await token.updateRoleAddress(address2, "pauser", {from: roleAddressChangerAccount});
    let pauser2 = await token.pauser();
    assert.equal(pauser2, address2);
  });

  it('should updateRoleAddress for upgrader', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.updateRoleAddress(address1, "upgrader", {from: roleAddressChangerAccount});
    let upgrader1 = await token.upgrader();
    assert.equal(upgrader1, address1);

    await token.updateRoleAddress(address2, "upgrader", {from: roleAddressChangerAccount});
    let upgrader2 = await token.upgrader();
    assert.equal(upgrader2, address2);
  });

  it('should updateRoleAddress for roleAddressChanger', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.updateRoleAddress(address1, "roleAddressChanger", {from: roleAddressChangerAccount});
    let roleAddressChanger1 = await token.roleAddressChanger();
    assert.equal(roleAddressChanger1, address1);

    await token.updateRoleAddress(address2, "roleAddressChanger", {from: address1});
    let roleAddressChanger2 = await token.roleAddressChanger();
    assert.equal(roleAddressChanger2, address2);
  });

  it('should fail to updateRoleAddress from a non-roleAddressChanger', async function () {
    let nonRoleAddressChanger = accounts[2];
    let address1 = accounts[7];

    try {
      await token.updateRoleAddress(address1, "masterMinter", {from: nonRoleAddressChanger});
      assert.fail();
    } catch(e) {
      checkFailureIsExpected(e);
    }
  });

/* Comments out tests with fees */
/*
  var fee = 25;
  var feeBase = 1000;

  it('should set fees and complete transferFrom with fees', async function() {
    await sampleTransferFrom();
  });

  it('should set long-decimal fees and complete transferFrom with fees', async function() {
    await sampleTransferFrom();
  });

  it('should set fees and and fail to complete transferFrom with insufficient balance to cover fees', async function() {
    fee = 1235;
    feeBase = 10000;
    await token.updateTransferFee(fee, feeBase);
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(accounts[0], 900);
    let initialBalanceFeeAccount = await token.balanceOf(feeAccount);
    await token.approve(accounts[3], 895);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(895)));
    try {
        transfer = await token.transferFrom(accounts[0], accounts[3], 895, {from: accounts[3]});
        assert.fail()
      } catch(e) {
        checkFailureIsExpected(e);
      } finally {
        let balance0 = await token.balanceOf(accounts[0]);
        assert.equal(balance0, 900);
        let balance3 = await token.balanceOf(accounts[3]);
        assert.equal(balance3, 0);
        let balanceFeeAccount = await token.balanceOf(feeAccount);
        assert.isTrue(new BigNumber(balanceFeeAccount).minus(new BigNumber(initialBalanceFeeAccount)).isEqualTo(new BigNumber(0)));
      }
  });

  it('should set long-decimal fees and complete transfer with fees', async function() {
    await sampleTransfer();  
  });

  it('should set long-decimal fees and complete transfer with fees from non-owner', async function() {
    fee = 123589;
    feeBase = 1000000;
    await token.updateTransferFee(fee, feeBase);
    await mint(accounts[2], 1900);
    let initialBalanceFeeAccount = await token.balanceOf(feeAccount);

    let transfer = await token.transfer(accounts[3], 1000, {from: accounts[2]});

    let feeAmount = calculateFeeAmount(1000);
    checkTransferEvents(transfer, accounts[2], accounts[3], 1000, feeAmount);

    let balance0 = await token.balanceOf(accounts[2]);
    assert.equal(balance0, 1900 - 1000 - feeAmount);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, 1000);
    let balanceFeeAccount = await token.balanceOf(feeAccount);
    assert.isTrue(new BigNumber(balanceFeeAccount).minus(new BigNumber(initialBalanceFeeAccount)).isEqualTo(new BigNumber(0)));
  });

  it('should set allowance and balances before and after approved transfer', async function() {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(accounts[0], 500);
    await token.approve(accounts[3], 100);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(100)));
    let initialBalanceFeeAccount = await token.balanceOf(feeAccount);

    let transfer = await token.transferFrom(accounts[0], accounts[3], 50, {from: accounts[3]});

    let feeAmount = calculateFeeAmount(50);
    checkTransferEvents(transfer, accounts[0], accounts[3], 50, feeAmount);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 450 - feeAmount);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, 50);
    let balanceFeeAccount = await token.balanceOf(feeAccount);
    assert.isTrue(new BigNumber(balanceFeeAccount).minus(new BigNumber(initialBalanceFeeAccount)).isEqualTo(new BigNumber(feeAmount)));
  });

  it('should test consistency of transfer(x) and approve(x) + transferFrom(x) with fees', async function() {
    fee = 1235;
    feeBase = 10000;
    await token.updateTransferFee(fee, feeBase);
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    let transferAmount = 650;
    let feeAmount = calculateFeeAmount(transferAmount);
    let totalAmount = transferAmount + feeAmount;
    await mint(accounts[0], totalAmount);
    let initialBalanceFeeAccount = await token.balanceOf(feeAccount);

    let transfer = await token.transfer(accounts[3], transferAmount);
    checkTransferEvents(transfer, accounts[0], accounts[3], transferAmount, feeAmount);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, totalAmount - transferAmount - feeAmount);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, transferAmount);
    let balanceFeeAccount = await token.balanceOf(feeAccount);
    assert.equal(balanceFeeAccount - initialBalanceFeeAccount, feeAmount);

    await token.allowance.call(accounts[1], accounts[4]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(accounts[1], totalAmount);
    initialBalanceFeeAccount = await token.balanceOf(feeAccount);

    await token.approve(accounts[4], transferAmount, {from: accounts[1]});
    allowed = await token.allowance.call(accounts[1], accounts[4]);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(transferAmount)));

    transfer = await token.transferFrom(accounts[1], accounts[4], transferAmount, {from: accounts[4]});

    checkTransferEvents(transfer, accounts[1], accounts[4], transferAmount, feeAmount);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance0, totalAmount - transferAmount - feeAmount);
    let balance4 = await token.balanceOf(accounts[4]);
    assert.equal(balance3, transferAmount);
    let balanceFeeAccountNew = await token.balanceOf(feeAccount);
    assert.isTrue(new BigNumber(balanceFeeAccountNew).minus(new BigNumber(initialBalanceFeeAccount)).isEqualTo(new BigNumber(feeAmount)));
  });

  it('should blacklist then unblacklist to make a transfer possible', async function() {
    await mint(accounts[2], 1900);
    await blacklist(accounts[2]);
    await unBlacklist(accounts[2]);
    await token.transfer(accounts[3], 600, {from: accounts[2]});
    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(1300).minus(new BigNumber(fee)));
    balance = await token.balanceOf(accounts[3]);
    assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(600)));
  });

  it('should fail to blacklist with non-blacklister account', async function() {
    await mint(accounts[2], 1900);
    try {
      await token.blacklist(accounts[2], {from: pauserAccount});
    } catch(e) {
      checkFailureIsExpected(e);
    } finally {
      await token.transfer(accounts[3], 600, {from: accounts[2]});
      let fee = calculateFeeAmount(600);
      let balance = await token.balanceOf(accounts[2]);
      assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(1300) - new BigNumber(fee)));
      balance = await token.balanceOf(accounts[3]);
      assert.isTrue(new BigNumber(balance).isEqualTo(new BigNumber(600)));
    }
  });
*/

});
