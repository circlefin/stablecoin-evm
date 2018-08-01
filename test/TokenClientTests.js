var Tx = require('ethereumjs-tx');
var abiUtils = require('./ABIUtils');
var makeRawTransaction = abiUtils.makeRawTransaction;
var sendRawTransaction = abiUtils.sendRawTransaction;
var tokenUtils = require('./TokenTestUtils');
var FiatToken = artifacts.require('FiatTokenV1');
var FiatTokenProxy = artifacts.require('FiatTokenProxy');
var BigNumber = require('bignumber.js');
var configureMinterJson = require('./assets/ConfigureMinter');
var pauseJson = require('./assets/Pause');
var unpauseJson = require('./assets/Unpause');
var updateMasterMinterJson = require('./assets/UpdateMasterMinter');
var updateBlacklisterJson = require('./assets/UpdateBlacklister');
var updateMasterMinterJson = require('./assets/UpdateMasterMinter');
var updatePauserJson = require('./assets/UpdatePauser');
var transferOwnershipJson = require('./assets/TransferOwnership');
var updateUpgraderAddressJson = require('./assets/UpdateUpgraderAddress');
var upgradeToJson = require('./assets/UpgradeTo');
var upgradeToAndCallJson = require('./assets/UpgradeToAndCall');
var removeMinterJson = require('./assets/RemoveMinter');
var blacklistJson = require('./assets/Blacklist');
var unblacklistJson = require('./assets/Unblacklist')


var checkVariables = tokenUtils.checkVariables;
var checkFailureIsExpected = tokenUtils.checkFailureIsExpected;
var getAdmin = tokenUtils.getAdmin;
var deployerAccount = tokenUtils.deployerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var upgraderAccount = tokenUtils.upgraderAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;
var encodeCall = tokenUtils.encodeCall;
var bigZero = tokenUtils.bigZero;

var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals
var amount = 100;

var deployerAccountPrivateKey = tokenUtils.deployerAccountPrivateKey;
var arbitraryAccountPrivateKey = tokenUtils.arbitraryAccountPrivateKey;
var tokenOwnerPrivateKey = tokenUtils.ownerAccountPrivateKey;
var upgraderAccountPrivateKey = tokenUtils.upgraderAccountPrivateKey;
var tokenOwnerPrivateKey = tokenUtils.tokenOwnerPrivateKey;
var blacklisterAccountPrivateKey = tokenUtils.blacklisterAccountPrivateKey;
var arbitraryAccount2PrivateKey = tokenUtils.arbitraryAccount2PrivateKey;
var masterMinterAccountPrivateKey = tokenUtils.masterMinterAccountPrivateKey;
var minterAccountPrivateKey = tokenUtils.minterAccountPrivateKey;
var pauserAccountPrivateKey = tokenUtils.pauserAccountPrivateKey;
var blacklisterAccountPrivateKey = tokenUtils.blacklisterAccountPrivateKey;
var initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;
var UpgradedFiatToken = tokenUtils.UpgradedFiatToken;
var UpgradedFiatTokenNewFields = tokenUtils.UpgradedFiatTokenNewFields;
var UpgradedFiatTokenNewFieldsNewLogic = tokenUtils.UpgradedFiatTokenNewFieldsNewLogic;
var upgradeTo = tokenUtils.upgradeTo;
 // Do not use this account in other tests
var upgradedTokenDeployer = "0xf408f04f9b7691f7174fa2bb73ad6d45fd5d3cbe";
var upgradedTokenDeployerPrivateKey = "47b65307d0d654fd4f786b908c04af8fface7710fc998b37d219de19c39ee58c";

var proxyOwnerAccount = tokenUtils.proxyOwnerAccount;
var proxyOwnerAccountPrivateKey = tokenUtils.proxyOwnerAccountPrivateKey;


