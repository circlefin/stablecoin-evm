const BN = require("bn.js");
const wrapTests = require("./helpers/wrapTests");
const {
  checkVariables,
  arbitraryAccount,
  upgraderAccount,
  tokenOwnerAccount,
  blacklisterAccount,
  masterMinterAccount,
  minterAccount,
  pauserAccount,
  initializeTokenWithProxy,
  UpgradedFiatToken,
  upgradeTo,
} = require("./helpers/tokenTest");

const amount = 100;

function runTests(newToken, _accounts) {
  let proxy, token;

  beforeEach(async () => {
    const rawToken = await newToken();
    const tokenConfig = await initializeTokenWithProxy(rawToken);
    ({ proxy, token } = tokenConfig);
    assert.strictEqual(proxy.address, token.address);
  });

  // Paused

  it("ept001 should changeAdmin while paused", async () => {
    await token.pause({ from: pauserAccount });
    await proxy.changeAdmin(arbitraryAccount, { from: upgraderAccount });
    const result = [
      { variable: "paused", expectedValue: true },
      { variable: "upgrader", expectedValue: arbitraryAccount },
    ];
    await checkVariables([token], [result]);
  });

  it("ept002 should updateMasterMinter while paused", async () => {
    await token.pause({ from: pauserAccount });
    await token.updateMasterMinter(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    const result = [
      { variable: "masterMinter", expectedValue: arbitraryAccount },
      { variable: "paused", expectedValue: true },
    ];
    await checkVariables([token], [result]);
  });

  it("ept003 should updateBlacklister while paused", async () => {
    await token.pause({ from: pauserAccount });
    await token.updateBlacklister(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    const result = [
      { variable: "blacklister", expectedValue: arbitraryAccount },
      { variable: "paused", expectedValue: true },
    ];
    await checkVariables([token], [result]);
  });

  it("ept004 should updatePauser while paused", async () => {
    await token.pause({ from: pauserAccount });
    await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
    const result = [
      { variable: "pauser", expectedValue: arbitraryAccount },
      { variable: "paused", expectedValue: true },
    ];
    await checkVariables([token], [result]);
  });

  it("ept005 should transferOwnership while paused", async () => {
    await token.pause({ from: pauserAccount });
    await token.transferOwnership(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    const result = [
      { variable: "tokenOwner", expectedValue: arbitraryAccount },
      { variable: "paused", expectedValue: true },
    ];
    await checkVariables([token], [result]);
  });

  it("ept006 should removeMinter while paused", async () => {
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.pause({ from: pauserAccount });
    const isAMinter = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
      { variable: "paused", expectedValue: true },
    ];
    await checkVariables([token], [isAMinter]);

    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    const notAMinter = [
      { variable: "isAccountMinter.minterAccount", expectedValue: false },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(0),
      },
      { variable: "paused", expectedValue: true },
    ];
    await checkVariables([token], [notAMinter]);
  });

  it("ept008 should upgrade while paused", async () => {
    const newRawToken = await UpgradedFiatToken.new();
    await token.pause({ from: pauserAccount });
    const tokenConfig = await upgradeTo(proxy, newRawToken);
    const newProxiedToken = tokenConfig.token;
    const newTokenResult = [
      { variable: "paused", expectedValue: true },
      { variable: "proxiedTokenAddress", expectedValue: newRawToken.address },
    ];
    await checkVariables([newProxiedToken], [newTokenResult]);
  });

  // Blacklisted

  it("ept013 should changeAdmin when msg.sender blacklisted", async () => {
    await token.blacklist(upgraderAccount, { from: blacklisterAccount });
    await proxy.changeAdmin(arbitraryAccount, { from: upgraderAccount });
    const result = [
      { variable: "isAccountBlacklisted.upgraderAccount", expectedValue: true },
      { variable: "upgrader", expectedValue: arbitraryAccount },
    ];
    await checkVariables([token], [result]);
  });

  it("ept014 should updateMasterMinter when msg.sender blacklisted", async () => {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    await token.updateMasterMinter(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    const setup = [
      { variable: "masterMinter", expectedValue: arbitraryAccount },
      {
        variable: "isAccountBlacklisted.tokenOwnerAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [setup]);
  });

  it("ept015 should updateBlacklister when msg.sender blacklisted", async () => {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    await token.updateBlacklister(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    const setup = [
      { variable: "blacklister", expectedValue: arbitraryAccount },
      {
        variable: "isAccountBlacklisted.tokenOwnerAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [setup]);
  });

  it("ept016 should updatePauser when msg.sender blacklisted", async () => {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
    const setup = [
      { variable: "pauser", expectedValue: arbitraryAccount },
      {
        variable: "isAccountBlacklisted.tokenOwnerAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [setup]);
  });

  it("ept017 should transferOwnership when msg.sender blacklisted", async () => {
    await token.blacklist(tokenOwnerAccount, { from: blacklisterAccount });
    await token.transferOwnership(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    const setup = [
      { variable: "tokenOwner", expectedValue: arbitraryAccount },
      {
        variable: "isAccountBlacklisted.tokenOwnerAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [setup]);
  });

  it("ept018 should pause when msg.sender blacklisted", async () => {
    await token.blacklist(pauserAccount, { from: blacklisterAccount });
    await token.pause({ from: pauserAccount });
    const setup = [
      { variable: "paused", expectedValue: true },
      { variable: "isAccountBlacklisted.pauserAccount", expectedValue: true },
    ];
    await checkVariables([token], [setup]);
  });

  it("ept019 should unpause when msg.sender blacklisted", async () => {
    await token.pause({ from: pauserAccount });
    let setup = [{ variable: "paused", expectedValue: true }];
    await checkVariables([token], [setup]);

    await token.blacklist(pauserAccount, { from: blacklisterAccount });
    await token.unpause({ from: pauserAccount });
    setup = [
      { variable: "isAccountBlacklisted.pauserAccount", expectedValue: true },
    ];
    await checkVariables([token], [setup]);
  });

  it("ept020 should blacklist when msg.sender blacklisted", async () => {
    await token.blacklist(blacklisterAccount, { from: blacklisterAccount });
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    const setup = [
      {
        variable: "isAccountBlacklisted.blacklisterAccount",
        expectedValue: true,
      },
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [setup]);
  });

  it("ept021 should unBlacklist when msg.sender blacklisted", async () => {
    await token.blacklist(blacklisterAccount, { from: blacklisterAccount });
    const setup = [
      {
        variable: "isAccountBlacklisted.blacklisterAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [setup]);

    await token.unBlacklist(blacklisterAccount, { from: blacklisterAccount });
    await checkVariables([token], [[]]);
  });

  it("ept022 should upgrade when msg.sender blacklisted", async () => {
    await token.blacklist(upgraderAccount, { from: blacklisterAccount });
    const newRawToken = await UpgradedFiatToken.new();
    const tokenConfig = await upgradeTo(proxy, newRawToken);
    const newProxiedToken = tokenConfig.token;

    const newTokenResult = [
      { variable: "proxiedTokenAddress", expectedValue: newRawToken.address },
      { variable: "isAccountBlacklisted.upgraderAccount", expectedValue: true },
    ];
    await checkVariables([newProxiedToken], [newTokenResult]);
  });

  it("ept023 should upgrade to blacklisted address", async () => {
    const newRawToken = await UpgradedFiatToken.new();

    await token.blacklist(newRawToken.address, { from: blacklisterAccount });
    const tokenConfig = await upgradeTo(proxy, newRawToken);
    const newProxiedToken = tokenConfig.token;

    const newTokenResult = [
      { variable: "proxiedTokenAddress", expectedValue: newRawToken.address },
    ];

    assert.isTrue(await newProxiedToken.isBlacklisted(newRawToken.address));
    await checkVariables([newProxiedToken], [newTokenResult]);
  });

  it("ept024 should blacklist a blacklisted address", async () => {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    const setup = [
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
    ];
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await checkVariables([token], [setup]);
  });

  it("ept025 should changeAdmin to blacklisted address", async () => {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await proxy.changeAdmin(arbitraryAccount, { from: upgraderAccount });
    const result = [
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
      { variable: "upgrader", expectedValue: arbitraryAccount },
    ];
    await checkVariables([token], [result]);
  });

  it("ept026 should updateMasterMinter to blacklisted address", async () => {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.updateMasterMinter(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    const setup = [
      { variable: "masterMinter", expectedValue: arbitraryAccount },
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [setup]);
  });

  it("ept027 should updateBlacklister to blacklisted address", async () => {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.updateBlacklister(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    const setup = [
      { variable: "blacklister", expectedValue: arbitraryAccount },
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [setup]);
  });

  it("ept028 should updatePauser to blacklisted address", async () => {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
    const setup = [
      { variable: "pauser", expectedValue: arbitraryAccount },
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [setup]);
  });

  it("ept029 should transferOwnership to blacklisted address", async () => {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    await token.transferOwnership(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    const setup = [
      { variable: "tokenOwner", expectedValue: arbitraryAccount },
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [setup]);
  });

  it("ept030 should configureMinter when masterMinter is blacklisted", async () => {
    await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    const result = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
      {
        variable: "isAccountBlacklisted.masterMinterAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [result]);
  });

  it("ept032 should configureMinter when minter is blacklisted", async () => {
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    const result = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
      { variable: "isAccountBlacklisted.minterAccount", expectedValue: true },
    ];
    await checkVariables([token], [result]);
  });

  it("ept033 should removeMinter when masterMinter is blacklisted", async () => {
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.blacklist(masterMinterAccount, { from: blacklisterAccount });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
      {
        variable: "isAccountBlacklisted.masterMinterAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [customVars]);

    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: false },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(0),
      },
      {
        variable: "isAccountBlacklisted.masterMinterAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ept034 should removeMinter when minter is blacklisted", async () => {
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.blacklist(minterAccount, { from: blacklisterAccount });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
      { variable: "isAccountBlacklisted.minterAccount", expectedValue: true },
    ];
    await checkVariables([token], [customVars]);

    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: false },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(0),
      },
      { variable: "isAccountBlacklisted.minterAccount", expectedValue: true },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ept035 should unBlacklist while contract is paused", async () => {
    await token.pause({ from: pauserAccount });
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    let customVars = [
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
      { variable: "paused", expectedValue: true },
    ];
    await checkVariables([token], [customVars]);

    await token.unBlacklist(arbitraryAccount, { from: blacklisterAccount });
    customVars = [{ variable: "paused", expectedValue: true }];
    await checkVariables([token], [customVars]);
  });

  it("ept036 should blacklist while contract is paused", async () => {
    await token.pause({ from: pauserAccount });
    let customVars = [{ variable: "paused", expectedValue: true }];
    await checkVariables([token], [customVars]);

    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    customVars = [
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
      { variable: "paused", expectedValue: true },
    ];
    await checkVariables([token], [customVars]);
  });

  it("ept037 should pause while contract is paused", async () => {
    await token.pause({ from: pauserAccount });
    let customVars = [{ variable: "paused", expectedValue: true }];
    await checkVariables([token], [customVars]);

    await token.pause({ from: pauserAccount });
    customVars = [{ variable: "paused", expectedValue: true }];
    await checkVariables([token], [customVars]);
  });
}

wrapTests("FiatToken extended positive", runTests);
