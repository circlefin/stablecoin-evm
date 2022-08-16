const fs = require("fs");
const path = require("path");
const some = require("lodash/some");

const FiatTokenV2_2 = artifacts.require("FiatTokenV2_2");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");

const THROWAWAY_ADDRESS = "0x0000000000000000000000000000000000000001";

let proxyContractAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({ PROXY_CONTRACT_ADDRESS: proxyContractAddress } = require("../config.js"));
}

module.exports = async (deployer, network) => {
  if (
    !proxyContractAddress ||
    some(["development", "coverage"], (v) => network.includes(v))
  ) {
    proxyContractAddress = (await FiatTokenProxy.deployed()).address;
  }

  console.log(`FiatTokenProxy: ${proxyContractAddress}`);

  console.log("Deploying FiatTokenV2_2 implementation contract...");
  await deployer.deploy(FiatTokenV2_2);

  const fiatTokenV2_2 = await FiatTokenV2_2.deployed();
  console.log("Deployed FiatTokenV2_2 at", fiatTokenV2_2.address);
  console.log(
    "Initializing FiatTokenV2_2 implementation contract with dummy values..."
  );
  await fiatTokenV2_2.initialize(
    "",
    "",
    "",
    0,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS,
    THROWAWAY_ADDRESS
  );
  await fiatTokenV2_2.initializeV2("");
  await fiatTokenV2_2.initializeV2_1(THROWAWAY_ADDRESS);
  await fiatTokenV2_2.initializeV2_2([]);
};
