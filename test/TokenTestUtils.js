const util = require('util');
const abi = require('ethereumjs-abi')
var _ = require('lodash');
var name = 'Sample Fiat Token';
var symbol = 'C-USD';
var currency = 'USD';
var decimals = 2;
var BigNumber = require('bignumber.js');
var bigZero = new BigNumber(0);
var bigHundred = new BigNumber(100);
var assertDiff = require('assert-diff');
assertDiff.options.strict = true;
var Q = require('q');
var FiatToken = artifacts.require('FiatToken');
var FiatTokenProxy = artifacts.require('FiatTokenProxy');

// TODO: test really big numbers  Does this still have to be done??

var deployerAccount = "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1"; // accounts[0]
var arbitraryAccount = "0xffcf8fdee72ac11b5c542428b35eef5769c409f0"; // accounts[1]
var arbitraryAccountPrivateKey = "6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1"; // accounts[1];
var proxyOwnerAccount = "0x22d491bde2303f2f43325b2108d26f1eaba1e32b"; // accounts[2]
var upgraderAccount = proxyOwnerAccount; // accounts[2]
var tokenOwnerAccount = "0xe11ba2b4d45eaed5996cd0823791e0c93114882d"; // accounts[3]
var blacklisterAccount = "0xd03ea8624c8c5987235048901fb614fdca89b117"; // accounts[4] Why Multiple blacklisterAccount??
var arbitraryAccount2 = "0x95ced938f7991cd0dfcb48f0a06a40fa1af46ebc"; // accounts[5]
var masterMinterAccount = "0x3e5e9111ae8eb78fe1cc3bb8915d5d461f3ef9a9"; // accounts[6]
var minterAccount = "0x28a8746e75304c0780e011bed21c72cd78cd535e"; // accounts[7]
var pauserAccount = "0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e"; // accounts[8]
//var blacklisterAccount = "0x1df62f291b2e969fb0849d99d9ce41e2f137006e"; // accounts[9]

var deployerAccountPrivateKey = "4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"; // accounts[0]
var arbitraryAccountPrivateKey = "6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1"; // accounts[1];
var upgraderAccountPrivateKey = "6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c"; // accounts[2]
var tokenOwnerPrivateKey = "646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913"; // accounts[3]
var blacklisterAccountPrivateKey = "add53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743"; // accounts[4]
var arbitraryAccount2PrivateKey = "395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd"; // accounts[5]
var masterMinterAccountPrivateKey = "e485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52"; // accounts[6]
var minterAccountPrivateKey = "a453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3"; // accounts[7]
var pauserAccountPrivateKey = "829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4"; // accounts[9];
//var blacklisterAccountPrivateKey = "b0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773"; // accounts[9]

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

var BigNumber = require('bignumber.js');

// set to true to enable verbose logging in the tests
var debugLogging = false;

function calculateFeeAmount(amount) {
    return Math.floor((fee / feeBase) * amount);
}

function checkTransferEventsWithFee(transfer, from, to, value, feeAmount) {
    assert.equal(transfer.logs[0].event, 'Fee');
    assert.equal(transfer.logs[0].args.from, from);
    assert.equal(transfer.logs[0].args.feeAccount, feeAccount);
    assert.equal(transfer.logs[0].args.feeAmount, feeAmount);
    assert.equal(transfer.logs[1].event, 'Transfer');
    assert.equal(transfer.logs[1].args.from, from);
    assert.equal(transfer.logs[1].args.to, to);
    assert.equal(transfer.logs[1].args.value, value);
}

function checkTransferEvents(transfer, from, to, value) {
    assert.equal(transfer.logs[0].event, 'Transfer');
    assert.equal(transfer.logs[0].args.from, from);
    assert.equal(transfer.logs[0].args.to, to);
    assert.equal(transfer.logs[0].args.value, value);
}

function checkMintEvents(minting, to, amount, minter) {
    // Mint Event
    assert.equal(minting.logs[0].event, 'Mint');
    assert.equal(minting.logs[0].args.minter, minter);
    assert.equal(minting.logs[0].args.to, to);
    assert.equal(minting.logs[0].args.amount, amount);

    // Transfer from 0 Event
    assert.equal(minting.logs[1].event, 'Transfer');
    assert.equal(minting.logs[1].args.from, 0);
    assert.equal(minting.logs[1].args.to, to);
    assert.equal(minting.logs[1].args.value, amount);

}

