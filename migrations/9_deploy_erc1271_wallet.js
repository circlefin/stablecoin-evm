const fs = require("fs");
const path = require("path");
const some = require("lodash/some");

const MockERC1271Wallet = artifacts.require("MockERC1271Wallet");

let mockERC1271WalletOwnerAddress = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    MOCK_ERC1271_WALLET_OWNER_ADDRESS: mockERC1271WalletOwnerAddress,
  } = require("../config.js"));
}

module.exports = async (deployer, network, accounts) => {
  const isTestEnvironment = some(["development", "coverage"], (v) =>
    network.includes(v)
  );

  if (isTestEnvironment) {
    mockERC1271WalletOwnerAddress = accounts[0];
  }

  if (!mockERC1271WalletOwnerAddress) {
    throw new Error(
      "MOCK_ERC1271_WALLET_OWNER_ADDRESS must be provided in config.js"
    );
  }

  console.log("Deploying MockERC1271Wallet contract...");

  await deployer.deploy(MockERC1271Wallet, mockERC1271WalletOwnerAddress);
  const walletAddress = (await MockERC1271Wallet.deployed()).address;

  console.log(`>>>>>>> Deployed MockERC1271Wallet at ${walletAddress} <<<<<<<`);
};
