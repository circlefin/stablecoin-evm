var tokenUtils = require("./../TokenTestUtils");
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
var upgradeTo = tokenUtils.upgradeTo;
var encodeCall = tokenUtils.encodeCall;
var validateTransferEvent = tokenUtils.validateTransferEvent;
var FiatToken = tokenUtils.FiatToken;
var FiatTokenProxy = tokenUtils.FiatTokenProxy;
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var UpgradedFiatTokenNewFields = tokenUtils.UpgradedFiatTokenNewFields;
var UpgradedFiatTokenNewFieldsNewLogic =
  tokenUtils.UpgradedFiatTokenNewFieldsNewLogic;
var getAdmin = tokenUtils.getAdmin;

var abiUtils = require("./../ABIUtils");
var makeRawTransaction = abiUtils.makeRawTransaction;
var sendRawTransaction = abiUtils.sendRawTransaction;

var AccountUtils = require("./../AccountUtils");
var Accounts = AccountUtils.Accounts;
var AccountPrivateKeys = AccountUtils.AccountPrivateKeys;
var addressEquals = AccountUtils.addressEquals;
var addressNotEquals = AccountUtils.addressNotEquals;

var amount = 100;

async function run_tests(newToken, accounts) {
  beforeEach("Make fresh token contract", async function () {
    rawToken = await newToken();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.isTrue(addressEquals(proxy.address, token.address));
  });

  it("upt001 should upgradeTo new contract and preserve data field values", async function () {
    let mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, {
      from: Accounts.masterMinterAccount,
    });
    await token.mint(Accounts.arbitraryAccount, mintAmount, {
      from: Accounts.minterAccount,
    });
    await token.transfer(Accounts.arbitraryAccount2, mintAmount, {
      from: Accounts.arbitraryAccount,
    });

    var upgradedToken = await UpgradedFiatToken.new();
    var tokenConfig = await upgradeTo(
      proxy,
      upgradedToken,
      Accounts.proxyOwnerAccount
    );
    var newToken = tokenConfig.token;

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
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newToken], [customVars]);
  });

  it("upt002 should upgradeToandCall to contract with new data fields set on initVX and ensure new fields are correct and old data is preserved", async function () {
    let mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, {
      from: Accounts.masterMinterAccount,
    });
    await token.mint(Accounts.arbitraryAccount, mintAmount, {
      from: Accounts.minterAccount,
    });
    await token.transfer(Accounts.arbitraryAccount2, mintAmount, {
      from: Accounts.arbitraryAccount,
    });

    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall(
      "initV2",
      ["bool", "address", "uint256"],
      [true, Accounts.pauserAccount, 12]
    );
    await proxy.upgradeToAndCall(upgradedToken.address, initializeData, {
      from: Accounts.proxyOwnerAccount,
    });
    newProxiedToken = await UpgradedFiatTokenNewFields.at(proxy.address);
    assert.isTrue(addressEquals(newProxiedToken.address, proxy.address));
    addressNotEquals(newProxiedToken.address, upgradedToken.address);

    assert.equal(await newProxiedToken.newBool(), true);
    assert.isTrue(
      addressEquals(await newProxiedToken.newAddress(), Accounts.pauserAccount)
    );
    assert.equal(newBigNumber(12).cmp(await newProxiedToken.newUint()), 0);

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
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  it("upt003 should upgradeToAndCall to contract with new data fields set on initVX and new logic and ensure old data preserved,new logic works, and new fields correct", async function () {
    let mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, {
      from: Accounts.masterMinterAccount,
    });
    await token.mint(Accounts.arbitraryAccount, mintAmount, {
      from: Accounts.minterAccount,
    });
    await token.transfer(Accounts.arbitraryAccount2, mintAmount, {
      from: Accounts.arbitraryAccount,
    });

    var upgradedToken = await UpgradedFiatTokenNewFieldsNewLogic.new();
    const initializeData = encodeCall(
      "initV2",
      ["bool", "address", "uint256"],
      [true, Accounts.pauserAccount, 12]
    );
    await proxy.upgradeToAndCall(upgradedToken.address, initializeData, {
      from: Accounts.proxyOwnerAccount,
    });
    newProxiedToken = await UpgradedFiatTokenNewFieldsNewLogic.at(
      proxy.address
    );
    assert.isTrue(addressEquals(newProxiedToken.address, proxy.address));
    addressNotEquals(newProxiedToken.address, upgradedToken.address);

    assert.equal(await newProxiedToken.newBool(), true);
    assert.isTrue(
      addressEquals(await newProxiedToken.newAddress(), Accounts.pauserAccount)
    );
    assert.equal(newBigNumber(12).cmp(await newProxiedToken.newUint()), 0);

    await newProxiedToken.setNewAddress(Accounts.masterMinterAccount);
    assert.isTrue(
      addressEquals(
        await newProxiedToken.newAddress(),
        Accounts.masterMinterAccount
      )
    );

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
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  it("upt008 should deploy upgraded version of contract with new data fields and without previous deployment and ensure new fields correct", async function () {
    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    const newProxy = await FiatTokenProxy.new(upgradedToken.address, {
      from: Accounts.proxyOwnerAccount,
    });
    proxiedToken = await UpgradedFiatTokenNewFields.at(newProxy.address);

    var data = encodeCall(
      "initialize",
      [
        "string",
        "string",
        "string",
        "uint8",
        "address",
        "address",
        "address",
        "address",
        "bool",
        "address",
        "uint256",
      ],
      [
        name,
        symbol,
        currency,
        decimals,
        Accounts.masterMinterAccount,
        Accounts.pauserAccount,
        Accounts.blacklisterAccount,
        Accounts.tokenOwnerAccount,
        true,
        Accounts.pauserAccount,
        12,
      ]
    );
    var upgradeToRawTx = await makeRawTransaction(
      data,
      Accounts.masterMinterAccount,
      AccountPrivateKeys.masterMinterPrivateKey,
      proxiedToken.address
    );
    await sendRawTransaction(upgradeToRawTx);

    assert.equal(await proxiedToken.newUint(), 12);
    assert.equal(await proxiedToken.newBool(), true);
    assert.isTrue(
      addressEquals(await proxiedToken.newAddress(), Accounts.pauserAccount)
    );

    customVars = [
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([proxiedToken], [customVars]);
  });

  it("upt010 should deploy upgraded version of contract with new data fields and logic without previous deployment and ensure new logic works, and new fields correct", async function () {
    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    const newProxy = await FiatTokenProxy.new(upgradedToken.address, {
      from: Accounts.proxyOwnerAccount,
    });
    proxiedToken = await UpgradedFiatTokenNewFields.at(newProxy.address);

    var data = encodeCall(
      "initialize",
      [
        "string",
        "string",
        "string",
        "uint8",
        "address",
        "address",
        "address",
        "address",
        "bool",
        "address",
        "uint256",
      ],
      [
        name,
        symbol,
        currency,
        decimals,
        Accounts.masterMinterAccount,
        Accounts.pauserAccount,
        Accounts.blacklisterAccount,
        Accounts.tokenOwnerAccount,
        true,
        Accounts.pauserAccount,
        12,
      ]
    );
    var upgradeToRawTx = await makeRawTransaction(
      data,
      Accounts.masterMinterAccount,
      AccountPrivateKeys.masterMinterPrivateKey,
      proxiedToken.address
    );
    await sendRawTransaction(upgradeToRawTx);

    assert.equal(await proxiedToken.newUint(), 12);
    assert.equal(await proxiedToken.newBool(), true);
    assert.isTrue(
      addressEquals(await proxiedToken.newAddress(), Accounts.pauserAccount)
    );

    await newProxiedToken.setNewAddress(Accounts.masterMinterAccount);
    assert.isTrue(
      addressEquals(
        await newProxiedToken.newAddress(),
        Accounts.masterMinterAccount
      )
    );

    customVars = [
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([proxiedToken], [customVars]);
  });

  it("upt004 should update proxy adminAccount with previous adminAccount", async function () {
    await proxy.changeAdmin(Accounts.masterMinterAccount, {
      from: Accounts.proxyOwnerAccount,
    });
    customVars = [
      { variable: "proxyOwner", expectedValue: Accounts.masterMinterAccount },
    ];
    await checkVariables([token], [customVars]);
  });

  it("upt005 should receive Transfer event on transfer when proxied after upgrade", async function () {
    let mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, {
      from: Accounts.masterMinterAccount,
    });
    await token.mint(Accounts.arbitraryAccount, mintAmount + 1, {
      from: Accounts.minterAccount,
    });
    await token.transfer(Accounts.arbitraryAccount2, mintAmount, {
      from: Accounts.arbitraryAccount,
    });

    var upgradedToken = await UpgradedFiatToken.new();
    var tokenConfig = await upgradeTo(
      proxy,
      upgradedToken,
      Accounts.proxyOwnerAccount
    );
    var newToken = tokenConfig.token;

    transfer = await newToken.transfer(Accounts.arbitraryAccount2, 1, {
      from: Accounts.arbitraryAccount,
    });
    validateTransferEvent(
      transfer,
      Accounts.arbitraryAccount,
      Accounts.arbitraryAccount2,
      1
    );

    customVars = [
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: newBigNumber(amount - mintAmount - 1),
      },
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "balances.arbitraryAccount", expectedValue: bigZero },
      {
        variable: "balances.arbitraryAccount2",
        expectedValue: newBigNumber(mintAmount + 1),
      },
      { variable: "totalSupply", expectedValue: newBigNumber(mintAmount + 1) },
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newToken], [customVars]);
  });

  it("upt006 should upgrade while paused and upgraded contract should be paused as a result; then unpause should unpause contract", async function () {
    await token.pause({ from: Accounts.pauserAccount });
    var upgradedToken = await UpgradedFiatToken.new();
    var tokenConfig = await upgradeTo(
      proxy,
      upgradedToken,
      Accounts.proxyOwnerAccount
    );
    var newToken = tokenConfig.token;

    customVars = [
      { variable: "paused", expectedValue: true },
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newToken], [customVars]);

    await newToken.unpause({ from: Accounts.pauserAccount });

    customVars2 = [
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newToken], [customVars2]);
  });

  it("upt007 should upgrade contract to original address", async function () {
    let mintAmount = 50;

    await token.configureMinter(Accounts.minterAccount, amount, {
      from: Accounts.masterMinterAccount,
    });
    await token.mint(Accounts.arbitraryAccount, mintAmount, {
      from: Accounts.minterAccount,
    });
    await token.transfer(Accounts.arbitraryAccount2, mintAmount, {
      from: Accounts.arbitraryAccount,
    });

    var tokenConfig = await upgradeTo(
      proxy,
      rawToken,
      Accounts.proxyOwnerAccount
    );
    var sameToken = tokenConfig.token;
    sameToken.proxiedTokenAddress = rawToken.address;

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
    await checkVariables([sameToken], [customVars]);
  });

  it("upt009 should check that admin is set correctly by proxy constructor", async function () {
    assert.isTrue(
      addressEquals(await getAdmin(token), Accounts.proxyOwnerAccount)
    );
  });

  it("upt011 should upgradeToAndCall while paused and upgraded contract should be paused as a result", async function () {
    await token.pause({ from: Accounts.pauserAccount });

    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall(
      "initV2",
      ["bool", "address", "uint256"],
      [true, Accounts.pauserAccount, 12]
    );
    await proxy.upgradeToAndCall(upgradedToken.address, initializeData, {
      from: Accounts.proxyOwnerAccount,
    });
    newProxiedToken = await UpgradedFiatTokenNewFields.at(proxy.address);
    assert.isTrue(addressEquals(newProxiedToken.address, proxy.address));
    addressNotEquals(newProxiedToken.address, upgradedToken.address);

    customVars = [
      { variable: "paused", expectedValue: true },
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  it("upt012 should upgradeToAndCall while proxyOwner is blacklisted", async function () {
    await token.blacklist(Accounts.proxyOwnerAccount, {
      from: Accounts.blacklisterAccount,
    });

    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall(
      "initV2",
      ["bool", "address", "uint256"],
      [true, Accounts.pauserAccount, 12]
    );
    await proxy.upgradeToAndCall(upgradedToken.address, initializeData, {
      from: Accounts.proxyOwnerAccount,
    });
    newProxiedToken = await UpgradedFiatTokenNewFields.at(proxy.address);

    customVars = [
      {
        variable: "isAccountBlacklisted.proxyOwnerAccount",
        expectedValue: true,
      },
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  it("upt013 should upgradeToAndCall while new logic is blacklisted", async function () {
    var upgradedToken = await UpgradedFiatTokenNewFields.new();
    await token.blacklist(upgradedToken.address, {
      from: Accounts.blacklisterAccount,
    });

    const initializeData = encodeCall(
      "initV2",
      ["bool", "address", "uint256"],
      [true, Accounts.pauserAccount, 12]
    );
    await proxy.upgradeToAndCall(upgradedToken.address, initializeData, {
      from: Accounts.proxyOwnerAccount,
    });
    newProxiedToken = await UpgradedFiatTokenNewFields.at(proxy.address);

    customVars = [
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  it("upt014 should upgradeTo while new logic is blacklisted", async function () {
    var upgradedToken = await UpgradedFiatToken.new();
    await token.blacklist(upgradedToken.address, {
      from: Accounts.blacklisterAccount,
    });

    var tokenConfig = await upgradeTo(
      proxy,
      upgradedToken,
      Accounts.proxyOwnerAccount
    );
    var newToken = tokenConfig.token;

    customVars = [
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newToken], [customVars]);
  });
}

var testWrapper = require("./../TestWrapper");
testWrapper.execute("FiatToken_ProxyPositiveTests", run_tests);

module.exports = {
  run_tests: run_tests,
};