// Creates a state object, with default values replaced by
// customVars where appropriate.
function buildExpectedState(token, customVars) {
    // set each variable's default value
    var expectedState = {
        'name': name,
        'symbol': symbol,
        'currency': currency,
        'decimals': new BigNumber(decimals),
        'masterMinter': masterMinterAccount,
        'pauser': pauserAccount,
        'blacklister': blacklisterAccount,
        'tokenOwner': tokenOwnerAccount,
        'proxiedTokenAddress': token.proxiedTokenAddress,
        'balances': {
            'arbitraryAccount': bigZero,
            'masterMinterAccount': bigZero,
            'minterAccount': bigZero,
            'pauserAccount': bigZero,
            'blacklisterAccount': bigZero,
            'tokenOwnerAccount': bigZero
        },
        'allowance': {
            'arbitraryAccount': {
                'masterMinterAccount': bigZero,
                'minterAccount': bigZero,
                'pauserAccount': bigZero,
                'blacklisterAccount': bigZero,
                'tokenOwnerAccount': bigZero,
                'upgraderAccount': bigZero,
                'arbitraryAccount': bigZero
            },
            'masterMinterAccount': {
                'arbitraryAccount': bigZero,
                'minterAccount': bigZero,
                'pauserAccount': bigZero,
                'blacklisterAccount': bigZero,
                'tokenOwnerAccount': bigZero,
                'upgraderAccount': bigZero,
                'masterMinterAccount': bigZero
            },
            'minterAccount': {
                'arbitraryAccount': bigZero,
                'masterMinterAccount': bigZero,
                'pauserAccount': bigZero,
                'blacklisterAccount': bigZero,
                'tokenOwnerAccount': bigZero,
                'upgraderAccount': bigZero,
                'minterAccount': bigZero
            },
            'pauserAccount': {
                'arbitraryAccount': bigZero,
                'masterMinterAccount': bigZero,
                'minterAccount': bigZero,
                'blacklisterAccount': bigZero,
                'tokenOwnerAccount': bigZero,
                'upgraderAccount': bigZero,
                'pauserAccount': bigZero
            },
            'blacklisterAccount': {
                'arbitraryAccount': bigZero,
                'masterMinterAccount': bigZero,
                'minterAccount': bigZero,
                'pauserAccount': bigZero,
                'tokenOwnerAccount': bigZero,
                'upgraderAccount': bigZero,
                'blacklisterAccount': bigZero
            },
            'tokenOwnerAccount': {
                'arbitraryAccount': bigZero,
                'masterMinterAccount': bigZero,
                'minterAccount': bigZero,
                'pauserAccount': bigZero,
                'blacklisterAccount': bigZero,
                'upgraderAccount': bigZero,
                'tokenOwnerAccount': bigZero
            },
            'upgraderAccount': {
                'arbitraryAccount': bigZero,
                'masterMinterAccount': bigZero,
                'minterAccount': bigZero,
                'pauserAccount': bigZero,
                'blacklisterAccount': bigZero,
                'tokenOwnerAccount': bigZero,
                'upgraderAccount': bigZero
            }
        },
        'totalSupply': bigZero,
        'isAccountBlacklisted': {
            'arbitraryAccount': false,
            'masterMinterAccount': false,
            'minterAccount': false,
            'pauserAccount': false,
            'blacklisterAccount': false,
            'tokenOwnerAccount': false,
        },
        'isAccountMinter': {
            'arbitraryAccount': false,
            'masterMinterAccount': false,
            'minterAccount': false,
            'pauserAccount': false,
            'blacklisterAccount': false,
            'tokenOwnerAccount': false,
        },
        'minterAllowance': {
            'arbitraryAccount': bigZero,
            'masterMinterAccount': bigZero,
            'minterAccount': bigZero,
            'pauserAccount': bigZero,
            'blacklisterAccount': bigZero,
            'tokenOwnerAccount': bigZero
        },
        'paused': false
    };

    // for each item in customVars, set the item in expectedState
    var i;
    for (i = 0; i < customVars.length; ++i) {
        if (_.has(expectedState, customVars[i].variable)) {
            if (expectedState[customVars[i].variable] == customVars[i].expectedValue) {
                throw new Error("variable " + customVars[i].variable + " to test has same default state as expected state");
            } else {
                _.set(expectedState, customVars[i].variable, customVars[i].expectedValue);
            }
        } else {
            // TODO: test the error
            throw new Error("variable " + customVars[i].variable + " not found in expectedState");
        }
    }
    return expectedState;
}

