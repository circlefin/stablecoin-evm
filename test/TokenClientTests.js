var Tx = require('ethereumjs-tx');
var abiUtils = require('./ABIUtils');
var makeRawTransaction = abiUtils.makeRawTransaction;
var sendRawTransaction = abiUtils.sendRawTransaction;
var tokenUtils = require('./TokenTestUtils');
var FiatToken = artifacts.require('FiatToken');
var BigNumber = require('bignumber.js');
var configureMinterJson = require('./assets/ConfigureMinter');
var pauseJson = require('./assets/Pause');
var unpauseJson = require('./assets/Unpause')
var updateMasterMinterJson = require('./assets/UpdateMasterMinter');
var updateBlacklisterJson = require('./assets/UpdateBlacklister');
var updateMasterMinterJson = require('./assets/UpdateMasterMinter');
var updatePauserJson = require('./assets/UpdatePauser');
var transferOwnershipJson = require('./assets/TransferOwnership');
var updateUpgraderAddressJson = require('./assets/UpdateUpgraderAddress');
var upgradeJson = require('./assets/Upgrade');
var removeMinterJson = require('./assets/RemoveMinter')

var checkVariables = tokenUtils.checkVariables;
var checkFailureIsExpected = tokenUtils.checkFailureIsExpected;
var deployerAccount = tokenUtils.deployerAccount;
var arbitraryAccount = tokenUtils.arbitraryAccount;
var upgraderAccount = tokenUtils.upgraderAccount;
var blacklisterAccount = tokenUtils.blacklisterAccount;
var arbitraryAccount2 = tokenUtils.arbitraryAccount2;
var masterMinterAccount = tokenUtils.masterMinterAccount;
var minterAccount = tokenUtils.minterAccount;
var pauserAccount = tokenUtils.pauserAccount;
var tokenOwnerAccount = tokenUtils.tokenOwnerAccount;

var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals

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

