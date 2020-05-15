const BN = require("bn.js");
const wrapTests = require("./helpers/wrapTests");
const {
  bigZero,
  checkVariables,
  arbitraryAccount,
  tokenOwnerAccount,
  blacklisterAccount,
  masterMinterAccount,
  minterAccount,
  pauserAccount,
  initializeTokenWithProxy,
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

  it("pt000 should check that default variable values are correct", async () => {
    await checkVariables([token], [[]]);
  });

  // Pause and Unpause

  it("pt011 should pause and set paused to true", async () => {
    await token.pause({ from: pauserAccount });
    const customVars = [{ variable: "paused", expectedValue: true }];
    await checkVariables([token], [customVars]);
  });

  it("pt006 should unpause and set paused to false", async () => {
    await token.pause({ from: pauserAccount });
    const customVars = [{ variable: "paused", expectedValue: true }];
    await checkVariables([token], [customVars]);
    await token.unpause({ from: pauserAccount });
    await checkVariables([token], [[]]);
  });

  // Approve

  it("pt020 should approve a spend and set allowed amount", async () => {
    await token.approve(minterAccount, amount, { from: arbitraryAccount });
    const customVars = [
      {
        variable: "allowance.arbitraryAccount.minterAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);
  });

  // Blacklist and Unblacklist

  it("pt019 should blacklist and set blacklisted to true", async () => {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    const customVars = [
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [customVars]);
  });

  it("pt018 should blacklist and set blacklisted to true, then unblacklist and set blacklisted to false", async () => {
    await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    const customVars = [
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [customVars]);

    await token.unBlacklist(arbitraryAccount, { from: blacklisterAccount });
    await checkVariables([token], [[]]);
  });

  // Configure minter

  it("pt015 should configureMinter, setting the minter to true and mintingAllowance to amount", async () => {
    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    const customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);
  });

  // Mint and Burn

  it("pt012 should mint the amount, increasing balance of recipient by amount, increasing total supply by amount, and decreasing minterAllowed by amount", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "balances.arbitraryAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it("pt017 should burn amount of tokens and reduce balance and total supply by amount", async () => {
    const mintAmount = 11;
    const burnAmount = 10;

    await token.configureMinter(minterAccount, mintAmount, {
      from: masterMinterAccount,
    });
    await token.mint(minterAccount, mintAmount, { from: minterAccount });
    const setup = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(0),
      },
      {
        variable: "balances.minterAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [setup]);

    await token.burn(burnAmount, { from: minterAccount });
    const afterBurn = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(0),
      },
      {
        variable: "balances.minterAccount",
        expectedValue: new BN(mintAmount - burnAmount),
      },
      {
        variable: "totalSupply",
        expectedValue: new BN(mintAmount - burnAmount),
      },
    ];
    await checkVariables([token], [afterBurn]);
  });

  // Remove minter

  it("pt010 should removeMinter, setting the minter to false and minterAllowed to 0", async () => {
    const mintAmount = 11;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "balances.arbitraryAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [customVars]);

    await token.removeMinter(minterAccount, { from: masterMinterAccount });
    customVars = [
      {
        variable: "balances.arbitraryAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  // Transfer and transferFrom

  it("pt008 should transfer, reducing sender balance by amount and increasing recipient balance by amount", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "balances.arbitraryAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [customVars]);

    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });
    customVars = [
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "balances.arbitraryAccount", expectedValue: bigZero },
      {
        variable: "balances.pauserAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it("pt007 should transferFrom, reducing sender balance by amount and increasing recipient balance by amount", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    let customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount),
      },
    ];
    await checkVariables([token], [customVars]);

    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      {
        variable: "balances.arbitraryAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [customVars]);

    await token.approve(masterMinterAccount, mintAmount, {
      from: arbitraryAccount,
    });
    await token.transferFrom(arbitraryAccount, pauserAccount, mintAmount, {
      from: masterMinterAccount,
    });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      { variable: "balances.arbitraryAccount", expectedValue: bigZero },
      {
        variable: "balances.pauserAccount",
        expectedValue: new BN(mintAmount),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  // Update methods

  it("pt004 should updateMasterMinter", async () => {
    await token.updateMasterMinter(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    const result = [
      { variable: "masterMinter", expectedValue: arbitraryAccount },
    ];
    await checkVariables([token], [result]);
  });

  it("pt005 should updateBlacklister", async () => {
    await token.updateBlacklister(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    const result = [
      { variable: "blacklister", expectedValue: arbitraryAccount },
    ];
    await checkVariables([token], [result]);
  });

  it("pt003 should updatePauser", async () => {
    await token.updatePauser(arbitraryAccount, { from: tokenOwnerAccount });
    const result = [{ variable: "pauser", expectedValue: arbitraryAccount }];
    await checkVariables([token], [result]);
  });

  // Transfer Ownership

  it("pt009 should set owner to _newOwner", async () => {
    await token.transferOwnership(arbitraryAccount, {
      from: tokenOwnerAccount,
    });
    const result = [
      { variable: "tokenOwner", expectedValue: arbitraryAccount },
    ];
    await checkVariables([token], [result]);
  });
}

wrapTests("FiatToken positive", runTests);
