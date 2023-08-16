const fs = require("fs");
const path = require("path");
const some = require("lodash/some");
const { readBlacklistFile } = require("../utils");

const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const V2_2Upgrader = artifacts.require("V2_2Upgrader");

let proxyAdminAddress = "";
let proxyContractAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    PROXY_ADMIN_ADDRESS: proxyAdminAddress,
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
  } = require("../config.js"));
}

module.exports = async (deployer, network) => {
  const isTestEnvironment = some(["development", "coverage"], (v) =>
    network.includes(v)
  );

  // Proceed if and only if the blacklist file exists.
  const accountsToBlacklist = readBlacklistFile(
    path.join(
      __dirname,
      "..",
      isTestEnvironment ? "blacklist.test.js" : "blacklist.remote.js"
    )
  );

  if (isTestEnvironment) {
    // DO NOT USE THESE ADDRESSES IN PRODUCTION
    proxyAdminAddress = "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598";
    proxyContractAddress = (await FiatTokenProxy.deployed()).address;
  }
  proxyContractAddress =
    proxyContractAddress || (await FiatTokenProxy.deployed()).address;

  if (!proxyAdminAddress) {
    throw new Error("PROXY_ADMIN_ADDRESS must be provided in config.js");
  }

  const fiatTokenV2_2 = await FiatTokenV2_2.deployed();

  console.log(`Proxy Admin:     ${proxyAdminAddress}`);
  console.log(`FiatTokenProxy:  ${proxyContractAddress}`);
  console.log(`FiatTokenV2_2:   ${fiatTokenV2_2.address}`);

  console.log("Deploying V2_2Upgrader contract...");

  const v2_2Upgrader = await deployer.deploy(
    V2_2Upgrader,
    proxyContractAddress,
    fiatTokenV2_2.address,
    proxyAdminAddress,
    accountsToBlacklist
  );

  console.log(
    `>>>>>>> Deployed V2_2Upgrader at ${v2_2Upgrader.address} <<<<<<<`
  );
};