// For testing variance of specific variables from their default values.
// customVars is an array of objects of the form,
// {'variable': <name of variable>, 'expectedValue': <expected value after modification>}
// to reference nested variables, name variable using dot syntax, e.g. 'allowance.arbitraryAccount.minterAccount'
async function checkVariables(_tokens, _customVars) {
    // Iterate over array of tokens.
    var numTokens = _tokens.length;
    assert.equal(numTokens, _customVars.length);
    var n;
    for (n = 0; n < numTokens; n++) {
        var token = _tokens[n];
        var customVars = _customVars[n];
        let expectedState = buildExpectedState(token, customVars);
        if (debugLogging) {
            console.log(util.inspect(expectedState, { showHidden: false, depth: null }))
        }

        let actualState = await getActualState(token);
        assertDiff.deepEqual(actualState, expectedState, "difference between expected and actual state");

        // Check that sum of individual balances equals totalSupply
        var accounts = [arbitraryAccount, masterMinterAccount, minterAccount, pauserAccount, blacklisterAccount, tokenOwnerAccount, upgraderAccount];
        var balanceSum = bigZero;
        var x;
        for (x = 0; x < accounts.length; x++) {
            balanceSum = balanceSum.plus(new BigNumber(await token.balanceOf(accounts[x])));
        }
        var totalSupply = new BigNumber(await token.totalSupply())
        assert(balanceSum.isEqualTo(totalSupply));
    }
}

