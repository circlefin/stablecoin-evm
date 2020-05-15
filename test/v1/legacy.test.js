const BN = require("bn.js");
const wrapTests = require("./helpers/wrapTests");
const {
  name,
  symbol,
  currency,
  decimals,
  mint,
  burn,
  setMinter,
  expectRevert,
  blacklist,
  sampleTransferFrom,
  approve,
  unBlacklist,
  sampleTransfer,
  checkTransferEvents,
  nullAccount,
  deployerAccount,
  tokenOwnerAccount,
  arbitraryAccount2,
  masterMinterAccount,
  minterAccount,
  pauserAccount,
  blacklisterAccount,
  proxyOwnerAccount,
  initializeTokenWithProxy,
  upgradeTo,
  UpgradedFiatToken,
  FiatTokenV1,
  getAdmin,
} = require("./helpers/tokenTest");

// these tests are for reference and do not track side effects on all variables
function runTests(_newToken, accounts) {
  let proxy, token;

  beforeEach(async () => {
    const rawToken = await FiatTokenV1.new();
    const tokenConfig = await initializeTokenWithProxy(rawToken);
    ({ proxy, token } = tokenConfig);
    assert.strictEqual(proxy.address, token.address);
  });

  it("should start with a totalSupply of 0", async () => {
    const totalSupply = await token.totalSupply();
    assert.isTrue(new BN(totalSupply).eqn(0));
  });

  it("should add multiple mints to a given address in address balance", async () => {
    await mint(token, accounts[0], 100, minterAccount);
    await mint(token, accounts[0], 200, minterAccount);

    const balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(new BN(balance0).eqn(300));
  });

  it("should fail to mint to a null address", async () => {
    const initialTotalSupply = await token.totalSupply();

    await expectRevert(mint(token, nullAccount, 100, minterAccount));

    const totalSupply = await token.totalSupply();
    assert.isTrue(new BN(totalSupply).eq(new BN(initialTotalSupply)));
  });

  it("should add multiple mints to a given address in address balance", async () => {
    await mint(token, accounts[0], 100, minterAccount);
    await mint(token, accounts[0], 200, minterAccount);

    const balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(new BN(balance0).eqn(300));
  });

  it("should add multiple mints to total supply", async () => {
    const initialTotalSupply = await token.totalSupply();
    await mint(token, accounts[0], 100, minterAccount);
    await mint(token, accounts[0], 400, minterAccount);
    await mint(token, accounts[1], 600, minterAccount);

    const totalSupply = await token.totalSupply();
    assert.isTrue(
      new BN(totalSupply).sub(new BN(initialTotalSupply)).eqn(1100)
    );
  });

  it("should fail to mint from blacklisted minter", async () => {
    await setMinter(token, accounts[2], 200);
    await blacklist(token, accounts[2]);

    await expectRevert(token.mint(accounts[0], 100, { from: accounts[2] }));

    const balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(balance0.eqn(0));
  });

  it("should fail to mint to blacklisted address", async () => {
    await blacklist(token, accounts[3]);

    await expectRevert(mint(token, accounts[3], 100, minterAccount));

    const balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(balance0.eqn(0));
  });

  it("should fail to mint from a non-minter call", async () => {
    await mint(token, accounts[0], 400, minterAccount);

    await expectRevert(token.mint(accounts[0], 100, { from: accounts[0] }));

    const balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(balance0.eqn(400));
  });

  it("should complete transferFrom", async () => {
    await sampleTransferFrom(
      token,
      deployerAccount,
      arbitraryAccount2,
      minterAccount
    );
  });

  it("should approve", async () => {
    await approve(token, accounts[3], 100, accounts[2]);
    const allowance = await token.allowance(accounts[2], accounts[3]);
    assert.isTrue(new BN(allowance).eqn(100));
  });

  it("should complete sample transfer", async () => {
    await sampleTransfer(
      token,
      deployerAccount,
      arbitraryAccount2,
      minterAccount
    );
  });

  it("should complete transfer from non-owner", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    const transfer = await token.transfer(accounts[3], 1000, {
      from: accounts[2],
    });

    checkTransferEvents(transfer, accounts[2], accounts[3], 1000);

    const balance0 = await token.balanceOf(accounts[2]);
    assert.isTrue(balance0.eqn(1900 - 1000));
    const balance3 = await token.balanceOf(accounts[3]);
    assert.isTrue(balance3.eqn(1000));
  });

  it("should set allowance and balances before and after approved transfer", async () => {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BN(allowed).eqn(0));
    await mint(token, accounts[0], 500, minterAccount);
    await token.approve(accounts[3], 100, { from: accounts[0] });
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BN(allowed).eqn(100));

    const transfer = await token.transferFrom(accounts[0], accounts[3], 50, {
      from: accounts[3],
    });

    checkTransferEvents(transfer, accounts[0], accounts[3], 50);

    const balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(new BN(balance0).eqn(450));
    const balance3 = await token.balanceOf(accounts[3]);
    assert.isTrue(new BN(balance3).eqn(50));
  });

  it("should fail on unauthorized approved transfer and not change balances", async () => {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BN(allowed).eqn(0));
    await mint(token, accounts[0], 500, minterAccount);
    await token.approve(accounts[3], 100, { from: accounts[0] });
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BN(allowed).eqn(100));

    await expectRevert(
      token.transferFrom(accounts[0], accounts[3], 50, { from: accounts[4] })
    );

    const balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(balance0.eqn(500));
    const balance3 = await token.balanceOf(accounts[3]);
    assert.isTrue(balance3.eqn(0));
  });

  it("should fail on invalid approved transfer amount and not change balances", async () => {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BN(allowed).eqn(0));
    await mint(token, accounts[0], 500, minterAccount);
    await token.approve(accounts[3], 100, { from: accounts[0] });
    allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BN(allowed).eqn(100));

    await expectRevert(
      token.transferFrom(accounts[0], accounts[3], 450, { from: accounts[3] })
    );

    const balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(balance0.eqn(500));
    const balance3 = await token.balanceOf(accounts[3]);
    assert.isTrue(balance3.eqn(0));
  });

  it("should fail on invalid transfer recipient (zero-account) and not change balances", async () => {
    await mint(token, accounts[0], 500, minterAccount);
    await token.approve(accounts[3], 100, { from: accounts[0] });
    const allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BN(allowed).eqn(100));

    await expectRevert(
      token.transferFrom(accounts[0], nullAccount, 50, { from: accounts[3] })
    );

    const balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(balance0.eqn(500));
  });

  it("should test consistency of transfer(x) and approve(x) + transferFrom(x)", async () => {
    let allowed = await token.allowance.call(accounts[0], accounts[3]);
    assert.isTrue(new BN(allowed).eqn(0));
    const transferAmount = 650;
    const totalAmount = transferAmount;
    await mint(token, accounts[0], totalAmount, minterAccount);

    let transfer = await token.transfer(accounts[3], transferAmount, {
      from: accounts[0],
    });
    checkTransferEvents(transfer, accounts[0], accounts[3], transferAmount);

    const balance0 = await token.balanceOf(accounts[0]);
    assert.isTrue(balance0.eqn(totalAmount - transferAmount));
    const balance3 = await token.balanceOf(accounts[3]);
    assert.isTrue(balance3.eqn(transferAmount));

    await token.allowance.call(accounts[1], accounts[4]);
    assert.isTrue(new BN(allowed).eqn(0));
    await mint(token, accounts[1], totalAmount, minterAccount);

    await token.approve(accounts[4], transferAmount, { from: accounts[1] });
    allowed = await token.allowance.call(accounts[1], accounts[4]);
    assert.isTrue(allowed.eqn(transferAmount));

    transfer = await token.transferFrom(
      accounts[1],
      accounts[4],
      transferAmount,
      { from: accounts[4] }
    );

    checkTransferEvents(transfer, accounts[1], accounts[4], transferAmount);

    const balance1 = await token.balanceOf(accounts[1]);
    assert.isTrue(balance1.eqn(totalAmount - transferAmount));
    const balance4 = await token.balanceOf(accounts[4]);
    assert.isTrue(balance4.eqn(transferAmount));
  });

  it("should pause and should not be able to transfer", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.strictEqual(await token.paused.call(), false);
    await token.pause({ from: pauserAccount });
    assert.strictEqual(await token.paused.call(), true);

    await expectRevert(
      sampleTransferFrom(
        token,
        deployerAccount,
        arbitraryAccount2,
        minterAccount
      )
    );
  });

  it("should pause and should not be able to transfer, then unpause and be able to transfer", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.strictEqual(await token.paused.call(), false);
    await token.pause({ from: pauserAccount });
    assert.strictEqual(await token.paused.call(), true);

    await expectRevert(
      sampleTransferFrom(
        token,
        deployerAccount,
        arbitraryAccount2,
        minterAccount
      )
    );

    await token.unpause({ from: pauserAccount });
    assert.strictEqual(await token.paused.call(), false);
    await sampleTransferFrom(
      token,
      deployerAccount,
      arbitraryAccount2,
      minterAccount
    );
  });

  it("should pause and should not be able to transferFrom", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.strictEqual(await token.paused.call(), false);
    await token.pause({ from: pauserAccount });
    assert.strictEqual(await token.paused.call(), true);

    await expectRevert(
      sampleTransfer(token, deployerAccount, arbitraryAccount2, minterAccount)
    );
  });

  it("should pause and should not be able to approve", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.strictEqual(await token.paused.call(), false);
    await token.pause({ from: pauserAccount });
    assert.strictEqual(await token.paused.call(), true);

    await expectRevert(approve(token, accounts[2], 50, accounts[3]));
  });

  it("should pause and should not be able to mint", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.strictEqual(await token.paused.call(), false);
    await token.pause({ from: pauserAccount });
    assert.strictEqual(await token.paused.call(), true);

    await expectRevert(mint(token, accounts[2], 1900, minterAccount));
  });

  it("should try to pause with non-pauser and fail to pause", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.strictEqual(await token.paused.call(), false);

    await expectRevert(token.pause({ from: accounts[0] }));

    assert.strictEqual(await token.paused.call(), false);
  });

  it("should try to pause with non-pauser and fail to pause", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    assert.strictEqual(await token.paused.call(), false);

    await expectRevert(token.pause({ from: accounts[0] }));

    assert.strictEqual(await token.paused.call(), false);
  });

  it("should approve and fail to transfer more than balance", async () => {
    await mint(token, accounts[2], 100, minterAccount);
    await token.approve(accounts[1], 600, { from: accounts[2] });

    await expectRevert(
      token.transferFrom(accounts[2], accounts[1], 600, { from: accounts[1] })
    );

    const balance = await token.balanceOf(accounts[2]);
    assert.isTrue(new BN(balance).eqn(100));
  });

  it("should blacklist and make transfer impossible", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    await blacklist(token, accounts[2]);

    await expectRevert(token.transfer(accounts[3], 600, { from: accounts[2] }));

    const balance = await token.balanceOf(accounts[2]);
    assert.isTrue(balance.eqn(1900));
  });

  it("should blacklist recipient and make transfer to recipient impossible", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    await mint(token, accounts[9], 1600, minterAccount);
    await blacklist(token, accounts[2]);

    await expectRevert(token.transfer(accounts[2], 600, { from: accounts[9] }));

    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(new BN(balance).eqn(1900));
    balance = await token.balanceOf(accounts[9]);
    assert.isTrue(new BN(balance).eqn(1600));
  });

  it("should blacklist and make transferFrom impossible with the approved transferer", async () => {
    const isBlacklistedBefore = await token.isBlacklisted(accounts[2]);
    assert.strictEqual(isBlacklistedBefore, false);

    await mint(token, accounts[2], 1900, minterAccount);
    await token.approve(accounts[1], 600, { from: accounts[2] });
    await blacklist(token, accounts[2]);

    await expectRevert(
      token.transferFrom(accounts[2], accounts[3], 600, { from: accounts[1] })
    );

    const balance = await token.balanceOf(accounts[2]);
    assert.isTrue(new BN(balance).eqn(1900));

    const isBlacklistedAfter = await token.isBlacklisted(accounts[2]);
    assert.strictEqual(isBlacklistedAfter, true);
  });

  it("should make transferFrom impossible with the approved and blacklisted transferer", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    await token.approve(accounts[1], 600, { from: accounts[2] });
    await blacklist(token, accounts[1]);

    await expectRevert(
      token.transferFrom(accounts[2], accounts[3], 600, { from: accounts[1] })
    );

    const balance = await token.balanceOf(accounts[2]);
    assert.isTrue(new BN(balance).eqn(1900));
  });

  it("should blacklist recipient and make transfer to recipient using transferFrom impossible", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    await token.approve(accounts[3], 600, { from: accounts[2] });
    await blacklist(token, accounts[3]);

    await expectRevert(
      token.transferFrom(accounts[2], accounts[3], 600, { from: accounts[2] })
    );

    const balance = await token.balanceOf(accounts[2]);
    assert.isTrue(new BN(balance).eqn(1900));
  });

  it("should blacklist and make approve impossible", async () => {
    await mint(token, accounts[1], 1900, minterAccount);
    await blacklist(token, accounts[1]);

    await expectRevert(token.approve(accounts[2], 600, { from: accounts[1] }));
    const approval = await token.allowance(accounts[1], accounts[2]);
    assert.isTrue(new BN(approval).eqn(0));
  });

  it("should make giving approval to blacklisted account impossible", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    await blacklist(token, accounts[1]);

    await expectRevert(token.approve(accounts[1], 600, { from: accounts[2] }));

    const approval = await token.allowance(accounts[2], accounts[1]);
    assert.isTrue(new BN(approval).eqn(0));
  });

  it("should blacklist then unblacklist to make a transfer possible", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    await blacklist(token, accounts[2]);
    await unBlacklist(token, accounts[2]);
    await token.transfer(accounts[3], 600, { from: accounts[2] });
    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(new BN(balance).eqn(1300));
    balance = await token.balanceOf(accounts[3]);
    assert.isTrue(new BN(balance).eqn(600));
  });

  it("should fail to blacklist with non-blacklister account", async () => {
    await mint(token, accounts[2], 1900, minterAccount);

    await expectRevert(token.blacklist(accounts[2], { from: pauserAccount }));

    await token.transfer(accounts[3], 600, { from: accounts[2] });
    let balance = await token.balanceOf(accounts[2]);
    assert.isTrue(new BN(balance).eqn(1300));
    balance = await token.balanceOf(accounts[3]);
    assert.isTrue(new BN(balance).eqn(600));
  });

  it("should unblacklist when paused", async () => {
    await mint(token, accounts[2], 1900, minterAccount);
    await token.blacklist(accounts[2], { from: blacklisterAccount });
    let blacklisted = await token.isBlacklisted(accounts[2]);
    assert.isTrue(blacklisted);

    await token.pause({ from: pauserAccount });

    await token.unBlacklist(accounts[2], { from: blacklisterAccount });

    blacklisted = await token.isBlacklisted(accounts[2]);
    assert.isFalse(blacklisted);

    const balance = await token.balanceOf(accounts[2]);
    assert.isTrue(new BN(balance).eqn(1900));
  });

  it("should change the minter and mint as well as fail to mint with the old minter", async () => {
    let update = await token.removeMinter(minterAccount, {
      from: masterMinterAccount,
    });
    assert.strictEqual(update.logs[0].event, "MinterRemoved");
    assert.strictEqual(update.logs[0].args.oldMinter, minterAccount);
    update = await setMinter(token, accounts[3], 10000, {
      from: masterMinterAccount,
    });
    await token.mint(accounts[1], 100, { from: accounts[3] });

    await expectRevert(token.mint(accounts[1], 200, { from: minterAccount }));

    const isMinter = await token.isMinter(minterAccount);
    assert.strictEqual(isMinter, false);
    const balance = await token.balanceOf(accounts[1]);
    assert.isTrue(balance.eqn(100));
  });

  it("should remove a minter even if the contract is paused", async () => {
    await token.configureMinter(accounts[3], 200, {
      from: masterMinterAccount,
    });
    let isAccountMinter = await token.isMinter(accounts[3]);
    assert.strictEqual(isAccountMinter, true);
    await token.pause({ from: pauserAccount });
    await token.removeMinter(accounts[3], { from: masterMinterAccount });
    isAccountMinter = await token.isMinter(accounts[3]);
    assert.strictEqual(isAccountMinter, false);
  });

  it("should pause contract even when contract is already paused", async () => {
    await token.pause({ from: pauserAccount });
    await token.pause({ from: pauserAccount });
    const isPaused = await token.paused();
    assert.strictEqual(isPaused, true);
  });

  it("should unpause contract even when contract is already unpaused", async () => {
    await token.unpause({ from: pauserAccount });
    const isPaused = await token.paused();
    assert.strictEqual(isPaused, false);
  });

  it("should fail to updateMinterAllowance from non-masterMinter", async () => {
    const minterAllowanceBefore = await token.minterAllowance(minterAccount);
    assert.isTrue(minterAllowanceBefore.eqn(0));

    await expectRevert(
      token.configureMinter(minterAccount, 100, { from: tokenOwnerAccount })
    );

    const minterAllowanceAfter = await token.minterAllowance(minterAccount);
    assert.isTrue(minterAllowanceAfter.eqn(0));
  });

  it("should have correct name", async () => {
    const actual = await token.name.call();
    assert.strictEqual(actual, name);
  });

  it("should have correct symbol", async () => {
    const actual = await token.symbol.call();
    assert.strictEqual(actual, symbol);
  });

  it("should have correct decimals", async () => {
    const actual = await token.decimals.call();
    assert.isTrue(actual.eqn(decimals));
  });

  it("should have correct currency", async () => {
    const actual = await token.currency.call();
    assert.strictEqual(actual, currency);
  });

  it("should mint and burn tokens", async () => {
    const burnerAddress = accounts[3];
    const amount = 500;
    await setMinter(token, burnerAddress, amount);
    const totalSupply = await token.totalSupply();
    const minterBalance = await token.balanceOf(burnerAddress);
    assert.isTrue(new BN(totalSupply).eqn(0));
    assert.isTrue(new BN(minterBalance).eqn(0));

    // mint tokens to burnerAddress
    await mint(token, burnerAddress, amount, minterAccount);
    const totalSupply1 = await token.totalSupply();
    const minterBalance1 = await token.balanceOf(burnerAddress);
    assert.isTrue(
      new BN(totalSupply1).eq(new BN(totalSupply).add(new BN(amount)))
    );
    assert.isTrue(
      new BN(minterBalance1).eq(new BN(minterBalance).add(new BN(amount)))
    );

    // burn tokens
    await burn(token, amount, burnerAddress);
    const totalSupply2 = await token.totalSupply();
    assert.isTrue(
      new BN(totalSupply2).eq(new BN(totalSupply1).sub(new BN(amount)))
    );

    // check that minter's balance has been reduced
    const minterBalance2 = await token.balanceOf(burnerAddress);
    assert.isTrue(
      new BN(minterBalance2).eq(new BN(minterBalance1).sub(new BN(amount)))
    );
  });

  it("should try to burn tokens from a non-minter and fail", async () => {
    const burnerAddress = accounts[3];
    const amount = 1000;

    await expectRevert(token.burn(amount, { from: burnerAddress }));
  });

  it("should fail to burn from a blacklisted address", async () => {
    const burnerAddress = accounts[3];
    await setMinter(token, burnerAddress, 200);
    await mint(token, burnerAddress, 200, minterAccount);
    await blacklist(token, burnerAddress);

    await expectRevert(token.burn(100, { from: burnerAddress }));
    const balance0 = await token.balanceOf(burnerAddress);
    assert.isTrue(balance0.eqn(200));
  });

  it("should try to burn more tokens than balance and fail", async () => {
    const burnerAddress = accounts[3];
    const amount = 500;
    await setMinter(token, burnerAddress, 250);
    await mint(token, burnerAddress, 100, minterAccount);

    await expectRevert(token.burn(amount, { from: burnerAddress }));
  });

  it("should upgrade and preserve data", async () => {
    await mint(token, accounts[2], 200, minterAccount);
    const initialBalance = await token.balanceOf(accounts[2]);
    assert.isTrue(new BN(initialBalance).eqn(200));

    const newRawToken = await UpgradedFiatToken.new();
    const tokenConfig = await upgradeTo(proxy, newRawToken);
    const newProxiedToken = tokenConfig.token;
    const newToken = newProxiedToken;

    const upgradedBalance = await newToken.balanceOf(accounts[2]);
    assert.isTrue(new BN(upgradedBalance).eqn(200));
    await newToken.configureMinter(minterAccount, 500, {
      from: masterMinterAccount,
    });
    await newToken.mint(accounts[2], 200, { from: minterAccount });
    const balance = await newToken.balanceOf(accounts[2]);
    assert.isTrue(new BN(balance).eqn(400));
  });

  it("should updateRoleAddress for masterMinter", async () => {
    const address1 = accounts[7];
    const address2 = accounts[6];
    await token.updateMasterMinter(address1, { from: tokenOwnerAccount });
    const masterMinter1 = await token.masterMinter();
    assert.strictEqual(masterMinter1, address1);

    await token.updateMasterMinter(address2, { from: tokenOwnerAccount });
    const masterMinter2 = await token.masterMinter();
    assert.strictEqual(masterMinter2, address2);
  });

  it("should updateRoleAddress for blacklister", async () => {
    const address1 = accounts[7];
    const address2 = accounts[6];
    await token.updateBlacklister(address1, { from: tokenOwnerAccount });
    const blacklister1 = await token.blacklister();
    assert.strictEqual(blacklister1, address1);

    await token.updateBlacklister(address2, { from: tokenOwnerAccount });
    const blacklister2 = await token.blacklister();
    assert.strictEqual(blacklister2, address2);
  });

  it("should updateRoleAddress for pauser", async () => {
    const address1 = accounts[7];
    const address2 = accounts[6];
    await token.updatePauser(address1, { from: tokenOwnerAccount });
    const pauser1 = await token.pauser();
    assert.strictEqual(pauser1, address1);

    await token.updatePauser(address2, { from: tokenOwnerAccount });
    const pauser2 = await token.pauser();
    assert.strictEqual(pauser2, address2);
  });

  it("should updateUpgraderAddress for upgrader", async () => {
    let upgrader = await getAdmin(proxy);
    assert.strictEqual(proxyOwnerAccount, upgrader);
    const address1 = accounts[10];
    await proxy.changeAdmin(address1, {
      from: proxyOwnerAccount,
    });
    upgrader = await getAdmin(proxy);
    assert.strictEqual(upgrader, address1);

    // Test upgrade with new upgrader account
    await token.configureMinter(minterAccount, 1000, {
      from: masterMinterAccount,
    });
    await token.mint(accounts[2], 200, { from: minterAccount });

    const initialBalance = await token.balanceOf(accounts[2]);
    assert.isTrue(new BN(initialBalance).eqn(200));

    const newRawToken = await UpgradedFiatToken.new();
    const tokenConfig = await upgradeTo(proxy, newRawToken, address1);
    const newProxiedToken = tokenConfig.token;
    const newToken = newProxiedToken;

    const upgradedBalance = await newToken.balanceOf(accounts[2]);
    assert.isTrue(new BN(upgradedBalance).eqn(200));
    await newToken.configureMinter(minterAccount, 500, {
      from: masterMinterAccount,
    });
    await newToken.mint(accounts[2], 200, { from: minterAccount });
    const balance = await newToken.balanceOf(accounts[2]);
    assert.isTrue(new BN(balance).eqn(400));
  });

  it("should fail to updateUpgraderAddress for upgrader using non-upgrader account", async () => {
    const address1 = accounts[7];
    await expectRevert(
      proxy.changeAdmin(address1, { from: tokenOwnerAccount })
    );
    const upgrader = await getAdmin(proxy);
    assert.notEqual(upgrader, address1);
  });

  it("should updateRoleAddress for roleAddressChanger", async () => {
    const address1 = accounts[7];
    const address2 = accounts[6];
    await token.transferOwnership(address1, { from: tokenOwnerAccount });
    const roleAddressChanger1 = await token.owner();
    assert.strictEqual(roleAddressChanger1, address1);

    await token.transferOwnership(address2, { from: address1 });
    const roleAddressChanger2 = await token.owner();
    assert.strictEqual(roleAddressChanger2, address2);
  });

  it("should fail to updateRoleAddress from a non-roleAddressChanger", async () => {
    const nonRoleAddressChanger = accounts[2];
    const address1 = accounts[7];

    await expectRevert(
      token.updateMasterMinter(address1, { from: nonRoleAddressChanger })
    );
  });
}

wrapTests("legacy", runTests);
