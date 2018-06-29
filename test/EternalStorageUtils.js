var assertDiff = require('assert-diff');
assertDiff.options.strict = true;
var Q = require('q');
const util = require('util');

var FiatToken = artifacts.require('FiatToken');
var EternalStorage = artifacts.require('EternalStorage');
var tokenUtils = require('./TokenTestUtils');
var name = tokenUtils.name;
var symbol = tokenUtils.symbol;
var currency = tokenUtils.currency;
var decimals = tokenUtils.decimals;
var buildExpectedState = tokenUtils.buildExpectedState;
var BigNumber = require('bignumber.js');
var bigZero = tokenUtils.bigZero;
var bigHundred = tokenUtils.bigHundred;
var mint = tokenUtils.mint;
var expectRevert = tokenUtils.expectRevert;
var masterMinterRole = tokenUtils.masterMinterRole;
var blacklisterRole = tokenUtils.blacklisterRole;
var pauserRole = tokenUtils.pauserRole;

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
var blacklisterAccount = tokenUtils.blacklisterAccount;

var arbitraryAccountPrivateKey = tokenUtils.arbitraryAccountPrivateKey;
var storageOwnerPrivateKey = tokenUtils.deployerAccountPrivateKey;

var debugLogging = tokenUtils.debugLogging;

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

async function checkEternalStorageVariables(storage, customVars) {
    // make sure we use the default EternalStorage deployerAccount
    // otherwise TokenTestUtils.buildExpectedState will use the
    // tokenOwnerAccount.
    var i;
    var foundTokenOwner = false;
    for (i = 0; i < customVars.length; ++i) {
        if (customVars[i].variable == 'tokenOwner') {
            foundTokenOwner = true;
        }
    }
    if (!foundTokenOwner) {
        customVars.push({ 'variable': 'tokenOwner', 'expectedValue': deployerAccount });
    }

    // get default token state
    var expectedTokenState = buildExpectedState(customVars);

    // now copy only the subset relevant to EternalStorage
    var expectedStorageState = {
        'owner': expectedTokenState['tokenOwner'],
        'balances': expectedTokenState['balances'],
        'allowance': expectedTokenState['allowance'],
        'totalSupply': expectedTokenState['totalSupply'],
        'isAccountBlacklisted': expectedTokenState['isAccountBlacklisted'],
        'isAccountMinter': expectedTokenState['isAccountMinter'],
        'minterAllowance': expectedTokenState['minterAllowance'],
    };

    if (debugLogging) {
        console.log(util.inspect(expectedStorageState, { showHidden: false, depth: null }))
    }

    let actualState = await getActualEternalStorageState(storage);
    assertDiff.deepEqual(actualState, expectedStorageState, "difference between expected and actual state");
}