// build up actualState object to compare to expectedState object
async function getActualState(token) {
    return Q.all([
        await token.name.call(),
        await token.symbol.call(),
        await token.currency.call(),
        await token.decimals.call(),
        await token.masterMinter.call(),
        await token.pauser.call(),
        await token.blacklister.call(),
        await token.owner.call(),
        await token.implementation.call(),
        await token.balanceOf(arbitraryAccount),
        await token.balanceOf(masterMinterAccount),
        await token.balanceOf(minterAccount),
        await token.balanceOf(pauserAccount),
        await token.balanceOf(blacklisterAccount),
        await token.balanceOf(tokenOwnerAccount),
        await token.allowance(arbitraryAccount, masterMinterAccount),
        await token.allowance(arbitraryAccount, minterAccount),
        await token.allowance(arbitraryAccount, pauserAccount),
        await token.allowance(arbitraryAccount, blacklisterAccount),
        await token.allowance(arbitraryAccount, tokenOwnerAccount),
        await token.allowance(arbitraryAccount, upgraderAccount),
        await token.allowance(arbitraryAccount, arbitraryAccount),
        await token.allowance(masterMinterAccount, arbitraryAccount),
        await token.allowance(masterMinterAccount, minterAccount),
        await token.allowance(masterMinterAccount, pauserAccount),
        await token.allowance(masterMinterAccount, blacklisterAccount),
        await token.allowance(masterMinterAccount, tokenOwnerAccount),
        await token.allowance(masterMinterAccount, upgraderAccount),
        await token.allowance(masterMinterAccount, masterMinterAccount),
        await token.allowance(minterAccount, arbitraryAccount),
        await token.allowance(minterAccount, masterMinterAccount),
        await token.allowance(minterAccount, pauserAccount),
        await token.allowance(minterAccount, blacklisterAccount),
        await token.allowance(minterAccount, tokenOwnerAccount),
        await token.allowance(minterAccount, upgraderAccount),
        await token.allowance(minterAccount, minterAccount),
        await token.allowance(pauserAccount, arbitraryAccount),
        await token.allowance(pauserAccount, masterMinterAccount),
        await token.allowance(pauserAccount, minterAccount),
        await token.allowance(pauserAccount, blacklisterAccount),
        await token.allowance(pauserAccount, tokenOwnerAccount),
        await token.allowance(pauserAccount, upgraderAccount),
        await token.allowance(pauserAccount, pauserAccount),
        await token.allowance(blacklisterAccount, arbitraryAccount),
        await token.allowance(blacklisterAccount, masterMinterAccount),
        await token.allowance(blacklisterAccount, minterAccount),
        await token.allowance(blacklisterAccount, pauserAccount),
        await token.allowance(blacklisterAccount, tokenOwnerAccount),
        await token.allowance(blacklisterAccount, upgraderAccount),
        await token.allowance(blacklisterAccount, blacklisterAccount),
        await token.allowance(tokenOwnerAccount, arbitraryAccount),
        await token.allowance(tokenOwnerAccount, masterMinterAccount),
        await token.allowance(tokenOwnerAccount, minterAccount),
        await token.allowance(tokenOwnerAccount, pauserAccount),
        await token.allowance(tokenOwnerAccount, blacklisterAccount),
        await token.allowance(tokenOwnerAccount, upgraderAccount),
        await token.allowance(tokenOwnerAccount, tokenOwnerAccount),
        await token.allowance(upgraderAccount, arbitraryAccount),
        await token.allowance(upgraderAccount, masterMinterAccount),
        await token.allowance(upgraderAccount, minterAccount),
        await token.allowance(upgraderAccount, pauserAccount),
        await token.allowance(upgraderAccount, blacklisterAccount),
        await token.allowance(upgraderAccount, tokenOwnerAccount),
        await token.allowance(upgraderAccount, upgraderAccount),
        await token.totalSupply(),
        await token.isBlacklisted(arbitraryAccount),
        await token.isBlacklisted(masterMinterAccount),
        await token.isBlacklisted(minterAccount),
        await token.isBlacklisted(pauserAccount),
        await token.isBlacklisted(blacklisterAccount),
        await token.isBlacklisted(tokenOwnerAccount),
        await token.isMinter(arbitraryAccount),
        await token.isMinter(masterMinterAccount),
        await token.isMinter(minterAccount),
        await token.isMinter(pauserAccount),
        await token.isMinter(blacklisterAccount),
        await token.isMinter(tokenOwnerAccount),
        await token.minterAllowance(arbitraryAccount),
        await token.minterAllowance(masterMinterAccount),
        await token.minterAllowance(minterAccount),
        await token.minterAllowance(pauserAccount),
        await token.minterAllowance(blacklisterAccount),
        await token.minterAllowance(tokenOwnerAccount),
        await token.paused()
    ]).spread(function (
        name,
        symbol,
        currency,
        decimals,
        masterMinter,
        pauser,
        blacklister,
        tokenOwner,
        proxiedTokenAddress,
        balancesA,
        balancesMM,
        balancesM,
        balancesP,
        balancesB,
        balancesRAC,
        allowanceAtoMM,
        allowanceAtoM,
        allowanceAtoP,
        allowanceAtoB,
        allowanceAtoRAC,
        allowanceAtoU,
        allowanceAtoA,
        allowanceMMtoA,
        allowanceMMtoM,
        allowanceMMtoP,
        allowanceMMtoB,
        allowanceMMtoRAC,
        allowanceMMtoU,
        allowanceMMtoMM,
        allowanceMtoA,
        allowanceMtoMM,
        allowanceMtoP,
        allowanceMtoB,
        allowanceMtoRAC,
        allowanceMtoU,
        allowanceMtoM,
        allowancePtoA,
        allowancePtoMM,
        allowancePtoM,
        allowancePtoB,
        allowancePtoRAC,
        allowancePtoU,
        allowancePtoP,
        allowanceBtoA,
        allowanceBtoMM,
        allowanceBtoM,
        allowanceBtoP,
        allowanceBtoRAC,
        allowanceBtoU,
        allowanceBtoB,
        allowanceRACtoA,
        allowanceRACtoMM,
        allowanceRACtoM,
        allowanceRACtoP,
        allowanceRACtoB,
        allowanceRACtoU,
        allowanceRACtoRAC,
        allowanceUtoA,
        allowanceUtoMM,
        allowanceUtoM,
        allowanceUtoP,
        allowanceUtoB,
        allowanceUtoRAC,
        allowanceUtoU,
        totalSupply,
        isAccountBlacklistedA,
        isAccountBlacklistedMM,
        isAccountBlacklistedM,
        isAccountBlacklistedP,
        isAccountBlacklistedB,
        isAccountBlacklistedRAC,
        isAccountMinterA,
        isAccountMinterMM,
        isAccountMinterM,
        isAccountMinterP,
        isAccountMinterB,
        isAccountMinterRAC,
        minterAllowanceA,
        minterAllowanceMM,
        minterAllowanceM,
        minterAllowanceP,
        minterAllowanceB,
        minterAllowanceRAC,
        paused
    ) {
        var actualState = {
            'name': name,
            'symbol': symbol,
            'currency': currency,
            'decimals': decimals,
            'masterMinter': masterMinter,
            'pauser': pauser,
            'blacklister': blacklister,
            'tokenOwner': tokenOwner,
            'proxiedTokenAddress': proxiedTokenAddress,
            'balances': {
                'arbitraryAccount': balancesA,
                'masterMinterAccount': balancesMM,
                'minterAccount': balancesM,
                'pauserAccount': balancesP,
                'blacklisterAccount': balancesB,
                'tokenOwnerAccount': balancesRAC
            },
            'allowance': {
                'arbitraryAccount': {
                    'masterMinterAccount': allowanceAtoMM,
                    'minterAccount': allowanceAtoM,
                    'pauserAccount': allowanceAtoP,
                    'blacklisterAccount': allowanceAtoB,
                    'tokenOwnerAccount': allowanceAtoRAC,
                    'upgraderAccount': allowanceAtoU,
                    'arbitraryAccount': allowanceAtoA,
                },
                'masterMinterAccount': {
                    'arbitraryAccount': allowanceMMtoA,
                    'minterAccount': allowanceMMtoM,
                    'pauserAccount': allowanceMMtoP,
                    'blacklisterAccount': allowanceMMtoB,
                    'tokenOwnerAccount': allowanceMMtoRAC,
                    'upgraderAccount': allowanceMMtoU,
                    'masterMinterAccount': allowanceMMtoMM,
                },
                'minterAccount': {
                    'arbitraryAccount': allowanceMtoA,
                    'masterMinterAccount': allowanceMtoMM,
                    'pauserAccount': allowanceMtoP,
                    'blacklisterAccount': allowanceMtoB,
                    'tokenOwnerAccount': allowanceMtoRAC,
                    'upgraderAccount': allowanceMtoU,
                    'minterAccount': allowanceMtoM,
                },
                'pauserAccount': {
                    'arbitraryAccount': allowancePtoA,
                    'masterMinterAccount': allowancePtoMM,
                    'minterAccount': allowancePtoM,
                    'blacklisterAccount': allowancePtoB,
                    'tokenOwnerAccount': allowancePtoRAC,
                    'upgraderAccount': allowancePtoU,
                    'pauserAccount': allowancePtoP,
                },
                'blacklisterAccount': {
                    'arbitraryAccount': allowanceBtoA,
                    'masterMinterAccount': allowanceBtoMM,
                    'minterAccount': allowanceBtoM,
                    'pauserAccount': allowanceBtoP,
                    'tokenOwnerAccount': allowanceBtoRAC,
                    'upgraderAccount': allowanceBtoU,
                    'blacklisterAccount': allowanceBtoB,
                },
                'tokenOwnerAccount': {
                    'arbitraryAccount': allowanceRACtoA,
                    'masterMinterAccount': allowanceRACtoMM,
                    'minterAccount': allowanceRACtoM,
                    'pauserAccount': allowanceRACtoP,
                    'blacklisterAccount': allowanceRACtoB,
                    'upgraderAccount': allowanceRACtoU,
                    'tokenOwnerAccount': allowanceRACtoRAC,
                },
                'upgraderAccount': {
                    'arbitraryAccount': allowanceUtoA,
                    'masterMinterAccount': allowanceUtoMM,
                    'minterAccount': allowanceUtoM,
                    'pauserAccount': allowanceUtoP,
                    'blacklisterAccount': allowanceUtoB,
                    'tokenOwnerAccount': allowanceUtoRAC,
                    'upgraderAccount': allowanceUtoU,
                }
            },
            'totalSupply': totalSupply,
            'isAccountBlacklisted': {
                'arbitraryAccount': isAccountBlacklistedA,
                'masterMinterAccount': isAccountBlacklistedMM,
                'minterAccount': isAccountBlacklistedM,
                'pauserAccount': isAccountBlacklistedP,
                'blacklisterAccount': isAccountBlacklistedB,
                'tokenOwnerAccount': isAccountBlacklistedRAC
            },
            'isAccountMinter': {
                'arbitraryAccount': isAccountMinterA,
                'masterMinterAccount': isAccountMinterMM,
                'minterAccount': isAccountMinterM,
                'pauserAccount': isAccountMinterP,
                'blacklisterAccount': isAccountMinterB,
                'tokenOwnerAccount': isAccountMinterRAC
            },
            'minterAllowance': {
                'arbitraryAccount': minterAllowanceA,
                'masterMinterAccount': minterAllowanceMM,
                'minterAccount': minterAllowanceM,
                'pauserAccount': minterAllowanceP,
                'blacklisterAccount': minterAllowanceB,
                'tokenOwnerAccount': minterAllowanceRAC
            },
            'paused': paused
        };
        return actualState;
    })
}

