var FiatToken = artifacts.require('FiatToken');
var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var BigNumber = require('bignumber.js');
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var checkVariables = tokenUtils.checkVariables;
var expectRevert = tokenUtils.expectRevert;
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var deployerAccount = tokenUtils.deployerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var upgraderAccount = tokenUtils.upgraderAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;

var amount = 100;

async function run_tests_common(newToken) {

  beforeEach('Make fresh token contract', async function () {
    token = await newToken();
  });

  it('should check that default variable values are correct', async function () {
    await checkVariables([token], [[]]);
  });


  it('fd001 should forward balanceOf to upgraded contract', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    let dataContractAddress = await token.getDataContractAddress();
    await token.mint(arbitraryAccount, 50, {from: minterAccount});

    var newToken = await UpgradedFiatToken.new(
      "0x0",
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = await newToken.getDataContractAddress();

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    await newToken.mint(arbitraryAccount, amount, {from: minterAccount});

    var oldToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    assert.isTrue(new BigNumber(await token.balanceOf(arbitraryAccount)).isEqualTo(new BigNumber(amount)));
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd002 should forward approve to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;
    
    await token.upgrade(newToken.address, { from: upgraderAccount });
    await token.approve(minterAccount, amount, {from: arbitraryAccount});

    var oldToken_result = [
      {'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd003 should forward transferFrom to upgraded contract', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    let dataContractAddress = await token.getDataContractAddress();
    await token.mint(arbitraryAccount, amount, {from: minterAccount});
    await token.approve(minterAccount, amount, {from: arbitraryAccount});

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;
    
    await token.upgrade(newToken.address, { from: upgraderAccount });
    await token.transferFrom(arbitraryAccount, minterAccount, amount, {from: minterAccount});

    var oldToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd004 should forward transfer to upgraded contract', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    let dataContractAddress = await token.getDataContractAddress();
    await token.mint(arbitraryAccount, amount, {from: minterAccount});

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;
    
    await token.upgrade(newToken.address, { from: upgraderAccount });
    await token.transfer(minterAccount, amount, {from: arbitraryAccount});

    var oldToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd005 should forward allowance to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.approve(minterAccount, 50, {from: arbitraryAccount});

    var newToken = await UpgradedFiatToken.new(
      "0x0",
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = await newToken.getDataContractAddress();
    
    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.approve(minterAccount, amount, {from: arbitraryAccount});

    var oldToken_result = [
      {'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, minterAccount)).isEqualTo(new BigNumber(amount)));
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd006 should forward totalSupply to upgraded contract', async function () {
    await token.configureMinter(minterAccount, 50, {from: masterMinterAccount});
    let dataContractAddress = await token.getDataContractAddress();
    await token.mint(arbitraryAccount, 50, {from: minterAccount});

    var newToken = await UpgradedFiatToken.new(
      "0x0",
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = await newToken.getDataContractAddress();

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    await newToken.mint(arbitraryAccount, amount, {from: minterAccount});

    var oldToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    assert.isTrue(new BigNumber(await token.totalSupply()).isEqualTo(new BigNumber(amount)));
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd007 should not forward name to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      "superAwesomeCoin",
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'name', 'expectedValue': "superAwesomeCoin" },
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    assert.isTrue(await token.name() != "superAwesomeCoin");
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd008 should not forward decimals to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      10,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'decimals', 'expectedValue': new BigNumber(10) },
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    assert.isTrue(!(new BigNumber(await token.decimals()).isEqualTo(new BigNumber(10))));
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd009 should not forward currency to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      "ABC",
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'currency', 'expectedValue': "ABC" },
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    assert.isTrue(await token.currency() != "ABC");
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd010 should not forward symbol to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      "XYZ",
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'symbol', 'expectedValue': "XYZ" },
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    assert.isTrue(await token.currency() != "XYZ");
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd011 should forward isAccountBlacklisted to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.blacklist(arbitraryAccount, {from: blacklisterAccount});

    var oldToken_result = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true },
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true },
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    assert.equal(await token.isAccountBlacklisted(arbitraryAccount), true);
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd013 should block unBlacklist on prior contract when upgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await expectRevert(token.unBlacklist(arbitraryAccount, {from: blacklisterAccount}));

    var oldToken_result = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true },
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true },
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd014 should block blacklist on prior contract when upgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await expectRevert(token.blacklist(arbitraryAccount, {from: blacklisterAccount}));

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });


  it('fd015 should not forward upgrader to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      upgraderAccount,
      blacklisterAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'upgrader', 'expectedValue': blacklisterAccount },
      {'variable': 'blacklister', 'expectedValue': upgraderAccount },
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    assert.isFalse(await token.upgrader() == blacklisterAccount);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd016 should not forward blacklister to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      upgraderAccount,
      blacklisterAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'upgrader', 'expectedValue': blacklisterAccount },
      {'variable': 'blacklister', 'expectedValue': upgraderAccount },
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    assert.isFalse(await token.blacklister() == upgraderAccount);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd017 should not forward masterMinter to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      pauserAccount,
      masterMinterAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'masterMinter', 'expectedValue': pauserAccount },
      {'variable': 'pauser', 'expectedValue': masterMinterAccount },
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    assert.isFalse(await token.masterMinter() == pauserAccount);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd018 should not forward owner to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      tokenOwnerAccount,
      upgraderAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'tokenOwner', 'expectedValue': upgraderAccount },
      {'variable': 'upgrader', 'expectedValue': tokenOwnerAccount },
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    assert.isFalse(await token.owner() == upgraderAccount);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd019 should not forward pauser to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      pauserAccount,
      masterMinterAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'pauser', 'expectedValue': masterMinterAccount },
      {'variable': 'masterMinter', 'expectedValue': pauserAccount },
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    assert.isFalse(await token.pauser() == masterMinterAccount);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd020 should not forward updateUpgraderAddress to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await token.updateUpgraderAddress(masterMinterAccount, {from: upgraderAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgrader', 'expectedValue': masterMinterAccount },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd021 should not forward updateMasterMinter to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await token.updateMasterMinter(pauserAccount, {from: tokenOwnerAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'masterMinter', 'expectedValue': pauserAccount },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd022 should not forward updateBlacklister to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await token.updateBlacklister(pauserAccount, {from: tokenOwnerAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'blacklister', 'expectedValue': pauserAccount },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd023 should not forward updatePauser to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await token.updatePauser(blacklisterAccount, {from: tokenOwnerAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'pauser', 'expectedValue': blacklisterAccount },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd024 should not forward transferOwnership to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await token.transferOwnership(blacklisterAccount, {from: tokenOwnerAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'tokenOwner', 'expectedValue': blacklisterAccount },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd025 should not forward getDataContractAddress to upgraded contract', async function () {
    let originalDataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      "0x0",
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    let dataContractAddress = await newToken.getDataContractAddress();

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    assert.notEqual(await token.getDataContractAddress(), dataContractAddress);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd027 should not forward upgradedAddress to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    assert.notEqual(await token.upgradedAddress(), await newToken.upgradedAddress());

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd028 should block removeMinter on prior contract when upgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await expectRevert(token.removeMinter(minterAccount, {from: masterMinterAccount}));

    var oldToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd029 should not forward pause to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await token.pause({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'paused', 'expectedValue': true},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    assert.equal(await newToken.paused(), false);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd030 should not forward unpause to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.pause({from: pauserAccount});
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.pause({from: pauserAccount});
    await token.unpause({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'paused', 'expectedValue': true},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    assert.equal(await newToken.paused(), true);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd031 should block mint on prior contract when upgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;
    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.mint(arbitraryAccount, 50, {from: minterAccount});
    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));

    var oldToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd032 should block burn on prior contract when upgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.configureMinter(minterAccount, 200, {from: masterMinterAccount});
    await token.mint(minterAccount, 50, {from: minterAccount});

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;


    await token.upgrade(newToken.address, { from: upgraderAccount });
    await expectRevert(token.burn(50, {from: minterAccount}));
    await newToken.burn(50, {from: minterAccount});

    var oldToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(150)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(150)},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd033 should block configureMinter on prior contract when upgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await expectRevert(token.configureMinter(pauserAccount, amount, {from: masterMinterAccount}));

    var oldToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd034 should allow isAccountMinter to query storage contract as if from upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.configureMinter(minterAccount, amount, {from: masterMinterAccount});

    var oldToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    assert.isTrue(await token.isAccountMinter(minterAccount));

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd035 should not forward isUpgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    assert.isFalse(await newToken.isUpgraded());

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd036 should allow minterAllowance to query storage contract as if from upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    
    await newToken.configureMinter(minterAccount, 200, {from: masterMinterAccount});

    var oldToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(200)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(200)},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    assert.equal(await token.minterAllowance(minterAccount), 200);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd037 should not forward paused to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    
    await newToken.pause({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'paused', 'expectedValue': true},
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ];

    assert.isFalse(await token.paused());

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });
}