async function getActualEternalStorageState(storage) {
    return Q.all([
        storage.owner.call(),

        storage.getBalance(arbitraryAccount),
        storage.getBalance(masterMinterAccount),
        storage.getBalance(minterAccount),
        storage.getBalance(pauserAccount),
        storage.getBalance(blacklisterAccount),
        storage.getBalance(deployerAccount),
        storage.getBalance(upgraderAccount),

        storage.getAllowed(arbitraryAccount, masterMinterAccount),
        storage.getAllowed(arbitraryAccount, minterAccount),
        storage.getAllowed(arbitraryAccount, pauserAccount),
        storage.getAllowed(arbitraryAccount, blacklisterAccount),
        storage.getAllowed(arbitraryAccount, deployerAccount),
        storage.getAllowed(arbitraryAccount, upgraderAccount),
        storage.getAllowed(masterMinterAccount, arbitraryAccount),
        storage.getAllowed(masterMinterAccount, minterAccount),
        storage.getAllowed(masterMinterAccount, pauserAccount),
        storage.getAllowed(masterMinterAccount, blacklisterAccount),
        storage.getAllowed(masterMinterAccount, deployerAccount),
        storage.getAllowed(masterMinterAccount, upgraderAccount),
        storage.getAllowed(minterAccount, arbitraryAccount),
        storage.getAllowed(minterAccount, masterMinterAccount),
        storage.getAllowed(minterAccount, pauserAccount),
        storage.getAllowed(minterAccount, blacklisterAccount),
        storage.getAllowed(minterAccount, deployerAccount),
        storage.getAllowed(minterAccount, upgraderAccount),
        storage.getAllowed(pauserAccount, arbitraryAccount),
        storage.getAllowed(pauserAccount, masterMinterAccount),
        storage.getAllowed(pauserAccount, minterAccount),
        storage.getAllowed(pauserAccount, blacklisterAccount),
        storage.getAllowed(pauserAccount, deployerAccount),
        storage.getAllowed(pauserAccount, upgraderAccount),
        storage.getAllowed(blacklisterAccount, arbitraryAccount),
        storage.getAllowed(blacklisterAccount, masterMinterAccount),
        storage.getAllowed(blacklisterAccount, minterAccount),
        storage.getAllowed(blacklisterAccount, pauserAccount),
        storage.getAllowed(blacklisterAccount, deployerAccount),
        storage.getAllowed(blacklisterAccount, upgraderAccount),
        storage.getAllowed(deployerAccount, arbitraryAccount),
        storage.getAllowed(deployerAccount, masterMinterAccount),
        storage.getAllowed(deployerAccount, minterAccount),
        storage.getAllowed(deployerAccount, pauserAccount),
        storage.getAllowed(deployerAccount, blacklisterAccount),
        storage.getAllowed(deployerAccount, upgraderAccount),
        storage.getAllowed(upgraderAccount, arbitraryAccount),
        storage.getAllowed(upgraderAccount, masterMinterAccount),
        storage.getAllowed(upgraderAccount, minterAccount),
        storage.getAllowed(upgraderAccount, pauserAccount),
        storage.getAllowed(upgraderAccount, blacklisterAccount),
        storage.getAllowed(upgraderAccount, deployerAccount),

        storage.getTotalSupply(),

        storage.isBlacklisted(arbitraryAccount),
        storage.isBlacklisted(masterMinterAccount),
        storage.isBlacklisted(minterAccount),
        storage.isBlacklisted(pauserAccount),
        storage.isBlacklisted(blacklisterAccount),
        storage.isBlacklisted(deployerAccount),
        storage.isBlacklisted(upgraderAccount),

        storage.isMinter(arbitraryAccount),
        storage.isMinter(masterMinterAccount),
        storage.isMinter(minterAccount),
        storage.isMinter(pauserAccount),
        storage.isMinter(blacklisterAccount),
        storage.isMinter(deployerAccount),
        storage.isMinter(upgraderAccount),

        storage.getMinterAllowed(arbitraryAccount),
        storage.getMinterAllowed(masterMinterAccount),
        storage.getMinterAllowed(minterAccount),
        storage.getMinterAllowed(pauserAccount),
        storage.getMinterAllowed(blacklisterAccount),
        storage.getMinterAllowed(deployerAccount),
        storage.getMinterAllowed(upgraderAccount),
    ]).spread(function (
        storageOwner,
        balancesA,
        balancesMM,
        balancesM,
        balancesP,
        balancesB,
        balancesRAC,
        balancesU,
        allowanceAtoMM,
        allowanceAtoM,
        allowanceAtoP,
        allowanceAtoB,
        allowanceAtoRAC,
        allowanceAtoU,
        allowanceMMtoA,
        allowanceMMtoM,
        allowanceMMtoP,
        allowanceMMtoB,
        allowanceMMtoRAC,
        allowanceMMtoU,
        allowanceMtoA,
        allowanceMtoMM,
        allowanceMtoP,
        allowanceMtoB,
        allowanceMtoRAC,
        allowanceMtoU,
        allowancePtoA,
        allowancePtoMM,
        allowancePtoM,
        allowancePtoB,
        allowancePtoRAC,
        allowancePtoU,
        allowanceBtoA,
        allowanceBtoMM,
        allowanceBtoM,
        allowanceBtoP,
        allowanceBtoRAC,
        allowanceBtoU,
        allowanceRACtoA,
        allowanceRACtoMM,
        allowanceRACtoM,
        allowanceRACtoP,
        allowanceRACtoB,
        allowanceRACtoU,
        allowanceUtoA,
        allowanceUtoMM,
        allowanceUtoM,
        allowanceUtoP,
        allowanceUtoB,
        allowanceUtoRAC,
        totalSupply,
        isAccountBlacklistedA,
        isAccountBlacklistedMM,
        isAccountBlacklistedM,
        isAccountBlacklistedP,
        isAccountBlacklistedB,
        isAccountBlacklistedRAC,
        isAccountBlacklistedU,
        isAccountMinterA,
        isAccountMinterMM,
        isAccountMinterM,
        isAccountMinterP,
        isAccountMinterB,
        isAccountMinterRAC,
        isAccountMinterU,
        minterAllowanceA,
        minterAllowanceMM,
        minterAllowanceM,
        minterAllowanceP,
        minterAllowanceB,
        minterAllowanceRAC,
        minterAllowanceU,
    ) {
        var actualState = {
            'owner': storageOwner,
            // contractStorage is not deterministic for FiatTokenWithStorage
            //'contractStorage': storageAddress,
            // 'owner': await token.owner.call(),
            'balances': {
                'arbitraryAccount': balancesA,
                'masterMinterAccount': balancesMM,
                'minterAccount': balancesM,
                'pauserAccount': balancesP,
                'blacklisterAccount': balancesB,
                'tokenOwnerAccount': balancesRAC,
                'upgraderAccount': balancesU
            },
            'allowance': {
                'arbitraryAccount': {
                    'masterMinterAccount': allowanceAtoMM,
                    'minterAccount': allowanceAtoM,
                    'pauserAccount': allowanceAtoP,
                    'blacklisterAccount': allowanceAtoB,
                    'tokenOwnerAccount': allowanceAtoRAC,
                    'upgraderAccount': allowanceAtoU
                },
                'masterMinterAccount': {
                    'arbitraryAccount': allowanceMMtoA,
                    'minterAccount': allowanceMMtoM,
                    'pauserAccount': allowanceMMtoP,
                    'blacklisterAccount': allowanceMMtoB,
                    'tokenOwnerAccount': allowanceMMtoRAC,
                    'upgraderAccount': allowanceMMtoU
                },
                'minterAccount': {
                    'arbitraryAccount': allowanceMtoA,
                    'masterMinterAccount': allowanceMtoMM,
                    'pauserAccount': allowanceMtoP,
                    'blacklisterAccount': allowanceMtoB,
                    'tokenOwnerAccount': allowanceMtoRAC,
                    'upgraderAccount': allowanceMtoU
                },
                'pauserAccount': {
                    'arbitraryAccount': allowancePtoA,
                    'masterMinterAccount': allowancePtoMM,
                    'minterAccount': allowancePtoM,
                    'blacklisterAccount': allowancePtoB,
                    'tokenOwnerAccount': allowancePtoRAC,
                    'upgraderAccount': allowancePtoU
                },
                'blacklisterAccount': {
                    'arbitraryAccount': allowanceBtoA,
                    'masterMinterAccount': allowanceBtoMM,
                    'minterAccount': allowanceBtoM,
                    'pauserAccount': allowanceBtoP,
                    'tokenOwnerAccount': allowanceBtoRAC,
                    'upgraderAccount': allowanceBtoU
                },
                'tokenOwnerAccount': {
                    'arbitraryAccount': allowanceRACtoA,
                    'masterMinterAccount': allowanceRACtoMM,
                    'minterAccount': allowanceRACtoM,
                    'pauserAccount': allowanceRACtoP,
                    'blacklisterAccount': allowanceRACtoB,
                    'upgraderAccount': allowanceRACtoU
                },
                'upgraderAccount': {
                    'arbitraryAccount': allowanceUtoA,
                    'masterMinterAccount': allowanceUtoMM,
                    'minterAccount': allowanceUtoM,
                    'pauserAccount': allowanceUtoP,
                    'blacklisterAccount': allowanceUtoB,
                    'tokenOwnerAccount': allowanceUtoRAC
                }
            },
            'totalSupply': totalSupply,
            'isAccountBlacklisted': {
                'arbitraryAccount': isAccountBlacklistedA,
                'masterMinterAccount': isAccountBlacklistedMM,
                'minterAccount': isAccountBlacklistedM,
                'pauserAccount': isAccountBlacklistedP,
                'blacklisterAccount': isAccountBlacklistedB,
                'tokenOwnerAccount': isAccountBlacklistedRAC,
                'upgraderAccount': isAccountBlacklistedU
            },
            'isAccountMinter': {
                'arbitraryAccount': isAccountMinterA,
                'masterMinterAccount': isAccountMinterMM,
                'minterAccount': isAccountMinterM,
                'pauserAccount': isAccountMinterP,
                'blacklisterAccount': isAccountMinterB,
                'tokenOwnerAccount': isAccountMinterRAC,
                'upgraderAccount': isAccountMinterU
            },
            'minterAllowance': {
                'arbitraryAccount': minterAllowanceA,
                'masterMinterAccount': minterAllowanceMM,
                'minterAccount': minterAllowanceM,
                'pauserAccount': minterAllowanceP,
                'blacklisterAccount': minterAllowanceB,
                'tokenOwnerAccount': minterAllowanceRAC,
                'upgraderAccount': minterAllowanceU
            }
        };
        return actualState;
    })
}

module.exports = {
    checkEternalStorageVariables: checkEternalStorageVariables
};