async function setMinter(token, minter, amount) {
    let update = await token.configureMinter(minter, amount, { from: masterMinterAccount });
    assert.equal(update.logs[0].event, 'MinterConfigured');
    assert.equal(update.logs[0].args.minter, minter);
    assert.equal(update.logs[0].args.minterAllowedAmount, amount);
    let minterAllowance = await token.minterAllowance(minter);

    assert.equal(minterAllowance, amount);
}

async function mint(token, to, amount, minter) {
    await setMinter(token, minter, amount);
    await mintRaw(token, to, amount, minter);
}

async function mintRaw(token, to, amount, minter) {
    let initialTotalSupply = await token.totalSupply();
    let initialMinterAllowance = await token.minterAllowance(minter);
    let minting = await token.mint(to, amount, { from: minter });
    checkMintEvents(minting, to, amount, minter);

    // TODO revisit this
    /*  let totalSupply = await token.totalSupply();
      totalSupply.should.be.bignumber.equal(initialTotalSupply);
      let minterAllowance = await token.minterAllowance(minter);
      assert.isTrue(new BigNumber(initialMinterAllowance).minus(new BigNumber(amount)).isEqualTo(new BigNumber(minterAllowance)));*/
}

async function blacklist(token, account) {
    let blacklist = await token.blacklist(account, { from: blacklisterAccount });
    assert.equal(blacklist.logs[0].event, 'Blacklisted');
    assert.equal(blacklist.logs[0].args._account, account);
}

