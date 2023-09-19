const fs = require("fs");
const path = require("path");

const BigNumber = require("bignumber.js");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const MasterMinter = artifacts.require("MasterMinter.sol");

let env = "";
let proxyContractAddress = "";
let masterMinterContractAddress = "";
let minter = "";
let burner = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    ENV: env,
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
    MASTER_MINTER_CONTRACT_ADDRESS: masterMinterContractAddress,
  } = require("../config.js"));

  if (fs.existsSync(path.join(__dirname, "..", `config.${env}.js`))) {
    ({ MINTER: minter, BURNER: burner } = require(`../config.${env}.js`));
  }
}

// Prints out current roles on important contracts, for validation
module.exports = async function (_) {
  proxyContractAddress =
    proxyContractAddress || (await FiatTokenProxy.deployed()).address;
  const proxyAsV2_1 = await FiatTokenV2_1.at(proxyContractAddress);
  const proxyContract = await FiatTokenProxy.at(proxyContractAddress);

  masterMinterContractAddress =
    masterMinterContractAddress || (await MasterMinter.deployed()).address;
  const masterMinter = await MasterMinter.at(masterMinterContractAddress);

  const tokenOwner = await proxyAsV2_1.owner();
  const proxyAdmin = await proxyContract.admin();
  const masterMinterOwner = await masterMinter.owner();
  const masterMinterRole = await proxyAsV2_1.masterMinter();
  const blacklisterRole = await proxyAsV2_1.blacklister();
  const pauserRole = await proxyAsV2_1.pauser();

  console.log(`>>>>>>> Validate the following roles are as expected: <<<<<<<`);
  console.log(`Token Owner:        ${tokenOwner}`);
  console.log(`Proxy Admin:        ${proxyAdmin}`);
  console.log(`MasterMinter Owner: ${masterMinterOwner}`);
  console.log(`MasterMinter Role:  ${masterMinterRole}`);
  console.log(`Blacklister Role:   ${blacklisterRole}`);
  console.log(`Pauser Role:        ${pauserRole}`);

  console.log(
    `>>>>>>> Configuring Minter and Burner allowance on ${env} <<<<<<<`
  );
  const minterAllowance = new BigNumber(
    await proxyAsV2_1.minterAllowance(minter)
  ).shiftedBy(-6);

  const burnerAllowance = new BigNumber(
    await proxyAsV2_1.minterAllowance(burner)
  ).shiftedBy(-6);

  console.log(
    `\n>>>>>>> Validate the minter/burner allowances (in major units) are as expected: <<<<<<<`
  );
  console.log(`Minter Allowance:  ${minterAllowance}`);
  console.log(`Burner Allowance:  ${burnerAllowance}`);
};
