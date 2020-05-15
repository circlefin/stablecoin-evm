const wrapTests = require("./helpers/wrapTests");
const BN = require("bn.js");
const {
  bigZero,
  checkVariables,
  name,
  symbol,
  currency,
  decimals,
  arbitraryAccount,
  upgraderAccount,
  tokenOwnerAccount,
  blacklisterAccount,
  masterMinterAccount,
  masterMinterAccountPrivateKey,
  minterAccount,
  pauserAccount,
  proxyOwnerAccount,
  initializeTokenWithProxy,
  upgradeTo,
  encodeCall,
  validateTransferEvent,
  FiatTokenProxy,
  UpgradedFiatToken,
  UpgradedFiatTokenNewFields,
  UpgradedFiatTokenNewFieldsNewLogic,
  getAdmin,
} = require("./helpers/tokenTest");
const { makeRawTransaction, sendRawTransaction } = require("./helpers/abi");

const amount = 100;

function runTests(newToken, _accounts) {
  let rawToken, proxy, token;

  beforeEach(async () => {
    rawToken = await newToken();
    const tokenConfig = await initializeTokenWithProxy(rawToken);
    ({ proxy, token } = tokenConfig);
    assert.strictEqual(proxy.address, token.address);
  });

  it("upt001 should upgradeTo new contract and preserve data field values", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });

    const upgradedToken = await UpgradedFiatToken.new();
    const tokenConfig = await upgradeTo(
      proxy,
      upgradedToken,
      proxyOwnerAccount
    );
    const newToken = tokenConfig.token;

    const customVars = [
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "balances.arbitraryAccount", expectedValue: bigZero },
      { variable: "balances.pauserAccount", expectedValue: new BN(mintAmount) },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newToken], [customVars]);
  });

  it("upt002 should upgradeToandCall to contract with new data fields set on initVX and ensure new fields are correct and old data is preserved", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });

    const upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall(
      "initV2",
      ["bool", "address", "uint256"],
      [true, pauserAccount, 12]
    );
    await proxy.upgradeToAndCall(upgradedToken.address, initializeData, {
      from: proxyOwnerAccount,
    });
    const newProxiedToken = await UpgradedFiatTokenNewFields.at(proxy.address);
    assert.strictEqual(newProxiedToken.address, proxy.address);
    assert.notEqual(newProxiedToken.address, upgradedToken.address);

    assert.strictEqual(await newProxiedToken.newBool(), true);
    assert.strictEqual(await newProxiedToken.newAddress(), pauserAccount);
    assert.strictEqual(new BN(12).eq(await newProxiedToken.newUint()), true);

    const customVars = [
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount),
      },
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "balances.arbitraryAccount", expectedValue: bigZero },
      { variable: "balances.pauserAccount", expectedValue: new BN(mintAmount) },
      { variable: "totalSupply", expectedValue: new BN(mintAmount) },
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  it("upt003 should upgradeToAndCall to contract with new data fields set on initVX and new logic and ensure old data preserved,new logic works, and new fields correct", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });

    const upgradedToken = await UpgradedFiatTokenNewFieldsNewLogic.new();
    const initializeData = encodeCall(
      "initV2",
      ["bool", "address", "uint256"],
      [true, pauserAccount, 12]
    );
    await proxy.upgradeToAndCall(upgradedToken.address, initializeData, {
      from: proxyOwnerAccount,
    });
    const newProxiedToken = await UpgradedFiatTokenNewFieldsNewLogic.at(
      proxy.address
    );
    assert.strictEqual(newProxiedToken.address, proxy.address);
    assert.notEqual(newProxiedToken.address, upgradedToken.address);

    assert.strictEqual(await newProxiedToken.newBool(), true);
    assert.strictEqual(await newProxiedToken.newAddress(), pauserAccount);
    assert.strictEqual(new BN(12).eq(await newProxiedToken.newUint()), true);

    await newProxiedToken.setNewAddress(masterMinterAccount);
    assert.strictEqual(await newProxiedToken.newAddress(), masterMinterAccount);

    const customVars = [
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
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  it("upt008 should deploy upgraded version of contract with new data fields and without previous deployment and ensure new fields correct", async () => {
    const upgradedToken = await UpgradedFiatTokenNewFields.new();
    const newProxy = await FiatTokenProxy.new(upgradedToken.address, {
      from: proxyOwnerAccount,
    });
    const proxiedToken = await UpgradedFiatTokenNewFields.at(newProxy.address);

    const data = encodeCall(
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
        masterMinterAccount,
        pauserAccount,
        blacklisterAccount,
        tokenOwnerAccount,
        true,
        pauserAccount,
        12,
      ]
    );
    const upgradeToRawTx = await makeRawTransaction(
      data,
      masterMinterAccount,
      masterMinterAccountPrivateKey,
      proxiedToken.address
    );
    await sendRawTransaction(upgradeToRawTx);

    assert.isTrue((await proxiedToken.newUint()).eqn(12));
    assert.strictEqual(await proxiedToken.newBool(), true);
    assert.strictEqual(await proxiedToken.newAddress(), pauserAccount);

    const customVars = [
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([proxiedToken], [customVars]);
  });

  it("upt010 should deploy upgraded version of contract with new data fields and logic without previous deployment and ensure new logic works, and new fields correct", async () => {
    const upgradedToken = await UpgradedFiatTokenNewFieldsNewLogic.new();
    const newProxy = await FiatTokenProxy.new(upgradedToken.address, {
      from: proxyOwnerAccount,
    });
    const proxiedToken = await UpgradedFiatTokenNewFieldsNewLogic.at(
      newProxy.address
    );

    const data = encodeCall(
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
        masterMinterAccount,
        pauserAccount,
        blacklisterAccount,
        tokenOwnerAccount,
        true,
        pauserAccount,
        12,
      ]
    );
    const upgradeToRawTx = await makeRawTransaction(
      data,
      masterMinterAccount,
      masterMinterAccountPrivateKey,
      proxiedToken.address
    );
    await sendRawTransaction(upgradeToRawTx);

    assert.isTrue((await proxiedToken.newUint()).eqn(12));
    assert.strictEqual(await proxiedToken.newBool(), true);
    assert.strictEqual(await proxiedToken.newAddress(), pauserAccount);

    await proxiedToken.setNewAddress(masterMinterAccount);
    assert.strictEqual(await proxiedToken.newAddress(), masterMinterAccount);

    const customVars = [
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([proxiedToken], [customVars]);
  });

  it("upt004 should update proxy adminAccount with previous adminAccount", async () => {
    await proxy.changeAdmin(masterMinterAccount, { from: proxyOwnerAccount });
    const customVars = [
      { variable: "upgrader", expectedValue: masterMinterAccount },
    ];
    await checkVariables([token], [customVars]);
  });

  it("upt005 should receive Transfer event on transfer when proxied after upgrade", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, mintAmount + 1, { from: minterAccount });
    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });

    const upgradedToken = await UpgradedFiatToken.new();
    const tokenConfig = await upgradeTo(
      proxy,
      upgradedToken,
      proxyOwnerAccount
    );
    const newToken = tokenConfig.token;

    const transfer = await newToken.transfer(pauserAccount, 1, {
      from: arbitraryAccount,
    });
    validateTransferEvent(transfer, arbitraryAccount, pauserAccount, new BN(1));

    const customVars = [
      {
        variable: "minterAllowance.minterAccount",
        expectedValue: new BN(amount - mintAmount - 1),
      },
      { variable: "isAccountMinter.minterAccount", expectedValue: true },
      { variable: "balances.arbitraryAccount", expectedValue: bigZero },
      {
        variable: "balances.pauserAccount",
        expectedValue: new BN(mintAmount + 1),
      },
      { variable: "totalSupply", expectedValue: new BN(mintAmount + 1) },
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newToken], [customVars]);
  });

  it("upt006 should upgrade while paused and upgraded contract should be paused as a result; then unpause should unpause contract", async () => {
    await token.pause({ from: pauserAccount });
    const upgradedToken = await UpgradedFiatToken.new();
    const tokenConfig = await upgradeTo(
      proxy,
      upgradedToken,
      proxyOwnerAccount
    );
    const newToken = tokenConfig.token;

    const customVars = [
      { variable: "paused", expectedValue: true },
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newToken], [customVars]);

    await newToken.unpause({ from: pauserAccount });

    const customVars2 = [
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newToken], [customVars2]);
  });

  it("upt007 should upgrade contract to original address", async () => {
    const mintAmount = 50;

    await token.configureMinter(minterAccount, amount, {
      from: masterMinterAccount,
    });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });

    const tokenConfig = await upgradeTo(proxy, rawToken, proxyOwnerAccount);
    const sameToken = tokenConfig.token;
    sameToken.proxiedTokenAddress = rawToken.address;

    const customVars = [
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
    await checkVariables([sameToken], [customVars]);
  });

  it("upt009 should check that admin is set correctly by proxy constructor", async () => {
    assert.strictEqual(
      web3.utils.toChecksumAddress(await getAdmin(token)),
      upgraderAccount
    );
  });

  it("upt011 should upgradeToAndCall while paused and upgraded contract should be paused as a result", async () => {
    await token.pause({ from: pauserAccount });

    const upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall(
      "initV2",
      ["bool", "address", "uint256"],
      [true, pauserAccount, 12]
    );
    await proxy.upgradeToAndCall(upgradedToken.address, initializeData, {
      from: proxyOwnerAccount,
    });
    const newProxiedToken = await UpgradedFiatTokenNewFields.at(proxy.address);
    assert.strictEqual(newProxiedToken.address, proxy.address);
    assert.notEqual(newProxiedToken.address, upgradedToken.address);

    const customVars = [
      { variable: "paused", expectedValue: true },
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  it("upt012 should upgradeToAndCall while upgrader is blacklisted", async () => {
    await token.blacklist(proxyOwnerAccount, { from: blacklisterAccount });

    const upgradedToken = await UpgradedFiatTokenNewFields.new();
    const initializeData = encodeCall(
      "initV2",
      ["bool", "address", "uint256"],
      [true, pauserAccount, 12]
    );
    await proxy.upgradeToAndCall(upgradedToken.address, initializeData, {
      from: proxyOwnerAccount,
    });
    const newProxiedToken = await UpgradedFiatTokenNewFields.at(proxy.address);

    const customVars = [
      { variable: "isAccountBlacklisted.upgraderAccount", expectedValue: true },
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  it("upt013 should upgradeToAndCall while new logic is blacklisted", async () => {
    const upgradedToken = await UpgradedFiatTokenNewFields.new();
    await token.blacklist(upgradedToken.address, { from: blacklisterAccount });

    const initializeData = encodeCall(
      "initV2",
      ["bool", "address", "uint256"],
      [true, pauserAccount, 12]
    );
    await proxy.upgradeToAndCall(upgradedToken.address, initializeData, {
      from: proxyOwnerAccount,
    });
    const newProxiedToken = await UpgradedFiatTokenNewFields.at(proxy.address);

    const customVars = [
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  it("upt014 should upgradeTo while new logic is blacklisted", async () => {
    const upgradedToken = await UpgradedFiatToken.new();
    await token.blacklist(upgradedToken.address, { from: blacklisterAccount });

    const tokenConfig = await upgradeTo(
      proxy,
      upgradedToken,
      proxyOwnerAccount
    );
    const newToken = tokenConfig.token;

    const customVars = [
      { variable: "proxiedTokenAddress", expectedValue: upgradedToken.address },
    ];
    await checkVariables([newToken], [customVars]);
  });
}

wrapTests("FiatToken proxy positive", runTests);