async function unBlacklist(token, account) {
    let unblacklist = await token.unBlacklist(account, { from: blacklisterAccount });
    assert.equal(unblacklist.logs[0].event, 'UnBlacklisted');
    assert.equal(unblacklist.logs[0].args._account, account);
}

async function setLongDecimalFeesTransferWithFees(token, ownerAccount, arbitraryAccount) {
    fee = 123589;
    feeBase = 1000000;
    await token.updateTransferFee(fee, feeBase);
    let allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(token, ownerAccount, 1900);
    let initialBalanceFeeAccount = await token.balanceOf(feeAccount);

    await token.approve(arbitraryAccount, 1500);
    allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(1500)));

    let transfer = await token.transfer(arbitraryAccount, 1000, { from: ownerAccount });

    let feeAmount = calculateFeeAmount(1000);
    checkTransferEvents(transfer, ownerAccount, arbitraryAccount, 1000, feeAmount);


    let balance0 = await token.balanceOf(ownerAccount);
    assert.equal(balance0, 1900 - 1000 - feeAmount);
    let balance3 = await token.balanceOf(arbitraryAccount);
    assert.equal(balance3, 1000);
    let balanceFeeAccount = await token.balanceOf(feeAccount);
    assert.isTrue(new BigNumber(balanceFeeAccount).minus(new BigNumber(initialBalanceFeeAccount)).isEqualTo(new BigNumber(feeAmount)));
}

