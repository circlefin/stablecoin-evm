var tokenUtils = require('./../TokenTestUtils.js');
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals
var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var burn = tokenUtils.burn;
var setMinter = tokenUtils.setMinter;
var expectRevert = tokenUtils.expectRevert;
var blacklist = tokenUtils.blacklist;
var sampleTransferFrom = tokenUtils.sampleTransferFrom;
var approve = tokenUtils.approve;
var unBlacklist = tokenUtils.unBlacklist;
var sampleTransfer = tokenUtils.sampleTransfer;
var checkTransferEvents = tokenUtils.checkTransferEvents;
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var upgradeTo = tokenUtils.upgradeTo;
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var FiatToken = tokenUtils.FiatToken;
var getAdmin = tokenUtils.getAdmin;
var newBigNumber = tokenUtils.newBigNumber;

var AccountUtils = require('./../AccountUtils.js');
var Accounts = AccountUtils.Accounts;
var addressEquals = AccountUtils.addressEquals;

// these tests are for reference and do not track side effects on all variables
async function run_tests(newToken, accounts) {

  beforeEach(async function () {
    rawToken =  await FiatToken.new();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.equal(proxy.address, token.address);
  });
/*
  it('should start with a totalSupply of 0', async function () {
    let totalSupply = await token.totalSupply();
    assert.isTrue(totalSupply.isZero());
  });

  it('should add multiple mints to a given address in address balance', async function () {
    await mint(token, accounts[0], 100, Accounts.minterAccount);
    await mint(token, accounts[0], 200, Accounts.minterAccount);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 300);
  });

  it('should fail to mint to a null address', async function () {
    let initialTotalSupply = await token.totalSupply();

    await expectRevert(mint(token, "0x0", 100, Accounts.minterAccount));

    totalSupply = await token.totalSupply();
    assert.isTrue(totalSupply.cmp(newBigNumber(initialTotalSupply))==0);

    await expectRevert(mint(token, 0x0, 100, Accounts.minterAccount));

    totalSupply = await token.totalSupply();
    assert.isTrue(totalSupply.cmp(newBigNumber(initialTotalSupply))==0);

    await expectRevert(mint(token, "0x0000000000000000000000000000000000000000", 100, Accounts.minterAccount));

    totalSupply = await token.totalSupply();
    assert.isTrue(totalSupply.cmp(newBigNumber(initialTotalSupply))==0);

    await expectRevert(mint(token, 0x0000000000000000000000000000000000000000, 100, Accounts.minterAccount));

    totalSupply = await token.totalSupply();
    assert.isTrue(totalSupply.cmp(newBigNumber(initialTotalSupply))==0);
  });

  it('should add multiple mints to a given address in address balance', async function () {
    await mint(token, accounts[0], 100, Accounts.minterAccount);
    await mint(token, accounts[0], 200, Accounts.minterAccount);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(balance0.cmp(newBigNumber(300))==0);
  });

  it('should add multiple mints to total supply', async function () {
    let initialTotalSupply = await token.totalSupply();
    await mint(token, accounts[0], 100, Accounts.minterAccount);
    await mint(token, accounts[0], 400, Accounts.minterAccount);
    await mint(token, accounts[1], 600, Accounts.minterAccount);

    let totalSupply = await token.totalSupply();
    assert.isTrue(totalSupply.sub(initialTotalSupply).cmp(newBigNumber(1100))==0);
  });

  it('should fail to mint from blacklisted minter', async function () {
    await setMinter(token, accounts[2], 200);
    await blacklist(token, accounts[2]);

    await expectRevert(token.mint(accounts[0], 100, { from: accounts[2] }));

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);
  });

  it('should fail to mint to blacklisted address', async function () {
    await blacklist(token, accounts[3]);

    await expectRevert(mint(token, accounts[3], 100, Accounts.minterAccount))

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);
  });

  it('should fail to mint from a non-minter call', async function () {
    await mint(token, accounts[0], 400, Accounts.minterAccount);

    await expectRevert(token.mint(accounts[0], 100, { from: accounts[0] }))

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 400);
  });

  it('should complete transferFrom', async function () {
    await sampleTransferFrom(token, Accounts.deployerAccount, Accounts.arbitraryAccount2, Accounts.minterAccount);
  });

  it('should approve', async function () {
    await approve(token, accounts[3], 100, accounts[2]);
    let allowance = await token.allowance(accounts[2], accounts[3]);
    assert.isTrue(allowance.cmp(newBigNumber(100))==0);
  });

  it('should complete sample transfer', async function () {
    await sampleTransfer(token, Accounts.deployerAccount, Accounts.arbitraryAccount2, Accounts.minterAccount);
  });

  it('should complete transfer from non-owner', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    let transfer = await token.transfer(accounts[3], 1000, { from: accounts[2] });

    checkTransferEvents(transfer, accounts[2], accounts[3], 1000);

    let balance0 = await token.balanceOf(accounts[2]);
    assert.equal(balance0, 1900 - 1000);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, 1000);
  });

  it('should set allowance and balances before and after approved transfer', async function () {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(allowed.isZero());
    await mint(token, accounts[0], 500, Accounts.minterAccount);
    await token.approve(accounts[3], 100);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(allowed.cmp(newBigNumber(100))==0);

    let transfer = await token.transferFrom(accounts[0], accounts[3], 50, { from: accounts[3] });

    checkTransferEvents(transfer, accounts[0], accounts[3], 50);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(balance0.cmp(newBigNumber(450))==0);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.isTrue(balance3.cmp(newBigNumber(50))==0);
  });

  it('should fail on unauthorized approved transfer and not change balances', async function () {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(allowed.cmp(newBigNumber(0))==0);
    await mint(token, accounts[0], 500, Accounts.minterAccount);
    await token.approve(accounts[3], 100);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(allowed.cmp(newBigNumber(100))==0);

    await expectRevert(token.transferFrom(accounts[0], accounts[3], 50, { from: accounts[4] }));

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 500);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, 0);
  });
*/
  it('should fail on invalid approved transfer amount and not change balances', async function () {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(allowed.cmp(newBigNumber(0))==0);
    await mint(token, accounts[0], 500, Accounts.minterAccount);
    await token.approve(accounts[3], 100);
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(allowed.cmp(newBigNumber(100))==0);

    await expectRevert(token.transferFrom(accounts[0], accounts[3], 450, { from: accounts[3] }));

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 500);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, 0);

  });

  it('should fail on invalid transfer recipient (zero-account) and not change balances', async function () {

    await mint(token, accounts[0], 500, Accounts.minterAccount);
    await token.approve(accounts[3], 100);
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(allowed.cmp(newBigNumber(100))==0);

    await expectRevert(token.transferFrom(accounts[0], 0, 50, { from: accounts[3] }));

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 500);
  });

  it('should test consistency of transfer(x) and approve(x) + transferFrom(x)', async function () {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(allowed.isZero());
    let transferAmount = 650;
    let totalAmount = transferAmount;
    await mint(token, accounts[0], totalAmount, Accounts.minterAccount);

    let transfer = await token.transfer(accounts[3], transferAmount);
    checkTransferEvents(transfer, accounts[0], accounts[3], transferAmount);

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, totalAmount - transferAmount);
    let balance3 = await token.balanceOf(accounts[3]);
    assert.equal(balance3, transferAmount);

    await token.allowance.call(accounts[1], accounts[4]);
    assert.isTrue(allowed.isZero());
    await mint(token, accounts[1], totalAmount, Accounts.minterAccount);

    await token.approve(accounts[4], transferAmount, { from: accounts[1] });
    allowed = await token.allowance.call(accounts[1], accounts[4]);
    assert.isTrue(allowed.cmp(newBigNumber(transferAmount))==0);

    transfer = await token.transferFrom(accounts[1], accounts[4], transferAmount, { from: accounts[4] });

    checkTransferEvents(transfer, accounts[1], accounts[4], transferAmount);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance0, totalAmount - transferAmount);
    let balance4 = await token.balanceOf(accounts[4]);
    assert.equal(balance3, transferAmount);
  });

  it('should pause and should not be able to transfer', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    assert.equal(await token.paused.call(), false);
    await token.pause({ from: Accounts.pauserAccount });
    assert.equal(await token.paused.call(), true);

    await expectRevert(sampleTransferFrom(token, Accounts.deployerAccount, Accounts.arbitraryAccount2, Accounts.minterAccount));
  });

  it('should pause and should not be able to transfer, then unpause and be able to transfer', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    assert.equal(await token.paused.call(), false);
    await token.pause({ from: Accounts.pauserAccount });
    assert.equal(await token.paused.call(), true);

    await expectRevert(sampleTransferFrom(token, Accounts.deployerAccount, Accounts.arbitraryAccount2, Accounts.minterAccount));

    await token.unpause({ from: Accounts.pauserAccount });
    assert.equal(await token.paused.call(), false);
    await sampleTransferFrom(token, Accounts.deployerAccount, Accounts.arbitraryAccount2, Accounts.minterAccount);
  });

  it('should pause and should not be able to transferFrom', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    assert.equal(await token.paused.call(), false);
    await token.pause({ from: Accounts.pauserAccount });
    assert.equal(await token.paused.call(), true);

    await expectRevert(sampleTransfer(token, Accounts.deployerAccount, Accounts.arbitraryAccount2, Accounts.minterAccount));
  });

  it('should pause and should not be able to approve', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    assert.equal(await token.paused.call(), false);
    await token.pause({ from: Accounts.pauserAccount });
    assert.equal(await token.paused.call(), true);

    await expectRevert(approve(token, accounts[2], 50, accounts[3]));
  });

  it('should pause and should not be able to mint', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    assert.equal(await token.paused.call(), false);
    await token.pause({ from: Accounts.pauserAccount });
    assert.equal(await token.paused.call(), true);

    await expectRevert(mint(token, accounts[2], 1900, Accounts.minterAccount));
  });

  it('should try to pause with non-pauser and fail to pause', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    assert.equal(await token.paused.call(), false);

    await expectRevert(token.pause({ from: accounts[0] }));

    assert.equal(await token.paused.call(), false);
  });

  it('should try to pause with non-pauser and fail to pause', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    assert.equal(await token.paused.call(), false);

    await expectRevert(token.pause({ from: accounts[0] }));

    assert.equal(await token.paused.call(), false);
  });

  it('should approve and fail to transfer more than balance', async function () {
    await mint(token, accounts[2], 100, Accounts.minterAccount);
    await token.approve(accounts[1], 600, { from: accounts[2] });

    await expectRevert(token.transferFrom(accounts[2], accounts[1], 600, { from: accounts[1] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(balance.cmp(newBigNumber(100))==0);
  });

  it('should blacklist and make transfer impossible', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    await blacklist(token, accounts[2]);

    await expectRevert(token.transfer(accounts[3], 600, { from: accounts[2] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.equal(balance, 1900);
  });

  it('should blacklist recipient and make transfer to recipient impossible', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    await mint(token, accounts[9], 1600, Accounts.minterAccount);
    await blacklist(token, accounts[2]);

    await expectRevert(token.transfer(accounts[2], 600, { from: accounts[9] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(balance.cmp(newBigNumber(1900))==0);
    balance = await token.balanceOf(accounts[9]);
    assert.isTrue(balance.cmp(newBigNumber(1600))==0);
  });

  it('should blacklist and make transferFrom impossible with the approved transferer', async function () {
    let isBlacklistedBefore = await token.isBlacklisted(accounts[2])
    assert.equal(isBlacklistedBefore, false);

    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    await token.approve(accounts[1], 600, { from: accounts[2] });
    await blacklist(token, accounts[2]);

    await expectRevert(token.transferFrom(accounts[2], accounts[3], 600, { from: accounts[1] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(balance.cmp(newBigNumber(1900))==0);

    let isBlacklistedAfter = await token.isBlacklisted(accounts[2]);
    assert.equal(isBlacklistedAfter, true);
  });

  it('should make transferFrom impossible with the approved and blacklisted transferer', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    await token.approve(accounts[1], 600, { from: accounts[2] });
    await blacklist(token, accounts[1]);

    await expectRevert(token.transferFrom(accounts[2], accounts[3], 600, { from: accounts[1] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(balance.cmp(newBigNumber(1900))==0);
  });

  it('should blacklist recipient and make transfer to recipient using transferFrom impossible', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    await token.approve(accounts[3], 600, { from: accounts[2] });
    await blacklist(token, accounts[3]);

    await expectRevert(token.transferFrom(accounts[2], accounts[3], 600, { from: accounts[2] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(balance.cmp(newBigNumber(1900))==0);
  });

  it('should blacklist and make approve impossible', async function () {
    await mint(token, accounts[1], 1900, Accounts.minterAccount);
    await blacklist(token, accounts[1]);

    await expectRevert(token.approve(accounts[2], 600, { from: accounts[1] }));
    let approval = await token.allowance(accounts[1], accounts[2]);
    assert.isTrue(approval.isZero());
  });

  it('should make giving approval to blacklisted account impossible', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    await blacklist(token, accounts[1]);

    await expectRevert(token.approve(accounts[1], 600, { from: accounts[2] }));

    let approval = await token.allowance(accounts[2], accounts[1]);
    assert.isTrue(approval.isZero());
  });

  it('should blacklist then unblacklist to make a transfer possible', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    await blacklist(token, accounts[2]);
    await unBlacklist(token, accounts[2]);
    await token.transfer(accounts[3], 600, { from: accounts[2] });
    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(balance.cmp(newBigNumber(1300))==0);
    balance = await token.balanceOf(accounts[3]);
    assert.isTrue(balance.cmp(newBigNumber(600))==0);
  });

  it('should fail to blacklist with non-blacklister account', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);

    await expectRevert(token.blacklist(accounts[2], { from: Accounts.pauserAccount }));

    await token.transfer(accounts[3], 600, { from: accounts[2] });
    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(balance.cmp(newBigNumber(1300))==0);
    balance = await token.balanceOf(accounts[3]);
    assert.isTrue(balance.cmp(newBigNumber(600))==0);
  });

  it('should unblacklist when paused', async function () {
    await mint(token, accounts[2], 1900, Accounts.minterAccount);
    await token.blacklist(accounts[2], { from: Accounts.blacklisterAccount });
    let blacklisted = await token.isBlacklisted(accounts[2]);
    assert.isTrue(blacklisted);

    await token.pause({ from: Accounts.pauserAccount });

    await token.unBlacklist(accounts[2], { from: Accounts.blacklisterAccount });

    blacklisted = await token.isBlacklisted(accounts[2]);
    assert.isFalse(blacklisted);

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(balance.cmp(newBigNumber(1900))==0);
  });

  it('should change the minter and mint as well as fail to mint with the old minter', async function () {
    let update = await token.removeMinter(Accounts.minterAccount, { from: Accounts.masterMinterAccount });
    assert.equal(update.logs[0].event, 'MinterRemoved');
    assert.isTrue(addressEquals(update.logs[0].args.oldMinter, Accounts.minterAccount));
    update = await setMinter(token, accounts[3], 10000, { from: Accounts.masterMinterAccount });
    await token.mint(accounts[1], 100, { from: accounts[3] });

    await expectRevert(token.mint(accounts[1], 200, { from: Accounts.minterAccount }));

    let isMinter = await token.isMinter(Accounts.minterAccount);
    assert.equal(isMinter, false);
    let balance = await token.balanceOf(accounts[1]);
    assert.equal(balance, 100);
  });

  it('should remove a minter even if the contract is paused', async function () {
    await token.configureMinter(accounts[3], 200, { from: Accounts.masterMinterAccount });
    let isAccountMinter = await token.isMinter(accounts[3]);
    assert.equal(isAccountMinter, true);
    await token.pause({ from: Accounts.pauserAccount });
    await token.removeMinter(accounts[3], { from: Accounts.masterMinterAccount });
    isAccountMinter = await token.isMinter(accounts[3]);
    assert.equal(isAccountMinter, false);
  });

  it('should pause contract even when contract is already paused', async function () {
    await token.pause({ from: Accounts.pauserAccount });
    await token.pause({ from: Accounts.pauserAccount });
    let isPaused = await token.paused();
    assert.equal(isPaused, true);
  });

  it('should unpause contract even when contract is already unpaused', async function () {
    await token.unpause({ from: Accounts.pauserAccount });
    let isPaused = await token.paused();
    assert.equal(isPaused, false);
  });

  it('should fail to updateMinterAllowance from non-masterMinter', async function () {
    let minterAllowanceBefore = await token.minterAllowance(Accounts.minterAccount)
    assert.equal(minterAllowanceBefore, 0);

    await expectRevert(token.configureMinter(Accounts.minterAccount, 100, { from: Accounts.tokenOwnerAccount }));

    let minterAllowanceAfter = await token.minterAllowance(Accounts.minterAccount)
    assert.equal(minterAllowanceAfter, 0);
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
    assert.equal(actual.toString(16,32), decimals.toString(16,32));
  });

  it('should have correct currency', async function () {
    let actual = await token.currency.call();
    assert.equal(actual, currency);
  });

  it('should mint and burn tokens', async function () {
    let burnerAddress = accounts[3];
    let amount = 500;
    await setMinter(token, burnerAddress, amount);
    let totalSupply = await token.totalSupply();
    let minterBalance = await token.balanceOf(burnerAddress);
    assert.isTrue(totalSupply.isZero());
    assert.isTrue(minterBalance.isZero());

    // mint tokens to burnerAddress
    await mint(token, burnerAddress, amount, Accounts.minterAccount);
    let totalSupply1 = await token.totalSupply();
    let minterBalance1 = await token.balanceOf(burnerAddress);
    assert.isTrue(totalSupply1.cmp(totalSupply.add(newBigNumber(amount)))==0);
    assert.isTrue(minterBalance1.cmp(minterBalance.add(newBigNumber(amount)))==0);

    // burn tokens
    await burn(token, amount, burnerAddress);
    let totalSupply2 = await token.totalSupply();
    assert.isTrue(totalSupply2.cmp(totalSupply1.sub(newBigNumber(amount)))==0);

    // check that minter's balance has been reduced
    let minterBalance2 = await token.balanceOf(burnerAddress);
    assert.isTrue(minterBalance2.cmp(minterBalance1.sub(newBigNumber(amount)))==0);
  });

  it('should try to burn tokens from a non-minter and fail', async function () {
    let burnerAddress = accounts[3];
    let amount = 1000;

    await expectRevert(token.burn(amount, { from: burnerAddress }));
  });

  it('should fail to burn from a blacklisted address', async function () {
    let burnerAddress = accounts[3];
    await setMinter(token, burnerAddress, 200);
    await mint(token, burnerAddress, 200, Accounts.minterAccount);
    await blacklist(token, burnerAddress);

    await expectRevert(token.burn(100, { from: burnerAddress }));
    let balance0 = await token.balanceOf(burnerAddress);
    assert.equal(balance0, 200);
  });

  it('should try to burn more tokens than balance and fail', async function () {
    let burnerAddress = accounts[3];
    let amount = 500;
    await setMinter(token, burnerAddress, 250);
    await mint(token, burnerAddress, 100, Accounts.minterAccount);

    await expectRevert(token.burn(amount, { from: burnerAddress }));
  });

  it('should upgrade and preserve data', async function () {
    await mint(token, accounts[2], 200, Accounts.minterAccount);
    let initialBalance = await token.balanceOf(accounts[2]);
    assert.isTrue(initialBalance.cmp(newBigNumber(200))==0);

    var newRawToken = await UpgradedFiatToken.new();
    var tokenConfig = await upgradeTo(proxy, newRawToken);
    var newProxiedToken = tokenConfig.token;
    var newToken = newProxiedToken;

    let upgradedBalance = await newToken.balanceOf(accounts[2]);
    assert.isTrue(upgradedBalance.cmp(newBigNumber(200))==0);
    await newToken.configureMinter(Accounts.minterAccount, 500, { from: Accounts.masterMinterAccount });
    await newToken.mint(accounts[2], 200, { from: Accounts.minterAccount });
    let balance = await newToken.balanceOf(accounts[2]);
    assert.isTrue(balance.cmp(newBigNumber(400))==0);
  });

  it('should updateRoleAddress for masterMinter', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.updateMasterMinter(address1, { from: Accounts.tokenOwnerAccount });
    let masterMinter1 = await token.masterMinter();
    assert.equal(masterMinter1, address1);

    await token.updateMasterMinter(address2, { from: Accounts.tokenOwnerAccount });
    let masterMinter2 = await token.masterMinter();
    assert.equal(masterMinter2, address2);
  });

  it('should updateRoleAddress for blacklister', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.updateBlacklister(address1, { from: Accounts.tokenOwnerAccount });
    let blacklister1 = await token.blacklister();
    assert.equal(blacklister1, address1);

    await token.updateBlacklister(address2, { from: Accounts.tokenOwnerAccount });
    let blacklister2 = await token.blacklister();
    assert.equal(blacklister2, address2);
  });

  it('should updateRoleAddress for pauser', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.updatePauser(address1, { from: Accounts.tokenOwnerAccount });
    let pauser1 = await token.pauser();
    assert.equal(pauser1, address1);

    await token.updatePauser(address2, { from: Accounts.tokenOwnerAccount });
    let pauser2 = await token.pauser();
    assert.equal(pauser2, address2);
  });

  it('should updateUpgraderAddress for upgrader', async function () {
    let upgrader = await getAdmin(proxy);
    assert.isTrue(addressEquals(Accounts.proxyOwnerAccount, upgrader));
    let address1 = accounts[10];
    let updated = await proxy.changeAdmin(address1, { from: Accounts.proxyOwnerAccount });
    upgrader = await getAdmin(proxy);
    assert.isTrue(addressEquals(upgrader, address1));

    //Test upgrade with new upgrader account
    await token.configureMinter(Accounts.minterAccount, 1000, {from: Accounts.masterMinterAccount});
    await token.mint(accounts[2], 200, {from: Accounts.minterAccount});

    let initialBalance = await token.balanceOf(accounts[2]);
    assert.isTrue(initialBalance.cmp(newBigNumber(200))==0);
    
    var newRawToken = await UpgradedFiatToken.new();
    var tokenConfig = await upgradeTo(proxy, newRawToken, address1);
    var newProxiedToken = tokenConfig.token;
    var newToken = newProxiedToken;

    let upgradedBalance = await newToken.balanceOf(accounts[2]);
    assert.isTrue(upgradedBalance.cmp(newBigNumber(200))==0);
    await newToken.configureMinter(Accounts.minterAccount, 500, { from: Accounts.masterMinterAccount });
    await newToken.mint(accounts[2], 200, { from: Accounts.minterAccount });
    let balance = await newToken.balanceOf(accounts[2]);
    assert.isTrue(balance.cmp(newBigNumber(400))==0);
  });

  it('should fail to updateUpgraderAddress for upgrader using non-upgrader account', async function () {
    let address1 = accounts[7];
    await expectRevert(proxy.changeAdmin(address1, { from: Accounts.tokenOwnerAccount }));
    let upgrader = await getAdmin(proxy);
    assert.notEqual(upgrader, address1);
  });

  it('should updateRoleAddress for roleAddressChanger', async function () {
    let address1 = accounts[7];
    let address2 = accounts[6];
    await token.transferOwnership(address1, { from: Accounts.tokenOwnerAccount });
    let roleAddressChanger1 = await token.owner();
    assert.equal(roleAddressChanger1, address1);

    await token.transferOwnership(address2, { from: address1 });
    let roleAddressChanger2 = await token.owner();
    assert.equal(roleAddressChanger2, address2);
  });

  it('should fail to updateRoleAddress from a non-roleAddressChanger', async function () {
    let nonRoleAddressChanger = accounts[2];
    let address1 = accounts[7];

    await expectRevert(token.updateMasterMinter(address1, { from: nonRoleAddressChanger }));
  });
}

var testWrapper = require('./../TestWrapper');
testWrapper.execute('FiatToken_LegacyTests', run_tests);

module.exports = {
  run_tests: run_tests,
}
