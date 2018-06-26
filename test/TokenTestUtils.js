var UpgradedFiatToken = artifacts.require('UpgradedFiatToken');
var EternalStorage = artifacts.require('EternalStorage');
const util = require('util');
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
// TODO: test really big numbers  Does this still have to be done??

var deployerAccount = "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1"; // accounts[0]
var deployerAccountPrivateKey = "4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"; // accounts[0]
var arbitraryAccount = "0xffcf8fdee72ac11b5c542428b35eef5769c409f0"; // accounts[1]
var arbitraryAccountPrivateKey = "6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1"; // accounts[1];
var upgraderAccount = "0x22d491bde2303f2f43325b2108d26f1eaba1e32b"; // accounts[2]
var tokenOwnerAccount = "0xe11ba2b4d45eaed5996cd0823791e0c93114882d"; // accounts[3]
var blacklisterAccount = "0xd03ea8624c8c5987235048901fb614fdca89b117"; // accounts[4] Why Multiple blacklisterAccount??
var arbitraryAccount2 = "0x95ced938f7991cd0dfcb48f0a06a40fa1af46ebc"; // accounts[5]
var masterMinterAccount = "0x3e5e9111ae8eb78fe1cc3bb8915d5d461f3ef9a9"; // accounts[6]
var minterAccount = "0x28a8746e75304c0780e011bed21c72cd78cd535e"; // accounts[7]
var pauserAccount = "0xaca94ef8bd5ffee41947b4585a84bda5a3d3da6e"; // accounts[8]
var blacklisterAccount = "0x1df62f291b2e969fb0849d99d9ce41e2f137006e"; // accounts[9]

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

