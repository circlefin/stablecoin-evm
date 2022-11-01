const fs = require("fs");
const path = require("path");

const BigNumber = require("bignumber.js");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");
const MasterMinter = artifacts.require("MasterMinter.sol");

let proxyContractAddress = "";
let masterMinterContractAddress = "";
let minterProd = "";
let minterStg = "";
let burnerProd = "";
let burnerStg = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
    MASTER_MINTER_CONTRACT_ADDRESS: masterMinterContractAddress,
    MINTER_PROD: minterProd,
    MINTER_STG: minterStg,
    BURNER_PROD: burnerProd,
    BURNER_STG: burnerStg,
  } = require("../config.js"));
}

// Prints out current roles on important contracts, for validation
module.exports = async function (deployer, network, accounts) {
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
  console.log(`Token Owner: ${tokenOwner}`);
  console.log(`Proxy Admin: ${proxyAdmin}`);
  console.log(`MasterMinter Owner:  ${masterMinterOwner}`);
  console.log(`MasterMinter Role: ${masterMinterRole}`);
  console.log(`Blacklister Role: ${blacklisterRole}`);
  console.log(`Pauser Role:  ${pauserRole}`);

  const minterProdAllowance = new BigNumber(
    await proxyAsV2_1.minterAllowance(minterProd)
  ).shiftedBy(-6);
  const minterStgAllowance = new BigNumber(
    await proxyAsV2_1.minterAllowance(minterStg)
  ).shiftedBy(-6);
  const burnerProdAllowance = new BigNumber(
    await proxyAsV2_1.minterAllowance(burnerProd)
  ).shiftedBy(-6);
  const burnerStgAllowance = new BigNumber(
    await proxyAsV2_1.minterAllowance(burnerStg)
  ).shiftedBy(-6);

  console.log(
    `>>>>>>> Validate the minter/burner allowances (in major units) are as expected: <<<<<<<`
  );
  console.log(`Minter Prod:  ${minterProdAllowance}`);
  console.log(`Minter Stg:  ${minterStgAllowance}`);
  console.log(`Burner Prod:  ${burnerProdAllowance}`);
  console.log(`Burner Stg:  ${burnerStgAllowance}`);
};