async function sampleTransfer(token, ownerAccount, arbitraryAccount, minter) {
    let allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(token, ownerAccount, 1900, minter);

    await token.approve(arbitraryAccount, 1500);
    allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(1500)));

    let transfer = await token.transfer(arbitraryAccount, 1000, { from: ownerAccount });

    checkTransferEvents(transfer, ownerAccount, arbitraryAccount, 1000);

    let balance0 = await token.balanceOf(ownerAccount);
    assert.equal(balance0, 1900 - 1000);
    let balance3 = await token.balanceOf(arbitraryAccount);
    assert.equal(balance3, 1000);
}

async function transferFromWithFees(token, ownerAccount, arbitraryAccount, minter) {
    fee = 1235;
    feeBase = 10000;
    await token.updateTransferFee(fee, feeBase);
    let allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(token, ownerAccount, 900, minter);
    let initialBalanceFeeAccount = await token.balanceOf(feeAccount);
    await token.approve(arbitraryAccount, 634);
    allowed = await token.allowance.call(ownerAccount, arbitraryAccount);
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(634)));

    transfer = await token.transferFrom(ownerAccount, arbitraryAccount, 534, { from: arbitraryAccount });

    let feeAmount = calculateFeeAmount(534);
    checkTransferEvents(transfer, ownerAccount, arbitraryAccount, 534, feeAmount);

    let balance0 = await token.balanceOf(ownerAccount);
    assert.isTrue(new BigNumber(balance0).isEqualTo(new BigNumber(900).minus(new BigNumber(534)).minus(new BigNumber(feeAmount))));
    let balance3 = await token.balanceOf(arbitraryAccount);
    assert.isTrue(new BigNumber(balance3).isEqualTo(new BigNumber(534)));
    let balanceFeeAccount = await token.balanceOf(feeAccount);
    assert.isTrue(new BigNumber(balanceFeeAccount).minus(new BigNumber(initialBalanceFeeAccount)).isEqualTo(new BigNumber(feeAmount)));
}

async function sampleTransferFrom(token, ownerAccount, arbitraryAccount, minter) {
    let allowed = await token.allowance.call(ownerAccount, arbitraryAccount); // TODO not this
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(0)));
    await mint(token, ownerAccount, 900, minter); // TODO maybe this
    await token.approve(arbitraryAccount, 634); // TODO not this
    allowed = await token.allowance.call(ownerAccount, arbitraryAccount); // TODO not this
    assert.isTrue(new BigNumber(allowed).isEqualTo(new BigNumber(634)));

    let transfer = await token.transferFrom(ownerAccount, arbitraryAccount, 534, { from: arbitraryAccount }); // TODO not this

    checkTransferEvents(transfer, ownerAccount, arbitraryAccount, 534);

    let balance0 = await token.balanceOf(ownerAccount);
    assert.isTrue(new BigNumber(balance0).isEqualTo(new BigNumber(900).minus(new BigNumber(534))));
    let balance3 = await token.balanceOf(arbitraryAccount);
    assert.isTrue(new BigNumber(balance3).isEqualTo(new BigNumber(534)));
}

async function approve(token, to, amount, from) {
    await token.approve(to, amount, { from: from });
}

async function redeem(token, account, amount) {
    let redeemResult = await token.redeem(amount, { from: account });
    assert.equal(redeemResult.logs[0].event, 'Redeem');
    assert.equal(redeemResult.logs[0].args.redeemedAddress, account);
    assert.equal(redeemResult.logs[0].args.amount, amount);
}

