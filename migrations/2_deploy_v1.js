const fs = require("fs");
const path = require("path");
const some = require("lodash/some");

const FiatTokenV1 = artifacts.require("FiatTokenV1");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");

const THROWAWAY_ADDRESS = "0x0000000000000000000000000000000000000001";

let proxyAdminAddress = "";
let ownerAddress = "";
let masterMinterAddress = "";
let pauserAddress = "";
let blacklisterAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    PROXY_ADMIN_ADDRESS: proxyAdminAddress,
    OWNER_ADDRESS: ownerAddress,
    MASTERMINTER_ADDRESS: masterMinterAddress,
    PAUSER_ADDRESS: pauserAddress,
    BLACKLISTER_ADDRESS: blacklisterAddress,
  } = require("../config.js"));
}

module.exports = async (deployer, network) => {
  if (some(["development", "coverage"], (v) => network.includes(v))) {
    // DO NOT USE THESE ADDRESSES IN PRODUCTION - these are the deterministic
    // addresses from ganache, so the private keys are well known and match the
    // values we use in the tests
    proxyAdminAddress = "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598";
    ownerAddress = "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d";
    masterMinterAddress = "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9";
    pauserAddress = "0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E";
    blacklisterAddress = "0xd03ea8624C8C5987235048901fB614fDcA89b117";
  }

  console.log(`Proxy Admin:   ${proxyAdminAddress}`);
  console.log(`Owner:         ${ownerAddress}`);
  console.log(`Master Minter: ${masterMinterAddress}`);
  console.log(`Pauser:        ${pauserAddress}`);
  console.log(`Blacklister:   ${blacklisterAddress}`);

  if (
    !proxyAdminAddress ||
    !ownerAddress ||
    !masterMinterAddress ||
    !pauserAddress ||
    !blacklisterAddress
  ) {
    throw new Error(
      "PROXY_ADMIN_ADDRESS, OWNER_ADDRESS, MASTERMINTER_ADDRESS, PAUSER_ADDRESS, and BLACKLISTER_ADDRESS must be provided in config.js"
    );
  }

  console.log("Deploying implementation contract...");
  await deployer.deploy(FiatTokenV1);
  const fiatTokenV1 = await FiatTokenV1.deployed();
  console.log("Deployed implementation contract at", FiatTokenV1.address);

  console.log("Initializing implementation contract with dummy values...");
  await fiatTokenV1.initialize(
    "",
    "",
    "",
    0,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS
  );

  console.log("Deploying proxy contract...");
  await deployer.deploy(FiatTokenProxy, FiatTokenV1.address);
  const fiatTokenProxy = await FiatTokenProxy.deployed();
  console.log("Deployed proxy contract at", FiatTokenProxy.address);

  console.log("Reassigning proxy contract admin...");
  // need to change admin first, or the call to initialize won't work
  // since admin can only call methods in the proxy, and not forwarded methods
  await fiatTokenProxy.changeAdmin(proxyAdminAddress);

  console.log("Initializing proxy contract...");
  // Pretend that the proxy address is a FiatTokenV1 - this is fine because the
  // proxy will forward all the calls to the FiatTokenV1 impl
  const proxyAsV1 = await FiatTokenV1.at(FiatTokenProxy.address);
  await proxyAsV1.initialize(
    "USD//C",
    "USDC",
    "USD",
    6,
    masterMinterAddress,
    pauserAddress,
    blacklisterAddress,
    ownerAddress
  );
};
