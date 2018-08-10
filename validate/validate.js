// Address of the FiatToken Implementation
var fiatTokenAddress = "0x0882477e7895bdc5cea7cb1552ed914ab157fe56";

// Address of the FiatToken Proxy
var fiatTokenProxyAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// role addresses
var MASTER_MINTER = 0x1500A138523709cE66C8B9aBe678aBc1b6C5A7b7;
var PAUSER = 0xe8e13e1B6d363C270eF3A5AB466eBAd8326311bb;
var UPGRADER = 0x69005ff70072c57547dC44ea975d85ea60e5B196;
var OWNER = 0xa61E278899a8553d93D14eb19bA2791e05069e87;
var BLACKLISTER = 0x063d13783A0A2Ce65b1Ca00D9e897E6c8B1Ec86B;

// Addresses of known minters - currently fake minters
// If replacing with real minters need to modify printMinterInfo
var minters = ["0x0000", "0x0001"];

var NAME = "USD//C";
var SYMBOL = "USDC";
var CURRENCY = "USD";
var DECIMALS = 6 ;
var TOTALSUPPLY =  0;
var PAUSED = false

// Name of current implementation artifact as stored in ./build/contracts/*.json
var FiatToken = artifacts.require("FiatTokenV1");

// Name of current proxy artifact as stored in ./build/contracts/*.json
var FiatTokenProxy = artifacts.require("FiatTokenProxy");

//
//
// Validation code
//
//

var adminSlot = "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b";
var implSlot = "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3";

const asyncGetStorageAt = (address, slot) => new Promise((resolve, reject) => {
  web3.eth.getStorageAt(address, slot, (err, result) => {
    if (err) {
      return reject(err);
    }
    resolve(result);
  });
});

async function printMinterInfo(proxiedToken) {
    for (const minter of minters) {
        console.log("\nMinter: " + minter);

        let isMinter = await proxiedToken.isMinter.call(minter);
        print("isMinter", isMinter, false);

        let minterAllowance = await proxiedToken.minterAllowance.call(minter);
        print("mintAllowance", minterAllowance, 0);

        let balanceOf = await proxiedToken.balanceOf.call(minter);
        print("balanceOf", balanceOf, 0);

        let isBlacklisted = await proxiedToken.isBlacklisted.call(minter);
        print("isBlacklisted", isBlacklisted, false);
    }
}

function getAddressFromSlotData(slotData) {
    const rawAddress = slotData.substring(26, 86);
    return "0x" + rawAddress;
}

function compare(actual, expected) {
    if(actual == expected)
    {
        return "(ok)";
    } else {
        return "(expect " + expected + ")";
    }
}

function print(name, actual, expected) {
    console.log(name + "\t" + actual + "\t" + compare(actual, expected));
}

async function Validate() {
    console.log("Connecting to contract...");
    var token = await FiatToken.at(fiatTokenAddress);
    console.log("Token found.");
    var proxiedToken = await FiatToken.at(fiatTokenProxyAddress);
    console.log("Proxied token created.");

    // initialized needs to retrieved manually
    var slot8Data = await asyncGetStorageAt(proxiedToken.address, 8);
    var initialized = slot8Data.substring(24,26);
    print("init proxy", initialized, "01");

    var slot8Data = await asyncGetStorageAt(fiatTokenAddress, 8);
    var initialized = slot8Data.substring(24,26);
    print("init logic", initialized, "01");

    var name = await proxiedToken.name.call();
    print("name     ", name, NAME);

    var symbol = await proxiedToken.symbol.call();
    print("symbol   ", symbol, SYMBOL);

    var decimals = await proxiedToken.decimals.call();
    print("decimals", decimals, DECIMALS);

    var currency = await proxiedToken.currency.call();
    print("currency", currency, CURRENCY);

    var totalSupply = await proxiedToken.totalSupply.call();
    print("totalSupply", totalSupply, TOTALSUPPLY);

    var paused = await proxiedToken.paused.call();
    print("paused  ", paused, PAUSED);

    // implementation
    var implementation = await asyncGetStorageAt(proxiedToken.address, implSlot);
    print("implement", getAddressFromSlotData(implementation), fiatTokenAddress);

    var admin = await asyncGetStorageAt(proxiedToken.address, adminSlot);
    print("upgrader", getAddressFromSlotData(admin), UPGRADER);

    var owner = await proxiedToken.owner.call();
    print("owner   ", owner, OWNER);

    var masterMinter = await proxiedToken.masterMinter.call();
    print("masterMinter", masterMinter, MASTER_MINTER);

    var pauser = await proxiedToken.pauser.call();
    print("pauser  ", pauser, PAUSER);

    var blacklister = await proxiedToken.blacklister.call();
    print("blacklister", blacklister, BLACKLISTER);

    await printMinterInfo(proxiedToken);
}

module.exports = async function(callback) {
    try {
    await Validate();
    } catch(e) {

    }
    callback();
}