/* Note: we are not actually using all the fields present in the unsigned JSON transaction (like nonce).
These tests check correctness of the data field by sending a raw transaction using data from the tokenclient. */
contract('Token Client Test', function (accounts) {
  beforeEach('Make fresh token contract', async function () {
    rawToken = await FiatToken.new();
    var tokenConfig = await initializeTokenWithProxy(rawToken);
    proxy = tokenConfig.proxy;
    token = tokenConfig.token;
    assert.equal(proxy.address, token.address);
  });

  /* Note: rerun ganache on each run of this test file, or else TC001 and TC002 will be skipped because they depend on nonce of account that deploys contract (since token-client must use hardcoded token addresses) */
    // skip allows these tests to not crash the entire test suite when truffle test is run
  it('TC001 should upgradeTo new contract and preserve data field values', async function () {
    let upgradedTokenDeployerNonce = await web3.toHex(web3.eth.getTransactionCount(upgradedTokenDeployer));
    if (upgradedTokenDeployerNonce != 0) { this.skip() }

    proxyOwnerNonce = await web3.toHex(web3.eth.getTransactionCount(proxyOwnerAccount));
    if (proxyOwnerNonce != 1) { this.skip() }

    let mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });

    var upgradedToken = await UpgradedFiatToken.new({from: upgradedTokenDeployer});

    const upgradeToData = encodeCall('upgradeTo', ['address'], [upgradedToken.address]);
    var upgradeToRawTx = makeRawTransaction(upgradeToJson.data, proxyOwnerAccount, proxyOwnerAccountPrivateKey, proxy.address)
    assert.equal(upgradeToJson.data, upgradeToData)

    proxiedToken = await FiatToken.at(proxy.address);
    assert.equal(proxiedToken.address, proxy.address);
    tokenConfig = {
      proxy: proxy,
      token: proxiedToken
    }

    await sendRawTransaction(upgradeToRawTx);

    var newToken = tokenConfig.token;

    customVars = [
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'proxiedTokenAddress', 'expectedValue': upgradedToken.address }
    ];
    await checkVariables([newToken], [customVars]);
  });

  it('TC002 should upgradeToandCall to contract with new data fields set on initialize and ensure new fields are correct and old data is preserved', async function () {
    let upgradedTokenDeployerNonce = await web3.toHex(web3.eth.getTransactionCount(upgradedTokenDeployer));
    if (upgradedTokenDeployerNonce != 1) { this.skip() }

    proxyOwnerNonce = await web3.toHex(web3.eth.getTransactionCount(proxyOwnerAccount));
    if (proxyOwnerNonce != 3) { this.skip() }

    let mintAmount = 50;

    await token.configureMinter(minterAccount, amount, { from: masterMinterAccount });
    await token.mint(arbitraryAccount, mintAmount, { from: minterAccount });
    await token.transfer(pauserAccount, mintAmount, { from: arbitraryAccount });

    var upgradedToken = await UpgradedFiatTokenNewFields.new({from: upgradedTokenDeployer});

    const initializeData = encodeCall('initialize', ['bool', 'address', 'uint256'], [true, pauserAccount, 12]);
    const proxyUpgradeToAndCallData = encodeCall('upgradeToAndCall', ['address', 'bytes'], [upgradedToken.address, initializeData]);
    var upgradeToAndCallRawTx = makeRawTransaction(upgradeToAndCallJson.data, proxyOwnerAccount, proxyOwnerAccountPrivateKey, proxy.address)

    await sendRawTransaction(upgradeToAndCallRawTx);
    newProxiedToken = await UpgradedFiatTokenNewFields.at(proxy.address);
    assert.equal(newProxiedToken.address, proxy.address);
    assert.notEqual(newProxiedToken.address, upgradedToken.address);

    assert.equal(await newProxiedToken.newBool(), true);
    assert.equal(await newProxiedToken.newAddress(), pauserAccount);
    assert.equal((new BigNumber(12)).isEqualTo(await newProxiedToken.newUint()), true);

    var newToken = tokenConfig.token;

    customVars = [
      { 'variable': 'minterAllowance.minterAccount', 'expectedValue': new BigNumber(amount - mintAmount) },
      { 'variable': 'isAccountMinter.minterAccount', 'expectedValue': true },
      { 'variable': 'balances.arbitraryAccount', 'expectedValue': bigZero },
      { 'variable': 'balances.pauserAccount', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'totalSupply', 'expectedValue': new BigNumber(mintAmount) },
      { 'variable': 'proxiedTokenAddress', 'expectedValue': upgradedToken.address }
    ];
    await checkVariables([newProxiedToken], [customVars]);
  });

  /*Command: UpdateMasterMinter
  Example Input:
  java -jar tokenclient-1.0-SNAPSHOT.jar UpdateMasterMinter ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --newAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --nonce 0 --gasLimit 0 --gasPrice 0 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
  Expected Output:
  */
  it('TC003 updates the master minter address', async function () {
    var updateMasterMinterRawTx = makeRawTransaction(updateMasterMinterJson.data, tokenOwnerAccount, tokenOwnerPrivateKey, token.address)

    await sendRawTransaction(updateMasterMinterRawTx);

    var customVars = [
            { 'variable': 'masterMinter', 'expectedValue': "0x5e7b85e7b7257684566532992d0c7d8a179bf56e"}
        ];
    await checkVariables([token], [customVars]);
  })

  /*Command: UpdateBlacklister
  Example Input:
  java -jar tokenclient-1.0-SNAPSHOT.jar UpdateBlacklister ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --newAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --nonce 0 --gasLimit 0 --gasPrice 0 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
  Expected Output:
  */
  it('TC004 updates the blacklister address', async function () {
    var updateBlacklisterRawTx = makeRawTransaction(updateBlacklisterJson.data, tokenOwnerAccount, tokenOwnerPrivateKey, token.address)

    await sendRawTransaction(updateBlacklisterRawTx);

    var customVars = [
            { 'variable': 'blacklister', 'expectedValue': "0x5e7b85e7b7257684566532992d0c7d8a179bf56e"}
        ];
    await checkVariables([token], [customVars]);
  })

  /*Command: UpdatePauser
  java -jar tokenclient-1.0-SNAPSHOT.jar UpdatePauser ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --newAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --nonce 0 --gasLimit 0 --gasPrice 0 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
  Expected Output:
  */
  it('TC005 updates the pauser', async function () {
    var updatePauserRawTx = makeRawTransaction(updatePauserJson.data, tokenOwnerAccount, tokenOwnerPrivateKey, token.address)

    await sendRawTransaction(updatePauserRawTx);

    var customVars = [
            { 'variable': 'pauser', 'expectedValue': "0x5e7b85e7b7257684566532992d0c7d8a179bf56e"}
        ];
    await checkVariables([token], [customVars]);
  })

  /*Command: TransferOwnership
  java -jar tokenclient-1.0-SNAPSHOT.jar TransferOwnership ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --newAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --nonce 0 --gasLimit 0 --gasPrice 0 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
  Expected Output:
  */
  it('TC006 updates the owner', async function () {
    var transferOwnershipRawTx = makeRawTransaction(transferOwnershipJson.data, tokenOwnerAccount, tokenOwnerPrivateKey, token.address)

    await sendRawTransaction(transferOwnershipRawTx);

    var customVars = [
            { 'variable': 'tokenOwner', 'expectedValue': "0x5e7b85e7b7257684566532992d0c7d8a179bf56e"}
        ];
    await checkVariables([token], [customVars]);
  })


  /* Command: UpdateUpgraderAddress
  java -jar tokenclient-1.0-SNAPSHOT.jar UpdateUpgraderAddress ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --newAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --nonce 1 --gasLimit 0 --gasPrice 0 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
  Expected Output:
  */
  it('TC007 updates the upgrader', async function () {
    assert.equal(await getAdmin(proxy), proxyOwnerAccount);

    var updateUpgraderAddressRawTx = makeRawTransaction(updateUpgraderAddressJson.data, proxyOwnerAccount, proxyOwnerAccountPrivateKey, proxy.address)

    await sendRawTransaction(updateUpgraderAddressRawTx);

    var customVars = [
      {
        'variable': 'upgrader', 'expectedValue': "0x5e7b85e7b7257684566532992d0c7d8a179bf56e"
      }
    ]
    await checkVariables([token], [customVars]);
  })

  /* Command: ConfigureMinter
  java -jar tokenclient-1.0-SNAPSHOT.jar ConfigureMinter ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --minterAddress ffcf8fdee72ac11b5c542428b35eef5769c409f0 --amount 1 --nonce 0 --gasLimit 0 --gasPrice 0 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
  Expected Output:
  */
  it('TC008 configures a minter and then removes it', async function () {
    var configureMinterRawTx = makeRawTransaction(configureMinterJson.data, masterMinterAccount, masterMinterAccountPrivateKey, token.address)

    await sendRawTransaction(configureMinterRawTx);

    var customVars = [
            {'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true},
            {'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(1)},
        ];
    await checkVariables([token], [customVars]);

    /* Command: RemoveMinter
    java -jar tokenclient-1.0-SNAPSHOT.jar RemoveMinter ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --minterAddress ffcf8fdee72ac11b5c542428b35eef5769c409f0 --nonce 0 --gasLimit 1 --gasPrice 2 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
    Expected Output: */
    var removeMinterRawTx = makeRawTransaction(removeMinterJson.data, masterMinterAccount, masterMinterAccountPrivateKey, token.address)

    await sendRawTransaction(removeMinterRawTx);

    await checkVariables([token], [[]]);
  })

  /* Command: Pause
  java -jar tokenclient-1.0-SNAPSHOT.jar Pause ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --nonce 0 --gasLimit 1 --gasPrice 2 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
  Expected Output:
  */
  it('TC009 pauses the contract and then unpauses it', async function () {
    var pauseRawTx = makeRawTransaction(pauseJson.data, pauserAccount, pauserAccountPrivateKey, token.address)

    await sendRawTransaction(pauseRawTx);

    var customVars = [
          {'variable': 'paused', 'expectedValue': true}
      ];
    await checkVariables([token], [customVars]);

    /*Command: Unpause
    java -jar tokenclient-1.0-SNAPSHOT.jar Unpause ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --nonce 0 --gasLimit 1 --gasPrice 2 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
    Expected Output:      
    var unpause = {"toAddress": "5e7b85e7b7257684566532992d0c7d8a179bf56e", "fromAddress": "5e7b85e7b7257684566532992d0c7d8a179bf56e", "nonce": 0, "gasLimit": 1, "gasPrice": 2, "value": 0, "data": "0x3f4ba83a"}
    */
    var unpauseRawTx = makeRawTransaction(unpauseJson.data, pauserAccount, pauserAccountPrivateKey, token.address)

    await sendRawTransaction(unpauseRawTx);

    await checkVariables([token], [[]]);
  })

  it('TC010 should blacklist and set blacklisted to true, then unblacklist and set blacklisted to false', async function () {
    var blacklistRawTx = makeRawTransaction(blacklistJson.data, blacklisterAccount, blacklisterAccountPrivateKey, token.address)
    await sendRawTransaction(blacklistRawTx);
    //await token.blacklist(arbitraryAccount, { from: blacklisterAccount });
    var customVars = [
      { 'variable': 'isAccountBlacklisted.arbitraryAccount', 'expectedValue': true }
    ];
    await checkVariables([token], [customVars]);

    //await token.unBlacklist(arbitraryAccount, { from: blacklisterAccount });
    var unblacklistRawTx = makeRawTransaction(unblacklistJson.data, blacklisterAccount, blacklisterAccountPrivateKey, token.address)
    await sendRawTransaction(unblacklistRawTx);

    await checkVariables([token], [[]]);
  });


});