async function run_tests_common_upgraded_disabled(newToken) {

  beforeEach('Make fresh token contract', async function () {
    token = await newToken();
  });

  it('should check that default variable values are correct', async function () {
    await checkVariables([token], [[]]);
  });


  it('fd041 should not forward balanceOf to upgraded contract', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    let dataContractAddress = await token.getDataContractAddress();
    await token.mint(arbitraryAccount, 50, {from: minterAccount});

    var newToken = await UpgradedFiatToken.new(
      "0x0",
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = await newToken.getDataContractAddress();

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await newToken.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    await newToken.mint(arbitraryAccount, amount, {from: minterAccount});

    var oldToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    assert.isTrue(new BigNumber(await token.balanceOf(arbitraryAccount)).isEqualTo(new BigNumber(amount)));
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd042 should not forward approve to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;
    
    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});

    expectRevert(token.approve(minterAccount, amount, {from: arbitraryAccount}));

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd043 should not forward transferFrom to upgraded contract', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    let dataContractAddress = await token.getDataContractAddress();
    await token.mint(arbitraryAccount, amount, {from: minterAccount});
    await token.approve(minterAccount, amount, {from: arbitraryAccount});

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;
    
    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await expectRevert(token.transferFrom(arbitraryAccount, minterAccount, amount, {from: minterAccount}));

    var oldToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd044 should not forward transfer to upgraded contract', async function () {
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    let dataContractAddress = await token.getDataContractAddress();
    await token.mint(arbitraryAccount, amount, {from: minterAccount});

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;
    
    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await expectRevert(token.transfer(minterAccount, amount, {from: arbitraryAccount}));

    var oldToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd045 should not forward allowance to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.approve(minterAccount, 50, {from: arbitraryAccount});

    var newToken = await UpgradedFiatToken.new(
      "0x0",
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = await newToken.getDataContractAddress();
    
    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await newToken.approve(minterAccount, amount, {from: arbitraryAccount});

    var oldToken_result = [
      {'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'allowance.arbitraryAccount.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    assert.isTrue(new BigNumber(await token.allowance(arbitraryAccount, minterAccount)).isEqualTo(new BigNumber(amount)));
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd046 should not forward total supply to upgraded contract', async function () {
    await token.configureMinter(minterAccount, 50, {from: masterMinterAccount});
    let dataContractAddress = await token.getDataContractAddress();
    await token.mint(arbitraryAccount, 50, {from: minterAccount});

    var newToken = await UpgradedFiatToken.new(
      "0x0",
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = await newToken.getDataContractAddress();

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await newToken.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    await newToken.mint(arbitraryAccount, amount, {from: minterAccount});

    var oldToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(amount)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    assert.isTrue(new BigNumber(await token.totalSupply()).isEqualTo(new BigNumber(amount)));
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd047 should not forward name to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      "superAwesomeCoin",
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'name', 'expectedValue': "superAwesomeCoin" },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    assert.isTrue(await token.name() != "superAwesomeCoin");
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd048 should not forward decimals to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      10,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'decimals', 'expectedValue': new BigNumber(10) },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    assert.isTrue(!(new BigNumber(await token.decimals()).isEqualTo(new BigNumber(10))));
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd049 should not forward currency to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      "ABC",
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'currency', 'expectedValue': "ABC" },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    assert.isTrue(await token.currency() != "ABC");
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd050 should not forward symbol to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      "XYZ",
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'symbol', 'expectedValue': "XYZ" },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    assert.isTrue(await token.currency() != "XYZ");
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd051 should allow isAccountBlacklisted to query storage as if from upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await newToken.blacklist(arbitraryAccount, {from: blacklisterAccount});

    var oldToken_result = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true },
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    assert.equal(await token.isAccountBlacklisted(arbitraryAccount), true);
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd053 should block unBlacklist on prior contract when upgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.blacklist(arbitraryAccount, {from: blacklisterAccount});

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await expectRevert(token.unBlacklist(arbitraryAccount, {from: blacklisterAccount}));

    var oldToken_result = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true },
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd054 should block blacklist on prior contract when upgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await expectRevert(token.blacklist(arbitraryAccount, {from: blacklisterAccount}));

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });


  it('fd055 should not forward upgrader to upgraded Contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      upgraderAccount,
      blacklisterAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'upgrader', 'expectedValue': blacklisterAccount },
      {'variable': 'blacklister', 'expectedValue': upgraderAccount },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    assert.isFalse(await token.upgrader() == blacklisterAccount);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd056 should not forward blacklister to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      upgraderAccount,
      blacklisterAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'upgrader', 'expectedValue': blacklisterAccount },
      {'variable': 'blacklister', 'expectedValue': upgraderAccount },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    assert.isFalse(await token.blacklister() == upgraderAccount);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd057 should not forward masterMinter to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      pauserAccount,
      masterMinterAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: masterMinterAccount}); //new pauser - switched to masterMinterAccount

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'masterMinter', 'expectedValue': pauserAccount },
      {'variable': 'pauser', 'expectedValue': masterMinterAccount },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    assert.isFalse(await token.masterMinter() == pauserAccount);
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd058 should not forward owner to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      tokenOwnerAccount,
      upgraderAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'tokenOwner', 'expectedValue': upgraderAccount },
      {'variable': 'upgrader', 'expectedValue': tokenOwnerAccount },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    assert.isFalse(await token.owner() == upgraderAccount);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd059 should not forward pauser to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      pauserAccount,
      masterMinterAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: masterMinterAccount}); //New pauser - switched to masterMinterAccount

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'pauser', 'expectedValue': masterMinterAccount },
      {'variable': 'masterMinter', 'expectedValue': pauserAccount },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    assert.isFalse(await token.pauser() == masterMinterAccount);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd060 should not forward updateUpgraderAddress to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await token.updateUpgraderAddress(masterMinterAccount, {from: upgraderAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgrader', 'expectedValue': masterMinterAccount },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd061 should not forward updateMasterMinter to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await token.updateMasterMinter(pauserAccount, {from: tokenOwnerAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'masterMinter', 'expectedValue': pauserAccount },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd062 should not forward updateBlacklister to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await token.updateBlacklister(pauserAccount, {from: tokenOwnerAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'blacklister', 'expectedValue': pauserAccount },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd063 should not forward updatePauser to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await token.updatePauser(blacklisterAccount, {from: tokenOwnerAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'pauser', 'expectedValue': blacklisterAccount },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd064 should not forward transferOwnership to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await token.transferOwnership(blacklisterAccount, {from: tokenOwnerAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'tokenOwner', 'expectedValue': blacklisterAccount },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd065 should not forward getDataContractAddress to upgraded contract', async function () {
    let originalDataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      "0x0",
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    let dataContractAddress = await newToken.getDataContractAddress();

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    assert.notEqual(await token.getDataContractAddress(), dataContractAddress);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd067 should not forward upgradedAddress to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount,
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    assert.notEqual(await token.upgradedAddress(), await newToken.upgradedAddress());

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd068 should block removeMinter on prior contract when upgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await expectRevert(token.removeMinter(minterAccount, {from: masterMinterAccount}));

    var oldToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];
    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd069 should not forward pause to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await token.pause({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'paused', 'expectedValue': true},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    assert.equal(await newToken.paused(), false);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd070 should not forward unpause to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.pause({from: pauserAccount});
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await newToken.pause({from: pauserAccount});
    await token.unpause({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'paused', 'expectedValue': true},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    assert.equal(await newToken.paused(), true);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd071 should block mint on prior contract when upgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;
    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await newToken.mint(arbitraryAccount, 50, {from: minterAccount});
    await expectRevert(token.mint(arbitraryAccount, 50, {from: minterAccount}));

    var oldToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(50)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'balances.arbitraryAccount', 'expectedValue': new BigNumber(50)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd072 should block burn on prior contract when upgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.configureMinter(minterAccount, 200, {from: masterMinterAccount});
    await token.mint(minterAccount, 50, {from: minterAccount});

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;


    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await expectRevert(token.burn(50, {from: minterAccount}));
    await newToken.burn(50, {from: minterAccount});

    var oldToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(150)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(150)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd073 should block configureMinter on prior contract when upgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await expectRevert(token.configureMinter(pauserAccount, amount, {from: masterMinterAccount}));

    var oldToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd074 should allow isAccountMinter to query storage contract as if from upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    await newToken.configureMinter(minterAccount, amount, {from: masterMinterAccount});

    var oldToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    assert.isTrue(await token.isAccountMinter(minterAccount));

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd075 should not forward isUpgraded to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    assert.isFalse(await newToken.isUpgraded());

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd076 should allow minterAllowance to query storage contract as if from upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    await token.configureMinter(minterAccount, amount, {from: masterMinterAccount});
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    
    await newToken.configureMinter(minterAccount, 200, {from: masterMinterAccount});

    var oldToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(200)},
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(200)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    assert.equal(await token.minterAllowance(minterAccount), 200);

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

  it('fd077 should not forward paused to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();

    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );

    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, { from: upgraderAccount });
    await newToken.disablePriorContract({from: pauserAccount});
    
    await newToken.pause({from: pauserAccount});

    var oldToken_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var newToken_result = [
      {'variable': 'paused', 'expectedValue': true},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ];

    assert.isFalse(await token.paused());

    await checkVariables([token, newToken], [oldToken_result, newToken_result]);
  });

}

