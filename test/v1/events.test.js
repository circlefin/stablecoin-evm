const wrapTests = require("./helpers/wrapTests");
const {
  FiatTokenV1,
  minterAccount,
  masterMinterAccount,
  arbitraryAccount,
  arbitraryAccount2,
  blacklisterAccount,
  tokenOwnerAccount,
  pauserAccount,
  proxyOwnerAccount,
  initializeTokenWithProxy,
  encodeCall,
  checkMintEvent,
  checkMinterConfiguredEvent,
  checkApprovalEvent,
  checkBurnEvents,
  checkMinterRemovedEvent,
  checkBlacklistEvent,
  checkUnblacklistEvent,
  checkPauserChangedEvent,
  checkUnpauseEvent,
  checkTransferOwnershipEvent,
  checkUpdateMasterMinterEvent,
  checkBlacklisterChangedEvent,
  checkUpgradeEvent,
  checkAdminChangedEvent,
  UpgradedFiatTokenNewFields,
  checkPauseEvent,
  checkTransferEvents,
} = require("./helpers/tokenTest");

const amount = 100;

function runTests(_newToken, _accounts) {
  let proxy, token;

  beforeEach(async () => {
    const rawToken = await FiatTokenV1.new();
    const tokenConfig = await initializeTokenWithProxy(rawToken);
    ({ proxy, token } = tokenConfig);
    assert.strictEqual(proxy.address, token.address);
  });

  it("et000 should check MinterConfigured event", async () => {
    const configureMinter = await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    checkMinterConfiguredEvent(configureMinter, minterAccount, amount);
  });

  it("et001 should check Mint/Transfer events", async () => {
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    const mint = await token.mint(arbitraryAccount, amount, {
      from: minterAccount,
    });
    checkMintEvent(mint, arbitraryAccount, amount, minterAccount);
  });

  it("et002 should check Burn/Transfer events", async () => {
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(minterAccount, amount, { from: minterAccount });
    const burn = await token.burn(amount, { from: minterAccount });
    checkBurnEvents(burn, amount, minterAccount);
  });

  it("et003 should check MinterRemoved event", async () => {
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    const minterRemovedEvent = await token.removeMinter(minterAccount, {
      from: masterMinterAccount,
    });
    checkMinterRemovedEvent(minterRemovedEvent, minterAccount);
  });

  it("et004 should check MasterMinterChanged event", async () => {
    const updateMasterMinter = await token.updateMasterMinter(
      arbitraryAccount,
      {
        from: tokenOwnerAccount,
      }
    );
    checkUpdateMasterMinterEvent(updateMasterMinter, arbitraryAccount);
  });

  it("et005 should check Blacklisted event", async () => {
    const blacklist = await token.blacklist(arbitraryAccount, {
      from: blacklisterAccount,
    });
    checkBlacklistEvent(blacklist, arbitraryAccount);
  });

  it("et006 should check UnBlacklisted event", async () => {
    const unblacklist = await token.unBlacklist(arbitraryAccount, {
      from: blacklisterAccount,
    });
    checkUnblacklistEvent(unblacklist, arbitraryAccount);
  });

  it("et007 should check BlacklisterChanged event", async () => {
    const blacklisterChanged = await token.updateBlacklister(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    checkBlacklisterChangedEvent(blacklisterChanged, arbitraryAccount);
  });

  it("et008 should check Upgraded event", async () => {
    const upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall(
      "initV2",
      ["bool", "address", "uint256"],
      [true, pauserAccount, 12]
    );
    const upgrade = await proxy.upgradeToAndCall(
      upgradedToken.address,
      initializeData,
      { from: proxyOwnerAccount }
    );
    checkUpgradeEvent(upgrade, upgradedToken.address);
  });

  it("et009 should check AdminChanged event", async () => {
    const adminChanged = await proxy.changeAdmin(arbitraryAccount, {
      from: proxyOwnerAccount,
    });
    checkAdminChangedEvent(adminChanged, proxyOwnerAccount, arbitraryAccount);
  });

  it("et010 should check OwnershipTransferred event", async () => {
    const transferOwnership = await token.transferOwnership(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    checkTransferOwnershipEvent(
      transferOwnership,
      tokenOwnerAccount,
      arbitraryAccount
    );
  });

  it("et011 should check Approval event", async () => {
    const approval = await token.approve(arbitraryAccount2, amount, {
      from: arbitraryAccount,
    });
    checkApprovalEvent(approval, arbitraryAccount, arbitraryAccount2, amount);
  });

  it("et012 should check Pause event", async () => {
    const pause = await token.pause({ from: pauserAccount });
    checkPauseEvent(pause);
  });

  it("et013 should check Unpause event", async () => {
    const unpause = await token.unpause({ from: pauserAccount });
    checkUnpauseEvent(unpause);
  });

  it("et014 should check PauserChanged event", async () => {
    const updatePauser = await token.updatePauser(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    checkPauserChangedEvent(updatePauser, arbitraryAccount);
  });

  it("et015 should check Transfer event", async () => {
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, amount, { from: minterAccount });
    const transfer = await token.transfer(arbitraryAccount2, amount, {
      from: arbitraryAccount,
    });
    checkTransferEvents(transfer, arbitraryAccount, arbitraryAccount2, amount);
  });

  it("et016 should check Transfer event in transferFrom", async () => {
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, amount, { from: minterAccount });
    await token.approve(arbitraryAccount2, amount, { from: arbitraryAccount });
    const transferFrom = await token.transferFrom(
      arbitraryAccount,
      blacklisterAccount,
      amount,
      { from: arbitraryAccount2 }
    );
    checkTransferEvents(
      transferFrom,
      arbitraryAccount,
      blacklisterAccount,
      amount
    );
  });
}

wrapTests("FiatToken events", runTests);
