const fs = require("fs");
const path = require("path");

const EIP712 = artifacts.require("EIP712");
const ECRecover = artifacts.require("ECRecover");
const FiatTokenV2 = artifacts.require("FiatTokenV2");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenUtil = artifacts.require("FiatTokenUtil");
const V2Upgrader = artifacts.require("V2Upgrader");

const THROWAWAY_ADDRESS = "0x0000000000000000000000000000000000000001";

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
  if (network.toLowerCase().includes("development")) {
    // DO NOT USE THIS ADDRESS IN PRODUCTION
    proxyAdminAddress = "0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598";
    proxyContractAddress = (await FiatTokenProxy.deployed()).address;
  }
  proxyContractAddress =
    proxyContractAddress || (await FiatTokenProxy.deployed()).address;

  console.log(`Proxy Admin:     ${proxyAdminAddress}`);
  console.log(`FiatTokenProxy:  ${proxyContractAddress}`);

  if (!proxyAdminAddress) {
    throw new Error("PROXY_ADMIN_ADDRESS must be provided in config.js");
  }

  console.log("Deploying Library contracts...");
  await deployer.deploy(ECRecover);
  console.log("Deployed ECRecover at", (await ECRecover.deployed()).address);
  await deployer.link(ECRecover, EIP712);
  await deployer.deploy(EIP712);
  console.log("Deployed EIP712 at", (await EIP712.deployed()).address);

  console.log("Deploying FiatTokenV2 implementation contract...");
  await deployer.link(EIP712, FiatTokenV2);
  await deployer.deploy(FiatTokenV2);

  const fiatTokenV2 = await FiatTokenV2.deployed();
  console.log("Deployed FiatTokenV2 at", fiatTokenV2.address);
  console.log(
    "Initializing FiatTokenV2 implementation contract with dummy values..."
  );
  await fiatTokenV2.initialize(
    "",
    "",
    "",
    0,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS
  );
  await fiatTokenV2.initializeV2("");

  console.log("Deploying FiatTokenUtil contract...");
  const fiatTokenUtil = await deployer.deploy(
    FiatTokenUtil,
    proxyContractAddress
  );
  console.log("Deployed FiatTokenUtil at", fiatTokenUtil.address);

  console.log("Deploying V2Upgrader contract...");

  const v2Upgrader = await deployer.deploy(
    V2Upgrader,
    proxyContractAddress,
    fiatTokenV2.address,
    proxyAdminAddress,
    "USD Coin"
  );

  console.log(`>>>>>>> Deployed V2Upgrader at ${v2Upgrader.address} <<<<<<<`);
};
