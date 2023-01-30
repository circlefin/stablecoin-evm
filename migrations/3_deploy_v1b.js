const fs = require("fs");
const path = require("path");
const some = require("lodash/some");

const FiatTokenV1b = artifacts.require("FiatTokenV1b");

let proxyAdminAddress = "";
let ownerAddress = "";
let masterMinterAddress = "";
let pauserAddress = "";
let blacklisterAddress = "";

/** ---------------------------
 * Setup
 --------------------------- */

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

  /** ---------------------------
  * Deploying v1b
  --------------------------- */

  console.log("Deploying implementation contract...");
  await deployer.deploy(FiatTokenV1b);
  const fiatTokenV1b = await FiatTokenV1b.deployed();
  console.log("Deployed implementation contract at", fiatTokenV1b.address);
};
