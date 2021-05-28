const tokenUtils = require("../v1/TokenTestUtils.js");
const bigZero = tokenUtils.bigZero;
const initializeTokenWithProxy = tokenUtils.initializeTokenWithProxy;

const AccountUtils = require("./AccountUtils.js");
const Accounts = AccountUtils.Accounts;
const checkState = AccountUtils.checkState;

const ControllerUtils = require("./ControllerTestUtils.js");
const checkControllerState = ControllerUtils.checkControllerState;

function MintControllerState(owner, controllers, minterManager) {
  this.owner = owner;
  this.controllers = controllers;
  this.minterManager = minterManager;
  this.checkState = async function (mintController) {
    await checkMintControllerState(mintController, this);
  };
}

// Default state of MintController when it is deployed
const mintControllerEmptyState = new MintControllerState(null, {}, bigZero);
// Checks the state of the mintController contract
async function checkMintControllerState(mintController, customState) {
  await checkControllerState(mintController, customState);
  await checkState(
    mintController,
    customState,
    mintControllerEmptyState,
    getActualMintControllerState,
    Accounts,
    true
  );
}

// Gets the actual state of the mintController contract.
// Evaluates all mappings on the provided accounts.
async function getActualMintControllerState(mintController) {
  const minterManager = await mintController.minterManager.call();
  return new MintControllerState(null, {}, minterManager);
}

// Deploys a FiatTokenV1 with a MintController contract as the masterMinter.
// Uses the same workflow we would do in production - first deploy FiatToken then set the masterMinter.
async function initializeTokenWithProxyAndMintController(
  rawToken,
  MintControllerArtifact
) {
  const tokenConfig = await initializeTokenWithProxy(rawToken);
  const mintController = await MintControllerArtifact.new(
    tokenConfig.token.address,
    { from: Accounts.mintOwnerAccount }
  );
  await tokenConfig.token.updateMasterMinter(mintController.address, {
    from: Accounts.tokenOwnerAccount,
  });
  const tokenConfigWithMinter = {
    proxy: tokenConfig.proxy,
    token: tokenConfig.token,
    mintController: mintController,
    customState: new MintControllerState(null, {}, tokenConfig.token.address),
  };
  return tokenConfigWithMinter;
}

module.exports = {
  initializeTokenWithProxyAndMintController: initializeTokenWithProxyAndMintController,
  checkMintControllerState: checkMintControllerState,
  MintControllerState: MintControllerState,
};