async function run_tests_upgraded_only(newToken) {

  beforeEach('Make fresh token contract', async function () {
    token = await newToken();
  });

  it('should check that default variable values are correct', async function () {
    await checkVariables([token], [[]]);
  });

  it('fd038 should block transferFromViaPriorContract if called directly (not from prior contract)', async function () {
    await token.configureMinter(minterAccount, 200, {from: masterMinterAccount});
    await token.mint(pauserAccount, 100, {from: minterAccount});
    await token.approve(arbitraryAccount, 100, {from: pauserAccount});
    await expectRevert(token.transferFromViaPriorContract(arbitraryAccount, pauserAccount, blacklisterAccount, 50, {from: arbitraryAccount}));

    var tokenOld_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(100)},
      {'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'allowance.pauserAccount.arbitraryAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'storageOwner', 'expectedValue': token.address },
      {'variable': 'upgradedAddress', 'expectedValue': token.address }
    ]
    var tokenNew_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(100)},
      {'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'allowance.pauserAccount.arbitraryAccount', 'expectedValue': new BigNumber(100)},
    ]
    let tokenOld = token.priorToken;
    await checkVariables([tokenOld, token], [tokenOld_result, tokenNew_result]);
  });

  it('fd039 should block transferViaPriorContract if called directly (not from prior contract)', async function () {
    await token.configureMinter(minterAccount, 200, {from: masterMinterAccount});
    await token.mint(pauserAccount, 100, {from: minterAccount});
    await expectRevert(token.transferViaPriorContract(pauserAccount, arbitraryAccount, 50, {from: pauserAccount}));

    var tokenOld_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(100)},
      {'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'storageOwner', 'expectedValue': token.address },
      {'variable': 'upgradedAddress', 'expectedValue': token.address }
    ]
    var tokenNew_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(100)},
      {'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(100)},
    ]
    let tokenOld = token.priorToken;
    await checkVariables([tokenOld, token], [tokenOld_result, tokenNew_result]);
  });


  it('fd040 should block approveViaPriorContract if called directly (not from prior contract)', async function () {
    await expectRevert(token.approveViaPriorContract(pauserAccount, arbitraryAccount, 50, {from: pauserAccount}));

    var tokenOld_result = [
      {'variable': 'storageOwner', 'expectedValue': token.address },
      {'variable': 'upgradedAddress', 'expectedValue': token.address }
    ]
    var tokenNew_result = [
    ]
    let tokenOld = token.priorToken;
    await checkVariables([tokenOld, token], [tokenOld_result, tokenNew_result]);
  });


  it('fd026 should not forward priorContractAddress to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, {from:upgraderAccount});

    assert.notEqual(await token.priorContractAddress(), await newToken.priorContractAddress());

    var tokenOld_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var tokenNew_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ]
    await checkVariables([token, newToken], [tokenOld_result, tokenNew_result]);
  });

  it('fd012 should not forward disablePriorContract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, {from:upgraderAccount});
    await token.disablePriorContract({from: pauserAccount});

    var tokenOld_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address },
      {'variable': 'priorContractAddress', 'expectedValue': await token.priorContractAddress()}
    ]
    var tokenNew_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ]
    await checkVariables([token, newToken], [tokenOld_result, tokenNew_result]);
  });

}

