var tokenUtils = require("./../TokenTestUtils.js");
var newBigNumber = tokenUtils.newBigNumber;
var assertDiff = require("assert-diff");
assertDiff.options.strict = true;

var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var checkVariables = tokenUtils.checkVariables;
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;

var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var FiatToken = tokenUtils.FiatToken;

var AccountUtils = require("./../AccountUtils.js");
var Accounts = AccountUtils.Accounts;

var amount = 100;

async function run_tests(newToken, accounts) {
  beforeEach("Make fresh token contract", async function () {
    rawToken = await newToken();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.equal(proxy.address, token.address);
  });

  it("pt000 should check that default variable values are correct", async function () {
    await checkVariables([token], [[]]);
  });

  // Pause and Unpause

  it("pt011 should pause and set paused to true", async function () {
    await token.pause({ from: Accounts.pauserAccount });
    var customVars = [{ variable: "paused", expectedValue: true }];
    await checkVariables([token], [customVars]);
  });

  it("pt006 should unpause and set paused to false", async function () {
    await token.pause({ from: Accounts.pauserAccount });
    var customVars = [{ variable: "paused", expectedValue: true }];
    await checkVariables([token], [customVars]);
    await token.unpause({ from: Accounts.pauserAccount });
    await checkVariables([token], [[]]);
  });

  // Approve

  it("pt020 should approve a spend and set allowed amount", async function () {
    await token.approve(Accounts.minterAccount, amount, {
      from: Accounts.arbitraryAccount,
    });
    var customVars = [
      {
        variable: "allowance.arbitraryAccount.minterAccount",
        expectedValue: newBigNumber(amount),
      },
    ];
    await checkVariables([token], [customVars]);
  });

  // Blacklist and Unblacklist

  it("pt019 should blacklist and set blacklisted to true", async function () {
    await token.blacklist(Accounts.arbitraryAccount, {
      from: Accounts.blacklisterAccount,
    });
    var customVars = [
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [customVars]);
  });

  it("pt018 should blacklist and set blacklisted to true, then unblacklist and set blacklisted to false", async function () {
    await token.blacklist(Accounts.arbitraryAccount, {
      from: Accounts.blacklisterAccount,
    });
    var customVars = [
      {
        variable: "isAccountBlacklisted.arbitraryAccount",
        expectedValue: true,
      },
    ];
    await checkVariables([token], [customVars]);

    await token.unBlacklist(Accounts.arbitraryAccount, {
      from: Accounts.blacklisterAccount,
    });
    await checkVariables([token], [[]]);
  });

  // Configure minter

  it("pt015 should configureMinter, setting the minter to true and mintingAllowance to amount", async function () {
    await token.configureMinter(Accounts.minterAccount, amount, {
      from: Accounts.masterMinterAccount,
    });
    var customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount),
      },
    ];
    await checkVariables([token], [customVars]);
  });

  // Mint and Burn

  it("pt012 should mint the amount, increasing balance of recipient by amount, increasing total supply by amount, and decreasing minterAllowed by amount", async function () {
    var mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, {
      from: Accounts.masterMinterAccount,
    });
    var customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount),
      },
    ];
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, mintAmount, {
      from: Accounts.minterAccount,
    });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount - mintAmount),
      },
      {
        variable: "balances.arbitraryAccount",
        expectedValue: newBigNumber(mintAmount),
      },
      { variable: "totalSupply", expectedValue: newBigNumber(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it("pt017 should burn amount of tokens and reduce balance and total supply by amount", async function () {
    var mintAmount = 11;
    var burnAmount = 10;

    await token.configureMinter(Accounts.minterAccount, mintAmount, {
      from: Accounts.masterMinterAccount,
    });
    await token.mint(Accounts.minterAccount, mintAmount, {
      from: Accounts.minterAccount,
    });
    var setup = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(0),
      },
      {
        variable: "balances.minterAccount",
        expectedValue: newBigNumber(mintAmount),
      },
      { variable: "totalSupply", expectedValue: newBigNumber(mintAmount) },
    ];
    await checkVariables([token], [setup]);

    await token.burn(burnAmount, { from: Accounts.minterAccount });
    var afterBurn = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(0),
      },
      {
        variable: "balances.minterAccount",
        expectedValue: newBigNumber(mintAmount - burnAmount),
      },
      {
        variable: "totalSupply",
        expectedValue: newBigNumber(mintAmount - burnAmount),
      },
    ];
    await checkVariables([token], [afterBurn]);
  });

  // Remove minter

  it("pt010 should removeMinter, setting the minter to false and minterAllowed to 0", async function () {
    let mintAmount = 11;

    await token.configureMinter(Accounts.minterAccount, amount, {
      from: Accounts.masterMinterAccount,
    });
    await token.mint(Accounts.arbitraryAccount, mintAmount, {
      from: Accounts.minterAccount,
    });
    var customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount - mintAmount),
      },
      {
        variable: "balances.arbitraryAccount",
        expectedValue: newBigNumber(mintAmount),
      },
      { variable: "totalSupply", expectedValue: newBigNumber(mintAmount) },
    ];
    await checkVariables([token], [customVars]);

    await token.removeMinter(Accounts.minterAccount, {
      from: Accounts.masterMinterAccount,
    });
    customVars = [
      {
        variable: "balances.arbitraryAccount",
        expectedValue: newBigNumber(mintAmount),
      },
      { variable: "totalSupply", expectedValue: newBigNumber(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  // Transfer and transferFrom

  it("pt008 should transfer, reducing sender balance by amount and increasing recipient balance by amount", async function () {
    let mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, {
      from: Accounts.masterMinterAccount,
    });
    var customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount),
      },
    ];
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, mintAmount, {
      from: Accounts.minterAccount,
    });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount - mintAmount),
      },
      {
        variable: "balances.arbitraryAccount",
        expectedValue: newBigNumber(mintAmount),
      },
      { variable: "totalSupply", expectedValue: newBigNumber(mintAmount) },
    ];
    await checkVariables([token], [customVars]);

    await token.transfer(Accounts.arbitraryAccount2, mintAmount, {
      from: Accounts.arbitraryAccount,
    });
    customVars = [
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount - mintAmount),
      },
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "balances.arbitraryAccount", expectedValue: bigZero },
      {
        variable: "balances.arbitraryAccount2",
        expectedValue: newBigNumber(mintAmount),
      },
      { variable: "totalSupply", expectedValue: newBigNumber(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  it("pt007 should transferFrom, reducing sender balance by amount and increasing recipient balance by amount", async function () {
    let mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, {
      from: Accounts.masterMinterAccount,
    });
    var customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount),
      },
    ];
    await checkVariables([token], [customVars]);

    await token.mint(Accounts.arbitraryAccount, mintAmount, {
      from: Accounts.minterAccount,
    });
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount - mintAmount),
      },
      {
        variable: "balances.arbitraryAccount",
        expectedValue: newBigNumber(mintAmount),
      },
      { variable: "totalSupply", expectedValue: newBigNumber(mintAmount) },
    ];
    await checkVariables([token], [customVars]);

    await token.approve(Accounts.masterMinterAccount, mintAmount, {
      from: Accounts.arbitraryAccount,
    });
    await token.transferFrom(
      Accounts.arbitraryAccount,
      Accounts.arbitraryAccount2,
      mintAmount,
      { from: Accounts.masterMinterAccount }
    );
    customVars = [
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount - mintAmount),
      },
      { variable: "balances.arbitraryAccount", expectedValue: bigZero },
      {
        variable: "balances.arbitraryAccount2",
        expectedValue: newBigNumber(mintAmount),
      },
      { variable: "totalSupply", expectedValue: newBigNumber(mintAmount) },
    ];
    await checkVariables([token], [customVars]);
  });

  // Update methods

  it("pt004 should updateMasterMinter", async function () {
    await token.updateMasterMinter(Accounts.arbitraryAccount, {
      from: Accounts.tokenOwnerAccount,
    });
    var result = [
      { variable: "masterMinter", expectedValue: Accounts.arbitraryAccount },
    ];
    await checkVariables([token], [result]);
  });

  it("pt005 should updateBlacklister", async function () {
    await token.updateBlacklister(Accounts.arbitraryAccount, {
      from: Accounts.tokenOwnerAccount,
    });
    var result = [
      { variable: "blacklister", expectedValue: Accounts.arbitraryAccount },
    ];
    await checkVariables([token], [result]);
  });

  it("pt003 should updatePauser", async function () {
    await token.updatePauser(Accounts.arbitraryAccount, {
      from: Accounts.tokenOwnerAccount,
    });
    var result = [
      { variable: "pauser", expectedValue: Accounts.arbitraryAccount },
    ];
    await checkVariables([token], [result]);
  });

  // Transfer Ownership

  it("pt009 should set owner to _newOwner", async function () {
    await token.transferOwnership(Accounts.arbitraryAccount, {
      from: Accounts.tokenOwnerAccount,
    });
    var result = [
      { variable: "tokenOwner", expectedValue: Accounts.arbitraryAccount },
    ];
    await checkVariables([token], [result]);
  });
}

var testWrapper = require("./../TestWrapper");
testWrapper.execute("FiatToken_PositiveTests", run_tests);

module.exports = {
  run_tests: run_tests,
};
