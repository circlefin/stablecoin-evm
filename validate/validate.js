// Address of the FiatToken Implementation
const fiatTokenAddress = "0x0882477e7895bdc5cea7cb1552ed914ab157fe56";

// Address of the FiatToken Proxy
const fiatTokenProxyAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

// role addresses
const MASTER_MINTER = 0x1500a138523709ce66c8b9abe678abc1b6c5a7b7;
const PAUSER = 0xe8e13e1b6d363c270ef3a5ab466ebad8326311bb;
const UPGRADER = 0x69005ff70072c57547dc44ea975d85ea60e5b196;
const OWNER = 0xa61e278899a8553d93d14eb19ba2791e05069e87;
const BLACKLISTER = 0x063d13783a0a2ce65b1ca00d9e897e6c8b1ec86b;

// Addresses of known minters - currently fake minters
// If replacing with real minters need to modify printMinterInfo
const minters = ["0x0000", "0x0001"];

const NAME = "USD//C";
const SYMBOL = "USDC";
const CURRENCY = "USD";
const DECIMALS = 6;
const TOTALSUPPLY = 0;
const PAUSED = false;

// Name of current implementation artifact as stored in ./build/contracts/*.json
const FiatTokenV1 = artifacts.require("FiatTokenV1");

// Name of current proxy artifact as stored in ./build/contracts/*.json
artifacts.require("FiatTokenProxy");

//
//
// Validation code
//
//

const adminSlot =
  "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b";
const implSlot =
  "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3";

const asyncGetStorageAt = (address, slot) =>
  new Promise((resolve, reject) => {
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

    const isMinter = await proxiedToken.isMinter.call(minter);
    print("isMinter", isMinter, false);

    const minterAllowance = await proxiedToken.minterAllowance.call(minter);
    print("mintAllowance", minterAllowance, 0);

    const balanceOf = await proxiedToken.balanceOf.call(minter);
    print("balanceOf", balanceOf, 0);

    const isBlacklisted = await proxiedToken.isBlacklisted.call(minter);
    print("isBlacklisted", isBlacklisted, false);
  }
}

function getAddressFromSlotData(slotData) {
  const rawAddress = slotData.substring(26, 86);
  return "0x" + rawAddress;
}

function compare(actual, expected) {
  if (actual === expected) {
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
  await FiatTokenV1.at(fiatTokenAddress);
  console.log("Token found.");
  const proxiedToken = await FiatTokenV1.at(fiatTokenProxyAddress);
  console.log("Proxied token created.");

  // initialized needs to retrieved manually
  let slot8Data = await asyncGetStorageAt(proxiedToken.address, 8);
  let initialized = slot8Data.substring(24, 26);
  print("init proxy", initialized, "01");

  slot8Data = await asyncGetStorageAt(fiatTokenAddress, 8);
  initialized = slot8Data.substring(24, 26);
  print("init logic", initialized, "01");

  const name = await proxiedToken.name.call();
  print("name     ", name, NAME);

  const symbol = await proxiedToken.symbol.call();
  print("symbol   ", symbol, SYMBOL);

  const decimals = await proxiedToken.decimals.call();
  print("decimals", decimals, DECIMALS);

  const currency = await proxiedToken.currency.call();
  print("currency", currency, CURRENCY);

  const totalSupply = await proxiedToken.totalSupply.call();
  print("totalSupply", totalSupply, TOTALSUPPLY);

  const paused = await proxiedToken.paused.call();
  print("paused  ", paused, PAUSED);

  // implementation
  const implementation = await asyncGetStorageAt(
    proxiedToken.address,
    implSlot
  );
  print("implement", getAddressFromSlotData(implementation), fiatTokenAddress);

  const admin = await asyncGetStorageAt(proxiedToken.address, adminSlot);
  print("upgrader", getAddressFromSlotData(admin), UPGRADER);

  const owner = await proxiedToken.owner.call();
  print("owner   ", owner, OWNER);

  const masterMinter = await proxiedToken.masterMinter.call();
  print("masterMinter", masterMinter, MASTER_MINTER);

  const pauser = await proxiedToken.pauser.call();
  print("pauser  ", pauser, PAUSER);

  const blacklister = await proxiedToken.blacklister.call();
  print("blacklister", blacklister, BLACKLISTER);

  await printMinterInfo(proxiedToken);
}

module.exports = async (callback) => {
  try {
    await Validate();
  } catch (e) {
    // continue
  }
  callback();
};