/* Note: we are not actually using all the fields present in the unsigned JSON transaction (like nonce).
These tests check correctness of the data field by sending a raw transaction using data from the tokenclient. */
async function newOriginalToken() {
    var token = await FiatToken.new(
        "0x0",
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

    token.default_priorContractAddress = "undefined";
    token.default_storageOwner = token.address;
    token.default_storageAddress = await token.getDataContractAddress();

    return token;
}

contract('Token Client tests', function (accounts) {
    beforeEach(async function checkBefore() {
        token = await newOriginalToken();
        let tokenAddress = token.address;
        dataContractAddress = await token.getDataContractAddress();
    });

	/*Command: UpdateMasterMinter
	Example Input:
	java -jar tokenclient-1.0-SNAPSHOT.jar UpdateMasterMinter ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --newAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --nonce 0 --gasLimit 0 --gasPrice 0 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
	Expected Output:
	*/
	it('TC001 updates the master minter address', async function () {

//		var updateMasterMinter = {"toAddress": "5e7b85e7b7257684566532992d0c7d8a179bf56e", "fromAddress": "5e7b85e7b7257684566532992d0c7d8a179bf56e", "nonce": 0, "gasLimit": 0, "gasPrice": 0, "value": 0, "data": "0xaa20e1e40000000000000000000000005e7b85e7b7257684566532992d0c7d8a179bf56e"}

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
	
	it('TC002 updates the blacklister address', async function () {

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
	it('TC003 updates the pauser', async function () {

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
	it('TC004 updates the owner', async function () {

		var transferOwnershipRawTx = makeRawTransaction(transferOwnershipJson.data, tokenOwnerAccount, tokenOwnerPrivateKey, token.address)

		await sendRawTransaction(transferOwnershipRawTx);

		var customVars = [
	            { 'variable': 'tokenOwner', 'expectedValue': "0x5e7b85e7b7257684566532992d0c7d8a179bf56e"}
	        ];
	    await checkVariables([token], [customVars]);
	})


	/*Command: UpdateUpgraderAddress
	java -jar tokenclient-1.0-SNAPSHOT.jar UpdateUpgraderAddress ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --newAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --nonce 1 --gasLimit 0 --gasPrice 0 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
	Expected Output:
	*/
	it('TC005 updates the upgrader', async function () {

		var updateUpgraderAddressRawTx = makeRawTransaction(updateUpgraderAddressJson.data, upgraderAccount, upgraderAccountPrivateKey, token.address)

		await sendRawTransaction(updateUpgraderAddressRawTx);

		var customVars = [
	            { 'variable': 'upgrader', 'expectedValue': "0x5e7b85e7b7257684566532992d0c7d8a179bf56e"}
	        ];
	    await checkVariables([token], [customVars]);
	})

	/*Command: Upgrade
	java -jar tokenclient-1.0-SNAPSHOT.jar Upgrade ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --upgradedAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --nonce 0 --gasLimit 0 --gasPrice 0 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
	{"toAddress": "5e7b85e7b7257684566532992d0c7d8a179bf56e", "fromAddress": "5e7b85e7b7257684566532992d0c7d8a179bf56e", "nonce": 0, "gasLimit": 0, "gasPrice": 0, "value": 0, "data": "0x0900f0100000000000000000000000005e7b85e7b7257684566532992d0c7d8a179bf56e"}
	Expected Output:
	*/

	it('TC006 upgrades', async function () {

		var upgradeRawTx = makeRawTransaction(upgradeJson.data, upgraderAccount, upgraderAccountPrivateKey, token.address)

		await sendRawTransaction(upgradeRawTx);

		assert.equal(await token.upgradedAddress.call(), "0x5e7b85e7b7257684566532992d0c7d8a179bf56e");

		// TODO: why does this checkVariables cause a revert?:
		/*		var customVars = [
			            { 'variable': 'upgradedAddress', 'expectedValue': "0x5e7b85e7b7257684566532992d0c7d8a179bf56e"}
			        ];
			    await checkVariables([token], [customVars]);
		*/
	})

	/*Command: ConfigureMinter
	java -jar tokenclient-1.0-SNAPSHOT.jar ConfigureMinter ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --minterAddress ffcf8fdee72ac11b5c542428b35eef5769c409f0 --amount 1 --nonce 0 --gasLimit 0 --gasPrice 0 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
	Expected Output:
	*/

	it('TC007 configures a minter and then removes it', async function () {

		var configureMinterRawTx = makeRawTransaction(configureMinterJson.data, masterMinterAccount, masterMinterAccountPrivateKey, token.address)

		await sendRawTransaction(configureMinterRawTx);

		var customVars = [
	            {'variable': 'isAccountMinter.arbitraryAccount', 'expectedValue': true},
	        	{'variable': 'minterAllowance.arbitraryAccount', 'expectedValue': new BigNumber(1)}
	        ];
	    await checkVariables([token], [customVars]);

	    /*Command: RemoveMinter
		java -jar tokenclient-1.0-SNAPSHOT.jar RemoveMinter ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --minterAddress ffcf8fdee72ac11b5c542428b35eef5769c409f0 --nonce 0 --gasLimit 1 --gasPrice 2 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
		Expected Output:
		*/
		var removeMinterRawTx = makeRawTransaction(removeMinterJson.data, masterMinterAccount, masterMinterAccountPrivateKey, token.address)

		await sendRawTransaction(removeMinterRawTx);

	    await checkVariables([token], [[]]);
	})

	/*Command: Pause
	java -jar tokenclient-1.0-SNAPSHOT.jar Pause ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --nonce 0 --gasLimit 1 --gasPrice 2 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
	Expected Output:
	*/
	it('TC008 pauses the contract and then unpauses it', async function () {
		var pauseRawTx = makeRawTransaction(pauseJson.data, pauserAccount, pauserAccountPrivateKey, token.address)

		await sendRawTransaction(pauseRawTx);

		var customVars = [
	            {'variable': 'paused', 'expectedValue': true}
	        ];
	    await checkVariables([token], [customVars]);

		/*Command: Unpause
		java -jar tokenclient-1.0-SNAPSHOT.jar Unpause ../../integrationtests/config/token-client.yml --tokenAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e --nonce 0 --gasLimit 1 --gasPrice 2 --value 0 --fromAddress 5e7b85e7b7257684566532992d0c7d8a179bf56e
		Expected Output:
		*/
	    var unpause = {"toAddress": "5e7b85e7b7257684566532992d0c7d8a179bf56e", "fromAddress": "5e7b85e7b7257684566532992d0c7d8a179bf56e", "nonce": 0, "gasLimit": 1, "gasPrice": 2, "value": 0, "data": "0x3f4ba83a"}

		var unpauseRawTx = makeRawTransaction(unpauseJson.data, pauserAccount, pauserAccountPrivateKey, token.address)

		await sendRawTransaction(unpauseRawTx);

	    await checkVariables([token], [[]]);
	})
})