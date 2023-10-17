const fs = require("fs");
const path = require("path");
const MasterMinter = artifacts.require("MasterMinter.sol");

let env = "";
let masterMinterContractAddress = "";
let minter = "";
let burner = "";
let minterControllerIncrementer = "";
let minterControllerRemover = "";
let burnerController = "";

// Read config file if it exists
if (fs.existsSync(path.join(__dirname, "..", "config.js"))) {
  ({
    ENV: env,
    MASTER_MINTER_CONTRACT_ADDRESS: masterMinterContractAddress,
  } = require("../config.js"));

  if (fs.existsSync(path.join(__dirname, "..", `config.${env}.js`))) {
    ({
      MINTER: minter,
      BURNER: burner,
      MINTER_CONTROLLER_INCREMENTER: minterControllerIncrementer,
      MINTER_CONTROLLER_REMOVER: minterControllerRemover,
      BURNER_CONTROLLER: burnerController,
    } = require(`../config.${env}.js`));
  }
}

module.exports = async function (deployer, network, accounts) {
  console.log(
    `>>>>>>> Configuring Known Cold Storage Controllers of Minters And Burners on ${env} <<<<<<<`
  );

  masterMinterContractAddress =
    masterMinterContractAddress || (await MasterMinter.deployed()).address;
  const masterMinter = await MasterMinter.at(masterMinterContractAddress);
  const masterMinterOwnerAddress = accounts[1];

  await masterMinter.configureController(minterControllerIncrementer, minter, {
    from: masterMinterOwnerAddress,
  });

  await masterMinter.configureController(minterControllerRemover, minter, {
    from: masterMinterOwnerAddress,
  });

  await masterMinter.configureController(burnerController, burner, {
    from: masterMinterOwnerAddress,
  });

  console.log(
    `MINTER_CONTROLLER_INCREMENTER ${minterControllerIncrementer} controls ${await masterMinter.getWorker(
      minterControllerIncrementer
    )}`
  );
  console.log(
    `MINTER_CONTROLLER_REMOVER ${minterControllerRemover} controls ${await masterMinter.getWorker(
      minterControllerRemover
    )}`
  );
  console.log(
    `BURNER_CONTROLLER ${burnerController} controls ${await masterMinter.getWorker(
      burnerController
    )}`
  );
};
