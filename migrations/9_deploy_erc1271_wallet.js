const fs = require("fs");
const path = require("path");
const some = require("lodash/some");

const MockERC1271Wallet = artifacts.require("MockERC1271Wallet");

let deployerAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({ DEPLOYER_ADDRESS: deployerAddress } = require("../config.js"));
}

module.exports = async (deployer, network, accounts) => {
  const isTestEnvironment = some(["development", "coverage"], (v) =>
    network.includes(v)
  );

  if (isTestEnvironment) {
    deployerAddress = accounts[0];
  }

  if (!deployerAddress) {
    throw new Error("DEPLOYER_ADDRESS must be provided in config.js");
  }

  console.log("Deploying MockERC1271Wallet contract...");

  await deployer.deploy(MockERC1271Wallet, deployerAddress);
  const walletAddress = (await MockERC1271Wallet.deployed()).address;

  console.log(`>>>>>>> Deployed MockERC1271Wallet at ${walletAddress} <<<<<<<`);
};