async function run_tests_upgraded_only_upgraded_disabled(newToken) {

  beforeEach('Make fresh token contract', async function () {
    token = await newToken();
  });

  it('should check that default variable values are correct', async function () {
    await checkVariables([token], [[]]);
  });

  it('fd078 should block transferFromViaPriorContract if called directly (not from prior contract)', async function () {
    await token.disablePriorContract({from: pauserAccount});
    await token.configureMinter(minterAccount, 200, {from: masterMinterAccount});
    await token.mint(pauserAccount, 100, {from: minterAccount});
    await token.approve(arbitraryAccount, 100, {from: pauserAccount});
    await expectRevert(token.transferFromViaPriorContract(arbitraryAccount, pauserAccount, blacklisterAccount, 50, {from: arbitraryAccount}));

    var tokenOld_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(100)},
      {'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'allowance.pauserAccount.arbitraryAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'storageOwner', 'expectedValue': token.address },
      {'variable': 'upgradedAddress', 'expectedValue': token.address }
    ]
    var tokenNew_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(100)},
      {'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'allowance.pauserAccount.arbitraryAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ]
    let tokenOld = token.priorToken;
    await checkVariables([tokenOld, token], [tokenOld_result, tokenNew_result]);
  });

  it('fd079 should block transferViaPriorContract if called directly (not from prior contract)', async function () {
    await token.disablePriorContract({from: pauserAccount});
    await token.configureMinter(minterAccount, 200, {from: masterMinterAccount});
    await token.mint(pauserAccount, 100, {from: minterAccount});
    await expectRevert(token.transferViaPriorContract(pauserAccount, arbitraryAccount, 50, {from: pauserAccount}));

    var tokenOld_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(100)},
      {'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'storageOwner', 'expectedValue': token.address },
      {'variable': 'upgradedAddress', 'expectedValue': token.address }
    ]
    var tokenNew_result = [
      {'variable': 'totalSupply', 'expectedValue': new BigNumber(100)},
      {'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'isAccountMinter.minterAccount', 'expectedValue': true},
      {'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(100)},
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ]
    let tokenOld = token.priorToken;
    await checkVariables([tokenOld, token], [tokenOld_result, tokenNew_result]);
  });


  it('fd080 should block approveViaPriorContract if called directly (not from prior contract)', async function () {
    await token.disablePriorContract({from: pauserAccount});

    await expectRevert(token.approveViaPriorContract(pauserAccount, arbitraryAccount, 50, {from: pauserAccount}));

    var tokenOld_result = [
      {'variable': 'storageOwner', 'expectedValue': token.address },
      {'variable': 'upgradedAddress', 'expectedValue': token.address }
    ]
    var tokenNew_result = [
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ]
    let tokenOld = token.priorToken;
    await checkVariables([tokenOld, token], [tokenOld_result, tokenNew_result]);
  });


  it('fd066 should not forward priorContractAddress to upgraded contract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, {from:upgraderAccount});
    await newToken.disablePriorContract({from: pauserAccount});

    assert.notEqual(await token.priorContractAddress(), await newToken.priorContractAddress());

    var tokenOld_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address }
    ]
    var tokenNew_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ]
    await checkVariables([token, newToken], [tokenOld_result, tokenNew_result]);
  });

  it('fd052 should not forward disablePriorContract', async function () {
    let dataContractAddress = await token.getDataContractAddress();
    var newToken = await UpgradedFiatToken.new(
      dataContractAddress,
      token.address,
      name,
      symbol,
      currency,
      decimals,
      masterMinterAccount,
      pauserAccount,
      blacklisterAccount,
      upgraderAccount,
      tokenOwnerAccount
    );
    newToken.default_storageOwner = newToken.address;
    newToken.default_storageAddress = dataContractAddress;

    await token.upgrade(newToken.address, {from:upgraderAccount});
    await token.disablePriorContract({from: pauserAccount});

    var tokenOld_result = [
      {'variable': 'storageOwner', 'expectedValue': newToken.address },
      {'variable': 'upgradedAddress', 'expectedValue': newToken.address },
      {'variable': 'priorContractAddress', 'expectedValue': "0x0000000000000000000000000000000000000000" }
    ]
    var tokenNew_result = [
      {'variable': 'priorContractAddress', 'expectedValue': token.address }
    ]
    await checkVariables([token, newToken], [tokenOld_result, tokenNew_result]);
  });

}

module.exports = {
  run_tests_common: run_tests_common,
  run_tests_common_upgraded_disabled: run_tests_common_upgraded_disabled,
  run_tests_upgraded_only, run_tests_upgraded_only,
  run_tests_upgraded_only_upgraded_disabled: run_tests_upgraded_only_upgraded_disabled
}