// For testing variance of specific variables from their default values.
// customVars is an array of objects of the form,
// {'variable': <name of variable>, 'expectedValue': <expected value after modification>}
// to reference nested variables, name variable using dot syntax, e.g. 'allowance.arbitraryAccount.minterAccount'
async function checkVariables(token, customVars) {
    // set each variable's default value
    var expectedState = {
        'name': name,
        'symbol': symbol,
        'currency': currency,
        'decimals': new BigNumber(decimals),
        'masterMinter': masterMinterAccount,
        'pauser': pauserAccount,
        'blacklister': blacklisterAccount,
        'upgrader': upgraderAccount,
        'tokenOwner': tokenOwnerAccount,
        'storageOwner': token.address,
        // contractStorage is not deterministic for FiatTokenWithStorage
        //'contractStorage': ,
        'priorContractAddress': token.default_priorContractAddress,
        'upgradedAddress': "0x0000000000000000000000000000000000000000",
        'balances': {
            'arbitraryAccount': bigZero,
            'masterMinterAccount': bigZero,
            'minterAccount': bigZero,
            'pauserAccount': bigZero,
            'blacklisterAccount': bigZero,
            'tokenOwnerAccount': bigZero,
            'upgraderAccount': bigZero
        },
        'allowance': {
            'arbitraryAccount': {
                'masterMinterAccount': bigZero,
                'minterAccount': bigZero,
                'pauserAccount': bigZero,
                'blacklisterAccount': bigZero,
                'tokenOwnerAccount': bigZero,
                'upgraderAccount': bigZero
            },
            'masterMinterAccount': {
                'arbitraryAccount': bigZero,
                'minterAccount': bigZero,
                'pauserAccount': bigZero,
                'blacklisterAccount': bigZero,
                'tokenOwnerAccount': bigZero,
                'upgraderAccount': bigZero
            },
            'minterAccount': {
                'arbitraryAccount': bigZero,
                'masterMinterAccount': bigZero,
                'pauserAccount': bigZero,
                'blacklisterAccount': bigZero,
                'tokenOwnerAccount': bigZero,
                'upgraderAccount': bigZero
            },
            'pauserAccount': {
                'arbitraryAccount': bigZero,
                'masterMinterAccount': bigZero,
                'minterAccount': bigZero,
                'blacklisterAccount': bigZero,
                'tokenOwnerAccount': bigZero,
                'upgraderAccount': bigZero
            },
            'blacklisterAccount': {
                'arbitraryAccount': bigZero,
                'masterMinterAccount': bigZero,
                'minterAccount': bigZero,
                'pauserAccount': bigZero,
                'tokenOwnerAccount': bigZero,
                'upgraderAccount': bigZero
            },
            'tokenOwnerAccount': {
                'arbitraryAccount': bigZero,
                'masterMinterAccount': bigZero,
                'minterAccount': bigZero,
                'pauserAccount': bigZero,
                'blacklisterAccount': bigZero,
                'upgraderAccount': bigZero
            },
            'upgraderAccount': {
                'arbitraryAccount': bigZero,
                'masterMinterAccount': bigZero,
                'minterAccount': bigZero,
                'pauserAccount': bigZero,
                'blacklisterAccount': bigZero,
                'tokenOwnerAccount': bigZero,
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
            'upgraderAccount': false
        },
        'isAccountMinter': {
            'arbitraryAccount': false,
            'masterMinterAccount': false,
            'minterAccount': false,
            'pauserAccount': false,
            'blacklisterAccount': false,
            'tokenOwnerAccount': false,
            'upgraderAccount': false
        },
        'minterAllowance': {
            'arbitraryAccount': bigZero,
            'masterMinterAccount': bigZero,
            'minterAccount': bigZero,
            'pauserAccount': bigZero,
            'blacklisterAccount': bigZero,
            'tokenOwnerAccount': bigZero,
            'upgraderAccount': bigZero
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

    if (debugLogging) {
        console.log(util.inspect(expectedState, { showHidden: false, depth: null }))
    }

    let actualState = await getActualState(token);
    assertDiff.deepEqual(actualState, expectedState, "difference between expected and actual state");
}

// build up actualState object to compare to expectedState object

async function getActualState(token) {
  let storage = EternalStorage.at(await token.getDataContractAddress());
  let _priorContractAddress = "undefined";
  if (_.has(token, 'priorContractAddress')) {
    _priorContractAddress = await token.priorContractAddress.call();
  }
    return Q.all([
        await token.name.call(),
        await token.symbol.call(),
        await token.currency.call(),
        await token.decimals.call(),
        await token.masterMinter.call(),
        await token.pauser.call(),
        await token.blacklister.call(),
        await token.upgrader.call(),
        await token.owner.call(),
        await storage.owner.call(),
        // contractStorage is not deterministic for FiatTokenWithStorage
        //'contractStorage': ,
        _priorContractAddress,
        await token.upgradedAddress.call(),
        await token.balanceOf(arbitraryAccount),
        await token.balanceOf(masterMinterAccount),
        await token.balanceOf(minterAccount),
        await token.balanceOf(pauserAccount),
        await token.balanceOf(blacklisterAccount),
        await token.balanceOf(tokenOwnerAccount),
        await token.balanceOf(upgraderAccount),
        await token.allowance(arbitraryAccount, masterMinterAccount),
        await token.allowance(arbitraryAccount, minterAccount),
        await token.allowance(arbitraryAccount, pauserAccount),
        await token.allowance(arbitraryAccount, blacklisterAccount),
        await token.allowance(arbitraryAccount, tokenOwnerAccount),
        await token.allowance(arbitraryAccount, upgraderAccount),
        await token.allowance(masterMinterAccount, arbitraryAccount),
        await token.allowance(masterMinterAccount, minterAccount),
        await token.allowance(masterMinterAccount, pauserAccount),
        await token.allowance(masterMinterAccount, blacklisterAccount),
        await token.allowance(masterMinterAccount, tokenOwnerAccount),
        await token.allowance(masterMinterAccount, upgraderAccount),
        await token.allowance(minterAccount, arbitraryAccount),
        await token.allowance(minterAccount, masterMinterAccount),
        await token.allowance(minterAccount, pauserAccount),
        await token.allowance(minterAccount, blacklisterAccount),
        await token.allowance(minterAccount, tokenOwnerAccount),
        await token.allowance(minterAccount, upgraderAccount),
        await token.allowance(pauserAccount, arbitraryAccount),
        await token.allowance(pauserAccount, masterMinterAccount),
        await token.allowance(pauserAccount, minterAccount),
        await token.allowance(pauserAccount, blacklisterAccount),
        await token.allowance(pauserAccount, tokenOwnerAccount),
        await token.allowance(pauserAccount, upgraderAccount),
        await token.allowance(blacklisterAccount, arbitraryAccount),
        await token.allowance(blacklisterAccount, masterMinterAccount),
        await token.allowance(blacklisterAccount, minterAccount),
        await token.allowance(blacklisterAccount, pauserAccount),
        await token.allowance(blacklisterAccount, tokenOwnerAccount),
        await token.allowance(blacklisterAccount, upgraderAccount),
        await token.allowance(tokenOwnerAccount, arbitraryAccount),
        await token.allowance(tokenOwnerAccount, masterMinterAccount),
        await token.allowance(tokenOwnerAccount, minterAccount),
        await token.allowance(tokenOwnerAccount, pauserAccount),
        await token.allowance(tokenOwnerAccount, blacklisterAccount),
        await token.allowance(tokenOwnerAccount, upgraderAccount),
        await token.allowance(upgraderAccount, arbitraryAccount),
        await token.allowance(upgraderAccount, masterMinterAccount),
        await token.allowance(upgraderAccount, minterAccount),
        await token.allowance(upgraderAccount, pauserAccount),
        await token.allowance(upgraderAccount, blacklisterAccount),
        await token.allowance(upgraderAccount, tokenOwnerAccount),
        await token.totalSupply(),
        await token.isAccountBlacklisted(arbitraryAccount),
        await token.isAccountBlacklisted(masterMinterAccount),
        await token.isAccountBlacklisted(minterAccount),
        await token.isAccountBlacklisted(pauserAccount),
        await token.isAccountBlacklisted(blacklisterAccount),
        await token.isAccountBlacklisted(tokenOwnerAccount),
        await token.isAccountBlacklisted(upgraderAccount),
        await token.isAccountMinter(arbitraryAccount),
        await token.isAccountMinter(masterMinterAccount),
        await token.isAccountMinter(minterAccount),
        await token.isAccountMinter(pauserAccount),
        await token.isAccountMinter(blacklisterAccount),
        await token.isAccountMinter(tokenOwnerAccount),
        await token.isAccountMinter(upgraderAccount),
        await token.minterAllowance(arbitraryAccount),
        await token.minterAllowance(masterMinterAccount),
        await token.minterAllowance(minterAccount),
        await token.minterAllowance(pauserAccount),
        await token.minterAllowance(blacklisterAccount),
        await token.minterAllowance(tokenOwnerAccount),
        await token.minterAllowance(upgraderAccount),
        await token.paused()
    ]).spread(function (
        name,
        symbol,
        currency,
        decimals,
        masterMinter,
        pauser,
        blacklister,
        upgrader,
        tokenOwner,
        storageOwner,
        priorContractAddress,
        upgradedAddress,
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
            'upgrader': upgrader,
            'tokenOwner': tokenOwner,
            'storageOwner': storageOwner,
            // contractStorage is not deterministic for FiatTokenWithStorage
            //'contractStorage': storageAddress,
            'priorContractAddress': priorContractAddress,
            'upgradedAddress': upgradedAddress,
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
    assert.equal(minting.logs[0].event, 'Mint');
    assert.equal(minting.logs[0].args.minter, minter);
    assert.equal(minting.logs[0].args.to, to);
    assert.equal(minting.logs[0].args.amount, amount);
    // TODO revisit this
    /*  let totalSupply = await token.totalSupply();
      totalSupply.should.be.bignumber.equal(initialTotalSupply);
      let minterAllowance = await token.minterAllowance(minter);
      assert.isTrue(new BigNumber(initialMinterAllowance).minus(new BigNumber(amount)).isEqualTo(new BigNumber(minterAllowance)));*/
}

async function mintToReserveAccount(token, address, amount) {
    let minting = await token.mint(amount, { from: minterAccount });
    assert.equal(minting.logs[0].event, 'Mint');
    assert.equal(minting.logs[0].args.amount, amount);
    let mintTransfer = await token.transfer(address, amount, { from: reserverAccount });
    assert.equal(mintTransfer.logs[0].event, 'Transfer');
    assert.equal(mintTransfer.logs[0].args.from, reserverAccount);
    assert.equal(mintTransfer.logs[0].args.to, address);
    assert.equal(mintTransfer.logs[0].args.value, amount);
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
    checkVariables: checkVariables,
    setMinter: setMinter,
    mint: mint,
    mintRaw: mintRaw,
    mintToReserveAccount: mintToReserveAccount,
    blacklist: blacklist,
    unBlacklist: unBlacklist,
    setLongDecimalFeesTransferWithFees: setLongDecimalFeesTransferWithFees,
    sampleTransfer: sampleTransfer,
    transferFromWithFees: transferFromWithFees,
    sampleTransferFrom: sampleTransferFrom,
    approve: approve,
    redeem: redeem,
    expectRevert: expectRevert,
    expectJump: expectJump,
    deployerAccount: deployerAccount,
    arbitraryAccount: arbitraryAccount,
    upgraderAccount: upgraderAccount,
    tokenOwnerAccount: tokenOwnerAccount,
    arbitraryAccount2: arbitraryAccount2,
    masterMinterAccount: masterMinterAccount,
    minterAccount: minterAccount,
    pauserAccount: pauserAccount,
    blacklisterAccount: blacklisterAccount,

    arbitraryAccountPrivateKey,
    deployerAccountPrivateKey
};
