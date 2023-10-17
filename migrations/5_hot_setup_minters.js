const fs = require("fs");
const path = require("path");
const BigNumber = require("bignumber.js");
const FiatTokenProxy = artifacts.require("FiatTokenProxy");
const FiatTokenV2_1 = artifacts.require("FiatTokenV2_1");

let env = "";
let proxyContractAddress = "";
let minter = "";
let burner = "";
let mintAllowanceUnits = 0;

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    ENV: env,
    PROXY_CONTRACT_ADDRESS: proxyContractAddress,
  } = require("../config.js"));

  if (fs.existsSync(path.join(__dirname, "..", `config.${env}.js`))) {
    ({
      MINTER: minter,
      BURNER: burner,
      MINT_ALLOWANCE_UNITS: mintAllowanceUnits,
    } = require(`../config.${env}.js`));
  }
}

// Configure some minters with hot keys before converting to cold storage
// to avoid needing a run to even get our products started.
module.exports = async function (deployer, network, accounts) {
  console.log(
    `>>>>>>> Configuring Known Minters and Burners on ${env} <<<<<<<`
  );
  proxyContractAddress =
    proxyContractAddress || (await FiatTokenProxy.deployed()).address;

  const proxyAsV2_1 = await FiatTokenV2_1.at(proxyContractAddress);
  const masterMinterAddress = accounts[1];

  const mintAllowance = new BigNumber(mintAllowanceUnits).shiftedBy(6);
  await proxyAsV2_1.configureMinter(minter, mintAllowance, {
    from: masterMinterAddress,
  });
  await proxyAsV2_1.configureMinter(burner, 0, {
    from: masterMinterAddress,
  });
};