async function initializeTokenWithProxy(rawToken) {
    const proxy = await FiatTokenProxy.new({ from: proxyOwnerAccount })
    const initializeData = encodeCall('initialize', ['string', 'string', 'string', 'uint8', 'address', 'address', 'address', 'address'], [name, symbol, currency, decimals, masterMinterAccount, pauserAccount, blacklisterAccount, tokenOwnerAccount]);
    await proxy.upgradeToAndCall('0', rawToken.address, initializeData, { from: proxyOwnerAccount })
    proxiedToken = await FiatToken.at(proxy.address);
    proxiedToken.proxiedTokenAddress = rawToken.address;
    assert.equal(proxiedToken.address, proxy.address);
    assert.notEqual(proxiedToken.address, rawToken.address);
    var tokenConfig = {
      proxy: proxy,
      token: proxiedToken
    };
    return tokenConfig;
}

async function upgradeTo(proxy, upgradedToken, proxyUpgraderAccount) {
  if (proxyUpgraderAccount == null) {
    proxyUpgraderAccount = proxyOwnerAccount;
  }
  await proxy.upgradeTo('1', upgradedToken.address, { from: proxyUpgraderAccount });
  proxiedToken = await FiatToken.at(proxy.address);
  assert.equal(proxiedToken.address, proxy.address);
  return tokenConfig = {
    proxy: proxy,
    token: proxiedToken
  }
}

async function expectRevert(contractPromise) {
    try {
        await contractPromise;
    } catch (error) {
        const revert = error.message.search('revert') >= 0;
        assert(
            revert,
            'Expected error of type revert, got \'' + error + '\' instead',
        );
        return;
    }
    assert.fail('Expected error of type revert, but no error was received');
}

async function expectJump(contractPromise) {
    try {
        await contractPromise;
        assert.fail('Expected invalid opcode not received');
    } catch (error) {
        const invalidOpcodeReceived = error.message.search('invalid opcode') >= 0;
        assert(invalidOpcodeReceived, `Expected "invalid opcode", got ${error} instead`);
    }
}

function encodeCall(name, arguments, values) {
  const methodId = abi.methodID(name, arguments).toString('hex');
  const params = abi.rawEncode(arguments, values).toString('hex');
  return '0x' + methodId + params;
}

module.exports = {
    name: name,
    symbol: symbol,
    currency: currency,
    decimals: decimals,
    bigZero: bigZero,
    bigHundred: bigHundred,
    debugLogging: debugLogging,
    calculateFeeAmount: calculateFeeAmount,
    checkTransferEventsWithFee: checkTransferEventsWithFee,
    checkTransferEvents: checkTransferEvents,
    buildExpectedState,
    checkVariables: checkVariables,
    setMinter: setMinter,
    mint: mint,
    mintRaw: mintRaw,
    blacklist: blacklist,
    unBlacklist: unBlacklist,
    setLongDecimalFeesTransferWithFees: setLongDecimalFeesTransferWithFees,
    sampleTransfer: sampleTransfer,
    transferFromWithFees: transferFromWithFees,
    sampleTransferFrom: sampleTransferFrom,
    approve: approve,
    redeem: redeem,
    initializeTokenWithProxy: initializeTokenWithProxy,
    upgradeTo: upgradeTo,
    expectRevert: expectRevert,
    expectJump: expectJump,
    encodeCall: encodeCall,
    deployerAccount: deployerAccount,
    arbitraryAccount: arbitraryAccount,
    tokenOwnerAccount: tokenOwnerAccount,
    arbitraryAccount2: arbitraryAccount2,
    masterMinterAccount: masterMinterAccount,
    minterAccount: minterAccount,
    pauserAccount: pauserAccount,
    blacklisterAccount: blacklisterAccount,
    proxyOwnerAccount: proxyOwnerAccount,
    arbitraryAccountPrivateKey,
    upgraderAccountPrivateKey,
    tokenOwnerPrivateKey,
    blacklisterAccountPrivateKey,
    arbitraryAccount2PrivateKey,
    masterMinterAccountPrivateKey,
    minterAccountPrivateKey,
    pauserAccountPrivateKey,
    deployerAccountPrivateKey
};
