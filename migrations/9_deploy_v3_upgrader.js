const fs = require("fs");
const path = require("path");
const some = require("lodash/some");

const FiatTokenV3 = artifacts.require("FiatTokenV3");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const V3Upgrader = artifacts.require("V3Upgrader");

let proxyAdminAddress = "";
let proxyContractAddress = "";
let addressesToBlacklist = [];

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    PROXY_ADMIN_ADDRESS: proxyAdminAddress,
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
    ADDRESSES_TO_BLACKLIST: addressesToBlacklist,
  } = require("../config.js"));
}

module.exports = async (deployer, network) => {
  if (some(["development", "coverage"], (v) => network.includes(v))) {
    // DO NOT USE THESE ADDRESSES IN PRODUCTION
    proxyAdminAddress = "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598";
    proxyContractAddress = (await FiatTokenProxy.deployed()).address;
    addressesToBlacklist = [
      "0xAa05F7C7eb9AF63D6cC03C36c4f4Ef6c37431EE0",
      "0x7F367cC41522cE07553e823bf3be79A889DEbe1B",
    ];
  }
  proxyContractAddress =
    proxyContractAddress || (await FiatTokenProxy.deployed()).address;

  if (addressesToBlacklist.length === 0) {
    throw new Error("ADDRESSES_TO_BLACKLIST must be provided in config.js");
  }

  if (!proxyAdminAddress) {
    throw new Error("PROXY_ADMIN_ADDRESS must be provided in config.js");
  }

  const fiatTokenV3 = await FiatTokenV3.deployed();

  console.log(`Proxy Admin:     ${proxyAdminAddress}`);
  console.log(`FiatTokenProxy:  ${proxyContractAddress}`);
  console.log(`FiatTokenV3:     ${fiatTokenV3.address}`);
  console.log(`Addresses to Blacklist:`, addressesToBlacklist);

  console.log("Deploying V3Upgrader contract...");

  const v3Upgrader = await deployer.deploy(
    V3Upgrader,
    proxyContractAddress,
    fiatTokenV3.address,
    proxyAdminAddress,
    addressesToBlacklist
  );

  console.log(`>>>>>>> Deployed V3Upgrader at ${v3Upgrader.address} <<<<<<<`);
};
