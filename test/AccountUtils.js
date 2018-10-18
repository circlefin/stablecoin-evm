// set to true to enable verbose logging in the tests
var debugLogging = false;
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;

var Q = require('q');
var clone = require('clone');

// named list of all accounts
var Accounts = {
    deployerAccount: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1", // accounts[0]
    arbitraryAccount: "0xffcf8fdee72ac11b5c542428b35eef5769c409f0", // accounts[1]
//    issuerControllerAccount: "0x22d491bde2303f2f43325b2108d26f1eaba1e32b", // accounts[2]
    tokenOwnerAccount: "0xe11ba2b4d45eaed5996cd0823791e0c93114882d", // Accounts.arbitraryAccount
    blacklisterAccount: "0xd03ea8624c8c5987235048901fb614fdca89b117", // accounts[4]
    arbitraryAccount2: "0x95ced938f7991cd0dfcb48f0a06a40fa1af46ebc", // accounts[5]
    masterMinterAccount: "0x3e5e9111ae8eb78fe1cc3bb8915d5d461f3ef9a9", // accounts[6]
    minterAccount: "0x28a8746e75304c0780e011bed21c72cd78cd535e", // accounts[7]
    pauserAccount: "0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e", // accounts[8]
    mintOwnerAccount: "0x1df62f291b2e969fb0849d99d9ce41e2f137006e", // accounts[9]
//    mintProtectorAccount: "0x610bb1573d1046fcb8a70bbbd395754cd57c2b60", // accounts[10]
    controller1Account: "0x855fa758c77d68a04990e992aa4dcdef899f654a", // accounts[11]
//    controller2Account: "0xfa2435eacf10ca62ae6787ba2fb044f8733ee843", // accounts[12]
//    issuerOwnerAccount: "0x64e078a8aa15a41b85890265648e965de686bae6", // accounts[13]
    proxyOwnerAccount: "0x2f560290fef1b3ada194b6aa9c40aa71f8e95598", // accounts[14]
};

// named list of known private keys
var AccountPrivateKeys = {
   deployerPrivateKey: "4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d", // accounts[0]
    arbitraryPrivateKey: "6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1", // accounts[1]
    issuerControllerPrivateKey: "6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c", // accounts[2]
    tokenOwnerPrivateKey: "646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913", // Accounts.arbitraryAccount
    blacklisterPrivateKey: "add53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743", // accounts[4]
    arbitrary2PrivateKey: "395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd", // accounts[5]
    masterMinterPrivateKey: "e485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52", // accounts[6]
    minterPrivateKeyt: "a453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3", // accounts[7]
    pauserPrivateKey: "829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4", // accounts[8]
    mintOwnerPrivateKey: "b0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773", // accounts[9]
    mintProtectorPrivateKey: "77c5495fbb039eed474fc940f29955ed0531693cc9212911efd35dff0373153f", // accounts[10]
    controller1PrivateKey: "d99b5b29e6da2528bf458b26237a6cf8655a3e3276c1cdc0de1f98cefee81c01", // accounts[11]
    controller2PrivateKey: "9b9c613a36396172eab2d34d72331c8ca83a358781883a535d2941f66db07b24", // accounts[12]
    issuerOwnerPrivateKey: "0874049f95d55fb76916262dc70571701b5c4cc5900c0691af75f1a8a52c8268", // accounts[13]
    proxyOwnerAccount: "21d7212f3b4e5332fd465877b64926e3532653e2798a11255a46f533852dfe46", // accounts[14]
};

// Returns an object with all named account values set to the default value
// e.g sets {owner: 0, minter: 0,...}
function setAccountDefault(accounts, defaultValue) {
    var result = {};
    for (var accountName in accounts) {
        result[accountName] = defaultValue;
    }
    return result;
}

// return an expectedState that combines customState with the emptyState
function buildExpectedPartialState(emptyState, customState, ignoreExtraCustomVars) {
    // for each item in customVars, set the item in expectedState
    var expectedState = clone(emptyState);

    for( var variableName in customState) {
        // do I ignore extra values
        if(expectedState.hasOwnProperty(variableName)) {
            var variableValue = customState[variableName];
            if(isLiteral(variableValue)) {
                expectedState[variableName] = variableValue;
            } else {
                // assume variableValue is a mapping evaluated on 1 or more accounts
                for(var accountName in variableValue) {
                    expectedState[variableName][accountName] = variableValue[accountName];
                }
            }
        } else if(! ignoreExtraCustomVars) {
             throw new Error("variable " + variableName + " not found in expectedState");
        }
     }
     return expectedState;
}

// For testing variance of specific variables from their default values.
// customVars is an array of objects of the form,
// {'variable': <name of variable>, 'expectedValue': <expected value after modification>}
// to reference nested variables, name variable using dot syntax, e.g. 'allowance.arbitraryAccount.minterAccount'
// emptyState: is the ideal empty state
// getActualState: async function(token, accounts) => state
// accounts: list of accounts on which to evaluate mappings
// ignoreExtraCustomVars: ignore _customVars names that are not in the emptyState
async function checkState(_tokens, _customVars, emptyState, getActualState, accounts, ignoreExtraCustomVars) {
    // Iterate over array of tokens.
    var numTokens = _tokens.length;
    assert.equal(numTokens, _customVars.length);
    var n;
    for (n = 0; n < numTokens; n++) {
        var token = _tokens[n];
        var customVars = _customVars[n];
        let expectedState = buildExpectedPartialState(emptyState, customVars, ignoreExtraCustomVars);

        if (debugLogging) {
            console.log(util.inspect(expectedState, { showHidden: false, depth: null }))
        }

        let actualState = await getActualState(token, accounts);
        assertDiff.deepEqual(actualState, expectedState, "difference between expected and actual state");
    }
}

// accountQuery: an async function that takes as input an address and
//       queries the blockchain for a result
// accounts: an object containing account addresses.  Eg: {owner: 0xffad9033, minter: 0x45289432}
// returns an object containing the results of calling mappingQuery on each account
//        E.g. {owner: value1, minter: value2}
async function getAccountState(accountQuery, accounts) {
    // create an array of promises
    var promises = [];
    for(var account in accounts) {
        var promiseQuery = accountQuery(Accounts[account]);
        promises.push(promiseQuery);
    }
    var results = await Q.allSettled(promises);
    var state = {};
    var u =0;
    for(var account in accounts) {
        state[account] = results[u].value;
        ++u;
    }
    return state;
}

function isLiteral(object) {
    if(typeof(object) == 'object' && ! object._isBigNumber)
        return false;
    return true;
}

module.exports = {
    Accounts: Accounts,
    AccountPrivateKeys: AccountPrivateKeys,
    setAccountDefault: setAccountDefault,
    buildExpectedPartialState: buildExpectedPartialState,
    checkState: checkState,
    getAccountState: getAccountState,
}