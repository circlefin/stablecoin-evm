// set to true to enable verbose logging in the tests
var debugLogging = false;
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;


// named list of all accounts
var mcAccounts = {
    mintOwnerAccount: "0x1df62f291b2e969fb0849d99d9ce41e2f137006e", // accounts[9]
    mintProtectorAccount: "0x610bb1573d1046fcb8a70bbbd395754cd57c2b60", // accounts[10]
    controller1Account: "0x855fa758c77d68a04990e992aa4dcdef899f654a", // accounts[11]
    controller2Account: "0xfa2435eacf10ca62ae6787ba2fb044f8733ee843", // accounts[12]
    issuerOwnerAccount: "0x64e078a8aa15a41b85890265648e965de686bae6", // accounts[13]
    issuerControllerAccount: "0x2f560290fef1b3ada194b6aa9c40aa71f8e95598", // accounts[14]

    deployerAccount: "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1", // accounts[0]
    arbitraryAccount: "0xffcf8fdee72ac11b5c542428b35eef5769c409f0", // accounts[1]
    tokenOwnerAccount: "0xe11ba2b4d45eaed5996cd0823791e0c93114882d", // accounts[3]
    blacklisterAccount: "0xd03ea8624c8c5987235048901fb614fdca89b117", // accounts[4] Why Multiple blacklisterAccount??
    arbitraryAccount2: "0x95ced938f7991cd0dfcb48f0a06a40fa1af46ebc", // accounts[5]
    masterMinterAccount: "0x3e5e9111ae8eb78fe1cc3bb8915d5d461f3ef9a9", // accounts[6]
    minterAccount: "0x28a8746e75304c0780e011bed21c72cd78cd535e", // accounts[7]
    pauserAccount: "0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e", // accounts[8]
}

// named list of known private keys
var mcAccountsPrivateKeys = {
    mintOwnerPrivateKey: "b0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773", // accounts[9]
    mintProtectorPrivateKey: "77c5495fbb039eed474fc940f29955ed0531693cc9212911efd35dff0373153f", // accounts[10]
    controller1PrivateKey: "d99b5b29e6da2528bf458b26237a6cf8655a3e3276c1cdc0de1f98cefee81c01", // accounts[11]
    controller2PrivateKey: "9b9c613a36396172eab2d34d72331c8ca83a358781883a535d2941f66db07b24", // accounts[12]
    issuerOwnerPrivateKey: "0874049f95d55fb76916262dc70571701b5c4cc5900c0691af75f1a8a52c8268", // accounts[13]
    issuerController2PrivateKey: "21d7212f3b4e5332fd465877b64926e3532653e2798a11255a46f533852dfe46" // accounts[14]
}

// Returns an object with all named account values set to the default value
// e.g sets {owner: 0, minter: 0,...}
function setAccountDefault(accounts, defaultValue) {
    var result = {};
    for (var accountName in accounts) {
        result[accountName] = defaultValue;
    }
    return result;
}

// Clones a state object
function cloneState(state) {
    // for each item in customVars, set the item in expectedState
    var clone = {};
    for (var attr in state) {
        var attrValue = state[attr];
        if(isLiteral(attrValue)) {
            clone[attr] = state[attr];
        } else {
            clone[attr] = cloneState(attrValue);
        }
    }
    return clone;
}

// return an expectedState that combines customState with the emptyState
// todo: after merge, integrate this with TokenTestUtils.js
function buildExpectedPartialState(emptyState, customState, ignoreExtraCustomVars) {
    // for each item in customVars, set the item in expectedState
    var expectedState = cloneState(emptyState);

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
// todo: after merge, integrate this with TokenTestUtils.js
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
    var results = {};
    for (var accountName in accounts) {
        results[accountName] = await accountQuery(accounts[accountName]);
    }
    return results;
}

function isLiteral(object) {
    if(typeof(object) == 'object' && ! object._isBigNumber)
        return false;
    return true;
}

// Turns a simple literal object into a printable string
function logObject(object) {
    var output = '';
    for (var property in object) {
        if(isLiteral(object[property])) {
            output += property + ':\n' + logObject(object[property]);
        } else {
            output += property + ': ' + object[property]+';\n ';
        }
    }
    return output;
}

module.exports = {
    mcAccounts: mcAccounts,
    setAccountDefault: setAccountDefault,
    cloneState: cloneState,
    buildExpectedPartialState: buildExpectedPartialState,
    checkState: checkState,
    logObject: logObject,
    getAccountState: getAccountState,
}